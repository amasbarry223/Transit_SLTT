"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const prisma_exception_filter_1 = require("./common/prisma-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cookie_parser_1.default)());
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    app.setGlobalPrefix(apiPrefix);
    const rawCors = process.env.CORS_ORIGIN ?? '';
    const configuredCors = rawCors
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const allowedOrigins = Array.from(new Set([
        'https://traorelogistique-transit.com',
        'https://www.traorelogistique-transit.com',
        'http://localhost:3000',
        'http://localhost:3001',
        ...configuredCors,
    ]));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            const isAllowed = allowedOrigins.some((allowed) => {
                if (allowed === origin)
                    return true;
                const cleanAllowed = allowed.replace(/^https?:\/\/(www\.)?/, '');
                const cleanOrigin = origin.replace(/^https?:\/\/(www\.)?/, '');
                return cleanAllowed === cleanOrigin;
            });
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(null, false);
            }
        },
        credentials: true,
    });
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    await app.listen(port, host);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`🚀 API Transit SLTT démarrée sur http://${host}:${port}/${apiPrefix}`);
}
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
bootstrap();
//# sourceMappingURL=main.js.map