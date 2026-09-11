import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKpis(user: CurrentUserType, annexeId?: string) {
    const annexeFilter =
      user.role === 'ADMIN'
        ? annexeId
          ? { annexeId }
          : {}
        : { annexeId: { in: user.annexeIds } };

    // Client.annexeId est nullable (répertoire partagé entre annexes, cf.
    // clients.service.ts::buildAnnexeFilter) : un client sans annexe reste
    // visible/compté par tous, contrairement aux dossiers/factures/caisses.
    const clientAnnexeFilter =
      user.role === 'ADMIN'
        ? annexeId
          ? { annexeId }
          : {}
        : { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };

    const [
      totalDossiers,
      dossiersEnCours,
      dossiersDedouanement,
      totalClients,
      factures,
      caisses,
      conteneursActifs,
    ] = await Promise.all([
      this.prisma.dossier.count({ where: annexeFilter }),
      this.prisma.dossier.count({ where: { ...annexeFilter, statut: 'EN_COURS' } }),
      this.prisma.dossier.count({ where: { ...annexeFilter, statut: 'EN_DEDOUANEMENT' } }),
      this.prisma.client.count({ where: { actif: true, ...clientAnnexeFilter } }),
      this.prisma.facture.findMany({
        // CA et impayé = factures réellement émises : ni annulées, ni brouillons.
        where: { ...annexeFilter, statut: { notIn: ['ANNULEE', 'BROUILLON'] } },
        select: { montantTtc: true, montantPaye: true, statut: true },
      }),
      this.prisma.caisse.findMany({
        where: user.role === 'ADMIN' && annexeId ? { annexeId } : user.role === 'ADMIN' ? {} : { annexeId: { in: user.annexeIds } },
        select: { soldeActuel: true, devise: true },
      }),
      this.prisma.conteneur.count({
        where: {
          statut: { in: ['EN_TRANSIT', 'AU_PORT', 'DEDOUANE'] },
          dossier: annexeFilter,
        },
      }),
    ]);

    const chiffreAffairesTotal = factures.reduce((acc: number, f: any) => acc + f.montantTtc, 0);
    const montantTotalEncaisse = factures.reduce((acc: number, f: any) => acc + f.montantPaye, 0);
    const montantImpaye = chiffreAffairesTotal - montantTotalEncaisse;
    // Une caisse a sa propre devise (champ libre, défaut 'FCFA') : sommer
    // toutes les caisses sous un unique total avec une devise fixe ('GNF')
    // était à la fois faux (aucune caisse n'est en GNF) et trompeur dès
    // qu'une deuxième devise apparaît. On regroupe par devise réelle.
    const soldesParDevise = caisses.reduce((acc: Record<string, number>, c: any) => {
      const devise = c.devise || 'FCFA';
      acc[devise] = (acc[devise] || 0) + c.soldeActuel;
      return acc;
    }, {} as Record<string, number>);

    return {
      dossiers: {
        total: totalDossiers,
        enCours: dossiersEnCours,
        enDedouanement: dossiersDedouanement,
      },
      clients: {
        total: totalClients,
      },
      conteneurs: {
        actifs: conteneursActifs,
      },
      finances: {
        chiffreAffairesTotal,
        montantTotalEncaisse,
        montantImpaye,
        soldesParDevise,
      },
    };
  }
}
