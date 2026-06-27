import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { CreateStudentProfileDto, UpdateStudentProfileDto } from './dto/student-profile.dto';
import { User, UserRole } from '../user/user.entity';
import { Grade } from '../grades/grade.entity';

@Injectable()
export class StudentProfileService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profileRepository: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {}

  async create(dto: CreateStudentProfileDto, createdBy?: string): Promise<StudentProfile> {
    // 验证学生用户存在且角色为学生
    const student = await this.userRepository.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('学生用户不存在');
    }
    if (student.role !== UserRole.STUDENT) {
      throw new ConflictException('指定用户不是学生角色');
    }

    // 检查是否已有档案
    const existing = await this.profileRepository.findOne({ where: { studentId: dto.studentId } });
    if (existing) {
      throw new ConflictException('该学生已存在档案');
    }

    const profile = this.profileRepository.create({
      ...dto,
      createdBy,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : undefined,
      graduationDate: dto.graduationDate ? new Date(dto.graduationDate) : undefined,
    });

    return this.profileRepository.save(profile);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: StudentProfile[]; total: number }> {
    const [data, total] = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.student', 'student')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('profile.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<StudentProfile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!profile) {
      throw new NotFoundException('学生档案不存在');
    }
    return profile;
  }

  async findByStudentId(studentId: string): Promise<StudentProfile> {
    const profile = await this.profileRepository.findOne({
      where: { studentId },
      relations: ['student'],
    });
    if (!profile) {
      throw new NotFoundException('学生档案不存在');
    }
    return profile;
  }

  async getFullProfile(studentId: string): Promise<{
    profile: StudentProfile;
    student: User;
    gradeSummary: {
      totalRecords: number;
      latestAverage: number | null;
      latestTerm: string | null;
    };
  }> {
    // 获取学生信息
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('学生用户不存在');
    }

    // 获取档案
    let profile: StudentProfile;
    try {
      profile = await this.findByStudentId(studentId);
    } catch {
      // 如果档案不存在，创建一个新档案
      profile = await this.create({ studentId }, undefined);
    }

    // 获取成绩摘要
    const latestGrade = await this.gradeRepository
      .createQueryBuilder('g')
      .select('g.term', 'term')
      .addSelect('AVG(g.score)', 'avgScore')
      .addSelect('COUNT(*)', 'count')
      .where('g.studentId = :studentId', { studentId })
      .groupBy('g.term')
      .orderBy('g.term', 'DESC')
      .limit(1)
      .getRawOne();

    const totalGrades = await this.gradeRepository.count({ where: { studentId } });

    const gradeSummary = {
      totalRecords: totalGrades,
      latestAverage: latestGrade?.avgScore ? parseFloat(latestGrade.avgScore) : null,
      latestTerm: latestGrade?.term || null,
    };

    return { profile, student, gradeSummary };
  }

  async update(
    id: string,
    dto: UpdateStudentProfileDto,
    updatedBy?: string,
  ): Promise<StudentProfile> {
    const profile = await this.findOne(id);

    // 如果要归档
    if (dto.isArchived === true && !profile.isArchived) {
      profile.archivedAt = new Date();
    }

    Object.assign(profile, {
      ...dto,
      updatedBy,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : profile.enrollmentDate,
      graduationDate: dto.graduationDate ? new Date(dto.graduationDate) : profile.graduationDate,
    });

    return this.profileRepository.save(profile);
  }

  async archive(id: string, reason: string, updatedBy?: string): Promise<StudentProfile> {
    const profile = await this.findOne(id);
    profile.isArchived = true;
    profile.archivedAt = new Date();
    profile.archiveReason = reason;
    profile.updatedBy = updatedBy;
    return this.profileRepository.save(profile);
  }

  async unarchive(id: string, updatedBy?: string): Promise<StudentProfile> {
    const profile = await this.findOne(id);
    if (!profile.isArchived) {
      throw new ConflictException('该档案未归档');
    }
    profile.isArchived = false;
    profile.archivedAt = null;
    profile.archiveReason = null;
    profile.updatedBy = updatedBy;
    return this.profileRepository.save(profile);
  }

  async upsertByStudentId(
    studentId: string,
    dto: Partial<CreateStudentProfileDto>,
    createdBy?: string,
  ): Promise<StudentProfile> {
    let profile = await this.profileRepository.findOne({ where: { studentId } });
    if (profile) {
      Object.assign(profile, { ...dto, updatedBy: createdBy });
    } else {
      profile = this.profileRepository.create({
        studentId,
        ...dto,
        createdBy,
      });
    }
    return this.profileRepository.save(profile);
  }
}
