import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum JupasStatus {
  NOT_APPLIED = 'not_applied',           // 未申请
  APPLICATION_SUBMITTED = 'application_submitted', // 已提交申请
  BAND_A_OFFERED = 'band_a_offered',     // 获得Band A录取
  BAND_B_OFFERED = 'band_b_offered',     // 获得Band B录取
  BAND_C_OFFERED = 'band_c_offered',     // 获得Band C录取
  CONFIRMED = 'confirmed',               // 已确认录取
  CONDITIONAL_OFFER = 'conditional_offer', // 有条件录取
  REJECTED = 'rejected',                 // 未获录取
  DEFERRED = 'deferred',                 // 延迟入学
  WITHDRAWN = 'withdrawn',               // 已撤销申请
  AWAITING_RESULT = 'awaiting_result',   // 等待结果
}

@Entity('dse_offer_tracking')
export class DseOfferTracking {
  @ApiProperty({ description: '升学去向追踪记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '关联的DSE成绩记录ID' })
  @Column({ type: 'uuid', name: 'dse_result_id' })
  dseResultId: string;

  @ManyToOne(() => null)
  @JoinColumn({ name: 'dse_result_id' })
  dseResult: any;

  @ApiProperty({ description: '学生ID' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => null)
  @JoinColumn({ name: 'student_id' })
  student: any;

  @ApiProperty({ description: '学生姓名（匿名化显示：姓+同学）' })
  @Column({ length: 50, name: 'student_name_anonymized' })
  studentNameAnonymized: string;

  @ApiProperty({ description: '班级' })
  @Column({ length: 20, nullable: true, name: 'class_name' })
  className: string;

  @ApiProperty({ description: 'JUPAS申请状态', enum: JupasStatus })
  @Column({
    type: 'enum',
    enum: JupasStatus,
    default: JupasStatus.NOT_APPLIED,
    name: 'jupas_status',
  })
  jupasStatus: JupasStatus;

  @ApiProperty({ description: 'JUPAS申请编号' })
  @Column({ length: 30, nullable: true, name: 'jupas_application_no' })
  jupasApplicationNo: string;

  @ApiProperty({ description: '最终就读大学（匿名）', example: '香港大學' })
  @Column({ length: 100, nullable: true, name: 'institution_anonymized' })
  institutionAnonymized: string;

  @ApiProperty({ description: '就读课程（匿名）', example: '內外全科醫學士' })
  @Column({ length: 200, nullable: true, name: 'program_anonymized' })
  programAnonymized: string;

  @ApiProperty({ description: '入学年份' })
  @Column({ type: 'int', nullable: true, name: 'enrollment_year' })
  enrollmentYear: number;

  @ApiProperty({ description: 'Offer确认日期' })
  @Column({ type: 'date', nullable: true, name: 'offer_date' })
  offerDate: Date;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true })
  remark: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
