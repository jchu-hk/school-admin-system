import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global interceptor to serialize entities (excludes @Exclude() fields like password)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger API Documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('学校管理系统 API')
    .setDescription('Smart School Admin System API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '输入 JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('auth', '认证相关')
    .addTag('users', '用户管理')
    .addTag('inquiries', '家长查询')
    .addTag('leaves', '请假管理')
    .addTag('notifications', '通知管理')
    .addTag('permissions', '权限管理')
    .addTag('roles', '角色管理')
    .addTag('courses', '课程管理')
    .addTag('attendance', '考勤管理')
    .addTag('grades', '成绩管理')
    .addTag('health', '健康检查')
    .addTag('backup', '备份管理')
    .addTag('dashboard', '仪表盘')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
