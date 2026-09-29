import { canonicalPermission, userSatisfiesPermission } from './permissions.guard';

describe('canonicalPermission', () => {
  it('normalise les deux vocabulaires vers module:action', () => {
    expect(canonicalPermission('dossiers.creer')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers.modifier')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers.supprimer')).toBe('dossiers:write');
    expect(canonicalPermission('dossiers:write')).toBe('dossiers:write');
    expect(canonicalPermission('factures:read')).toBe('factures:read');
  });

  it('ne confond pas "write-caisse" avec "write" (permissions distinctes)', () => {
    expect(canonicalPermission('bons:write-caisse')).toBe('bons:write-caisse');
    expect(canonicalPermission('bons:write')).toBe('bons:write');
  });

  it('applique les alias de module backend -> front', () => {
    expect(canonicalPermission('caisse.gerer')).toBe('comptabilite:write');
    expect(canonicalPermission('settings.modifier')).toBe('parametres:write');
    expect(canonicalPermission('annexes.creer')).toBe('parametres:write');
  });

  it('ne confond pas "manage" avec "read" (faille de canonicalisation)', () => {
    // "manage" ne contient pas "write" et n'était pas dans VERB_TO_ACTION :
    // il retombait sur "read" par défaut, ce qui faisait de
    // "utilisateurs:read" (ou tout autre variante lecture) un droit
    // équivalent à "utilisateurs:manage" (gestion complète des comptes).
    expect(canonicalPermission('utilisateurs:manage')).toBe('utilisateurs:manage');
    expect(canonicalPermission('utilisateurs:manage')).not.toBe('utilisateurs:read');
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

  it('ne laisse pas "bons:write-caisse" et "bons:write" s’octroyer mutuellement (pas d’escalade croisée)', () => {
    expect(userSatisfiesPermission(['bons:write-caisse'], 'bons:write')).toBe(false);
    expect(userSatisfiesPermission(['bons:write'], 'bons:write-caisse')).toBe(false);
    // Chacun reste valide pour lui-même et implique la lecture du module.
    expect(userSatisfiesPermission(['bons:write-caisse'], 'bons:write-caisse')).toBe(true);
    expect(userSatisfiesPermission(['bons:write-caisse'], 'bons:read')).toBe(true);
    expect(userSatisfiesPermission(['bons:write'], 'bons:read')).toBe(true);
  });

  it('un simple droit de lecture "utilisateurs" n’accorde PAS "utilisateurs:manage"', () => {
    // Avant le fix : canonicalPermission('utilisateurs:manage') valait
    // 'utilisateurs:read', donc un délégué avec 'utilisateurs:read' (ou
    // 'utilisateurs.lire') se voyait accorder la gestion complète des
    // comptes (création/suppression/réinitialisation de mot de passe).
    expect(userSatisfiesPermission(['utilisateurs:read'], 'utilisateurs:manage')).toBe(false);
    expect(userSatisfiesPermission(['utilisateurs.lire'], 'utilisateurs:manage')).toBe(false);
    expect(userSatisfiesPermission(['utilisateurs:manage'], 'utilisateurs:manage')).toBe(true);
  });
});
