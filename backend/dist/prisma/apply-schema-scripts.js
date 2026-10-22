"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaScripts = void 0;
exports.splitSqlStatements = splitSqlStatements;
exports.applySchemaScripts = applySchemaScripts;
const fs_1 = require("fs");
const path_1 = require("path");
exports.schemaScripts = { status: 'none', applied: [] };
function splitSqlStatements(sql) {
    return sql
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .split(/;\s*(?:\n|$)/)
        .map((s) => s.trim())
        .filter(Boolean);
}
function resolveSqlDir() {
    return [(0, path_1.join)(__dirname, 'sql'), (0, path_1.join)(__dirname, '..', '..', 'prisma', 'sql')].find((d) => (0, fs_1.existsSync)(d));
}
async function applySchemaScripts(prisma) {
    const dir = resolveSqlDir();
    if (!dir)
        return exports.schemaScripts;
    const files = (0, fs_1.readdirSync)(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
        try {
            for (const statement of splitSqlStatements((0, fs_1.readFileSync)((0, path_1.join)(dir, file), 'utf8'))) {
                await prisma.$executeRawUnsafe(statement);
            }
            exports.schemaScripts.applied.push(file);
        }
        catch (err) {
            exports.schemaScripts.status = 'error';
            exports.schemaScripts.detail = `${file} : ${(err?.message ?? String(err)).slice(0, 300)}`;
            return exports.schemaScripts;
        }
    }
    exports.schemaScripts.status = 'ok';
    return exports.schemaScripts;
}
//# sourceMappingURL=apply-schema-scripts.js.map