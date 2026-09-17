import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import type { CurrentUserType } from '../../auth/auth.types';
import { assertAnnexeAccess } from '../../common/annexe-filter.utils';

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

  async findByDossier(dossierId: string, user: CurrentUserType) {
    // Sans ce contrôle, n'importe quel utilisateur authentifié (quel que
    // soit son périmètre d'annexe) pouvait lister les documents de N'IMPORTE
    // QUEL dossier en connaissant/devinant son id — seul JwtAuthGuard
    // s'appliquait ici, aucun @RequirePermission ni filtre par annexe
    // (contrairement à dossiers.service.findOne, qui inclut déjà ces mêmes
    // documents en étant, lui, correctement cloisonné).
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
      select: { annexeId: true },
    });
    if (!dossier) throw new NotFoundException(`Dossier ${dossierId} non trouvé`);
    assertAnnexeAccess(user, dossier.annexeId, 'ce dossier');

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
      where: {
        OR: [
          { nomFichier: filename },
          { id: filename },
        ],
      },
    });

    if (!doc) {
      // Fallback si le fichier est directement présent sur le disque dans uploads.
      // `filename` vient d'un @Param() sur une route @Public() (sans authentification) :
      // on refuse tout ce qui n'est pas un simple nom de fichier (pas de "..", pas de
      // séparateur de chemin) avant de résoudre, puis on revalide que le résultat reste
      // bien sous uploadBaseDir — sinon un `filename` du type "../../.env" permettait de
      // lire n'importe quel fichier lisible par le process, sans authentification.
      if (path.basename(filename) !== filename) {
        throw new NotFoundException('Fichier non trouvé');
      }
      const directPath = this.resolveInsideUploads(path.join(this.uploadBaseDir, filename));
      // `filename` égal à "." (basename(".") === ".", donc accepté par le contrôle
      // ci-dessus) résout directPath sur uploadBaseDir lui-même — un dossier, pas un
      // fichier. `isFile()` ferme ce cas avant `res.sendFile()` (qui échouerait sur un
      // dossier de toute façon, mais après avoir déjà posé les en-têtes de réponse).
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
      throw new NotFoundException('Fichier non trouvé');
    }
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
