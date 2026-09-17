"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaExceptionFilter = class PrismaExceptionFilter {
    logger = new common_1.Logger('Prisma');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        let status = common_1.HttpStatus.BAD_REQUEST;
        let message = 'Requête invalide.';
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            switch (exception.code) {
                case 'P2002': {
                    status = common_1.HttpStatus.CONFLICT;
                    const target = exception.meta?.target ?? '';
                    message = `Cette valeur existe déjà${target ? ` (${Array.isArray(target) ? target.join(', ') : target})` : ''}.`;
                    break;
                }
                case 'P2025':
                    status = common_1.HttpStatus.NOT_FOUND;
                    message = exception.meta?.cause ?? 'Ressource introuvable.';
                    break;
                case 'P2003': {
                    status = common_1.HttpStatus.CONFLICT;
                    const method = (req.method ?? '').toUpperCase();
                    message =
                        method === 'DELETE'
                            ? 'Suppression impossible : cet élément est référencé par d’autres données.'
                            : 'Opération impossible : une référence fournie (id lié) n’existe pas.';
                    break;
                }
                case 'P2000':
                    message = 'Une valeur fournie est trop longue.';
                    break;
                default:
                    this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
                    message = 'La base de données a refusé l’opération.';
            }
        }
        else {
            this.logger.warn(exception.message);
            message = 'Données invalides pour cette opération.';
        }
        res.status(status).json({ statusCode: status, message });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError, client_1.Prisma.PrismaClientValidationError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map