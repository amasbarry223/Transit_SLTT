import { canonicalPermission, userSatisfiesPermission } from './permissions.guard';

describe('canonicalPermission', () => {
  it('normalise les deux vocabulaires vers module:action', () => {
    expect(canonicalPermission('dossiers.creer')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers.modifier')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers.supprimer')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers:write')).toBe('dossiers:write');
    expect(canonicalPermission('factures:read')).toBe('factures:read');
    expect(canonicalPermission('bons:write-caisse')).toBe('bons:write');
  });

  it('applique les alias de module backend -> front', () => {
    expect(canonicalPermission('caisse.gerer')).toBe('comptabilite:write');
    expect(canonicalPermission('settings.modifier')).toBe('parametres:write');
    expect(canonicalPermission('annexes.creer')).toBe('parametres:write');
  });
});

describe('userSatisfiesPermission', () => {
  it('accepte un compte provisionné par l’UI (module:action) face à un garde backend (module.verbe)', () => {
    const perms = ['dossiers:read', 'dossiers:write', 'factures:read'];
    expect(userSatisfiesPermission(perms, 'dossiers.creer')).toBe(true);
    expect(userSatisfiesPermission(perms, 'dossiers.modifier')).toBe(true);
    expect(userSatisfiesPermission(perms, 'factures.creer')).toBe(false);
  });

  it('accepte un compte seed (module.verbe) face à un garde front (module:action)', () => {
    const perms = ['dossiers.creer', 'dossiers.modifier'];
    expect(userSatisfiesPermission(perms, 'dossiers:write')).toBe(true);
    expect(userSatisfiesPermission(perms, 'dossiers:read')).toBe(true); // write => read
  });

  it('refuse quand le module ne correspond pas', () => {
    expect(userSatisfiesPermission(['stock:write'], 'comptabilite:write')).toBe(false);
    expect(userSatisfiesPermission([], 'dossiers:write')).toBe(false);
  });

  it('accepte un droit accordé au niveau du module entier', () => {
    expect(userSatisfiesPermission(['dossiers'], 'dossiers.supprimer')).toBe(true);
  });
});
