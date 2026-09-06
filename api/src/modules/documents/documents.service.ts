import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly uploadBaseDir = path.resolve(process.env.UPLOAD_DIR || './uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
    }
  }

  async saveFileMetadata(
    file: Express.Multer.File,
    dossierId?: string,
  ) {
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

  async findByDossier(dossierId: string) {
    return this.prisma.document.findMany({
      where: { dossierId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFilePath(filename: string) {
    const doc = await this.prisma.document.findFirst({
      where: { nomFichier: filename },
    });

    if (!doc) throw new NotFoundException('Fichier non trouvé');
    const fullPath = path.resolve(doc.cheminRelatif);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Fichier physique introuvable sur le disque');
    }

    return { doc, fullPath };
  }

  async deleteFile(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document non trouvé');

    const fullPath = path.resolve(doc.cheminRelatif);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // Ignorer l'erreur physique
      }
    }

    return this.prisma.document.delete({ where: { id } });
  }
}
