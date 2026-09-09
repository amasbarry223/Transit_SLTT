import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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

  /** Référence unique OPC-N. Le compteur front se réinitialise après un reload
   *  (seq non persisté) et renvoyait des doublons -> on tranche côté serveur. */
  private async nextOperationReference(): Promise<string> {
    const last = await this.prisma.operationComptable.findFirst({
      where: { reference: { startsWith: 'OPC-' } },
      orderBy: { createdAt: 'desc' },
      select: { reference: true },
    });
    const lastNum = Number(String(last?.reference ?? '').replace(/^OPC-/, '')) || 0;
    for (let n = lastNum + 1; n < lastNum + 50; n++) {
      const candidate = `OPC-${n}`;
      const exists = await this.prisma.operationComptable.findUnique({
        where: { reference: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    return `OPC-${Date.now()}`;
  }

  async createOperation(data: any) {
    const montant = Number(data.montant);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException("Le montant de l'opération doit être supérieur à 0.");
    }
    if (data.type !== 'Entrée' && data.type !== 'Sortie') {
      throw new BadRequestException("Le type doit être « Entrée » ou « Sortie ».");
    }

    const reference =
      data.reference &&
      !(await this.prisma.operationComptable.findUnique({
        where: { reference: data.reference },
        select: { id: true },
      }))
        ? data.reference
        : await this.nextOperationReference();

    return this.prisma.operationComptable.create({
      data: {
        reference,
        annexeId: data.annexeId || null,
        date: data.date || new Date().toISOString().slice(0, 10),
        clientId: data.clientId || null,
        dossierId: data.dossierId || null,
        clientNom: data.clientNom || null,
        nature: data.nature,
        type: data.type,
        montant,
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
    const soldeTheorique = Number(data.soldeTheorique) || 0;
    const soldeConstate = Number(data.soldeConstate) || 0;
    const ecart = Math.round((soldeConstate - soldeTheorique) * 100) / 100;

    if (!data.periodeDebut || !data.periodeFin) {
      throw new BadRequestException('La période de clôture (début et fin) est obligatoire.');
    }
    const iso = /^\d{4}-\d{2}-\d{2}/;
    if (iso.test(data.periodeDebut) && iso.test(data.periodeFin) && data.periodeDebut > data.periodeFin) {
      throw new BadRequestException('La date de début de période est postérieure à la date de fin.');
    }
    // Une même période ne se clôture qu'une fois par annexe.
    const dejaCloturee = await this.prisma.clotureCaisse.findFirst({
      where: {
        annexeId: data.annexeId || null,
        periodeDebut: data.periodeDebut,
        periodeFin: data.periodeFin,
      },
      select: { id: true },
    });
    if (dejaCloturee) {
      throw new ConflictException('Cette période a déjà été clôturée pour cette annexe.');
    }

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
