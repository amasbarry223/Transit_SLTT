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

const DEFAULT_ACCESS_SECRET = 'transit_sltt_super_secret_jwt_key_default_dev_2025';
const DEFAULT_REFRESH_SECRET = 'transit_sltt_super_secret_refresh_key_dev_2025';

export function jwtAccessSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_ACCESS_SECRET;
}

export function jwtAccessExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '15m';
}

export function jwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET;
}

export function jwtRefreshExpiresIn(): string {
  return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}
