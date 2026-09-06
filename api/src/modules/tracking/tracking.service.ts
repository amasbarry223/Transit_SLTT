import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async updateTrackingPosition(dossierId: string, data: { dernierePosition?: string; statutAffiche?: string }) {
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
