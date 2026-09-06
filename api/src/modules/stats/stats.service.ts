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
      this.prisma.client.count({ where: { actif: true } }),
      this.prisma.facture.findMany({
        where: annexeFilter,
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
    const soldeTotalCaisse = caisses.reduce((acc: number, c: any) => acc + c.soldeActuel, 0);

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
        soldeTotalCaisse,
        devise: 'GNF',
      },
    };
  }
}
