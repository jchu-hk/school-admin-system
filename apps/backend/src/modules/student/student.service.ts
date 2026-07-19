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
   * 格式: YYYYNNNN(YYYY=入学年份,NNNN=4位序号)
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
        // 如果序列不存在,创建新记录
        sequence = manager.create(StudentIdSequence, {
          academicYear: academicYearStr,
          lastSequence: 0,
        });
        sequence = await manager.save(StudentIdSequence, sequence);
      }

      // 检查是否已达上限
      if (sequence.lastSequence >= 9999) {
        throw new BadRequestException(
          `STU-003: 学号生成失败,学年 ${academicYearStr} 序号已达上限(9999)`,
        );
      }

      // 递增序号
      sequence.lastSequence += 1;
      await manager.save(StudentIdSequence, sequence);

      // 生成学号: YYYY + NNNN(补齐4位)
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

    // 检查香港身份证是否重复（包括软删除）
    if (dto.hk_id) {
      const existing = await this.studentRepo.findOne({
        where: { hkId: dto.hk_id },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException('STU-004: 同一香港身份证已存在');
      }
    }

    // 检查学号是否已存在（包括软删除记录）
    // 学号是个人唯一标识，软删除后不可重用
    let studentId = dto.student_id;
    if (studentId) {
      const existingStudent = await this.studentRepo.findOne({
        where: { studentId },
        withDeleted: true,
      });
      if (existingStudent) {
        throw new ConflictException('STU-013: 学号已被使用（包括已删除记录）');
      }
    } else {
      // 自动生成学号
      studentId = await this.generateStudentId(admissionYear);

      // 检查学号是否已存在（包括软删除记录）
      const existingStudent = await this.studentRepo.findOne({
        where: { studentId },
        withDeleted: true,
      });
      if (existingStudent) {
        throw new ConflictException('STU-013: 学号已被使用（包括已删除记录）');
      }
    }

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

    const savedStudent = await this.studentRepo.save(student);

    // If class_id is provided, create a class allocation
    if (dto.class_id) {
      // Find the current academic year
      const academicYear = await this.academicYearRepo.findOne({
        where: { isCurrent: true },
      });
      if (academicYear) {
        const allocation = this.allocationRepo.create({
          studentId: savedStudent.id,
          classId: dto.class_id,
          academicYearId: academicYear.id,
          academicYearStr: academicYear.year,
          allocationType: AllocationType.MAIN,
          effectiveDate: new Date(),
        });
        await this.allocationRepo.save(allocation);
      }
    }

    return savedStudent;
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

    const params: any[] = [];

    let whereClause = 'WHERE s.deleted_at IS NULL';
    let paramIdx = 1;
    if (query.search) {
      whereClause += ` AND (s.name_zh ILIKE $${paramIdx} OR s.student_id ILIKE $${paramIdx})`;
      params.push(`%${query.search}%`);
      paramIdx++;
    }
    if (query.class_id) {
      whereClause += ` AND alloc.class_id = $${paramIdx}`;
      params.push(query.class_id);
      paramIdx++;
    }
    if (query.academic_year) {
      whereClause += ` AND ay.year = $${paramIdx}`;
      params.push(query.academic_year);
      paramIdx++;
    }
    if (query.status) {
      whereClause += ` AND s.status = $${paramIdx}`;
      params.push(query.status);
      paramIdx++;
    }
    if (query.gender) {
      whereClause += ` AND s.gender = $${paramIdx}`;
      params.push(query.gender);
      paramIdx++;
    }

    // Add filter for MAIN allocation type to get current class
    whereClause += ` AND (alloc.allocation_type = 'main' OR alloc.allocation_type IS NULL)`;

    const sortBy = query.sortBy ? query.sortBy.replace(/\.id$/, '.id') : 's.id';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM students s
      LEFT JOIN class_allocations alloc ON alloc.student_id = s.id AND alloc.end_date IS NULL AND (alloc.allocation_type = 'main' OR alloc.allocation_type IS NULL)
      LEFT JOIN classes cls ON cls.id = alloc.class_id
      LEFT JOIN academic_years ay ON ay.id = alloc.academic_year_id
      ${whereClause}
    `;

    const dataSql = `
      SELECT DISTINCT ON (s.id)
        s.id, s.student_id, s.name_zh, s.name_en, s.gender,
        s.birth_date, s.address, s.phone, s.email,
        s.admission_date, s.status, s.guardian_name,
        s.guardian_phone, s.guardian_relationship,
        s.emergency_contact, s.emergency_phone,
        s.hk_id, s.notes, s.created_at, s.updated_at,
        cls.id as cls_id, cls.name as cls_name,
        ay.year as ay_year
      FROM students s
      LEFT JOIN class_allocations alloc ON alloc.student_id = s.id AND alloc.end_date IS NULL AND (alloc.allocation_type = 'main' OR alloc.allocation_type IS NULL)
      LEFT JOIN classes cls ON cls.id = alloc.class_id
      LEFT JOIN academic_years ay ON ay.id = alloc.academic_year_id
      ${whereClause}
      ORDER BY s.id, ${sortBy} ${sortOrder}
      LIMIT ${pageSize} OFFSET ${skip}
    `;

    const [countResult, items] = await Promise.all([
      this.studentRepo.query(countSql, params),
      this.studentRepo.query(dataSql, params),
    ]);

    const total = parseInt(countResult[0]?.total || '0', 10);

    const mappedItems = items.map((s: any) => ({
      id: s.id,
      student_id: s.student_id,
      name_zh: s.name_zh,
      name_en: s.name_en,
      gender: s.gender,
      birth_date: s.birth_date,
      address: s.address,
      phone: s.phone,
      email: s.email,
      admission_date: s.admission_date,
      status: s.status,
      guardian_name: s.guardian_name,
      guardian_phone: s.guardian_phone,
      guardian_relationship: s.guardian_relationship,
      emergency_contact: s.emergency_contact,
      emergency_phone: s.emergency_phone,
      hk_id: s.hk_id,
      notes: s.notes,
      created_at: s.created_at,
      updated_at: s.updated_at,
      currentClass: s.cls_id
        ? {
            class_id: s.cls_id,
            class_name: s.cls_name,
            academic_year: s.ay_year,
          }
        : null,
    }));

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
      ...(dto.admission_date && { admissionDate: new Date(dto.admission_date) }),
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

    const savedStudent = await this.studentRepo.save(student);

    // If class_id is provided, update class allocation
    if (dto.class_id) {
      // Find the current academic year
      const academicYear = await this.academicYearRepo.findOne({
        where: { isCurrent: true },
      });
      if (academicYear) {
        // Check existing active allocation
        const currentAllocation = await this.allocationRepo.findOne({
          where: {
            studentId: id,
            academicYearId: academicYear.id,
            allocationType: AllocationType.MAIN,
            endDate: IsNull(),
          },
        });

        // Only update if class_id actually changed
        if (!currentAllocation || currentAllocation.classId !== dto.class_id) {
          // Close old allocation
          if (currentAllocation) {
            await this.allocationRepo.update(currentAllocation.id, {
              endDate: new Date(),
            });
          }

          // Create new allocation
          const allocation = this.allocationRepo.create({
            studentId: id,
            classId: dto.class_id,
            academicYearId: academicYear.id,
            academicYearStr: academicYear.year,
            allocationType: AllocationType.MAIN,
            effectiveDate: new Date(),
          });
          await this.allocationRepo.save(allocation);
        }
      }
    }

    return savedStudent;
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

    // 如果是主班分配,检查是否已存在
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

    // 如果是主班分配,先将旧的分配标记为过期
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
  // 班级管理
  // ============================================================

  async findClasses(): Promise<Class[]> {
    return this.classRepo.find({
      where: { isActive: true },
      order: { grade: 'ASC', name: 'ASC' },
    });
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
