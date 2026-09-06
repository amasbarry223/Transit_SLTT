import {
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
import { RequirePermission } from '../../shared/decorators';

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
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 25 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('dossierId') dossierId?: string,
  ) {
    return this.documentsService.saveFileMetadata(file, dossierId);
  }

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
