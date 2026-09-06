import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, CurrentUserType } from './auth.types';

const BCRYPT_ROUNDS = 12;

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

    // Refresh token (7j)
    const refreshToken = this.jwt.sign(
      { sub: profile.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'transit_sltt_super_secret_refresh_key_dev_2025',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
      },
    );

    // Persister le refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.upsert({
      where: { token: refreshToken },
      create: { userId: profile.id, token: refreshToken, expiresAt },
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
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
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
      .delete({ where: { token: refreshToken } })
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
}
