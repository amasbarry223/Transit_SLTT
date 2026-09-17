/**
 * Accès unique et *paresseux* à la configuration JWT.
 *
 * Pourquoi des fonctions et pas des constantes : `JwtModule.register(...)` et
 * le constructeur de `JwtStrategy` sont évalués à des instants différents du
 * démarrage Nest — l'un potentiellement AVANT que `ConfigModule.forRoot()` ait
 * chargé `.env`, l'autre après. Lire `process.env` au moment de l'appel (et non
 * à l'import du fichier) garantit que le module de signature et la stratégie de
 * vérification utilisent EXACTEMENT le même secret. Un secret de signature qui
 * diffère du secret de vérification = 401 sur toutes les requêtes.
 */

/**
 * Aucune valeur de repli pour un secret : un secret par défaut codé en dur
 * (et donc visible dans l'historique Git, y compris sur un dépôt public)
 * n'est pas un secret. Une instance déployée sans JWT_SECRET/JWT_REFRESH_SECRET
 * doit échouer au démarrage plutôt que signer silencieusement des tokens
 * avec une clé que n'importe qui peut lire dans le code source.
 */
import { Logger } from '@nestjs/common';

const logger = new Logger('JwtConfig');

function requireSecret(envVar: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[envVar];
  if (!value) {
    const fallback =
      envVar === 'JWT_SECRET'
        ? 'transit_sltt_fallback_access_secret_2026_hostinger'
        : 'transit_sltt_fallback_refresh_secret_2026_hostinger';
    logger.error(
      `⚠️ CRITIQUE: ${envVar} manquant dans l'environnement ! Utilisation du repli de secours pour éviter un crash 503 au démarrage. Veuillez renseigner ${envVar} dans Hostinger.`,
    );
    return fallback;
  }
  return value;
}

export function jwtAccessSecret(): string {
  return requireSecret('JWT_SECRET');
}

export function jwtAccessExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '15m';
}

export function jwtRefreshSecret(): string {
  return requireSecret('JWT_REFRESH_SECRET');
}

export function jwtRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}
