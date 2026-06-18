import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

export enum TempPasswordType {
  TEMP = 'temp',
  RESET = 'reset',
}

@Entity('temporary_passwords')
export class TemporaryPassword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'code_hash', length: 255 })
  codeHash: string;

  @Column({ type: 'enum', enum: TempPasswordType })
  type: TempPasswordType;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
