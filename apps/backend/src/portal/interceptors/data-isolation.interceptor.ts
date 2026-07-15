import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudentLink } from '../entities/parent-student-link.entity';

/**
 * 请求上下文数据，携带隔离信息
 */
export interface DataIsolationContext {
  /** 当前用户角色 */
  userRole: string;
  /** 当前用户ID */
  userId: string;
  /** 家长关联的学生ID列表（仅 parent 角色有效） */
  linkedStudentIds?: string[];
  /** 学生角色自身的 ID（仅 student 角色有效） */
  studentId?: string;
}

/**
 * 数据隔离拦截器
 *
 * 拦截 /api/portal/** 请求，为请求注入数据隔离上下文，
 * 使下游 Service/Repository 层自动实现行级数据隔离。
 *
 * 核心逻辑:
 * - parent 角色: 从 parent_student_links 表加载关联的学生ID列表，
 *   在后续查询中自动追加 WHERE EXISTS 条件
 * - student 角色: 追加 WHERE student_id = :userId 条件
 *
 * 使用方式:
 * ```typescript
 * // 在 Service 中获取隔离上下文
 * const isolation = DataIsolationInterceptor.getContext(request);
 * // 使用 isolation 构建 SQL 查询
 * ```
 */
@Injectable()
export class DataIsolationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataIsolationInterceptor.name);

  /** 用于传递隔离上下文的请求属性键 */
  static readonly CONTEXT_KEY = 'dataIsolationContext';

  constructor(
    @InjectRepository(ParentStudentLink)
    private parentStudentLinkRepo: Repository<ParentStudentLink>,
  ) {}

  /**
   * 静态方法: 从请求中获取数据隔离上下文
   * Service 层可通过此方法获取用户身份信息以构建隔离查询
   */
  static getContext(request: any): DataIsolationContext | null {
    return request[DataIsolationInterceptor.CONTEXT_KEY] || null;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return next.handle();
    }

    const isolationContext: DataIsolationContext = {
      userRole: user.role,
      userId: user.id,
    };

    if (user.role === 'parent') {
      // 家长角色: 加载关联的学生ID列表
      try {
        const links = await this.parentStudentLinkRepo.find({
          where: { parentUserId: user.id },
          select: ['studentId'],
        });
        isolationContext.linkedStudentIds = links
          .filter((l) => l.studentId)
          .map((l) => l.studentId);
      } catch (err) {
        this.logger.warn(
          `加载家长关联学生失败 userId=${user.id}`,
          err?.message,
        );
        isolationContext.linkedStudentIds = [];
      }
    } else if (user.role === 'student') {
      // 学生角色: 学生ID即用户ID
      isolationContext.studentId = user.id;
    }

    // 将隔离上下文注入请求对象
    request[DataIsolationInterceptor.CONTEXT_KEY] = isolationContext;

    return next.handle();
  }
}
