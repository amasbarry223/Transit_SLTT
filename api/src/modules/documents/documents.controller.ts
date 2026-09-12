import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Public, RequirePermission } from '../../shared/decorators';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Même liste que DOC_ACCEPTED_EXTENSIONS côté front (src/lib/constants/validation.constants.ts)
// — l'attribut `accept` d'un <input type="file"> n'est qu'une suggestion d'UI,
// jamais une garantie serveur : sans ce filtre, n'importe quel type de fichier
// (exécutable, script...) pouvait être uploadé, stocké sur le disque du
// serveur et son `mimetype` déclaré tel quel (valeur client, falsifiable)
// persisté et renvoyé au téléchargement.
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp',
]);

function documentFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    cb(new BadRequestException(`Type de fichier non autorisé (${ext || 'sans extension'}).`), false);
    return;
  }
  cb(null, true);
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('dossier/:dossierId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async findByDossier(@Param('dossierId') dossierId: string) {
    return this.documentsService.findByDossier(dossierId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents.upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: documentFileFilter,
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('dossierId') dossierId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu, ou type de fichier refusé.');
    }
    return this.documentsService.saveFileMetadata(file, dossierId);
  }

  // @Public() nécessaire, pas juste l'absence de @UseGuards() : JwtAuthGuard
  // est câblé en APP_GUARD global (voir app.module.ts) et s'applique donc à
  // TOUTE route sans ce décorateur, malgré l'absence de @UseGuards() ici —
  // vérifié empiriquement (401 sur cette route avant l'ajout de @Public()).
  // Cette URL est utilisée en <img src> (logo société sur le papier à
  // en-tête officiel de tous les documents imprimés — facture/devis/bon de
  // caisse/reçu) et par un fetch() sans en-tête Authorization côté aperçu
  // document (document-viewer.tsx::FetchedDocumentPreview) : un <img> ne
  // peut pas envoyer de Bearer token, et les deux étaient cassés en silence
  // avant ce correctif. Le nom de fichier (horodatage + suffixe aléatoire
  // ~1e9) n'est pas énumérable et n'est jamais listé sans authentification
  // (findByDossier est guardé) : sécurité par obscurité assumée pour cette
  // seule route, comme pour un logo public.
  @Public()
  @Get(':filename/download')
  async downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const { doc, fullPath } = await this.documentsService.getFilePath(filename);
    res.setHeader('Content-Type', doc.typeMime);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.nomOriginal}"`);
    return res.sendFile(fullPath);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('documents.supprimer')
  async deleteFile(@Param('id') id: string) {
    return this.documentsService.deleteFile(id);
  }
}
