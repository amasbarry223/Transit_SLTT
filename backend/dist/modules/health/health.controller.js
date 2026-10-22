"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../shared/decorators");
const ensure_prisma_client_1 = require("../../bootstrap/ensure-prisma-client");
const prisma_service_1 = require("../../prisma/prisma.service");
function errorCode(err) {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError)
        return err.code;
    if (err instanceof client_1.Prisma.PrismaClientInitializationError)
        return err.errorCode ?? 'INIT';
    if (err instanceof client_1.Prisma.PrismaClientValidationError)
        return 'VALIDATION';
    return err?.name ?? 'UNKNOWN';
}
let HealthController = class HealthController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async db() {
        const checks = {
            annexes: () => this.prisma.annexe.count(),
            clients: () => this.prisma.client.count(),
            dossiers: () => this.prisma.dossier.count(),
            factures: () => this.prisma.facture.count(),
            bonsSortie: () => this.prisma.bonSortie.count(),
            bonsLivraison: () => this.prisma.bonLivraison.count(),
            notifications: () => this.prisma.notification.count(),
            recusPaiement: () => this.prisma.recuPaiement.count(),
        };
        const started = Date.now();
        const names = Object.keys(checks);
        const results = await Promise.allSettled(names.map((n) => checks[n]()));
        return {
            durationMs: Date.now() - started,
            checks: Object.fromEntries(names.map((n, i) => {
                const r = results[i];
                return [n, r.status === 'fulfilled' ? 'ok' : errorCode(r.reason)];
            })),
        };
    }
    check() {
        return {
            status: 'ok',
            service: 'Transit SLTT API',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV || 'development',
            prismaModels: Object.keys(client_1.Prisma.ModelName).length,
            prismaClientSync: ensure_prisma_client_1.prismaClientSync,
        };
    }
    root() {
        return {
            status: 'ok',
            service: 'Transit SLTT API',
            version: '1.0.0',
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('health/db'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "db", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "root", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthController);
//# sourceMappingURL=health.controller.js.map