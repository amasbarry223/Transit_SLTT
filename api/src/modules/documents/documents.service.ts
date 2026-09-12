import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import type { CurrentUserType } from '../../auth/auth.types';

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

  /** Résout le chemin disque en garantissant qu'il reste sous uploadBaseDir. */
  private resolveInsideUploads(cheminRelatif: string): string {
    const fullPath = path.resolve(cheminRelatif);
    const base = this.uploadBaseDir + path.sep;
    if (fullPath !== this.uploadBaseDir && !fullPath.startsWith(base)) {
      throw new NotFoundException('Fichier hors du répertoire autorisé');
    }
    return fullPath;
  }

  async getFilePath(filename: string) {
    const doc = await this.prisma.document.findFirst({
      where: { nomFichier: filename },
    });

    if (!doc) throw new NotFoundException('Fichier non trouvé');
    const fullPath = this.resolveInsideUploads(doc.cheminRelatif);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Fichier physique introuvable sur le disque');
    }

    return { doc, fullPath };
  }

  async deleteFile(id: string, user: CurrentUserType) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { dossier: { select: { annexeId: true } } },
    });
    if (!doc) throw new NotFoundException('Document non trouvé');

    // Un document rattaché à un dossier hérite du périmètre annexe de ce
    // dossier : sans ce contrôle, n'importe quel utilisateur disposant de la
    // permission globale 'documents.supprimer' pouvait supprimer un document
    // d'une annexe à laquelle il n'a pas accès.
    if (
      doc.dossier &&
      user.role !== 'ADMIN' &&
      !user.annexeIds.includes(doc.dossier.annexeId)
    ) {
      throw new ForbiddenException("Ce document n'appartient pas à votre annexe");
    }

    // Le fichier disque ne doit être supprimé que s'il est bien sous uploads/ ;
    // sinon on retire seulement la ligne en base (pas de suppression sauvage).
    try {
      const fullPath = this.resolveInsideUploads(doc.cheminRelatif);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      // Chemin hors périmètre ou erreur d'I/O : on n'échoue pas la suppression logique.
    }

    return this.prisma.document.delete({ where: { id } });
  }
}
