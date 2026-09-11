import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, CurrentUserType } from './auth.types';
import { jwtRefreshSecret, jwtRefreshExpiresIn } from './jwt.config';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;

/**
 * Seul le hash du refresh token part en base (colonne `token`, jamais
 * renommée pour éviter une migration de schéma — mais elle ne contient
 * plus de refresh token en clair depuis ce commit). Un accès en lecture à
 * la table `refresh_tokens` (fuite de sauvegarde, dump, accès DB) ne
 * suffit plus à réutiliser un token : il faut connaître le token brut,
 * jamais persisté. Le client continue d'envoyer/recevoir le JWT signé en
 * clair comme avant — seul ce qui est écrit en base change.
 */
function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Valide les credentials et retourne l'access token + les infos utilisateur */
  async login(email: string, password: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userAnnexes: { select: { annexeId: true } },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!profile.actif) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }

    const passwordValid = await bcrypt.compare(password, profile.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Mise à jour de dernière connexion (fire-and-forget)
    void this.prisma.profile
      .update({
        where: { id: profile.id },
        data: { derniereConnexion: new Date() },
      })
      .catch(() => null);

    const annexeIds = profile.userAnnexes.map((ua: any) => ua.annexeId);

    const payload: JwtPayload = {
      sub: profile.id,
      email: profile.email,
      nom: profile.nom,
      role: profile.role,
      permissions: (profile.permissions as string[]) || [],
      annexeIds,
    };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.jwt.sign(
      { sub: profile.id },
      {
        secret: jwtRefreshSecret(),
        expiresIn: jwtRefreshExpiresIn() as any,
      },
    );

    // La ligne en base doit expirer en même temps que le JWT lui-même,
    // sinon l'un des deux invalide le refresh avant l'autre.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.upsert({
      where: { token: refreshTokenHash },
      create: { userId: profile.id, token: refreshTokenHash, expiresAt },
      update: { expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: profile.id,
        nom: profile.nom,
        email: profile.email,
        role: profile.role,
        permissions: (profile.permissions as string[]) || [],
        annexeIds,
      },
    };
  }

  /** Échange un refresh token valide contre un nouvel access token */
  async refreshAccessToken(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: jwtRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashRefreshToken(refreshToken) },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token révoqué ou expiré');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
      include: { userAnnexes: { select: { annexeId: true } } },
    });

    if (!profile || !profile.actif) {
      throw new UnauthorizedException('Compte inactif');
    }

    const annexeIds = profile.userAnnexes.map((ua: any) => ua.annexeId);

    const newPayload: JwtPayload = {
      sub: profile.id,
      email: profile.email,
      nom: profile.nom,
      role: profile.role,
      permissions: (profile.permissions as string[]) || [],
      annexeIds,
    };

    return { accessToken: this.jwt.sign(newPayload) };
  }

  /** Révoque un refresh token (logout) */
  async logout(refreshToken: string) {
    await this.prisma.refreshToken
      .delete({ where: { token: hashRefreshToken(refreshToken) } })
      .catch(() => null); // Pas d'erreur si déjà révoqué
  }

  /** Hache un mot de passe (utilisé dans le seed et la création de compte) */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /** Vérifie qu'un profil existe — utilisé par JwtStrategy */
  async findProfileById(id: string) {
    return this.prisma.profile.findUnique({
      where: { id },
      select: { id: true, actif: true, role: true },
    });
  }

  /** Met à jour le profil de l'utilisateur connecté */
  async updateProfile(userId: string, data: { nom?: string; email?: string }) {
    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const existing = await this.prisma.profile.findUnique({
        where: { email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException(`L'email ${data.email} est déjà utilisé`);
      }
    }

    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        nom: data.nom?.trim(),
        email: data.email?.toLowerCase().trim(),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        telephone: true,
        role: true,
        permissions: true,
        actif: true,
        avatarUrl: true,
      },
    });

    return updated;
  }

  /** Permet à un utilisateur connecté de modifier son mot de passe en validant l'ancien */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const passwordValid = await bcrypt.compare(currentPassword, profile.passwordHash);
    if (!passwordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.profile.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Mot de passe mis à jour avec succès' };
  }
}
