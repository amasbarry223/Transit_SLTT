import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix global
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Validation globale des DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Retire les champs non déclarés dans le DTO
      forbidNonWhitelisted: true,
      transform: true,        // Transforme les types primitifs automatiquement
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`🚀 API Transit SLTT démarrée sur http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
