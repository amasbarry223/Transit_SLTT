import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class ComptabiliteService {
  constructor(private prisma: PrismaService) {}

  /** annexeId nullable (opération/clôture pas encore rattachée) : visible de
   *  tous, comme pour clients/devis/transporteurs. */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }

  // Opérations comptables
  async findAllOperations(user: CurrentUserType, params?: { annexeId?: string; clientId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.clientId ? { clientId: params.clientId } : {},
      ],
    };

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

  async createOperation(user: CurrentUserType, data: any) {
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException("Vous ne pouvez pas créer d'opération pour cette annexe");
    }
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

    const buildData = (ref: string) => ({
      reference: ref,
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
      // Attribution fiable : le nom de l'auteur vient du JWT, jamais d'un
      // champ texte libre fourni par le client (qui pouvait prétendre
      // être n'importe qui dans le journal comptable).
      creePar: user.nom,
    });

    try {
      return await this.prisma.operationComptable.create({
        data: buildData(reference),
        include: { annexe: true },
      });
    } catch (err) {
      // nextOperationReference() vérifie puis choisit une référence en deux
      // temps (pas de séquence atomique en base) : deux créations
      // concurrentes peuvent choisir la même référence entre le check et le
      // create. Plutôt que de renvoyer un 409 pour une collision purement
      // interne (l'utilisateur n'a rien fait de mal), on retente une fois
      // avec une référence fraîchement recalculée.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const retryReference = await this.nextOperationReference();
        return this.prisma.operationComptable.create({
          data: buildData(retryReference),
          include: { annexe: true },
        });
      }
      throw err;
    }
  }

  async deleteOperation(id: string, user: CurrentUserType) {
    const existing = await this.prisma.operationComptable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Opération ${id} non trouvée`);
    if (existing.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette opération');
    }
    await this.prisma.operationComptable.delete({ where: { id } });
    return { id };
  }

  // Clôtures de caisse
  async findAllClotures(user: CurrentUserType, params?: { annexeId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
      ],
    };

    return this.prisma.clotureCaisse.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCloture(user: CurrentUserType, data: any) {
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de clôture pour cette annexe');
    }
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
        cloturePar: user.nom,
        clotureLe: data.clotureLe || new Date().toISOString(),
      },
      include: { annexe: true },
    });
  }
}
