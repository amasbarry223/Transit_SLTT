import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Aligne la valeur reçue sur l'enum Prisma TypeClient (PARTICULIER | ENTREPRISE | ONG | GOUVERNEMENT). */
function normalizeTypeClient(raw: unknown): 'PARTICULIER' | 'ENTREPRISE' | 'ONG' | 'GOUVERNEMENT' {
  const upper = String(raw ?? '').toUpperCase();
  if (upper === 'PARTICULIER') return 'PARTICULIER';
  if (upper === 'ONG') return 'ONG';
  if (upper === 'ETAT' || upper === 'GOUVERNEMENT') return 'GOUVERNEMENT';
  return 'ENTREPRISE';
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.client.findMany({
      where: {
        actif: true,
        ...(search
          ? {
              OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { nom: 'asc' },
      include: {
        _count: {
          select: { dossiers: true, factures: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        dossiers: { take: 5, orderBy: { createdAt: 'desc' } },
        factures: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: {
          select: { dossiers: true, factures: true, devis: true, cotations: true },
        },
      },
    });
    if (!client) throw new NotFoundException(`Client ${id} non trouvé`);
    return client;
  }

  async create(data: any) {
    const code = data.code || `CLT-${Date.now().toString(36).toUpperCase()}`;
    const existing = await this.prisma.client.findUnique({ where: { code } });
    if (existing) {
      const altCode = `CLT-${Math.floor(1000 + Math.random() * 9000)}`;
      data.code = altCode;
    } else {
      data.code = code;
    }

    const type = normalizeTypeClient(data.type);

    return this.prisma.client.create({
      data: {
        code: data.code,
        nom: data.nom,
        type,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        pays: data.pays || 'Guinée',
        nif: data.nif || null,
        rccm: data.rccm || null,
        actif: data.actif ?? true,
        notes: data.notes || null,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.adresse !== undefined) updateData.adresse = data.adresse || null;
    if (data.ville !== undefined) updateData.ville = data.ville || null;
    if (data.pays !== undefined) updateData.pays = data.pays || 'Guinée';
    if (data.nif !== undefined) updateData.nif = data.nif || null;
    if (data.rccm !== undefined) updateData.rccm = data.rccm || null;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.type !== undefined) updateData.type = normalizeTypeClient(data.type);
    return this.prisma.client.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: { actif: false } });
  }
}
