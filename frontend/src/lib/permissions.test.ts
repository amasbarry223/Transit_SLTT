import { describe, expect, it } from "vitest";
import { hasPermission, normalizePermissions, normalizeRole, type PermissionUser } from "./permissions";
import type { UserRole } from "@/lib/domain-types";

describe("normalizeRole", () => {
  it("reconnaît les valeurs brutes de l'enum Prisma RoleUtilisateur", () => {
    expect(normalizeRole("ADMIN")).toBe("Administrateur");
    expect(normalizeRole("COMPTABLE")).toBe("Comptable");
    expect(normalizeRole("TRANSITAIRE")).toBe("Agent de transit");
    expect(normalizeRole("COMMERCIAL")).toBe("Agent de transit");
    expect(normalizeRole("OPERATEUR")).toBe("Agent de transit");
  });

  it("retombe sur le rôle le MOINS privilégié pour un rôle absent ou non reconnu (jamais Administrateur)", () => {
    // RoleUtilisateur.CLIENT existe côté schéma Prisma mais n'est produit par
    // aucun formulaire de création d'utilisateur aujourd'hui — un défaut
    // "ouvert" ici accorderait silencieusement tous les droits à un rôle que
    // cette fonction ne reconnaît pas (hasPermission court-circuite tout
    // check pour "Administrateur").
    expect(normalizeRole("CLIENT")).toBe("Agent de transit");
    expect(normalizeRole("un-role-inconnu")).toBe("Agent de transit");
    expect(normalizeRole(null)).toBe("Agent de transit");
    expect(normalizeRole(undefined)).toBe("Agent de transit");
    expect(normalizeRole("")).toBe("Agent de transit");
  });
});

describe("hasPermission", () => {
  it("un rôle non reconnu n'a PAS accès à un module Administrateur-only", () => {
    // PermissionUser.role est typé UserRole, mais en pratique la valeur vient
    // du JWT/session sous sa forme brute (profile.role, l'enum Prisma —
    // cf. auth.service.ts login()), non mappée : le cast reflète ce que
    // hasPermission reçoit réellement à l'exécution.
    const user: PermissionUser = { role: "CLIENT" as UserRole, permissions: [] };
    expect(hasPermission(user, "parametres:write")).toBe(false);
    expect(hasPermission(user, "utilisateurs:manage")).toBe(false);
  });

  it("un utilisateur inactif n'a jamais aucune permission", () => {
    expect(
      hasPermission({ role: "ADMIN" as UserRole, permissions: [], actif: false }, "dashboard:read"),
    ).toBe(false);
  });
});

describe("normalizePermissions — vocabulaire backend/seed \"module.verbe\"", () => {
  // prisma/seed.ts provisionne des comptes de démo avec ce format
  // ("dossiers.creer", "caisse.encaisser"…) — voir canonicalPermission() côté
  // API (backend/src/auth/guards/permissions.guard.ts), déjà satisfait par
  // ce même format. Sans traduction ici, ces comptes voient une UI vide alors
  // que le backend les autorise déjà.
  it("traduit les permissions seed de l'agent de transit (dossiers.creer, dossiers.modifier, documents.upload)", () => {
    const result = normalizePermissions(["dossiers.creer", "dossiers.modifier", "documents.upload"]);
    expect(result).toEqual(
      expect.arrayContaining(["dossiers:write", "dossiers:read", "documents:write", "documents:read"]),
    );
    expect(result.length).toBeGreaterThan(0);
  });

  it("traduit les permissions seed du comptable (factures.creer, caisse.encaisser, caisse.decaisser, depenses.valider) via l'alias caisse/depenses -> comptabilite", () => {
    const result = normalizePermissions([
      "factures.creer",
      "caisse.encaisser",
      "caisse.decaisser",
      "depenses.valider",
    ]);
    expect(result).toEqual(
      expect.arrayContaining(["factures:write", "factures:read", "comptabilite:write", "comptabilite:read"]),
    );
  });

  it("un verbe de lecture ('lire'/'consulter') ne donne pas l'écriture", () => {
    expect(normalizePermissions(["clients.lire"])).toEqual(["clients:read"]);
  });

  it("une clé totalement inconnue reste ignorée (pas de faux positif)", () => {
    expect(normalizePermissions(["module-fantome.action-inconnue"])).toEqual([]);
  });
});
