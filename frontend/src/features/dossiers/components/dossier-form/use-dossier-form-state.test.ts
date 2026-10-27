import { describe, expect, it, vi } from "vitest";
import React from "react";
import { useDossierFormState } from "./use-dossier-form-state";
import type { Annexe, Dossier, Societe } from "@/lib/domain-types";

function runHook<TProps, TResult>(hook: (props: TProps) => TResult, initialProps: TProps) {
  const states: unknown[] = [];
  const memos: { value: unknown; deps?: unknown[] }[] = [];
  let stateIndex = 0;
  let memoIndex = 0;
  let currentProps = initialProps;
  let currentResult: TResult;

  const useStateMock = vi.fn((initial: unknown) => {
    const idx = stateIndex++;
    if (idx >= states.length) {
      states[idx] = typeof initial === "function" ? (initial as () => unknown)() : initial;
    }
    const setState = (next: unknown) => {
      states[idx] = typeof next === "function" ? (next as (prev: unknown) => unknown)(states[idx]) : next;
      execute();
    };
    return [states[idx], setState];
  });

  const useMemoMock = vi.fn((factory: () => unknown, deps?: unknown[]) => {
    const idx = memoIndex++;
    const prev = memos[idx];
    const depsChanged = !prev || !deps || deps.some((d, i) => !Object.is(d, prev.deps?.[i]));
    if (depsChanged) {
      memos[idx] = { value: factory(), deps };
    }
    return memos[idx].value;
  });

  function execute() {
    stateIndex = 0;
    memoIndex = 0;
    // Inject mock hook dispatcher into React 19 internals
    const internals = (React as unknown as {
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: unknown };
    }).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    internals.H = {
      useState: useStateMock,
      useMemo: useMemoMock,
    };
    currentResult = hook(currentProps);
  }

  execute();

  return {
    get current() {
      return currentResult;
    },
    rerender: (nextProps?: TProps) => {
      if (nextProps) currentProps = nextProps;
      execute();
    },
  };
}

const mockAnnexes: Annexe[] = [
  {
    id: "annexe-1",
    nom: "Dakar Port",
    code: "DK",
    villeSiege: "Dakar",
    devise: "FCFA",
    actif: true,
  },
  {
    id: "annexe-2",
    nom: "Bamako",
    code: "ML",
    villeSiege: "Bamako",
    devise: "FCFA",
    actif: true,
  },
];

const mockSocietes: Societe[] = [
  {
    id: "soc-1",
    nom: "SLTT Transit",
    raisonSociale: "SLTT Transit SARL",
    actif: true,
    adresse: "Port de Dakar",
    telephone: "+221 33 000 00 00",
    rccm: "RC-1234",
    nif: "NIF-5678",
    afficherNomAvecLogo: true,
  },
];

describe("useDossierFormState - Étape 1 (Identité)", () => {
  it("initialise un nouveau dossier avec la date du jour et sans faux positif isDirty", () => {
    const today = new Date().toISOString().slice(0, 10);
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    expect(hook.current.annexeId).toBe("annexe-1");
    expect(hook.current.date).toBe(today);
    // Grâce au correctif, l'annexe et la date préremplies ne marquent pas le formulaire comme dirty
    expect(hook.current.isDirty).toBe(false);
  });

  it("marque isDirty à true dès qu'un champ de l'étape 1 est renseigné ou modifié", () => {
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    expect(hook.current.isDirty).toBe(false);

    hook.current.setBl("BL-12345");

    expect(hook.current.isDirty).toBe(true);
  });

  it("valide l'étape 1 et bloque le passage si un champ obligatoire manque", () => {
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    hook.current.goNextStep();

    // Bloqué à l'étape 1
    expect(hook.current.wizardStep).toBe(1);
    expect(hook.current.errors.clientId).toBe("Le client est obligatoire.");
    expect(hook.current.errors.nature).toBe("La nature de la marchandise est obligatoire.");
    expect(hook.current.errors.bl).toBe("Le numéro de BL est obligatoire.");
    expect(hook.current.errors.camion).toBe("Le numéro de camion est obligatoire.");
  });

  it("permet d'avancer à l'étape 2 une fois l'étape 1 validée", () => {
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    hook.current.setClientId("client-1");
    hook.current.setNature("Riz blanc");
    hook.current.setBl("MSCU987654");
    hook.current.setCamion("DK-1234-A");

    hook.current.goNextStep();

    expect(hook.current.wizardStep).toBe(2);
    expect(hook.current.errors).toEqual({});
  });

  it("redirige le wizard à l'étape 1 si validate() échoue depuis une autre étape", () => {
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    hook.current.setWizardStep(3);

    expect(hook.current.wizardStep).toBe(3);

    const isValid = hook.current.validate();
    expect(isValid).toBe(false);

    // Revient automatiquement à l'étape 1 pour afficher les erreurs
    expect(hook.current.wizardStep).toBe(1);
    expect(hook.current.errors.clientId).toBeDefined();
  });

  it("normalise, trime et convertit en majuscules BL et Camion dans buildSaveInput", () => {
    const hook = runHook(useDossierFormState, {
      isEdit: false,
      dossierSeq: 1,
      dossiers: [],
      societes: mockSocietes,
      annexes: mockAnnexes,
      defaultAnnexeId: "annexe-1",
    });

    hook.current.setClientId("client-1");
    hook.current.setNature("   Conteneurs de sucre   ");
    hook.current.setBl("  mscu-1234-xy  ");
    hook.current.setCamion("  dk 5678 ab  ");
    hook.current.setNoConteneur("  msku7654321  ");

    const payload = hook.current.buildSaveInput("Client Test");

    expect(payload.nature).toBe("Conteneurs de sucre");
    expect(payload.bl).toBe("MSCU-1234-XY");
    expect(payload.camion).toBe("DK 5678 AB");
    expect(payload.noConteneur).toBe("MSKU7654321");
  });

  it("préserve les données existantes en mode édition", () => {
    const existing: Dossier = {
      id: "dossier-1",
      reference: "DK-2026-0001",
      annexeId: "annexe-2",
      annexeNom: "Bamako",
      clientId: "client-99",
      clientNom: "Ancien Client",
      nature: "Cacao",
      bl: "BL-EXISTING-01",
      camion: "RC-999-Z",
      date: "2026-01-15",
      statut: "En cours",
      totalContrat: 500000,
      montantPaye: 0,
      depenses: [],
      paiements: [],
    };

    const hook = runHook(useDossierFormState, {
      existing,
      isEdit: true,
      dossierSeq: 1,
      dossiers: [existing],
      societes: mockSocietes,
      annexes: mockAnnexes,
    });

    expect(hook.current.annexeId).toBe("annexe-2");
    expect(hook.current.clientId).toBe("client-99");
    expect(hook.current.nature).toBe("Cacao");
    expect(hook.current.bl).toBe("BL-EXISTING-01");
    expect(hook.current.camion).toBe("RC-999-Z");
    expect(hook.current.date).toBe("2026-01-15");
    expect(hook.current.isDirty).toBe(false);
  });
});
