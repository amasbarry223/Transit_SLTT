import { describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import type {
  Archive,
  Client,
  Dossier,
  DossierFournisseur,
  Ecriture,
  Facture,
  Fournisseur,
  SubDossier,
} from "@/lib/store";

const baseDossier: Dossier = {
  id: "d1",
  reference: "SLTT-TR-2026-0001",
  annexeId: "33333333-3333-3333-3333-333333333333",
  clientId: "c1",
  clientNom: "Golaine Tech",
  bl: "BL-1",
  camion: "",
  nature: "Marchandise générale",
  droitDouane: 0,
  fraisCircuit: 0,
  fraisPrestation: 0,
  montantInvesti: 1000,
  montantPaye: 0,
  statut: "En cours",
  date: "2026-07-01",
};

const baseClient: Client = {
  id: "c1",
  nom: "Golaine Tech",
  type: "Entreprise",
  telephone: "",
  email: "",
  adresse: "",
  annexeId: "33333333-3333-3333-3333-333333333333",
  nbDossiers: 1,
  totalDu: 1000,
  totalPaye: 0,
};

describe("removeDossier", () => {
  function seedState() {
    const ecriture: Ecriture = {
      id: "e1",
      date: "2026-07-01",
      clientId: "c1",
      clientNom: "Golaine Tech",
      dossierId: "d1",
      annexeId: "33333333-3333-3333-3333-333333333333",
      montantInvesti: 1000,
      montantPaye: 0,
      modePaiement: "Espèces",
    };
    const fichier = {
      id: "f1",
      dossierId: "d1",
      nom: "bl.pdf",
      taille: 100,
      type: "application/pdf",
      dateUpload: "2026-07-01",
      dataUrl: "data:,",
    };
    const subDossier: SubDossier = {
      id: "sd1",
      dossierId: "d1",
      nom: "Sous-dossier 1",
      dateCreation: "2026-07-01",
    };
    const facture: Facture = {
      id: "fa1",
      numero: "FA-0001",
      dossierId: "d1",
      clientId: "c1",
      clientNom: "Golaine Tech",
      annexeId: "33333333-3333-3333-3333-333333333333",
      date: "2026-07-01",
      dateEcheance: "2026-07-15",
      statut: "Envoyée",
      lignes: [],
      tauxTVA: 0,
      montantHT: 0,
      montantTVA: 0,
      montantTTC: 0,
      montantPaye: 0,
      notes: "",
      creePar: "Test",
      creeLe: "2026-07-01",
    };
    const dossierFournisseur: DossierFournisseur = {
      id: "df1",
      dossierId: "d1",
      fournisseurId: "fr1",
      fournisseurNom: "Transporteur X",
      type: "Transporteur",
      description: "",
      montantBudgete: 100,
      montantReel: 100,
      statut: "Payé",
      date: "2026-07-01",
    };
    const fournisseur: Fournisseur = {
      id: "fr1",
      nom: "Transporteur X",
      type: "Transporteur",
      annexeId: "a1",
      contact: "",
      telephone: "",
      email: "",
      adresse: "",
      nbDossiers: 1,
      montantTotal: 100,
      statut: "Actif",
    };
    const archive: Archive = {
      id: "ar1",
      nom: "bl-scan.pdf",
      typeDocument: "Autre",
      taille: 100,
      type: "application/pdf",
      storagePath: "2026-07/ar1.pdf",
      dossierId: "d1",
      annexeId: "a1",
      creePar: "Test",
      createdAt: "2026-07-01",
    };

    useStore.setState({
      dossiers: [baseDossier],
      clients: [baseClient],
      ecritures: [ecriture],
      fichiers: [fichier],
      subDossiers: [subDossier],
      factures: [facture],
      dossierFournisseurs: [dossierFournisseur],
      fournisseurs: [fournisseur],
      devis: [],
      archives: [archive],
      auditLogs: [],
      auditSeq: 1,
      bons: [],
    });
  }

  it("délie les écritures liées au lieu de les supprimer", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const ecriture = useStore.getState().ecritures.find((e) => e.id === "e1");
    expect(ecriture).toBeDefined();
    expect(ecriture?.dossierId).toBeUndefined();
  });

  it("retire les fichiers et sous-dossiers liés", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    expect(useStore.getState().fichiers.find((f) => f.dossierId === "d1")).toBeUndefined();
    expect(useStore.getState().subDossiers.find((sd) => sd.dossierId === "d1")).toBeUndefined();
  });

  it("délie les factures et archives liées au lieu de les supprimer", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const facture = useStore.getState().factures.find((f) => f.id === "fa1");
    expect(facture).toBeDefined();
    expect(facture?.dossierId).toBeNull();

    const archive = useStore.getState().archives.find((a) => a.id === "ar1");
    expect(archive).toBeDefined();
    expect(archive?.dossierId).toBeUndefined();
  });

  it("journalise la suppression dans l'audit", async () => {
    seedState();
    await useStore.getState().removeDossier("d1");
    const audit = useStore.getState().auditLogs.find((l) => l.action === "Suppression");
    expect(audit).toBeDefined();
  });
});

describe("deleteArchive", () => {
  function seedArchive() {
    const archive: Archive = {
      id: "ar1",
      nom: "bl-scan.pdf",
      typeDocument: "Autre",
      taille: 100,
      type: "application/pdf",
      storagePath: "2026-07/ar1.pdf",
      annexeId: "a1",
      creePar: "Test",
      createdAt: "2026-07-01",
    };
    useStore.setState({ archives: [archive], auditLogs: [], auditSeq: 1 });
  }

  it("supprime le fichier de l'état local et journalise dans l'audit", async () => {
    seedArchive();
    await useStore.getState().deleteArchive("ar1");
    expect(useStore.getState().archives.find((a) => a.id === "ar1")).toBeUndefined();
    const audit = useStore.getState().auditLogs.find((l) => l.action === "Suppression");
    expect(audit).toBeDefined();
  });
});
