import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Requis pour lire les cookies httpOnly (access/refresh/CSRF) posés par
  // AuthController — sans lui, req.cookies est toujours undefined.
  app.use(cookieParser());

  // Prefix global
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // CORS — credentials:true + origine exacte (jamais '*'/true, incompatible
  // avec credentials selon la spec Fetch) : indispensable pour que le
  // navigateur envoie/accepte les cookies httpOnly cross-origin.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Traduit les erreurs Prisma (P2002, P2025, P2003…) en 409/404/400 au lieu
  // d'un 500 avec stack trace.
  app.useGlobalFilters(new PrismaExceptionFilter());

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
