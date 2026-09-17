import { getTrustedOrigins, isTrustedOrigin } from './cors-origins.util';

describe('cors-origins.util', () => {
  describe('getTrustedOrigins', () => {
    it('inclut toujours les domaines de production et localhost par défaut', () => {
      const origins = getTrustedOrigins('');
      expect(origins).toContain('https://traorelogistique-transit.com');
      expect(origins).toContain('https://www.traorelogistique-transit.com');
      expect(origins).toContain('http://localhost:3000');
    });

    it('ajoute les origines configurées via CORS_ORIGIN sans dupliquer', () => {
      const origins = getTrustedOrigins('https://autre-domaine.com, https://traorelogistique-transit.com');
      expect(origins.filter((o) => o === 'https://traorelogistique-transit.com')).toHaveLength(1);
      expect(origins).toContain('https://autre-domaine.com');
    });
  });

  describe('isTrustedOrigin', () => {
    it('accepte le domaine avec ou sans www', () => {
      const origins = getTrustedOrigins('');
      expect(isTrustedOrigin('https://traorelogistique-transit.com', origins)).toBe(true);
      expect(isTrustedOrigin('https://www.traorelogistique-transit.com', origins)).toBe(true);
    });

    it('rejette une origine tierce non listée', () => {
      const origins = getTrustedOrigins('');
      expect(isTrustedOrigin('https://evil-hacker.com', origins)).toBe(false);
    });
  });
});
