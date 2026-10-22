import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Taille de pool par défaut adaptée à un MySQL mutualisé. */
const DEFAULT_CONNECTION_LIMIT = 5;
const DEFAULT_POOL_TIMEOUT_S = 20;

/**
 * Prisma dimensionne son pool à (2 × cœurs physiques + 1) : sur l'hôte
 * Hostinger (32 cœurs annoncés) cela fait 65 connexions par processus,
 * bien au-delà de la limite de connexions par utilisateur d'un MySQL
 * mutualisé — le chargement initial (~20 requêtes parallèles) échouait alors
 * au hasard sur certaines ressources (clients, dossiers, annexes…). On borne
 * le pool, et on laisse attendre une connexion libre plutôt que d'échouer.
 * Une valeur explicite dans DATABASE_URL reste prioritaire.
 */
export function withPoolLimits(url: string | undefined, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (!url) return url;
  const params: string[] = [];
  if (!/[?&]connection_limit=/.test(url)) {
    params.push(`connection_limit=${Number(env.PRISMA_CONNECTION_LIMIT) || DEFAULT_CONNECTION_LIMIT}`);
  }
  if (!/[?&]pool_timeout=/.test(url)) {
    params.push(`pool_timeout=${Number(env.PRISMA_POOL_TIMEOUT) || DEFAULT_POOL_TIMEOUT_S}`);
  }
  if (params.length === 0) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${params.join('&')}`;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = withPoolLimits(process.env.DATABASE_URL);
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Base de données MySQL connectée avec succès');
    } catch (err: any) {
      this.logger.warn(`⚠️ Connexion MySQL en attente de configuration ou démarrage : ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
