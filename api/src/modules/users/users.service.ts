import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleUtilisateur } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export function mapToPrismaRole(role: string): RoleUtilisateur {
  switch (role) {
    case 'Administrateur':
    case 'ADMIN':
      return RoleUtilisateur.ADMIN;
    case 'Agent de transit':
    case 'TRANSITAIRE':
      return RoleUtilisateur.TRANSITAIRE;
    case 'Comptable':
    case 'COMPTABLE':
      return RoleUtilisateur.COMPTABLE;
    case 'Commercial':
    case 'COMMERCIAL':
      return RoleUtilisateur.COMMERCIAL;
    case 'Magasinier':
    case 'OPERATEUR':
      return RoleUtilisateur.OPERATEUR;
    case 'Client':
    case 'CLIENT':
      return RoleUtilisateur.CLIENT;
    default:
      return RoleUtilisateur.OPERATEUR;
  }
}

export function mapToAppRole(role: RoleUtilisateur | string): string {
  switch (role) {
    case RoleUtilisateur.ADMIN:
    case 'ADMIN':
      return 'Administrateur';
    case RoleUtilisateur.TRANSITAIRE:
    case 'TRANSITAIRE':
      return 'Agent de transit';
    case RoleUtilisateur.COMPTABLE:
    case 'COMPTABLE':
      return 'Comptable';
    case RoleUtilisateur.COMMERCIAL:
    case 'COMMERCIAL':
      return 'Commercial';
    case RoleUtilisateur.OPERATEUR:
    case 'OPERATEUR':
      return 'Magasinier';
    case RoleUtilisateur.CLIENT:
    case 'CLIENT':
      return 'Client';
    default:
      return String(role);
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const profiles = await this.prisma.profile.findMany({
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

    return profiles.map((p) => ({
      ...p,
      role: mapToAppRole(p.role),
    }));
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
    return {
      ...safeUser,
      role: mapToAppRole(safeUser.role),
    };
  }

  async create(data: {
    email: string;
    password?: string;
    nom: string;
    telephone?: string;
    role?: any;
    permissions?: string[];
    annexeIds?: string[];
  }) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.prisma.profile.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException(`L'email ${data.email} est déjà utilisé`);

    const rawPassword = data.password || 'Transit2026!';
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const prismaRole = mapToPrismaRole(data.role || 'Magasinier');

    const created = await this.prisma.profile.create({
      data: {
        email,
        passwordHash,
        nom: data.nom,
        telephone: data.telephone,
        role: prismaRole,
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

    return {
      ...created,
      role: mapToAppRole(created.role),
    };
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
    if (data.role) updateData.role = mapToPrismaRole(data.role);
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

    const updated = await this.prisma.profile.update({
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

    return {
      ...updated,
      role: mapToAppRole(updated.role),
    };
  }

  async resetPassword(id: string, newPassword: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.profile.update({
      where: { id },
      data: { passwordHash },
    });
    return { success: true };
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.profile.delete({ where: { id } });
  }
}
