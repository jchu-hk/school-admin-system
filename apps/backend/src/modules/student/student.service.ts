import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import {
  Student,
  AcademicYear,
  StudentIdSequence,
  ClassAllocation,
  StudentStatus,
  AllocationType,
} from './student.entity';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentQueryDto,
  CreateClassAllocationDto,
  ClassAllocationQueryDto,
} from './dto/student.dto';
import { Class } from '../user/class.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
    @InjectRepository(StudentIdSequence)
    private readonly sequenceRepo: Repository<StudentIdSequence>,
    @InjectRepository(ClassAllocation)
    private readonly allocationRepo: Repository<ClassAllocation>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    private readonly dataSource: DataSource,
  ) {}

  // ============================================================
  // 学号自动生成
  // ============================================================

  /**
   * 生成学号
   * 格式: YYYYNNNN（YYYY=入学年份，NNNN=4位序号）
   * 例如: 2026000001
   */
  private async generateStudentId(admissionYear: number): Promise<string> {
    const academicYearStr = `${admissionYear}-${admissionYear + 1}`;

    // 使用事务确保并发安全
    return this.dataSource.transaction(async (manager) => {
      // 查找或创建该学年的序列记录
      let sequence = await manager.findOne(StudentIdSequence, {
        where: { academicYear: academicYearStr },
      });

      if (!sequence) {
        // 如果序列不存在，创建新记录
        sequence = manager.create(StudentIdSequence, {
          academicYear: academicYearStr,
          lastSequence: 0,
        });
        sequence = await manager.save(StudentIdSequence, sequence);
      }

      // 检查是否已达上限
      if (sequence.lastSequence >= 9999) {
        throw new BadRequestException(
          `STU-003: 学号生成失败，学年 ${academicYearStr} 序号已达上限（9999）`,
        );
      }

      // 递增序号
      sequence.lastSequence += 1;
      await manager.save(StudentIdSequence, sequence);

      // 生成学号: YYYY + NNNN（补齐4位）
      const sequenceNum = sequence.lastSequence.toString().padStart(4, '0');
      return `${admissionYear}${sequenceNum}`;
    });
  }

  // ============================================================
  // 学生档案 CRUD
  // ============================================================

  async create(dto: CreateStudentDto, userId?: string): Promise<Student> {
    const admissionDate = new Date(dto.admission_date);
    const admissionYear = admissionDate.getFullYear();

    // 检查香港身份证是否重复
    if (dto.hk_id) {
      const existing = await this.studentRepo.findOne({
        where: { hkId: dto.hk_id, deletedAt: IsNull() },
      });
      if (existing) {
        throw new ConflictException('STU-004: 同一香港身份证已存在');
      }
    }

    // 自动生成学号
    const studentId = await this.generateStudentId(admissionYear);

    const student = this.studentRepo.create({
      studentId,
      nameZh: dto.name_zh,
      nameEn: dto.name_en,
      gender: dto.gender,
      birthDate: new Date(dto.birth_date),
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      admissionDate,
      guardianName: dto.guardian_name,
      guardianPhone: dto.guardian_phone,
      guardianRelationship: dto.guardian_relationship,
      emergencyContact: dto.emergency_contact,
      emergencyPhone: dto.emergency_phone,
      hkId: dto.hk_id,
      notes: dto.notes,
      status: StudentStatus.ACTIVE,
      createdBy: userId,
    });

    return this.studentRepo.save(student);
  }

  async findAll(query: StudentQueryDto): Promise<{
    items: Partial<Student>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const qb = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect(
        ClassAllocation,
        'alloc',
        'alloc.student_id = student.id AND alloc.end_date IS NULL',
      )
      .leftJoinAndSelect(Class, 'cls', 'cls.id = alloc.class_id')
      .leftJoinAndSelect(AcademicYear, 'ay', 'ay.id = alloc.academic_year_id')
      .where('student.deleted_at IS NULL');

    // 搜索过滤
    if (query.search) {
      qb.andWhere(
        '(student.name_zh ILIKE :search OR student.student_id ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // 班级过滤
    if (query.class_id) {
      qb.andWhere('alloc.class_id = :classId', {
        classId: query.class_id,
      });
    }

    // 学年过滤
    if (query.academic_year) {
      qb.andWhere('ay.year = :academicYear', {
        academicYear: query.academic_year,
      });
    }

    // 状态过滤
    if (query.status) {
      qb.andWhere('student.status = :status', { status: query.status });
    }

    // 性别过滤
    if (query.gender) {
      qb.andWhere('student.gender = :gender', { gender: query.gender });
    }

    // 排序
    const sortBy = query.sortBy || 'student.created_at';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(sortBy, sortOrder);

    // 分页
    qb.skip(skip).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    // 映射结果，添加 currentClass
    const mappedItems = items.map((s) => {
      const allocation = (s as any).alloc;
      const cls = (s as any).cls;
      const ay = (s as any).ay;
      const { deletedAt: _deletedAt, ...rest } = s as any;
      return {
        ...rest,
        currentClass: allocation
          ? {
              class_id: cls?.id,
              class_name: cls?.name,
              academic_year: ay?.year,
            }
          : null,
      };
    });

    return {
      items: mappedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!student) {
      throw new NotFoundException('STU-010: 学生档案不存在');
    }
    return student;
  }

  async findOneWithDetails(id: string): Promise<any> {
    const student = await this.findOne(id);

    // 获取当前班级分配
    const currentAllocation = await this.allocationRepo.findOne({
      where: { studentId: id, endDate: IsNull() },
      relations: ['class', 'academicYear'],
    });

    // 获取关联用户
    const linkedUser = await this.dataSource.query(
      `SELECT u.id as user_id, u.username, u.status
       FROM users u
       JOIN student_users su ON su.user_id = u.id
       WHERE su.student_id = $1 AND u.deleted_at IS NULL
       LIMIT 1`,
      [id],
    );

    return {
      ...student,
      currentClass: currentAllocation
        ? {
            class_id: currentAllocation.class?.id,
            class_name: currentAllocation.class?.name,
            academic_year: currentAllocation.academicYear?.year,
            homeroom_teacher: currentAllocation.class?.homeroomTeacherId,
          }
        : null,
      linked_user_account: linkedUser?.[0] || null,
    };
  }

  async update(
    id: string,
    dto: UpdateStudentDto,
    userId?: string,
  ): Promise<Student> {
    const student = await this.findOne(id);

    // 禁止修改学号
    if (dto.birth_date) {
      // allow birth_date change
    }

    Object.assign(student, {
      ...(dto.name_zh && { nameZh: dto.name_zh }),
      ...(dto.name_en !== undefined && { nameEn: dto.name_en }),
      ...(dto.gender && { gender: dto.gender }),
      ...(dto.birth_date && { birthDate: new Date(dto.birth_date) }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.guardian_name !== undefined && {
        guardianName: dto.guardian_name,
      }),
      ...(dto.guardian_phone !== undefined && {
        guardianPhone: dto.guardian_phone,
      }),
      ...(dto.guardian_relationship !== undefined && {
        guardianRelationship: dto.guardian_relationship,
      }),
      ...(dto.emergency_contact !== undefined && {
        emergencyContact: dto.emergency_contact,
      }),
      ...(dto.emergency_phone !== undefined && {
        emergencyPhone: dto.emergency_phone,
      }),
      ...(dto.hk_id !== undefined && { hkId: dto.hk_id }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.status && { status: dto.status }),
      updatedBy: userId,
    });

    return this.studentRepo.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepo.softRemove(student);
  }

  // ============================================================
  // 班级分配管理
  // ============================================================

  async createClassAllocation(
    studentId: string,
    dto: CreateClassAllocationDto,
    _userId?: string,
  ): Promise<ClassAllocation> {
    // 验证学生存在
    await this.findOne(studentId);

    // 验证班级存在
    const cls = await this.classRepo.findOne({
      where: { id: dto.class_id },
    });
    if (!cls) {
      throw new NotFoundException('班级不存在');
    }

    // 验证学年存在
    const academicYear = await this.academicYearRepo.findOne({
      where: { id: dto.academic_year_id },
    });
    if (!academicYear) {
      throw new NotFoundException('学年不存在');
    }

    // 如果是主班分配，检查是否已存在
    if (!dto.allocation_type || dto.allocation_type === AllocationType.MAIN) {
      const existing = await this.allocationRepo.findOne({
        where: {
          studentId,
          academicYearId: dto.academic_year_id,
          allocationType: AllocationType.MAIN,
          endDate: IsNull(),
        },
      });
      if (existing) {
        throw new ConflictException('STU-012: 该学生本学年已有主班分配');
      }
    }

    // 如果是主班分配，先将旧的分配标记为过期
    if (!dto.allocation_type || dto.allocation_type === AllocationType.MAIN) {
      await this.allocationRepo.update(
        {
          studentId,
          academicYearId: dto.academic_year_id,
          allocationType: AllocationType.MAIN,
          endDate: IsNull(),
        },
        { endDate: new Date() },
      );
    }

    const allocation = this.allocationRepo.create({
      studentId,
      classId: dto.class_id,
      academicYearId: dto.academic_year_id,
      academicYearStr: academicYear.year,
      allocationType: dto.allocation_type || AllocationType.MAIN,
      effectiveDate: new Date(dto.effective_date),
    });

    return this.allocationRepo.save(allocation);
  }

  async findStudentAllocations(
    studentId: string,
    query: ClassAllocationQueryDto,
  ): Promise<ClassAllocation[]> {
    const where: any = { studentId };
    if (query.academic_year) {
      where.academicYearStr = query.academic_year;
    }
    return this.allocationRepo.find({
      where,
      relations: ['class', 'academicYear'],
      order: { effectiveDate: 'DESC' },
    });
  }

  async findClassStudents(
    classId: string,
    academicYear?: string,
  ): Promise<any> {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) {
      throw new NotFoundException('班级不存在');
    }

    const where: any = { classId };
    if (academicYear) {
      where.academicYearStr = academicYear;
    }

    const allocations = await this.allocationRepo.find({
      where,
      relations: ['student'],
      order: { effectiveDate: 'ASC' },
    });

    return {
      class_id: cls.id,
      class_name: cls.name,
      academic_year: academicYear || cls.academicYearId,
      homeroom_teacher: cls.homeroomTeacherId,
      total_students: allocations.length,
      students: allocations.map((a) => ({
        id: a.student?.id,
        student_id: a.student?.studentId,
        name_zh: a.student?.nameZh,
        name_en: a.student?.nameEn,
        gender: a.student?.gender,
        allocation_type: a.allocationType,
      })),
    };
  }

  // ============================================================
  // 学年管理
  // ============================================================

  async findAcademicYears(): Promise<AcademicYear[]> {
    return this.academicYearRepo.find({
      order: { startDate: 'DESC' },
    });
  }
}
