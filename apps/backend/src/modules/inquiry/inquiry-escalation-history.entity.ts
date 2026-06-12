import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

/**
 * 升级历史记录实体
 * 记录每次紧急升级的详细信息
 */
@Entity('inquiry_escalation_history')
export class InquiryEscalationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inquiry_id' })
  inquiryId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inquiry_id' })
  inquiry: User;

  /** 升级原因 */
  @Column({ name: 'escalation_reason', type: 'text' })
  escalationReason: string;

  /** 升级类型 */
  @Column({ name: 'escalation_category', type: 'varchar', length: 100 })
  escalationCategory: string;

  /** 原始优先级 */
  @Column({ name: 'original_priority', type: 'varchar', length: 50 })
  originalPriority: string;

  /** 新优先级 */
  @Column({ name: 'new_priority', type: 'varchar', length: 50 })
  newPriority: string;

  /** 触发的关键词 */
  @Column({ name: 'triggered_keywords', type: 'text', nullable: true })
  triggeredKeywords: string;

  /** 通知对象列表（JSON字符串） */
  @Column({ name: 'notified_users', type: 'text', nullable: true })
  notifiedUsers: string;

  /** 是否由管理员手动触发 */
  @Column({ name: 'is_manual', type: 'boolean', default: false })
  isManual: boolean;

  /** 触发者ID（手动升级时） */
  @Column({ name: 'triggered_by', type: 'uuid', nullable: true })
  triggeredBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggered_by' })
  triggerer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
