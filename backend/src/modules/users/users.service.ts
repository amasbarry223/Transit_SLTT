import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RoleUtilisateur } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertStrongPassword } from '../../common/password.utils';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { CurrentUserType } from '../../auth/auth.types';

function mapToPrismaRole(role: string): RoleUtilisateur {
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

function mapToAppRole(role: RoleUtilisateur | string): string {
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

function isActorAdmin(actor: CurrentUserType): boolean {
  return String(actor.role || '').toUpperCase() === 'ADMIN';
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /** Bloque la suppression, désactivation ou rétrogradation du dernier
   *  compte ADMIN actif du système — sans ce garde-fou, plus personne ne
   *  peut accéder aux écrans réservés à la gestion des utilisateurs (dont
   *  celui-ci) pour réparer la situation, seule une intervention manuelle
   *  en base y remédie. */
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

  /** Un délégué `utilisateurs:manage` non-admin ne peut jamais accorder à
   *  autrui (ni garder pour lui-même) une permission qu'il ne possède pas. */
  private assertPermissionCeiling(actor: CurrentUserType, requestedPermissions: string[]) {
    if (isActorAdmin(actor)) return;
    const allowed = new Set(actor.permissions ?? []);
    if (allowed.has('*')) return;
    const overflow = requestedPermissions.filter((p) => !allowed.has(p));
    if (overflow.length > 0) {
      throw new ForbiddenException(`Permissions hors périmètre délégué : ${overflow.join(', ')}.`);
    }
  }

  /** Même principe pour les annexes : un délégué ne peut assigner que des
   *  annexes auxquelles il a lui-même accès. */
  private assertAnnexeCeiling(actor: CurrentUserType, requestedAnnexeIds: string[]) {
    if (isActorAdmin(actor)) return;
    const allowed = new Set(actor.annexeIds ?? []);
    const overflow = requestedAnnexeIds.filter((id) => !allowed.has(id));
    if (overflow.length > 0) {
      throw new ForbiddenException(
        'Annexes hors périmètre délégué : vous ne pouvez assigner que des annexes auxquelles vous avez vous-même accès.',
      );
    }
  }

  private assertNotSelfDeactivation(actorId: string, targetId: string, actif: boolean | undefined) {
    if (targetId === actorId && actif === false) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }
  }

  private assertNotSelfDelete(actorId: string, targetId: string) {
    if (targetId === actorId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
  }

  /** Seul un administrateur peut créer ou promouvoir un compte Administrateur. */
  private assertRoleEscalationAllowed(actor: CurrentUserType, requestedRole: string | undefined) {
    if (!requestedRole) return;
    if (mapToPrismaRole(requestedRole) === RoleUtilisateur.ADMIN && !isActorAdmin(actor)) {
      throw new ForbiddenException('Seul un administrateur peut créer ou promouvoir un compte en Administrateur.');
    }
  }

  /** Seul un administrateur peut modifier, supprimer ou réinitialiser le
   *  mot de passe d'un autre compte Administrateur. */
  private assertCanTouchAdminTarget(actor: CurrentUserType, target: { role: string }) {
    if (!isActorAdmin(actor) && target.role === 'Administrateur') {
      throw new ForbiddenException('Seul un administrateur peut modifier un compte Administrateur.');
    }
  }

  // `utilisateurs:manage` peut être délégué à un responsable d'annexe non-ADMIN
  // (cf. assertAnnexeCeiling pour create/update) : sans ce filtre, un tel
  // délégué voyait la liste ET la fiche complètes de TOUS les utilisateurs de
  // TOUTES les annexes (email, téléphone, rôle, permissions), pas seulement
  // ceux de son propre périmètre.
  async findAll(actor: CurrentUserType) {
    const profiles = await this.prisma.profile.findMany({
      where: isActorAdmin(actor)
        ? undefined
        : { userAnnexes: { some: { annexeId: { in: actor.annexeIds ?? [] } } } },
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

  async findOne(id: string, actor: CurrentUserType) {
    const user = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        userAnnexes: {
          include: { annexe: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`Utilisateur ${id} non trouvé`);
    if (!isActorAdmin(actor)) {
      const targetAnnexeIds = user.userAnnexes.map((ua) => ua.annexeId);
      const allowed = new Set(actor.annexeIds ?? []);
      if (!targetAnnexeIds.some((aid) => allowed.has(aid))) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      role: mapToAppRole(safeUser.role),
    };
  }

  async create(data: CreateUserDto, actor: CurrentUserType) {
    const email = data.email.toLowerCase().trim();
    const existing = await this.prisma.profile.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException(`L'email ${data.email} est déjà utilisé`);

    const rawPassword = data.password ?? data.motDePasse;
    assertStrongPassword(rawPassword);

    this.assertRoleEscalationAllowed(actor, data.role);
    this.assertPermissionCeiling(actor, data.permissions ?? []);
    this.assertAnnexeCeiling(actor, data.annexeIds ?? []);

    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const prismaRole = mapToPrismaRole(data.role || 'Magasinier');

    const created = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
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

      await this.auditLogsService.log(
        {
          userId: actor.id,
          action: 'Création',
          entite: 'Utilisateurs',
          entiteId: profile.id,
          donnees: { detail: `Utilisateur ${profile.nom} créé`, userName: actor.nom },
        },
        tx,
      );

      return profile;
    });

    return {
      ...created,
      role: mapToAppRole(created.role),
    };
  }

  async update(id: string, data: UpdateUserDto, actor: CurrentUserType) {
    const target = await this.findOne(id, actor);

    this.assertNotSelfDeactivation(actor.id, id, data.actif);
    this.assertRoleEscalationAllowed(actor, data.role);
    this.assertCanTouchAdminTarget(actor, target);
    if (data.permissions) this.assertPermissionCeiling(actor, data.permissions);
    if (data.annexeIds) this.assertAnnexeCeiling(actor, data.annexeIds);

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
      assertStrongPassword(rawPassword);
      updateData.passwordHash = await bcrypt.hash(rawPassword, 12);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.annexeIds) {
        // Remplacer les annexes — dans la même transaction que la mise à
        // jour du profil : avant, ces deux écritures n'étaient liées par
        // aucune transaction, un échec entre les deux pouvait laisser
        // l'utilisateur sans aucune annexe assignée.
        await tx.userAnnexe.deleteMany({ where: { userId: id } });
        await tx.userAnnexe.createMany({
          data: data.annexeIds.map((annexeId) => ({ userId: id, annexeId })),
        });
      }

      const profile = await tx.profile.update({
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

      // Révoque les sessions existantes si le mot de passe vient de changer —
      // même raison que AuthService.changePassword (un refresh token émis
      // avant ce changement resterait sinon utilisable jusqu'à ses 7 jours).
      if (rawPassword !== undefined) {
        await tx.refreshToken.deleteMany({ where: { userId: id } });
      }

      await this.auditLogsService.log(
        {
          userId: actor.id,
          action: 'Modification',
          entite: 'Utilisateurs',
          entiteId: profile.id,
          donnees: { detail: `Utilisateur ${profile.nom} mis à jour`, userName: actor.nom },
        },
        tx,
      );

      return profile;
    });

    return {
      ...updated,
      role: mapToAppRole(updated.role),
    };
  }

  async resetPassword(id: string, newPassword: string | undefined, actor: CurrentUserType) {
    const target = await this.findOne(id, actor);
    this.assertCanTouchAdminTarget(actor, target);
    assertStrongPassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.profile.update({ where: { id }, data: { passwordHash } });
      // Révoque les sessions existantes de la cible — même raison que
      // AuthService.changePassword (un compte réinitialisé après compromission
      // resterait sinon accessible via son ancien refresh token).
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await this.auditLogsService.log(
        {
          userId: actor.id,
          action: 'Modification',
          entite: 'Utilisateurs',
          entiteId: id,
          donnees: { detail: `Mot de passe réinitialisé pour ${target.nom}`, userName: actor.nom },
        },
        tx,
      );
    });

    return { success: true };
  }

  async delete(id: string, actor: CurrentUserType) {
    const target = await this.findOne(id, actor);
    this.assertNotSelfDelete(actor.id, id);
    this.assertCanTouchAdminTarget(actor, target);
    await this.assertNotLastActiveAdmin(id, true);

    await this.prisma.$transaction(async (tx) => {
      await tx.profile.delete({ where: { id } });
      await this.auditLogsService.log(
        {
          userId: actor.id,
          action: 'Suppression',
          entite: 'Utilisateurs',
          entiteId: id,
          donnees: { detail: `Utilisateur ${target.nom} supprimé`, userName: actor.nom },
        },
        tx,
      );
    });
  }
}
