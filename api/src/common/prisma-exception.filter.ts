import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Traduit les erreurs Prisma connues en réponses HTTP propres au lieu d'un
 * 500 générique avec stack trace. Évite d'avoir à envelopper chaque service
 * dans des try/catch de traduction.
 */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Prisma');

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Requête invalide.';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[] | string | undefined) ?? '';
          message = `Cette valeur existe déjà${target ? ` (${Array.isArray(target) ? target.join(', ') : target})` : ''}.`;
          break;
        }
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) ?? 'Ressource introuvable.';
          break;
        case 'P2003':
          status = HttpStatus.CONFLICT;
          message =
            'Opération impossible : cet élément est référencé par d’autres données.';
          break;
        case 'P2000':
          message = 'Une valeur fournie est trop longue.';
          break;
        default:
          this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
          message = 'La base de données a refusé l’opération.';
      }
    } else {
      // PrismaClientValidationError : payload mal formé pour Prisma.
      this.logger.warn(exception.message);
      message = 'Données invalides pour cette opération.';
    }

    res.status(status).json({ statusCode: status, message });
  }
}
