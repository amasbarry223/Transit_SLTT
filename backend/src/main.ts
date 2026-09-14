import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
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

  // CORS — credentials:true + support multi-origines (apex + sous-domaine www)
  const rawCors = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const allowedOrigins = rawCors
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (curl, tests internes, Postman)
      if (!origin) {
        return callback(null, true);
      }
      // Vérifier correspondance exacte ou avec/sans www
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === origin) return true;
        const cleanAllowed = allowed.replace(/^https?:\/\/(www\.)?/, '');
        const cleanOrigin = origin.replace(/^https?:\/\/(www\.)?/, '');
        return cleanAllowed === cleanOrigin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origine ${origin} non autorisée par CORS`));
      }
    },
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
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API Transit SLTT démarrée sur http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
