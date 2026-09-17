import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { getTrustedOrigins, isTrustedOrigin } from './common/cors-origins.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En-têtes de sécurité HTTP (X-Content-Type-Options, X-Frame-Options,
  // Strict-Transport-Security, etc.) — absents jusqu'ici. `crossOriginResourcePolicy`
  // desserré : le front peut être sur un domaine distinct de l'API (cf.
  // .env.example / CORS_ORIGIN multi-origines) et charge des images (logo,
  // documents) directement depuis cette API.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Requis pour lire les cookies httpOnly (access/refresh/CSRF) posés par
  // AuthController — sans lui, req.cookies est toujours undefined.
  app.use(cookieParser());

  // Prefix global
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // CORS — credentials:true + support multi-origines (apex + sous-domaine www).
  // Liste d'origines de confiance : source unique dans cors-origins.util.ts,
  // partagée avec CsrfGuard (voir ce fichier pour la justification du repli).
  const allowedOrigins = getTrustedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (curl, tests internes, Postman)
      if (!origin) {
        return callback(null, true);
      }
      callback(null, isTrustedOrigin(origin, allowedOrigins));
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
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API Transit SLTT démarrée sur http://${host}:${port}/${apiPrefix}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

bootstrap();
