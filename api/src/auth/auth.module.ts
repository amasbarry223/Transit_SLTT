import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AnnexeGuard } from './guards/annexe.guard';
import { jwtAccessSecret, jwtAccessExpiresIn } from './jwt.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // registerAsync : la factory s'exécute pendant l'init du conteneur Nest,
    // donc APRÈS ConfigModule.forRoot() — .env est bien chargé ici.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtAccessSecret(),
        signOptions: { expiresIn: jwtAccessExpiresIn() as `${number}m` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard, AnnexeGuard],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, AnnexeGuard, JwtModule],
})
export class AuthModule {}
