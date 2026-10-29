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
import { ORIGINE, SOURCE_AUTO, derniereClotureFin, lendemain, nextReference } from './journal-posting';

@Injectable()
export class ComptabiliteService {
  constructor(private prisma: PrismaService) {}

  /** annexeId nullable (opération/clôture pas encore rattachée) : visible de
   *  tous, comme pour clients/devis/transporteurs. */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }

  /** Une période clôturée est figée : plus de création ni de suppression
   *  d'opération à une date couverte par une clôture de l'annexe. Le contrôle
   *  vivait seulement dans le formulaire de saisie (contourné par l'import
   *  Excel/OCR et par l'API). */
  private async assertPeriodeOuverte(annexeId: string | null | undefined, date: string) {
    if (!annexeId) return;
    const cloture = await this.prisma.clotureCaisse.findFirst({
      where: { annexeId, periodeFin: { gte: date } },
      select: { periodeFin: true },
      orderBy: { periodeFin: 'desc' },
    });
    if (cloture) {
      throw new ConflictException(
        `La période est clôturée jusqu'au ${cloture.periodeFin} : aucune opération ne peut être ajoutée ou supprimée à cette date.`,
      );
    }
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
        lien: { select: { origineType: true, origineId: true } },
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

    // AAAA-MM-JJ strict : le verrou de période et les clôtures comparent des
    // chaînes ; une date avec heure (« 2026-01-31T10:00 ») contournait le verrou.
    const date: string = String(data.date || new Date().toISOString()).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("La date de l'opération doit être au format AAAA-MM-JJ.");
    }
    await this.assertPeriodeOuverte(data.annexeId, date);

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
      date,
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

  /**
   * Annule une écriture par CONTRE-PASSATION : une écriture inverse (même
   * montant, sens opposé) est ajoutée à la date du jour, l'écriture d'origine
   * reste au journal. Plus de suppression physique : le journal garde la trace
   * de toute correction, et une écriture d'une période clôturée peut être
   * corrigée sans rouvrir la période (l'inverse est passée dans la période
   * ouverte, au lendemain de la dernière clôture si besoin).
   */
  async annulerOperation(id: string, user: CurrentUserType) {
    const existing = await this.prisma.operationComptable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Opération ${id} non trouvée`);
    if (existing.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette opération');
    }
    if (existing.source === SOURCE_AUTO.CONTREPASSATION) {
      throw new ConflictException("Une contre-passation ne s'annule pas : saisissez une nouvelle opération si besoin.");
    }
    // Écriture générée par un événement métier : elle se corrige à la source
    // (dossier, facture, dépense). Seule exception : écriture de dossier devenue
    // orpheline (dossier supprimé).
    const auto = typeof existing.source === 'string' && existing.source.startsWith('auto_');
    if (auto && !(existing.source === 'auto_dossier' && !existing.dossierId)) {
      throw new ConflictException(
        "Cette écriture est générée automatiquement : modifiez le règlement, la dépense ou la facture à l'origine.",
      );
    }

    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const dejaAnnulee = await tx.journalLien.findUnique({
          where: { origineType_origineId: { origineType: ORIGINE.CONTREPASSATION, origineId: id } },
          select: { id: true },
        });
        if (dejaAnnulee) throw new ConflictException('Cette opération a déjà été annulée.');

        const today = new Date().toISOString().slice(0, 10);
        const fin = await derniereClotureFin(tx, existing.annexeId);
        const date = fin && today <= fin ? lendemain(fin) : today;
        const inverse = await tx.operationComptable.create({
          data: {
            reference: await nextReference(tx),
            annexeId: existing.annexeId,
            date,
            clientId: existing.clientId,
            dossierId: existing.dossierId,
            clientNom: existing.clientNom,
            nature: `Annulation ${existing.reference} — ${existing.nature}`,
            type: existing.type === 'Entrée' ? 'Sortie' : 'Entrée',
            montant: existing.montant,
            modePaiement: existing.modePaiement,
            source: SOURCE_AUTO.CONTREPASSATION,
            creePar: user.nom,
          },
        });
        await tx.journalLien.create({
          data: { origineType: ORIGINE.CONTREPASSATION, origineId: id, operationId: inverse.id },
        });
        return { ...inverse, lien: { origineType: ORIGINE.CONTREPASSATION, origineId: id } };
      });
    } catch (err) {
      // Deux annulations simultanées : la contrainte unique du lien tranche.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Cette opération a déjà été annulée.');
      }
      throw err;
    }
  }

  /**
   * Rattache à un client des écritures saisies avec un simple nom de tiers
   * (historique, imports). Ne fait que COMPLÉTER un clientId manquant : un
   * rattachement existant n'est jamais écrasé. Aucun montant ne change, donc
   * autorisé aussi en période clôturée.
   */
  async rattacherOperations(user: CurrentUserType, liens: Array<{ operationId: string; clientId: string }>) {
    if (!Array.isArray(liens) || liens.length === 0) {
      throw new BadRequestException('Aucun rattachement fourni.');
    }
    if (liens.length > 1000) {
      throw new BadRequestException('1 000 rattachements maximum par envoi.');
    }
    const clientIds = [...new Set(liens.map((l) => l.clientId))];
    const clients = await this.prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true } });
    const clientsConnus = new Set(clients.map((c: { id: string }) => c.id));
    const operations = await this.prisma.operationComptable.findMany({
      where: { id: { in: liens.map((l) => l.operationId) } },
      select: { id: true, annexeId: true },
    });
    const annexeParOp = new Map(operations.map((o: { id: string; annexeId: string | null }) => [o.id, o.annexeId]));

    // Regroupement par client : une requête par client au lieu d'une par écriture.
    const parClient = new Map<string, string[]>();
    for (const { operationId, clientId } of liens) {
      if (!annexeParOp.has(operationId) || !clientsConnus.has(clientId)) continue;
      const annexeId = annexeParOp.get(operationId);
      if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) continue;
      parClient.set(clientId, [...(parClient.get(clientId) ?? []), operationId]);
    }
    let rattachees = 0;
    if (parClient.size === 0) return { rattachees };
    await this.prisma.$transaction(async (tx: any) => {
      for (const [clientId, ids] of parClient) {
        const res = await tx.operationComptable.updateMany({
          where: { id: { in: ids }, clientId: null },
          data: { clientId },
        });
        rattachees += res.count;
      }
    });
    return { rattachees };
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
    const soldeConstate = Number(data.soldeConstate);
    if (!Number.isFinite(soldeConstate)) {
      throw new BadRequestException('Le solde constaté est obligatoire.');
    }

    if (!data.periodeDebut || !data.periodeFin) {
      throw new BadRequestException('La période de clôture (début et fin) est obligatoire.');
    }
    const iso = /^\d{4}-\d{2}-\d{2}/;
    if (iso.test(data.periodeDebut) && iso.test(data.periodeFin) && data.periodeDebut > data.periodeFin) {
      throw new BadRequestException('La date de début de période est postérieure à la date de fin.');
    }
    const annexeId: string | null = data.annexeId || null;
    // Deux clôtures d'une même annexe ne peuvent pas se chevaucher (et a fortiori
    // couvrir la même période) : le solde d'ouverture de la suivante serait ambigu.
    const dejaCloturee = await this.prisma.clotureCaisse.findFirst({
      where: {
        annexeId,
        periodeDebut: { lte: data.periodeFin },
        periodeFin: { gte: data.periodeDebut },
      },
      select: { id: true },
    });
    if (dejaCloturee) {
      throw new ConflictException('Cette période a déjà été clôturée (ou chevauche une clôture existante) pour cette annexe.');
    }

    // Solde théorique recalculé ICI : jamais repris du client. La caisse est un
    // cumul, donc théorique = solde constaté de la clôture précédente (report)
    // + net (entrées − sorties) de la période.
    const precedente = await this.prisma.clotureCaisse.findFirst({
      where: { annexeId, periodeFin: { lt: data.periodeDebut } },
      orderBy: { periodeFin: 'desc' },
      select: { soldeConstate: true },
    });
    const soldeOuverture = precedente?.soldeConstate ?? 0;
    const groupes = await this.prisma.operationComptable.groupBy({
      by: ['type'],
      where: { annexeId, date: { gte: data.periodeDebut, lte: data.periodeFin } },
      _sum: { montant: true },
    });
    const somme = (type: string) => groupes.find((g: any) => g.type === type)?._sum?.montant ?? 0;
    const soldeTheorique = Math.round((soldeOuverture + somme('Entrée') - somme('Sortie')) * 100) / 100;
    // Convention unique : écart = constaté − théorique (positif = excédent).
    const ecart = Math.round((soldeConstate - soldeTheorique) * 100) / 100;

    try {
      return await this.prisma.clotureCaisse.create({
        data: {
          annexeId,
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
    } catch (err) {
      // Filet de sécurité si deux clôtures concurrentes passent toutes les
      // deux le `findFirst` ci-dessus avant que l'une n'écrive (race déjà
      // recontrée sur nextOperationReference/nextRecuReference) : la
      // contrainte @@unique tranche, on traduit juste en la même erreur
      // métier plutôt qu'un 500 Prisma brut.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Cette période a déjà été clôturée (ou chevauche une clôture existante) pour cette annexe.');
      }
      throw err;
    }
  }
}
