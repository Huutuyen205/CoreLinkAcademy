import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Helmet bảo vệ headers
  app.use(helmet());

  // CORS cho Web client
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix /api/v1 theo A5
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation tại /api/docs theo A12
  const config = new DocumentBuilder()
    .setTitle('CoreLink Academy API')
    .setDescription('Tài liệu OpenAPI CoreLink Academy - Hệ thống quản lý đào tạo tích hợp AI')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`CoreLink API đang chạy tại: http://localhost:${port}/api/v1`);
  logger.log(`Swagger tài liệu tại: http://localhost:${port}/api/docs`);
}

bootstrap();
