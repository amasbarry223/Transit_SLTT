import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleUtilisateur } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

export function mapToPrismaRole(role: string): RoleUtilisateur {
  switch (role) {
    case 'Administrateur':
    case 'ADMIN':
    case 'Direction':
    case 'DIRECTEUR':
      return RoleUtilisateur.ADMIN;
    case 'Comptable':
    case 'COMPTABLE':
      return RoleUtilisateur.COMPTABLE;
    case 'Agent de transit':
    case 'TRANSITAIRE':
    default:
      return RoleUtilisateur.TRANSITAIRE;
  }
}

export function mapToAppRole(role: RoleUtilisateur | string): string {
  switch (role) {
    case RoleUtilisateur.ADMIN:
    case 'ADMIN':
    case 'Direction':
    case 'DIRECTEUR':
      return 'Administrateur';
    case RoleUtilisateur.COMPTABLE:
    case 'COMPTABLE':
      return 'Comptable';
    case RoleUtilisateur.TRANSITAIRE:
    case 'TRANSITAIRE':
    default:
      return 'Agent de transit';
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Même seuil que authService.changePassword — jamais de repli implicite
   *  sur un mot de passe par défaut quand ce champ est absent ou trop court. */
  private assertStrongPassword(password: string | undefined): asserts password is string {
    if (!password || password.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }
  }

  /** Bloque la suppression, désactivation ou rétrogradation du dernier
   *  compte ADMIN actif du système — sans ce garde-fou, plus personne ne
   *  peut accéder aux écrans réservés @Roles('ADMIN') (dont celui-ci) pour
   *  réparer la situation, seule une intervention manuelle en base y remédie. */
  private async assertNotLastActiveAdmin(id: string, wouldLoseAdminAccess: boolean) {
    if (!wouldLoseAdminAccess) return;
    const target = await this.prisma.profile.findUnique({ where: { id } });
    if (!target || target.role !== RoleUtilisateur.ADMIN || !target.actif) return;
    const otherActiveAdmins = await this.prisma.profile.count({
      where: { role: RoleUtilisateur.ADMIN, actif: true, id: { not: id } },
    });
    if (otherActiveAdmins === 0) {
      throw new BadRequestException(
        "Impossible : c'est le dernier administrateur actif du système.",
      );
    }
  }

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

  async create(data: CreateUserDto) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.prisma.profile.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException(`L'email ${data.email} est déjà utilisé`);

    const rawPassword = data.password ?? data.motDePasse;
    this.assertStrongPassword(rawPassword);
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

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id);

    // Perte d'accès ADMIN = désactivation, ou changement vers un rôle non-admin.
    const wouldLoseAdminAccess =
      data.actif === false || (!!data.role && mapToPrismaRole(data.role) !== RoleUtilisateur.ADMIN);
    await this.assertNotLastActiveAdmin(id, wouldLoseAdminAccess);

    const updateData: any = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.role) updateData.role = mapToPrismaRole(data.role);
    if (data.permissions) updateData.permissions = data.permissions;
    if (data.actif !== undefined) updateData.actif = data.actif;
    const rawPassword = data.password ?? data.motDePasse;
    if (rawPassword !== undefined) {
      this.assertStrongPassword(rawPassword);
      updateData.passwordHash = await bcrypt.hash(rawPassword, 12);
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

  async resetPassword(id: string, newPassword: string | undefined) {
    await this.findOne(id);
    this.assertStrongPassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.profile.update({
      where: { id },
      data: { passwordHash },
    });
    return { success: true };
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.assertNotLastActiveAdmin(id, true);
    return this.prisma.profile.delete({ where: { id } });
  }
}
