import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload, CurrentUserType } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserType> {
    // Vérification que le profil est encore actif en base
    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
      select: { id: true, actif: true, nom: true, email: true, role: true, permissions: true },
    });

    if (!profile || !profile.actif) {
      throw new UnauthorizedException('Compte inactif ou introuvable');
    }

    // Les annexeIds viennent du payload (évite un aller-retour DB à chaque requête)
    return {
      id: payload.sub,
      email: payload.email,
      nom: payload.nom,
      role: payload.role,
      permissions: payload.permissions,
      annexeIds: payload.annexeIds,
    };
  }
}
