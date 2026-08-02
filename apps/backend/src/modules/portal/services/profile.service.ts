import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../user/user.entity';
import { Student } from '../../student/student.entity';
import { ParentStudentLink } from '../../auth/entities/parent-student-link.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/audit-log.entity';

/**
 * 脱敏工具 — 根据角色敏感度掩码个人字段
 */
function maskPhone(phone: string | null | undefined, fullMask: boolean): string | null {
  if (!phone) return null;
  if (fullMask) {
    return '****' + phone.slice(-4);
  }
  return phone;
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (domain && local) {
    return local[0] + '***@' + domain;
  }
  return email;
}

function maskAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const masked = address.replace(/(大廈|大樓|大夏|街|道|路|號)(.*)$/, '$1****');
  return masked;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  /** 学生可编辑字段白名单 (Student entity fields) */
  private readonly EDITABLE_FIELDS = [
    'phone',
    'email',
    'emergencyContact',
    'emergencyPhone',
    'address',
    'guardianPhone',
  ];

  /** 锁定不可编辑字段 */
  private readonly LOCKED_FIELDS = [
    'studentId',
    'nameZh',
    'nameEn',
    'gender',
    'birthDate',
    'className',
    'admissionDate',
  ];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(ParentStudentLink)
    private linkRepository: Repository<ParentStudentLink>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 获取学生个人档案
   * - student 角色：查看本人完整档案（有基础掩码）
   * - parent 角色：查看关联子女的脱敏档案
   */
  async getProfile(userId: string, role: UserRole): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (role === UserRole.STUDENT) {
      // 学生查看本人档案 — 查找关联的学生档案
      const studentProfile = await this.studentRepository.findOne({
        where: { id: userId },
      });
      if (!studentProfile) {
        throw new NotFoundException('学生档案不存在');
      }
      return this.buildStudentProfile(studentProfile, false, {
        name: user.name,
        phone: user.phone,
        email: user.email,
        className: user.className,
      });
    }

    if (role === UserRole.PARENT) {
      // 家长查看子女档案（需关联校验），脱敏显示
      const links = await this.linkRepository.find({
        where: { parentId: userId },
      });

      if (!links || links.length === 0) {
        throw new ForbiddenException('未关联任何学生');
      }

      const profiles = [];
      for (const link of links) {
        const student = await this.studentRepository.findOne({
          where: { id: link.studentId },
        });
        if (student) {
          const studentUser = await this.userRepository.findOne({
            where: { id: link.studentId },
          });
          profiles.push(
            this.buildStudentProfile(student, true, {
              name: studentUser?.name || student.nameZh,
              phone: studentUser?.phone,
              email: studentUser?.email,
              className: studentUser?.className,
            }),
          );
        }
      }

      return {
        role: 'parent',
        children: profiles,
      };
    }

    throw new ForbiddenException('无权访问个人档案');
  }

  /**
   * 更新学生个人档案（仅 student 角色，有限字段）
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    ip?: string,
  ): Promise<{
    updatedFields: string[];
    message: string;
    profile: any;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('仅学生角色可编辑个人档案');
    }

    const studentProfile = await this.studentRepository.findOne({
      where: { id: userId },
    });
    if (!studentProfile) {
      throw new NotFoundException('学生档案不存在');
    }

    // 验证只包含允许编辑的字段
    const updateKeys = Object.keys(dto).filter(
      (k) => dto[k as keyof UpdateProfileDto] !== undefined,
    );
    const invalidKeys = updateKeys.filter(
      (k) => !this.EDITABLE_FIELDS.includes(k),
    );

    if (invalidKeys.length > 0) {
      throw new BadRequestException(
        `以下字段不可编辑: ${invalidKeys.join(', ')}`,
      );
    }

    if (updateKeys.length === 0) {
      throw new BadRequestException('未提供任何可编辑字段');
    }

    // 记录变更前值（用于审计）
    const changes: Array<{ field: string; old: string; new: string }> = [];

    for (const key of updateKeys) {
      const oldVal = (studentProfile as any)[key];
      const newVal = dto[key as keyof UpdateProfileDto];
      if (oldVal !== newVal) {
        (studentProfile as any)[key] = newVal;
        changes.push({
          field: key,
          old: oldVal ? String(oldVal).substring(0, 3) + '****' : '',
          new: String(newVal).substring(0, 3) + '****',
        });
      }
    }

    await this.studentRepository.save(studentProfile);

    // 同步更新 users 表的 phone/email
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.email !== undefined) user.email = dto.email;
    await this.userRepository.save(user);

    // 记录审计日志
    await this.auditService.log(
      'user_update' as AuditAction,
      userId,
      `学生档案编辑: ${changes.map((c) => c.field).join(', ')}`,
      ip,
      { changes },
      200,
    );

    this.logger.log(`Profile updated for user ${userId}: ${updateKeys.join(', ')}`);

    return {
      updatedFields: updateKeys,
      message: '个人信息已更新',
      profile: this.buildStudentProfile(studentProfile, false, {
        name: user.name,
        phone: user.phone,
        email: user.email,
        className: user.className,
      }),
    };
  }

  /**
   * 构建学生个人档案响应对象
   */
  private buildStudentProfile(
    student: Student,
    fullMask: boolean,
    extra?: { name?: string; phone?: string | null; email?: string | null; className?: string | null },
  ): Record<string, any> {
    const editableFields = fullMask ? [] : this.EDITABLE_FIELDS;

    return {
      studentId: student.studentId,
      studentCode: student.studentId,
      nameZh: student.nameZh,
      nameEn: student.nameEn || null,
      name: extra?.name || student.nameZh,
      gender: student.gender || null,
      birthDate: student.birthDate
        ? new Date(student.birthDate).toISOString().split('T')[0]
        : null,
      email: maskEmail(student.email || extra?.email),
      phone: maskPhone(student.phone || extra?.phone, fullMask),
      emergencyContact: fullMask
        ? student.emergencyContact
          ? student.emergencyContact[0] + '***'
          : null
        : student.emergencyContact || null,
      emergencyPhone: maskPhone(student.emergencyPhone, fullMask),
      address: fullMask ? maskAddress(student.address) : student.address || null,
      guardianName: fullMask
        ? student.guardianName
          ? student.guardianName[0] + '***'
          : null
        : student.guardianName || null,
      guardianPhone: maskPhone(student.guardianPhone, fullMask),
      className: extra?.className || null,
      admissionDate: student.admissionDate
        ? new Date(student.admissionDate).toISOString().split('T')[0]
        : null,
      editableFields,
      lockedFields: fullMask ? [] : this.LOCKED_FIELDS,
      role: 'student',
      lastUpdated: student.updatedAt?.toISOString() || null,
    };
  }
}
