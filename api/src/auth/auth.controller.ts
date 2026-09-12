import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, Public, SkipCsrf } from '../shared/decorators';
import type { CurrentUserType } from './auth.types';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_COOKIE,
  accessCookieOptions,
  accessCookieMaxAge,
  refreshCookieOptions,
  refreshCookieMaxAge,
  csrfCookieOptions,
} from './cookie.config';

function apiPrefix(): string {
  return process.env.API_PREFIX ?? 'api';
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...accessCookieOptions(),
      maxAge: accessCookieMaxAge(),
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...refreshCookieOptions(apiPrefix()),
      maxAge: refreshCookieMaxAge(),
    });
    // Non-httpOnly par conception : le front le lit et l'échote en en-tête
    // X-CSRF-Token (double-submit) sur chaque requête d'état — voir csrf.guard.ts.
    res.cookie(CSRF_COOKIE, randomBytes(32).toString('hex'), {
      ...csrfCookieOptions(),
      maxAge: refreshCookieMaxAge(),
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions(apiPrefix()));
    res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
  }

  // 5 tentatives / minute / IP : au-delà, 429 Too Many Requests. Limite
  // resserrée uniquement sur les routes qui vérifient un secret (mot de
  // passe, refresh token) — le reste de l'API garde le défaut permissif
  // du ThrottlerModule (aucune restriction pratique sur l'usage normal).
  @Public()
  @SkipCsrf()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token absent.');
    }
    const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...accessCookieOptions(),
      maxAge: accessCookieMaxAge(),
    });
    return { success: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearAuthCookies(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserType) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() body: { nom?: string; email?: string },
  ) {
    return this.authService.updateProfile(user.id, body);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() body: { currentPassword?: string; newPassword?: string },
  ) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Mot de passe actuel et nouveau mot de passe requis');
    }
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
