"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
const prisma_exception_filter_1 = require("./common/prisma-exception.filter");
const cors_origins_util_1 = require("./common/cors-origins.util");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    try {
        const helmet = require('helmet');
        app.use(helmet({
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }));
    }
    catch {
        app.use((_req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            next();
        });
    }
    app.use((0, cookie_parser_1.default)());
    const apiPrefix = process.env.API_PREFIX ?? 'api';
    app.setGlobalPrefix(apiPrefix);
    const allowedOrigins = (0, cors_origins_util_1.getTrustedOrigins)();
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            callback(null, (0, cors_origins_util_1.isTrustedOrigin)(origin, allowedOrigins));
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