"use client";

import { useMemo, useState } from "react";
import {
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  Lock,
  RefreshCw,
  Bell,
  Globe,
  Calendar,
  Coins,
  Users,
  User,
  RotateCcw,
  AlertTriangle,
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNav } from "@/lib/nav-store";
import { useCurrentUser } from "@/hooks/use-permission";
import { hashPassword } from "@/lib/crypto";
import type { UserInput, UserRole, AuditAction, AuditModule, AuditEntry } from "@/lib/store";
import { formatDateShort } from "@/lib/format";
import { ToneBadge } from "@/components/sltt/status-badge";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PageHeader } from "@/components/sltt/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

type ParamTab = "users" | "profile" | "security" | "audit" | "preferences";

const AUDIT_PAGE_SIZE = 8;

const actionTone: Record<
  AuditAction,
  "blue" | "emerald" | "amber" | "indigo" | "slate" | "red"
> = {
  Connexion: "slate",
  Création: "blue",
  Modification: "indigo",
  Validation: "emerald",
  Paiement: "emerald",
  Export: "amber",
  Suppression: "red",
};

const tabs: {
  key: ParamTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "users", label: "Utilisateurs & rôles", shortLabel: "Utilisateurs", icon: Users },
  { key: "profile", label: "Mon profil", shortLabel: "Profil", icon: User },
  { key: "security", label: "Sécurité", shortLabel: "Sécurité", icon: Shield },
  { key: "audit", label: "Audit & traçabilité", shortLabel: "Audit", icon: ScrollText },
  { key: "preferences", label: "Préférences", shortLabel: "Préférences", icon: Globe },
];

const roleTone: Record<UserRole, "red" | "blue" | "emerald" | "amber" | "indigo"> = {
  Administrateur: "red",
  "Agent de transit": "blue",
  Comptable: "emerald",
  Magasinier: "amber",
  Commercial: "indigo",
};

const allRoles: UserRole[] = [
  "Administrateur",
  "Agent de transit",
  "Comptable",
  "Magasinier",
  "Commercial",
];

const modulesList = [
  "Dossiers",
  "Comptabilité",
  "Stock",
  "Bons de sortie",
  "Clients",
  "Rapports",
];

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/* ------------------------------------------------------------------ */
/* SUB-COMPONENTS PER TAB                                              */
/* ------------------------------------------------------------------ */

function UsersTab() {
  const { toast } = useToast();
  const users = useStore((s) => s.users);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);
  const removeUser = useStore((s) => s.removeUser);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const userToDelete = users.find((u) => u.id === deleteId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("Agent de transit");
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({
    Dossiers: true,
    Comptabilité: false,
    Stock: false,
    "Bons de sortie": false,
    Clients: true,
    Rapports: false,
  });
  const [accessCode, setAccessCode] = useState(() => generateCode());
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Agent de transit");
  const [perms, setPerms] = useState<Record<string, boolean>>({
    Dossiers: true,
    Comptabilité: false,
    Stock: false,
    "Bons de sortie": false,
    Clients: true,
    Rapports: false,
  });

  function refreshCode() {
    setAccessCode(generateCode());
  }

  function openEditUser(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditingUserId(id);
    setEditNom(u.nom);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPerms(
      Object.fromEntries(modulesList.map((m) => [m, u.permissions.includes(m)])) as Record<string, boolean>
    );
    setEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId || !editNom.trim()) return;
    const permissions = Object.entries(editPerms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const input: UserInput = {
      nom: editNom.trim(),
      email: editEmail.trim(),
      role: editRole,
      permissions,
    };
    updateUser(editingUserId, input);
    toast({ title: "Utilisateur mis à jour" });
    setEditOpen(false);
    setEditingUserId(null);
  }

  function resetForm() {
    setNom("");
    setEmail("");
    setRole("Agent de transit");
    setPerms({
      Dossiers: true,
      Comptabilité: false,
      Stock: false,
      "Bons de sortie": false,
      Clients: true,
      Rapports: false,
    });
    setAccessCode(generateCode());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !email.trim()) return;
    const permissions = Object.entries(perms)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const input: UserInput = {
      nom: nom.trim(),
      email: email.trim(),
      role,
      permissions,
      motDePasse: accessCode,
    };
    addUser(input);
    toast({ title: "Utilisateur créé avec succès" });
    setCreateOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Gérez les comptes, rôles et permissions de l&apos;équipe.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <UserPlus className="size-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Users table */}
      <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Nom
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                E-mail
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Rôle
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Statut
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Dernière connexion
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow
                key={u.id}
                className="hover:bg-slate-50/60 border-b border-border"
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs font-bold">
                      {getInitials(u.nom)}
                    </div>
                    <span className="font-medium text-slate-900">{u.nom}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-slate-600">{u.email}</TableCell>
                <TableCell className="py-3">
                  <ToneBadge tone={roleTone[u.role]}>{u.role}</ToneBadge>
                </TableCell>
                <TableCell className="py-3">
                  <ToneBadge tone={u.actif ? "emerald" : "slate"}>
                    {u.actif ? "Actif" : "Inactif"}
                  </ToneBadge>
                </TableCell>
                <TableCell className="py-3 text-slate-500 tabular-nums">
                  {formatDateShort(u.derniereConnexion)}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.actif}
                        onCheckedChange={() => {
                          toggleUserActive(u.id);
                          toast({
                            title: "Statut mis à jour",
                            description: `${u.nom} est maintenant ${u.actif ? "inactif" : "actif"}.`,
                          });
                        }}
                        aria-label={`Basculer le statut de ${u.nom}`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-primary"
                      aria-label={`Modifier ${u.nom}`}
                      title="Modifier"
                      onClick={() => openEditUser(u.id)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-500 hover:text-destructive"
                      aria-label={`Supprimer ${u.nom}`}
                      title="Supprimer l'utilisateur"
                      onClick={() => setDeleteId(u.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Delete user confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;utilisateur <strong>{userToDelete?.nom}</strong> sera définitivement supprimé.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  removeUser(deleteId);
                  toast({ title: "Utilisateur supprimé", description: `${userToDelete?.nom} a été supprimé.` });
                  setDeleteId(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Créez un compte et définissez ses permissions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-nom" className="text-sm font-medium text-slate-700">
                Nom complet
              </Label>
              <Input
                id="u-nom"
                placeholder="ex. Awa Traoré"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="u-email" className="text-sm font-medium text-slate-700">
                E-mail
              </Label>
              <Input
                id="u-email"
                type="email"
                placeholder="awa.traore@sltt.ml"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Rôle</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Code d&apos;accès
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={accessCode}
                  readOnly
                  className="font-mono tracking-[0.3em] text-center font-semibold text-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={refreshCode}
                  aria-label="Régénérer le code"
                  title="Régénérer le code"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Code à 6 caractères, communiquez-le à l&apos;utilisateur.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Permissions
              </Label>
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-slate-50/50 p-3 sm:grid-cols-2">
                {modulesList.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-700 hover:bg-white"
                  >
                    <Checkbox
                      checked={perms[m]}
                      onCheckedChange={(v) =>
                        setPerms((prev) => ({ ...prev, [m]: Boolean(v) }))
                      }
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Créer le compte</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription className="sr-only">
              Modifiez le nom, l'e-mail, le rôle et les permissions de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-nom" className="text-sm font-medium text-slate-700">
                Nom complet
              </Label>
              <Input
                id="e-nom"
                placeholder="ex. Awa Traoré"
                required
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-email" className="text-sm font-medium text-slate-700">
                E-mail
              </Label>
              <Input
                id="e-email"
                type="email"
                placeholder="awa.traore@sltt.ml"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Rôle</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Permissions
              </Label>
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-slate-50/50 p-3 sm:grid-cols-2">
                {modulesList.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-700 hover:bg-white"
                  >
                    <Checkbox
                      checked={editPerms[m]}
                      onCheckedChange={(v) =>
                        setEditPerms((prev) => ({ ...prev, [m]: Boolean(v) }))
                      }
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!editNom.trim()}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileTab() {
  const { toast } = useToast();
  const users = useStore((s) => s.users);
  const adminUser = users.find((u) => u.role === "Administrateur");
  const [pNom, setPNom] = useState(adminUser?.nom ?? "Amadou Traoré");
  const [pEmail, setPEmail] = useState(adminUser?.email ?? "amadou.traore@sltt.ml");
  const [pTel, setPTel] = useState("+223 76 12 34 56");
  const [pPoste, setPPoste] = useState("Directeur des opérations");
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Vos informations personnelles et professionnelles.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast({ title: "Profil mis à jour avec succès" });
          }}
          className="space-y-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xl font-bold">
              {getInitials(pNom || "Amadou Traoré")}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{pNom || "Amadou Traoré"}</p>
              <p className="text-sm text-slate-500">Administrateur</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-nom" className="text-sm font-medium text-slate-700">
                Nom complet
              </Label>
              <Input
                id="p-nom"
                value={pNom}
                onChange={(e) => setPNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email" className="text-sm font-medium text-slate-700">
                E-mail
              </Label>
              <Input
                id="p-email"
                type="email"
                value={pEmail}
                onChange={(e) => setPEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tel" className="text-sm font-medium text-slate-700">
                Téléphone
              </Label>
              <Input
                id="p-tel"
                value={pTel}
                onChange={(e) => setPTel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-poste" className="text-sm font-medium text-slate-700">
                Poste
              </Label>
              <Input
                id="p-poste"
                value={pPoste}
                onChange={(e) => setPPoste(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Enregistrer les modifications</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const updateUser = useStore((s) => s.updateUser);
  const [autoLogout, setAutoLogout] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPwd) {
      toast({ title: "Veuillez saisir un nouveau mot de passe", variant: "destructive" });
      return;
    }
    if (newPwd !== confPwd) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Utilisateur introuvable", variant: "destructive" });
      return;
    }
    setSavingPwd(true);
    try {
      const hashed = await hashPassword(newPwd);
      updateUser(currentUser.id, {
        nom: currentUser.nom,
        email: currentUser.email,
        role: currentUser.role,
        permissions: currentUser.permissions,
        motDePasse: hashed,
      });
      toast({ title: "Mot de passe mis à jour" });
      setCurPwd("");
      setNewPwd("");
      setConfPwd("");
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Mot de passe, authentification et options de sécurité du compte.
      </p>

      {/* Mot de passe */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Mot de passe</h3>
        </div>
        <form
          onSubmit={handlePasswordSubmit}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="space-y-2">
            <Label htmlFor="cur-pwd" className="text-sm font-medium text-slate-700">
              Mot de passe actuel
            </Label>
            <Input
              id="cur-pwd"
              type="password"
              placeholder="••••••••"
              value={curPwd}
              onChange={(e) => setCurPwd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pwd" className="text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-pwd"
              type="password"
              placeholder="••••••••"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf-pwd" className="text-sm font-medium text-slate-700">
              Confirmer
            </Label>
            <Input
              id="conf-pwd"
              type="password"
              placeholder="••••••••"
              value={confPwd}
              onChange={(e) => setConfPwd(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" disabled={savingPwd}>
              {savingPwd ? "Enregistrement…" : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Préférences de sécurité */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Préférences de sécurité
          </h3>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Déconnexion automatique après 30 min d'inactivité
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Protège votre session en cas d'absence prolongée.
              </p>
            </div>
            <Switch checked={autoLogout} onCheckedChange={setAutoLogout} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Authentification à deux facteurs
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Renforcez la sécurité avec un code temporaire à la connexion.
              </p>
            </div>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function AuditTab() {
  const auditLogs = useStore((s) => s.auditLogs);
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const modules = useMemo(
    () => [...new Set(auditLogs.map((e) => e.module))].sort(),
    [auditLogs],
  );
  const actions = useMemo(
    () => [...new Set(auditLogs.map((e) => e.action))].sort(),
    [auditLogs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return auditLogs.filter((e) => {
      if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (q) {
        const haystack = `${e.user} ${e.module} ${e.action} ${e.detail} ${e.ip}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [auditLogs, query, moduleFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * AUDIT_PAGE_SIZE,
    safePage * AUDIT_PAGE_SIZE,
  );
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * AUDIT_PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * AUDIT_PAGE_SIZE, filtered.length);

  const hasActiveFilters =
    query.trim() !== "" || moduleFilter !== "all" || actionFilter !== "all";

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Journal des actions utilisateurs — connexions, modifications et opérations
        sensibles.
      </p>

      <Card className="p-4 shadow-sm border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher utilisateur, action…"
              className="h-10 pl-9"
              aria-label="Rechercher dans le journal d'audit"
            />
          </div>

          <Select
            value={moduleFilter}
            onValueChange={(v) => {
              setModuleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-48" aria-label="Filtrer par module">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {modules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Filtrer par action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-slate-500"
              onClick={() => {
                setQuery("");
                setModuleFilter("all");
                setActionFilter("all");
                setPage(1);
              }}
            >
              Réinitialiser
            </Button>
          )}

          <p className="ml-auto text-xs tabular-nums text-slate-500">
            {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm border-border/80">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ScrollText className="size-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">
            Journal d&apos;audit
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Aucune entrée ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Date / Heure
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Utilisateur
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 sm:table-cell">
                      Module
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Action
                    </TableHead>
                    <TableHead className="h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Détail
                    </TableHead>
                    <TableHead className="hidden h-10 px-4 text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                      IP
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-border hover:bg-slate-50/60"
                    >
                      <TableCell className="px-4 py-3.5 tabular-nums text-slate-600">
                        {formatDateShort(row.date)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-slate-900">
                        {row.user}
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 sm:table-cell">
                        <ToneBadge tone="slate">{row.module}</ToneBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <ToneBadge tone={actionTone[row.action]}>{row.action}</ToneBadge>
                      </TableCell>
                      <TableCell className="max-w-[280px] px-4 py-3.5 text-sm text-slate-600">
                        <span className="line-clamp-2" title={row.detail}>
                          {row.detail}
                        </span>
                      </TableCell>
                      <TableCell className="hidden px-4 py-3.5 font-mono text-xs text-slate-500 md:table-cell">
                        {row.ip}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs tabular-nums text-slate-500">
                {startIdx}–{endIdx} sur {filtered.length} entrée
                {filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-slate-600">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function PreferencesTab() {
  const { toast } = useToast();
  const resetAll = useStore((s) => s.resetAll);
  const [emailNotif, setEmailNotif] = useState(true);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Personnalisez la langue, les formats et les notifications.
      </p>
      <Card className="p-6 shadow-sm border-border/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast({ title: "Préférences enregistrées" });
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lang" className="text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3.5 text-slate-400" />
                  Langue
                </span>
              </Label>
              <Select defaultValue="fr">
                <SelectTrigger id="lang" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bmb">Bambara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dfmt" className="text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  Format de date
                </span>
              </Label>
              <Select defaultValue="dmy">
                <SelectTrigger id="dfmt" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dmy">JJ/MM/AAAA</SelectItem>
                  <SelectItem value="mdy">MM/JJ/AAAA</SelectItem>
                  <SelectItem value="ymd">AAAA-MM-JJ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cur" className="text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="size-3.5 text-slate-400" />
                  Devise
                </span>
              </Label>
              <Select defaultValue="fcfa">
                <SelectTrigger id="cur" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fcfa">FCFA (XOF)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                  <SelectItem value="usd">Dollar US ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-slate-900 inline-flex items-center gap-1.5">
                <Bell className="size-4 text-slate-400" />
                Notifications par e-mail
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Recevez un message à chaque dossier en attente ou alerte de stock.
              </p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 shadow-sm border-border/80 border-red-200/60">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Réinitialiser les données
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Restaure toutes les données (dossiers, clients, écritures, stock, bons, utilisateurs)
              à leur état initial. Cette action est irréversible.
            </p>
            <Button
              variant="destructive"
              className="mt-3 h-9"
              onClick={() => {
                if (
                  confirm(
                    "Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.",
                  )
                ) {
                  resetAll();
                  toast({
                    title: "Données réinitialisées",
                    description: "Toutes les données ont été restaurées à l'état initial.",
                  });
                }
              }}
            >
              <RotateCcw className="size-4" />
              Réinitialiser les données
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MAIN SCREEN                                                          */
/* ------------------------------------------------------------------ */

function UsersTabBadge() {
  const count = useStore((s) => s.users.length);
  return (
    <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
      {count}
    </span>
  );
}

export function ParametresScreen() {
  const currentRole = useNav((s) => s.currentRole);
  const isAdmin = currentRole === "Administrateur";
  const [active, setActive] = useState<ParamTab>("profile");

  // Corrige le tab actif lors du premier render post-hydratation (currentRole arrive en retard depuis Zustand).
  // Pattern "adjust state during rendering" pour éviter un rendu en cascade lié à useEffect.
  const [prevIsAdmin, setPrevIsAdmin] = useState(isAdmin);
  if (isAdmin !== prevIsAdmin) {
    setPrevIsAdmin(isAdmin);
    if (isAdmin) {
      setActive((prev) => (prev === "profile" ? "users" : prev));
    } else {
      setActive((prev) => (prev === "users" || prev === "audit" ? "profile" : prev));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, les utilisateurs et les préférences de l'application."
      />

      <Tabs
        value={active}
        onValueChange={(v) => setActive(v as ParamTab)}
        className="gap-0"
      >
        {/* Barre d'onglets pleine largeur (alignée sur les bords du layout) */}
        <div
          className={cn(
            "sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8",
            "supports-[backdrop-filter]:bg-background/80",
          )}
        >
          <TabsList
            className={cn(
              "flex h-12 w-full items-stretch rounded-none bg-slate-50/80 p-0",
              "dark:bg-muted/30",
            )}
          >
            {tabs.filter((t) => (t.key !== "users" && t.key !== "audit") || isAdmin).map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className={cn(
                    "relative flex flex-1 items-center justify-center gap-2 rounded-none",
                    "border-0 border-b-2 border-transparent bg-transparent px-2 py-0",
                    "text-sm font-medium text-slate-500 shadow-none transition-colors",
                    "hover:bg-white/60 hover:text-slate-900",
                    "data-[state=active]:border-primary data-[state=active]:bg-white",
                    "data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "[&[data-state=active]_svg]:text-primary",
                    "min-w-0",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-slate-400" />
                  <span className="hidden truncate sm:inline">{t.label}</span>
                  <span className="truncate sm:hidden">{t.shortLabel}</span>
                  {t.key === "users" && <UsersTabBadge />}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {isAdmin && (
          <TabsContent value="users" className="mt-6 focus-visible:outline-none">
            <UsersTab />
          </TabsContent>
        )}
        <TabsContent value="profile" className="mt-6 focus-visible:outline-none">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security" className="mt-6 focus-visible:outline-none">
          <SecurityTab />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="audit" className="mt-6 focus-visible:outline-none">
            <AuditTab />
          </TabsContent>
        )}
        <TabsContent value="preferences" className="mt-6 focus-visible:outline-none">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
