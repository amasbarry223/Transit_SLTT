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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
exports.withPoolLimits = withPoolLimits;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const apply_schema_scripts_1 = require("./apply-schema-scripts");
const DEFAULT_CONNECTION_LIMIT = 5;
const DEFAULT_POOL_TIMEOUT_S = 20;
function withPoolLimits(url, env = process.env) {
    if (!url)
        return url;
    const params = [];
    if (!/[?&]connection_limit=/.test(url)) {
        params.push(`connection_limit=${Number(env.PRISMA_CONNECTION_LIMIT) || DEFAULT_CONNECTION_LIMIT}`);
    }
    if (!/[?&]pool_timeout=/.test(url)) {
        params.push(`pool_timeout=${Number(env.PRISMA_POOL_TIMEOUT) || DEFAULT_POOL_TIMEOUT_S}`);
    }
    if (params.length === 0)
        return url;
    return `${url}${url.includes('?') ? '&' : '?'}${params.join('&')}`;
}
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor() {
        const url = withPoolLimits(process.env.DATABASE_URL);
        super(url ? { datasources: { db: { url } } } : undefined);
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Base de données MySQL connectée avec succès');
        }
        catch (err) {
            this.logger.warn(`⚠️ Connexion MySQL en attente de configuration ou démarrage : ${err?.message || err}`);
            return;
        }
        const res = await (0, apply_schema_scripts_1.applySchemaScripts)(this);
        if (res.status === 'error')
            this.logger.error(`Scripts SQL : échec — ${res.detail}`);
        else if (res.applied.length)
            this.logger.log(`Scripts SQL appliqués : ${res.applied.join(', ')}`);
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map