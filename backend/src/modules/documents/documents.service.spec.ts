import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DocumentsService } from './documents.service';
import type { CurrentUserType } from '../../auth/auth.types';

function admin(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return { id: 'admin-1', email: 'admin@x.com', nom: 'Admin', role: 'ADMIN', permissions: ['*'], annexeIds: [], ...overrides };
}

function agent(overrides: Partial<CurrentUserType> = {}): CurrentUserType {
  return {
    id: 'agent-1',
    email: 'agent@x.com',
    nom: 'Agent',
    role: 'TRANSITAIRE',
    permissions: ['documents:read'],
    annexeIds: ['annexe-ml'],
    ...overrides,
  };
}

function createFakePrisma() {
  return {
    dossier: { findUnique: vi.fn() },
    document: { findMany: vi.fn() },
  };
}

describe('DocumentsService.findByDossier', () => {
  it("rejette un utilisateur dont l'annexe ne correspond pas à celle du dossier", async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ci' });
    const service = new DocumentsService(prisma as any);

    await expect(service.findByDossier('dossier-1', agent({ annexeIds: ['annexe-ml'] }))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.document.findMany).not.toHaveBeenCalled();
  });

  it("accepte un utilisateur dont l'annexe correspond à celle du dossier", async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ml' });
    prisma.document.findMany.mockResolvedValue([{ id: 'doc-1' }]);
    const service = new DocumentsService(prisma as any);

    const result = await service.findByDossier('dossier-1', agent({ annexeIds: ['annexe-ml'] }));
    expect(result).toEqual([{ id: 'doc-1' }]);
  });

  it('un admin accède aux documents de toute annexe', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue({ annexeId: 'annexe-ci' });
    prisma.document.findMany.mockResolvedValue([]);
    const service = new DocumentsService(prisma as any);

    await expect(service.findByDossier('dossier-1', admin())).resolves.toEqual([]);
  });

  it('404 si le dossier n’existe pas — sans révéler quoi que ce soit sur les documents', async () => {
    const prisma = createFakePrisma();
    prisma.dossier.findUnique.mockResolvedValue(null);
    const service = new DocumentsService(prisma as any);

    await expect(service.findByDossier('dossier-inconnu', agent())).rejects.toThrow(NotFoundException);
    expect(prisma.document.findMany).not.toHaveBeenCalled();
  });
});

describe('DocumentsService.getFilePath', () => {
  const originalUploadDir = process.env.UPLOAD_DIR;
  let uploadDir: string;
  let outsideFile: string;

  beforeEach(() => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'documents-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;
    outsideFile = path.join(os.tmpdir(), `outside-secret-${Date.now()}.txt`);
    fs.writeFileSync(outsideFile, 'contenu confidentiel');
  });

  afterEach(() => {
    process.env.UPLOAD_DIR = originalUploadDir;
    fs.rmSync(uploadDir, { recursive: true, force: true });
    fs.rmSync(outsideFile, { force: true });
  });

  function service() {
    const prisma = { document: { findFirst: vi.fn().mockResolvedValue(null) } };
    return new DocumentsService(prisma as any);
  }

  it("rejette un filename '..' qui tente de sortir du répertoire uploads (path traversal)", async () => {
    const relative = path
      .relative(uploadDir, outsideFile)
      .split(path.sep)
      .join('/');

    await expect(service().getFilePath(relative)).rejects.toThrow(NotFoundException);
  });

  it("rejette un filename contenant un séparateur de chemin même sans '..'", async () => {
    fs.mkdirSync(path.join(uploadDir, 'sub'));
    fs.writeFileSync(path.join(uploadDir, 'sub', 'a.pdf'), '%PDF-1.4');

    await expect(service().getFilePath('sub/a.pdf')).rejects.toThrow(NotFoundException);
  });

  it('sert un fichier légitime présent directement dans uploads (repli sans ligne en base)', async () => {
    fs.writeFileSync(path.join(uploadDir, 'legit.pdf'), '%PDF-1.4');

    const result = await service().getFilePath('legit.pdf');

    expect(result.fullPath).toBe(path.resolve(uploadDir, 'legit.pdf'));
  });

  it('rejette un filename "." (résoudrait sur le dossier uploads lui-même, pas un fichier)', async () => {
    await expect(service().getFilePath('.')).rejects.toThrow(NotFoundException);
  });

  it('rejette un filename ".." (remonterait au dossier parent d\'uploads)', async () => {
    await expect(service().getFilePath('..')).rejects.toThrow(NotFoundException);
  });
});
