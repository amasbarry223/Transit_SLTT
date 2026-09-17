"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const annexe_filter_utils_1 = require("../../common/annexe-filter.utils");
let DocumentsService = class DocumentsService {
    prisma;
    uploadBaseDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    constructor(prisma) {
        this.prisma = prisma;
        if (!fs.existsSync(this.uploadBaseDir)) {
            fs.mkdirSync(this.uploadBaseDir, { recursive: true });
        }
    }
    async saveFileMetadata(file, dossierId) {
        const document = await this.prisma.document.create({
            data: {
                dossierId: dossierId || null,
                nomFichier: file.filename,
                nomOriginal: file.originalname,
                typeMime: file.mimetype,
                taille: file.size,
                cheminRelatif: file.path,
                url: `/api/documents/${file.filename}/download`,
            },
        });
        return document;
    }
    async findAll(user) {
        const isGlobal = user.role === 'ADMIN' || user.role === 'Administrateur' || user.permissions?.includes('*');
        if (isGlobal || !user.annexeIds?.length) {
            return this.prisma.document.findMany({
                include: {
                    dossier: {
                        select: { id: true, numero: true, annexeId: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        return this.prisma.document.findMany({
            where: {
                OR: [
                    { dossierId: null },
                    { dossier: { annexeId: { in: user.annexeIds } } },
                ],
            },
            include: {
                dossier: {
                    select: { id: true, numero: true, annexeId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByDossier(dossierId, user) {
        const dossier = await this.prisma.dossier.findUnique({
            where: { id: dossierId },
            select: { annexeId: true },
        });
        if (!dossier)
            throw new common_1.NotFoundException(`Dossier ${dossierId} non trouvé`);
        (0, annexe_filter_utils_1.assertAnnexeAccess)(user, dossier.annexeId, 'ce dossier');
        return this.prisma.document.findMany({
            where: { dossierId },
            orderBy: { createdAt: 'desc' },
        });
    }
    resolveInsideUploads(cheminRelatif) {
        const fullPath = path.resolve(cheminRelatif);
        const base = this.uploadBaseDir + path.sep;
        if (fullPath !== this.uploadBaseDir && !fullPath.startsWith(base)) {
            throw new common_1.NotFoundException('Fichier hors du répertoire autorisé');
        }
        return fullPath;
    }
    async getFilePath(filename) {
        const doc = await this.prisma.document.findFirst({
            where: {
                OR: [
                    { nomFichier: filename },
                    { id: filename },
                ],
            },
        });
        if (!doc) {
            if (path.basename(filename) !== filename) {
                throw new common_1.NotFoundException('Fichier non trouvé');
            }
            const directPath = this.resolveInsideUploads(path.join(this.uploadBaseDir, filename));
            if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
                const ext = path.extname(filename).toLowerCase();
                const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
                return {
                    doc: {
                        nomOriginal: filename,
                        typeMime: mime,
                    },
                    fullPath: directPath,
                };
            }
            throw new common_1.NotFoundException('Fichier non trouvé');
        }
        const fullPath = this.resolveInsideUploads(doc.cheminRelatif);
        if (!fs.existsSync(fullPath)) {
            throw new common_1.NotFoundException('Fichier physique introuvable sur le disque');
        }
        return { doc, fullPath };
    }
    async deleteFile(id, user) {
        const doc = await this.prisma.document.findUnique({
            where: { id },
            include: { dossier: { select: { annexeId: true } } },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document non trouvé');
        if (doc.dossier &&
            user.role !== 'ADMIN' &&
            !user.annexeIds.includes(doc.dossier.annexeId)) {
            throw new common_1.ForbiddenException("Ce document n'appartient pas à votre annexe");
        }
        try {
            const fullPath = this.resolveInsideUploads(doc.cheminRelatif);
            if (fs.existsSync(fullPath))
                fs.unlinkSync(fullPath);
        }
        catch {
        }
        return this.prisma.document.delete({ where: { id } });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map