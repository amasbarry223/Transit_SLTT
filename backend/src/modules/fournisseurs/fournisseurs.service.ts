import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateFournisseurInput {
  code?: string;
  nom: string;
  type?: string;
  contact?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  rccm?: string | null;
  nif?: string | null;
  actif?: boolean;
}

export interface UpdateFournisseurInput {
  nom?: string;
  type?: string;
  contact?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  rccm?: string | null;
  nif?: string | null;
  actif?: boolean;
}

@Injectable()
export class FournisseursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.fournisseur.findMany({
      where: {
        actif: true,
        ...(search
          ? {
              OR: [
                { nom: { contains: search } },
                { code: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { depenses: true } },
      },
    });
  }

  async findOne(id: string) {
    const fournisseur = await this.prisma.fournisseur.findUnique({
      where: { id },
      include: {
        depenses: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { depenses: true } },
      },
    });
    if (!fournisseur) throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    return fournisseur;
  }

  async create(data: CreateFournisseurInput) {
    const code = data.code || `FRN-${Date.now().toString(36).toUpperCase()}`;
    const existing = await this.prisma.fournisseur.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Le fournisseur avec le code ${code} existe déjà`);

    return this.prisma.fournisseur.create({
      data: {
        code,
        nom: data.nom,
        type: data.type || 'Autre',
        contact: data.contact || null,
        telephone: data.telephone || null,
        email: data.email || null,
        adresse: data.adresse || null,
        rccm: data.rccm || null,
        nif: data.nif || null,
        actif: data.actif ?? true,
      },
    });
  }

  async update(id: string, data: UpdateFournisseurInput) {
    await this.findOne(id);

    const updateData: Prisma.FournisseurUpdateInput = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.contact !== undefined) updateData.contact = data.contact;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.rccm !== undefined) updateData.rccm = data.rccm;
    if (data.nif !== undefined) updateData.nif = data.nif;
    if (data.actif !== undefined) updateData.actif = data.actif;

    return this.prisma.fournisseur.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.fournisseur.update({
      where: { id },
      data: { actif: false },
    });
  }
}
