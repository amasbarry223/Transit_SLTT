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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const MAX_SETTING_VALUE_LENGTH = 10_000;
const VALID_SETTING_TYPES = new Set(['string', 'number', 'boolean', 'json']);
function assertValidSettingValue(cle, valeur, type) {
    if (typeof valeur !== 'string' && typeof valeur !== 'number' && typeof valeur !== 'boolean') {
        throw new common_1.BadRequestException(`Valeur invalide pour le paramètre "${cle}".`);
    }
    if (String(valeur).length > MAX_SETTING_VALUE_LENGTH) {
        throw new common_1.BadRequestException(`La valeur du paramètre "${cle}" dépasse la taille maximale autorisée (${MAX_SETTING_VALUE_LENGTH} caractères).`);
    }
    if (type !== undefined && !VALID_SETTING_TYPES.has(type)) {
        throw new common_1.BadRequestException(`Type de paramètre invalide pour "${cle}" : "${type}".`);
    }
}
function parseValue(valeur, type) {
    if (type === 'number') {
        const n = Number(valeur);
        return Number.isFinite(n) ? n : 0;
    }
    if (type === 'boolean') {
        return valeur === 'true' || valeur === '1';
    }
    if (type === 'json') {
        try {
            return JSON.parse(valeur);
        }
        catch {
            return valeur;
        }
    }
    return valeur;
}
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicSettings() {
        const settings = await this.prisma.setting.findMany({
            where: { isPublic: true },
        });
        const result = {};
        settings.forEach((s) => {
            result[s.cle] = parseValue(s.valeur, s.type);
        });
        return result;
    }
    async getAll() {
        const settings = await this.prisma.setting.findMany({
            orderBy: [{ groupName: 'asc' }, { cle: 'asc' }],
        });
        const map = {};
        const parsedMap = {};
        const groups = {};
        settings.forEach((s) => {
            map[s.cle] = s.valeur;
            parsedMap[s.cle] = parseValue(s.valeur, s.type);
            const group = s.groupName || 'general';
            if (!groups[group])
                groups[group] = [];
            groups[group].push(s);
        });
        return { list: settings, map, parsedMap, groups };
    }
    async getByKey(cle) {
        const setting = await this.prisma.setting.findUnique({ where: { cle } });
        if (!setting)
            return null;
        return {
            ...setting,
            parsedValue: parseValue(setting.valeur, setting.type),
        };
    }
    async setKey(cle, valeur, description, type, isPublic, groupName) {
        assertValidSettingValue(cle, valeur, type);
        return this.prisma.setting.upsert({
            where: { cle },
            create: {
                cle,
                valeur: String(valeur),
                description,
                type: type || 'string',
                isPublic: isPublic ?? false,
                groupName: groupName || 'general',
            },
            update: {
                valeur: String(valeur),
                ...(description !== undefined ? { description } : {}),
                ...(type !== undefined ? { type } : {}),
                ...(isPublic !== undefined ? { isPublic } : {}),
                ...(groupName !== undefined ? { groupName } : {}),
            },
        });
    }
    async setMany(settings) {
        const operations = Object.entries(settings).map(([cle, data]) => {
            if (typeof data === 'object' && data !== null) {
                assertValidSettingValue(cle, data.valeur, data.type);
                return this.prisma.setting.upsert({
                    where: { cle },
                    create: {
                        cle,
                        valeur: String(data.valeur),
                        description: data.description,
                        type: data.type || 'string',
                        isPublic: data.isPublic ?? false,
                        groupName: data.groupName || 'general',
                    },
                    update: {
                        valeur: String(data.valeur),
                        ...(data.description !== undefined ? { description: data.description } : {}),
                        ...(data.type !== undefined ? { type: data.type } : {}),
                        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
                        ...(data.groupName !== undefined ? { groupName: data.groupName } : {}),
                    },
                });
            }
            assertValidSettingValue(cle, data);
            return this.prisma.setting.upsert({
                where: { cle },
                create: { cle, valeur: String(data) },
                update: { valeur: String(data) },
            });
        });
        return this.prisma.$transaction(operations);
    }
    async getStatusOptions(entityType) {
        const where = { isActive: true };
        if (entityType) {
            where.entityType = entityType;
        }
        return this.prisma.statusConfig.findMany({
            where,
            orderBy: [{ entityType: 'asc' }, { orderIndex: 'asc' }],
        });
    }
    async setStatusOption(data) {
        return this.prisma.statusConfig.upsert({
            where: {
                entityType_value: {
                    entityType: data.entityType,
                    value: data.value,
                },
            },
            create: {
                entityType: data.entityType,
                value: data.value,
                label: data.label,
                color: data.color,
                icon: data.icon,
                orderIndex: data.orderIndex ?? 0,
                isActive: data.isActive ?? true,
            },
            update: {
                label: data.label,
                ...(data.color !== undefined ? { color: data.color } : {}),
                ...(data.icon !== undefined ? { icon: data.icon } : {}),
                ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            },
        });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map