import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.port.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const port = await this.prisma.port.findUnique({ where: { id } });
    if (!port) throw new NotFoundException(`Port ${id} non trouvé`);
    return port;
  }

  async create(data: { code: string; nom: string; ville?: string; pays?: string }) {
    const existing = await this.prisma.port.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Un port avec le code ${data.code} existe déjà`);
    const { code, nom, ville, pays } = data;
    return this.prisma.port.create({ data: { code, nom, ville, pays } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = {};
    for (const k of ['code', 'nom', 'ville', 'pays', 'actif'] as const) {
      if (data[k] !== undefined) updateData[k] = data[k];
    }
    return this.prisma.port.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.port.update({ where: { id }, data: { actif: false } });
  }
}
