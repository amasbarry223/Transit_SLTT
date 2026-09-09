import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload, CurrentUserType } from '../auth.types';
import { jwtAccessSecret } from '../jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Même source que la signature (auth.module) : jamais de secret divergent.
      secretOrKey: jwtAccessSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserType> {
    // On relit le profil à chaque requête : rôle et permissions viennent donc
    // de la base, pas du token. Une révocation de droits / d'admin prend effet
    // immédiatement au lieu d'attendre l'expiration de l'access token.
    const profile = await this.prisma.profile.findUnique({
      where: { id: payload.sub },
      select: { id: true, actif: true, nom: true, email: true, role: true, permissions: true },
    });

    if (!profile || !profile.actif) {
      throw new UnauthorizedException('Compte inactif ou introuvable');
    }

    return {
      id: profile.id,
      email: profile.email,
      nom: profile.nom,
      role: profile.role,
      permissions: (profile.permissions as string[]) ?? [],
      // Les annexeIds restent issues du payload (compromis perf : pas de
      // jointure userAnnexes à chaque requête ; rafraîchies au refresh token).
      annexeIds: payload.annexeIds,
    };
  }
}
