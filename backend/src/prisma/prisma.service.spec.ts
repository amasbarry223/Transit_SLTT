import { withPoolLimits } from './prisma.service';

describe('withPoolLimits', () => {
  it('borne le pool par défaut (5 connexions, attente 20 s) sur une URL sans paramètres', () => {
    expect(withPoolLimits('mysql://u:p@h:3306/db', {})).toBe('mysql://u:p@h:3306/db?connection_limit=5&pool_timeout=20');
  });

  it('ajoute les paramètres à une URL qui en a déjà', () => {
    expect(withPoolLimits('mysql://u:p@h/db?sslaccept=strict', {})).toBe(
      'mysql://u:p@h/db?sslaccept=strict&connection_limit=5&pool_timeout=20',
    );
  });

  it('respecte une valeur explicite dans DATABASE_URL', () => {
    expect(withPoolLimits('mysql://u:p@h/db?connection_limit=12&pool_timeout=5', {})).toBe(
      'mysql://u:p@h/db?connection_limit=12&pool_timeout=5',
    );
  });

  it('lit PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT', () => {
    expect(withPoolLimits('mysql://u:p@h/db', { PRISMA_CONNECTION_LIMIT: '3', PRISMA_POOL_TIMEOUT: '30' })).toBe(
      'mysql://u:p@h/db?connection_limit=3&pool_timeout=30',
    );
  });

  it('laisse une URL absente telle quelle', () => {
    expect(withPoolLimits(undefined, {})).toBeUndefined();
  });
});
