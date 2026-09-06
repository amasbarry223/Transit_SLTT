import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Base de données MySQL connectée avec succès');
    } catch (err: any) {
      console.warn('⚠️ Connexion MySQL en attente de configuration ou démarrage :', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
