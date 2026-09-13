import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicTracking(codeTracking: string) {
    const tracking = await this.prisma.trackingPublic.findUnique({
      where: { codeTracking: codeTracking.trim() },
      include: {
        dossier: {
          select: {
            numero: true,
            type: true,
            statut: true,
            voieTransport: true,
            marchandise: true,
            navireVol: true,
            compagnie: true,
            numeroBl: true,
            portProvenance: true,
            portDestination: true,
            dateDepart: true,
            dateArriveePrevue: true,
            dateArriveeEffective: true,
            dateLivraison: true,
            conteneurs: {
              select: {
                numero: true,
                type: true,
                statut: true,
              },
            },
            etapes: {
              orderBy: { ordre: 'asc' },
              select: {
                titre: true,
                description: true,
                completee: true,
                dateEffective: true,
              },
            },
          },
        },
      },
    });

    if (!tracking || !tracking.actif) {
      throw new NotFoundException("Numéro de suivi introuvable ou inactif");
    }

    return tracking;
  }

  async updateTrackingPosition(
    dossierId: string,
    user: CurrentUserType,
    data: { dernierePosition?: string; statutAffiche?: string },
  ) {
    // Le tracking public est exposé à quiconque connaît le code, mais sa
    // mise à jour doit rester réservée aux utilisateurs de l'annexe du
    // dossier concerné — sans ce contrôle, dossierId est accepté tel quel
    // et n'importe quel utilisateur autorisé sur `dossiers.modifier`
    // pouvait modifier le suivi affiché publiquement pour un dossier d'une
    // autre annexe.
    const dossier = await this.prisma.dossier.findUnique({
      where: { id: dossierId },
      select: { annexeId: true },
    });
    if (!dossier) throw new NotFoundException(`Dossier ${dossierId} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(dossier.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce dossier');
    }

    return this.prisma.trackingPublic.upsert({
      where: { dossierId },
      create: {
        dossierId,
        codeTracking: `TRK-${dossierId.slice(0, 8).toUpperCase()}`,
        dernierePosition: data.dernierePosition,
        statutAffiche: data.statutAffiche,
      },
      update: data,
    });
  }
}
