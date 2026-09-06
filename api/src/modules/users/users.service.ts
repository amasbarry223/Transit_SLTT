import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        telephone: true,
        role: true,
        permissions: true,
        actif: true,
        avatarUrl: true,
        derniereConnexion: true,
        createdAt: true,
        userAnnexes: {
          select: {
            annexe: { select: { id: true, nom: true, code: true } },
          },
        },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        userAnnexes: {
          include: { annexe: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`Utilisateur ${id} non trouvé`);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async create(data: {
    email: string;
    password: string;
    nom: string;
    telephone?: string;
    role?: any;
    permissions?: string[];
    annexeIds?: string[];
  }) {
    const existing = await this.prisma.profile.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) throw new ConflictException(`L'email ${data.email} est déjà utilisé`);

    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.prisma.profile.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        nom: data.nom,
        telephone: data.telephone,
        role: data.role || 'OPERATEUR',
        permissions: data.permissions || [],
        userAnnexes: data.annexeIds?.length
          ? {
              create: data.annexeIds.map((annexeId) => ({ annexeId })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        permissions: true,
        actif: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      nom?: string;
      telephone?: string;
      role?: any;
      permissions?: string[];
      actif?: boolean;
      annexeIds?: string[];
      password?: string;
    },
  ) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.role) updateData.role = data.role;
    if (data.permissions) updateData.permissions = data.permissions;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    if (data.annexeIds) {
      // Remplacer les annexes
      await this.prisma.userAnnexe.deleteMany({ where: { userId: id } });
      await this.prisma.userAnnexe.createMany({
        data: data.annexeIds.map((annexeId) => ({ userId: id, annexeId })),
      });
    }

    return this.prisma.profile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        permissions: true,
        actif: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.profile.delete({ where: { id } });
  }
}
