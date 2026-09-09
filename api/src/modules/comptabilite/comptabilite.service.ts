import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ComptabiliteService {
  constructor(private prisma: PrismaService) {}

  // Opérations comptables
  async findAllOperations(params?: { annexeId?: string; clientId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.clientId) where.clientId = params.clientId;

    return this.prisma.operationComptable.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOperation(data: any) {
    return this.prisma.operationComptable.create({
      data: {
        reference: data.reference,
        annexeId: data.annexeId || null,
        date: data.date || new Date().toISOString().slice(0, 10),
        clientId: data.clientId || null,
        dossierId: data.dossierId || null,
        clientNom: data.clientNom || null,
        nature: data.nature,
        type: data.type,
        montant: Number(data.montant || 0),
        modePaiement: data.modePaiement || 'Espèces',
        source: data.source || 'saisie',
        importRef: data.importRef || null,
        creePar: data.creePar || null,
      },
      include: { annexe: true },
    });
  }

  async deleteOperation(id: string) {
    const existing = await this.prisma.operationComptable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Opération ${id} non trouvée`);
    await this.prisma.operationComptable.delete({ where: { id } });
    return { id };
  }

  // Clôtures de caisse
  async findAllClotures(params?: { annexeId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;

    return this.prisma.clotureCaisse.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCloture(data: any) {
    const soldeTheorique = Number(data.soldeTheorique || 0);
    const soldeConstate = Number(data.soldeConstate || 0);
    const ecart = soldeConstate - soldeTheorique;

    return this.prisma.clotureCaisse.create({
      data: {
        annexeId: data.annexeId || null,
        periodeDebut: data.periodeDebut,
        periodeFin: data.periodeFin,
        soldeTheorique,
        soldeConstate,
        ecart,
        note: data.note || null,
        cloturePar: data.cloturePar || null,
        clotureLe: data.clotureLe || new Date().toISOString(),
      },
      include: { annexe: true },
    });
  }
}
