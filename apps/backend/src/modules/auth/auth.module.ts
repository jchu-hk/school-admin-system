import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { PasswordController } from './password.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { UserModule } from '../user/user.module';
import { OtpSession } from '../otp/entities/otp.entity';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { ParentStudentLink } from './entities/parent-student-link.entity';
import { TemporaryPassword } from './entities/temporary-password.entity';
import { OtpRequest } from './entities/otp-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OtpSession,
      ParentStudentLink,
      TemporaryPassword,
      OtpRequest,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'school-admin-secret',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  controllers: [AuthController, PasswordController],
  providers: [AuthService, PasswordService, JwtStrategy],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
