import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DseRelease } from './dse-release.entity';
import { User } from '../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum DseSubjectLevel {
  /** 核心科目 */
  CHINESE_LANG = 'Chinese Language',
  ENGLISH_LANG = 'English Language',
  MATHEMATICS_COMPULSORY = 'Mathematics (Compulsory)',
  MATHEMATICS_EXTENDED = 'Mathematics (Extended Part)',
  LIBERAL_STUDIES = 'Liberal Studies',

  /** 乙类科目（应用学习） */
  APPPLIED_LEARNING = 'Applied Learning',

  /** 丙类科目（其他语言） */
  OTHER_LANGUAGE = 'Other Language',
}

export enum DseLevel {
  LEVEL_5_PLUS_PLUS = '5++',
  LEVEL_5_PLUS = '5+',
  LEVEL_5 = '5',
  LEVEL_4 = '4',
  LEVEL_3 = '3',
  LEVEL_2 = '2',
  LEVEL_1 = '1',
  UNGRADED = 'U',
  ABSENT = 'Absent',
  /** 未评级（缺考） */
  NOT_ATTENDED = 'Not Attended',
}

export enum DseResultStatus {
  PENDING = 'pending', // 待导入
  IMPORTED = 'imported', // 已导入原始成绩
  REVIEW_REQUESTED = 'review_requested', // 覆核申请中
  REVIEW_IN_PROGRESS = 'review_in_progress', // 覆核处理中
  REVIEW_COMPLETED = 'review_completed', // 覆核完成（可能有更正）
  PUBLISHED = 'published', // 已向家长/学生公布
}

@Entity('dse_results')
export class DseResult {
  @ApiProperty({ description: 'DSE成绩记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: '关联的放榜记录ID' })
  @Column({ type: 'uuid', name: 'release_id' })
  releaseId: string;

  @ManyToOne(() => DseRelease, { eager: false })
  @JoinColumn({ name: 'release_id' })
  release: DseRelease;

  @ApiProperty({ description: '学生ID（关联users表）' })
  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty({ description: '中文姓名' })
  @Column({ length: 100, name: 'student_name' })
  studentName: string;

  @ApiProperty({ description: '班级', example: '6A' })
  @Column({ length: 20, nullable: true, name: 'class_name' })
  className: string;

  @ApiProperty({ description: 'HKEAA考生编号' })
  @Column({ length: 30, nullable: true, name: 'hkeaa_candidate_no' })
  hkeaaCandidateNo: string;

  @ApiProperty({ description: '中文科目成绩' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'chinese_level',
  })
  chineseLevel: string;

  @ApiProperty({ description: '英文科目成绩' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'english_level',
  })
  englishLevel: string;

  @ApiProperty({ description: '数学必修部分成绩' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'math_compulsory_level',
  })
  mathCompulsoryLevel: string;

  @ApiProperty({ description: '数学延伸部分成绩（M1/M2）' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'math_extended_level',
  })
  mathExtendedLevel: string;

  @ApiProperty({ description: '通识科目成绩' })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'liberal_studies_level',
  })
  liberalStudiesLevel: string;

  /** 选修科目1代码 */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'elective_1_code',
  })
  elective1Code: string;

  /** 选修科目1名称 */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'elective_1_name',
  })
  elective1Name: string;

  /** 选修科目1成绩 */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'elective_1_level',
  })
  elective1Level: string;

  /** 选修科目2代码 */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'elective_2_code',
  })
  elective2Code: string;

  /** 选修科目2名称 */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'elective_2_name',
  })
  elective2Name: string;

  /** 选修科目2成绩 */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'elective_2_level',
  })
  elective2Level: string;

  /** 选修科目3代码 */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'elective_3_code',
  })
  elective3Code: string;

  /** 选修科目3名称 */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'elective_3_name',
  })
  elective3Name: string;

  /** 选修科目3成绩 */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'elective_3_level',
  })
  elective3Level: string;

  /** 最佳5科成绩（用于统计） */
  @ApiProperty({ description: '最佳5科成绩总和' })
  @Column({ type: 'int', nullable: true, name: 'best_five_total' })
  bestFiveTotal: number;

  /** 成绩原始JSON（来自HKEAA完整数据备份） */
  @ApiProperty({ description: 'HKEAA原始数据' })
  @Column({ type: 'jsonb', nullable: true, name: 'raw_data' })
  rawData: Record<string, any>;

  @ApiProperty({ description: '成绩状态', enum: DseResultStatus })
  @Column({
    type: 'enum',
    enum: DseResultStatus,
    default: DseResultStatus.PENDING,
    name: 'result_status',
  })
  resultStatus: DseResultStatus;

  @ApiProperty({ description: '是否已向家长公布' })
  @Column({ type: 'boolean', default: false, name: 'published_to_parent' })
  publishedToParent: boolean;

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
