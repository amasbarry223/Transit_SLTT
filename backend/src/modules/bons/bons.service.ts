import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class BonsService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  // Sans ce contrôle, une ligne à montant négatif passait `Number(l.montant) || 0`
  // sans être rejetée et venait diminuer silencieusement le montantTotal (recalculé
  // en sommant les lignes), produisant un bon de caisse au total sous-évalué,
  // voire négatif.
  private toPositiveMontant(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('Le montant de chaque ligne doit être un nombre supérieur à 0.');
    }
    return n;
  }

  // Sans ce contrôle, une quantité négative passait `Number(data.quantite || 0)`
  // sans être rejetée. À la validation du bon, `decrement: bon.quantite` avec
  // une valeur négative AUGMENTE le stock au lieu de le diminuer : le garde-fou
  // anti-stock-négatif ne se déclenche jamais puisque le stock ne fait
  // qu'augmenter, ce qui permettait de fabriquer du stock via un faux bon de
  // sortie à quantité négative.
  private toPositiveQuantite(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('La quantité du bon doit être un nombre supérieur à 0.');
    }
    return n;
  }

  // `BonSortie.montant` est `@default(0)` en base et purement informatif (les
  // bons de sortie marchandise n'ont pas systématiquement de valeur associée,
  // contrairement aux lignes de bon de caisse via toPositiveMontant) — seul un
  // montant négatif doit être rejeté, pas un montant nul.
  private toNonNegativeMontant(value: unknown): number {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n < 0) {
      throw new BadRequestException('Le montant du bon ne peut pas être négatif.');
    }
    return n;
  }

  // Bons de sortie stock
  async findAllBons(user: CurrentUserType, params?: { annexeId?: string; clientId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      ...this.buildAnnexeFilter(user),
      ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
      ...(params?.clientId ? { clientId: params.clientId } : {}),
    };

    return this.prisma.bonSortie.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
        stock: { select: { id: true, marchandise: true, quantite: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBon(id: string, user: CurrentUserType) {
    let bon = await this.prisma.bonSortie.findUnique({
      where: { id },
      include: { annexe: true, client: true, stock: true },
    });
    if (!bon) {
      bon = await this.prisma.bonSortie.findFirst({
        where: { reference: id },
        include: { annexe: true, client: true, stock: true },
      });
    }
    if (!bon) throw new NotFoundException(`Bon de sortie ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de sortie');
    }
    return bon;
  }

  // Sans ce contrôle, un stockId d'une autre annexe était accepté tel quel :
  // la validation du bon décrémentait alors le stock d'une annexe hors du
  // périmètre de l'utilisateur.
  private async assertStockInAnnexe(stockId: string | null | undefined, annexeId: string) {
    if (!stockId) return;
    const stock = await this.prisma.stockItem.findUnique({ where: { id: stockId }, select: { annexeId: true } });
    if (!stock) throw new BadRequestException('Article de stock introuvable.');
    if (stock.annexeId !== annexeId) {
      throw new BadRequestException("L'article de stock n'appartient pas à l'annexe du bon.");
    }
  }

  async createBon(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de bon pour cette annexe');
    }
    await this.assertStockInAnnexe(data.stockId, data.annexeId);
    // Jamais créé "Validé" : validateBon court-circuite un bon déjà validé,
    // le stock n'aurait alors jamais été décrémenté ni le mouvement tracé.
    // Le front crée le bon puis appelle /valider (bons-slice.ts::addBon).
    const statut = data.statut && data.statut !== 'Validé' ? data.statut : 'En attente';
    return this.prisma.bonSortie.create({
      data: {
        reference: data.reference,
        date: data.date || new Date().toISOString().slice(0, 10),
        clientId: data.clientId,
        clientNom: data.clientNom || null,
        annexeId: data.annexeId,
        stockId: data.stockId || null,
        marchandise: data.marchandise,
        quantite: this.toPositiveQuantite(data.quantite),
        unite: data.unite || 'colis',
        motif: data.motif || '',
        montant: this.toNonNegativeMontant(data.montant),
        statut,
      },
      include: { annexe: true, client: true, stock: true },
    });
  }

  async updateBon(id: string, user: CurrentUserType, data: any) {
    const bon = await this.findOneBon(id, user);
    if (bon.statut === 'Validé') {
      throw new BadRequestException('Un bon de sortie déjà validé ne peut pas être modifié.');
    }
    if (user.role !== 'ADMIN' && data.annexeId && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    await this.assertStockInAnnexe(
      data.stockId !== undefined ? data.stockId : bon.stockId,
      data.annexeId !== undefined ? data.annexeId : bon.annexeId,
    );

    // Écriture conditionnée au statut (même pattern que validateBon) : une
    // validation concurrente entre le findOneBon ci-dessus et cette écriture
    // aurait sinon laissé un bon "Validé" dont la quantité ne correspond plus
    // au stock réellement décrémenté.
    const updated = await this.prisma.bonSortie.updateMany({
      where: { id: bon.id, statut: { not: 'Validé' } },
      data: {
        date: data.date !== undefined ? data.date : bon.date,
        clientId: data.clientId !== undefined ? data.clientId : bon.clientId,
        clientNom: data.clientNom !== undefined ? data.clientNom : bon.clientNom,
        annexeId: data.annexeId !== undefined ? data.annexeId : bon.annexeId,
        stockId: data.stockId !== undefined ? data.stockId : bon.stockId,
        marchandise: data.marchandise !== undefined ? data.marchandise : bon.marchandise,
        quantite: data.quantite !== undefined ? this.toPositiveQuantite(data.quantite) : bon.quantite,
        unite: data.unite !== undefined ? data.unite : bon.unite,
        motif: data.motif !== undefined ? data.motif : bon.motif,
        montant: data.montant !== undefined ? this.toNonNegativeMontant(data.montant) : bon.montant,
      },
    });
    if (updated.count === 0) {
      throw new BadRequestException('Un bon de sortie déjà validé ne peut pas être modifié.');
    }
    return this.prisma.bonSortie.findUnique({
      where: { id: bon.id },
      include: { annexe: true, client: true, stock: true },
    });
  }

  async validateBon(id: string, user: CurrentUserType) {
    const bon = await this.findOneBon(id, user);
    if (bon.statut === 'Validé') return bon;

    return this.prisma.$transaction(async (tx: any) => {
      // Passage à "Validé" conditionné au statut courant : deux validations
      // simultanées ne peuvent pas déduire le stock deux fois.
      const claimed = await tx.bonSortie.updateMany({
        where: { id, statut: { not: 'Validé' } },
        data: { statut: 'Validé' },
      });
      if (claimed.count === 0) {
        return tx.bonSortie.findUnique({
          where: { id },
          include: { annexe: true, client: true, stock: true },
        });
      }

      if (bon.stockId) {
        // Décrément atomique (même pattern que stock.service.ts) : évite
        // qu'une validation concurrente d'un autre mouvement sur le même
        // article n'écrase le résultat de l'autre (perte de mise à jour).
        const claimed = await tx.stockItem.updateMany({
          where: { id: bon.stockId },
          data: { quantite: { decrement: bon.quantite } },
        });
        if (claimed.count > 0) {
          const fresh = await tx.stockItem.findUnique({ where: { id: bon.stockId } });
          // Contrôle sur la valeur RÉELLE post-écriture (même principe que
          // stock.service.createMouvement et caisse.service.createTransaction) :
          // si le stock devient négatif, on rejette et toute la transaction
          // est annulée — le bon n'est PAS marqué "Validé" et aucun
          // mouvement n'est créé. Avant ce correctif, la quantité était
          // silencieusement ramenée à 0 mais le bon était quand même validé
          // avec un mouvement de sortie à la quantité PLEINE demandée : un
          // bon de 100 unités sur un stock de 30 se validait « avec succès »,
          // laissant le stock à 0 et un historique prétendant que 100
          // unités avaient bien été sorties.
          if (fresh && fresh.quantite < 0) {
            throw new BadRequestException(
              'Quantité insuffisante en stock pour valider ce bon de sortie.',
            );
          }
          await tx.mouvementStock.create({
            data: {
              stockId: bon.stockId,
              annexeId: bon.annexeId,
              date: new Date().toISOString().slice(0, 10),
              type: 'Sortie',
              marchandise: bon.marchandise,
              quantite: bon.quantite,
              unite: bon.unite,
              responsable: 'Magasinier',
              bonRef: bon.reference,
              motif: bon.motif,
            },
          });
        }
      }

      return tx.bonSortie.findUnique({
        where: { id },
        include: { annexe: true, client: true, stock: true },
      });
    });
  }

  async deleteBon(id: string, user: CurrentUserType) {
    let bon = await this.prisma.bonSortie.findUnique({ where: { id } });
    if (!bon) {
      bon = await this.prisma.bonSortie.findFirst({ where: { reference: id } });
    }
    if (!bon) return { id };
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de sortie');
    }
    if (bon.statut === 'Validé') {
      throw new BadRequestException(
        "Un bon de sortie validé ne peut pas être supprimé (le stock a déjà été mouvementé).",
      );
    }
    await this.prisma.bonSortie.delete({ where: { id: bon.id } });
    return { id: bon.id };
  }

  // Bons de sortie caisse
  async findAllBonsCaisse(user: CurrentUserType, params?: { annexeId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    const where: any = {
      ...this.buildAnnexeFilter(user),
      ...(params?.annexeId ? { annexeId: params.annexeId } : {}),
    };

    return this.prisma.bonSortieCaisse.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneBonCaisse(id: string, user: CurrentUserType) {
    let bon = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
    if (!bon) {
      bon = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
    }
    if (!bon) throw new NotFoundException(`Bon de caisse ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(bon.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de caisse');
    }
    return bon;
  }

  async createBonCaisse(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de bon de caisse pour cette annexe');
    }
    const date = data.date || new Date().toISOString().slice(0, 10);
    const lignes = (data.lignes || []).map((l: any) => ({
      date: l.date || date,
      beneficiaire: l.beneficiaire,
      motif: l.motif,
      montant: this.toPositiveMontant(l.montant),
    }));
    // Le total est la somme des lignes, jamais une valeur fournie par le client
    // (sinon en-tête et détail peuvent diverger).
    const montantTotal = lignes.reduce((s: number, l: any) => s + l.montant, 0);

    return this.prisma.bonSortieCaisse.create({
      data: {
        reference: data.reference,
        date,
        annexeId: data.annexeId,
        montantTotal,
        // Attribution fiable : nom de l'auteur pris du JWT, jamais d'un
        // champ texte libre fourni par le client.
        creePar: user.nom,
        lignes: { create: lignes },
      },
      include: { annexe: true, lignes: true },
    });
  }

  async updateBonCaisse(id: string, user: CurrentUserType, data: any) {
    let existing = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
    if (!existing && data.reference) {
      existing = await this.prisma.bonSortieCaisse.findUnique({ where: { reference: data.reference } });
    }
    if (!existing) {
      existing = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
    }

    // Si introuvable en base (ex: créé hors ligne ou désynchronisé), upsert résilient pour ne pas bloquer l'utilisateur
    if (!existing) {
      const annexeId = data.annexeId || user.annexeIds[0];
      if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
        throw new ForbiddenException('Vous ne pouvez pas rattacher ce bon de caisse à cette annexe');
      }
      const date = data.date || new Date().toISOString().slice(0, 10);
      const lignes = (data.lignes || []).map((l: any) => ({
        date: l.date || date,
        beneficiaire: l.beneficiaire,
        motif: l.motif,
        montant: this.toPositiveMontant(l.montant),
      }));
      const montantTotal = lignes.reduce((s: number, l: any) => s + l.montant, 0);

      return this.prisma.bonSortieCaisse.create({
        data: {
          id,
          reference: data.reference || `N°${Date.now()}`,
          date,
          annexeId,
          montantTotal,
          creePar: user.nom,
          lignes: { create: lignes },
        },
        include: { annexe: true, lignes: true },
      });
    }

    const targetId = existing.id;
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de caisse');
    }
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce bon de caisse à cette annexe');
    }
    const date = data.date || existing.date;
    const annexeId = data.annexeId || existing.annexeId;

    const hasLignes = Array.isArray(data.lignes);
    const lignes = hasLignes
      ? data.lignes.map((l: any) => ({
          date: l.date || date,
          beneficiaire: l.beneficiaire,
          motif: l.motif,
          montant: this.toPositiveMontant(l.montant),
        }))
      : null;
    const montantTotal = lignes ? lignes.reduce((s: number, l: any) => s + l.montant, 0) : undefined;

    return this.prisma.$transaction(async (tx: any) => {
      if (hasLignes) {
        await tx.ligneBonSortieCaisse.deleteMany({ where: { bonSortieCaisseId: targetId } });
      }
      return tx.bonSortieCaisse.update({
        where: { id: targetId },
        data: {
          date,
          annexeId,
          ...(lignes ? { montantTotal, lignes: { create: lignes } } : {}),
        },
        include: { annexe: true, lignes: true },
      });
    });
  }

  async deleteBonCaisse(id: string, user: CurrentUserType) {
    let existing = await this.prisma.bonSortieCaisse.findUnique({ where: { id } });
    if (!existing) {
      existing = await this.prisma.bonSortieCaisse.findFirst({ where: { reference: id } });
    }
    if (!existing) {
      return { id };
    }
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(existing.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce bon de caisse');
    }
    await this.prisma.bonSortieCaisse.delete({ where: { id: existing.id } });
    return { id: existing.id };
  }
}
