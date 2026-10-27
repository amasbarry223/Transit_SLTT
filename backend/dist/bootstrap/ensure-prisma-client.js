"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaClientSync = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('PrismaSync');
exports.prismaClientSync = { status: 'ok' };
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
function ensurePrismaClient() {
    const backendDir = (0, path_1.resolve)(__dirname, '..', '..');
    const schemaPath = [(0, path_1.join)(__dirname, '..', 'prisma', 'schema.prisma'), (0, path_1.join)(backendDir, 'prisma', 'schema.prisma')].find((p) => (0, fs_1.existsSync)(p));
    if (!schemaPath) {
        exports.prismaClientSync.status = 'error';
        exports.prismaClientSync.detail = 'schema.prisma introuvable (ni dist/prisma ni prisma/)';
        logger.error(exports.prismaClientSync.detail);
        return;
    }
    try {
        const searchPaths = [backendDir, (0, path_1.join)(backendDir, '..')];
        const clientPkg = require.resolve('@prisma/client/package.json', { paths: searchPaths });
        const generatedSchema = (0, path_1.join)((0, path_1.dirname)(clientPkg), '..', '..', '.prisma', 'client', 'schema.prisma');
        const deployed = normalize((0, fs_1.readFileSync)(schemaPath, 'utf8'));
        const generated = (0, fs_1.existsSync)(generatedSchema) ? normalize((0, fs_1.readFileSync)(generatedSchema, 'utf8')) : '';
        if (deployed === generated)
            return;
        logger.log('Client Prisma périmé par rapport au schéma déployé — régénération…');
        const prismaCli = require.resolve('prisma/build/index.js', { paths: searchPaths });
        const res = (0, child_process_1.spawnSync)(process.execPath, [prismaCli, 'generate', '--schema', schemaPath], {
            cwd: backendDir,
            env: process.env,
            encoding: 'utf8',
        });
        if (res.status === 0) {
            exports.prismaClientSync.status = 'regenerated';
            logger.log('Client Prisma régénéré.');
        }
        else {
            const output = `${res.stderr ?? ''}${res.stdout ?? ''}${res.error ? String(res.error) : ''}`.trim();
            exports.prismaClientSync.status = 'failed';
            exports.prismaClientSync.detail = output.slice(-500) || `code ${res.status}`;
            logger.error(`Échec de prisma generate : ${exports.prismaClientSync.detail}`);
        }
    }
    catch (err) {
        exports.prismaClientSync.status = 'error';
        exports.prismaClientSync.detail = err?.message?.slice(0, 500);
        logger.error(`Vérification du client Prisma impossible : ${exports.prismaClientSync.detail}`);
    }
}
ensurePrismaClient();
//# sourceMappingURL=ensure-prisma-client.js.map