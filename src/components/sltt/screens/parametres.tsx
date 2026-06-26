"use client";

import { useState } from "react";
import {
  UserPlus,
  Pencil,
  MoreHorizontal,
  Shield,
  Lock,
  KeyRound,
  RefreshCw,
  Bell,
  Globe,
  Calendar,
  Coins,
  Users,
  User,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { UserInput, UserRole } from "@/lib/store";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ParamTab = "users" | "profile" | "security" | "preferences";

const tabs: { key: ParamTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "users", label: "Utilisateurs & rôles", icon: Users },
  { key: "profile", label: "Mon profil", icon: User },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "preferences", label: "Préférences", icon: Globe },
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

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "?";
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
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

  const [sheetOpen, setSheetOpen] = useState(false);
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
    setEditPerms({
      Dossiers: true,
      Comptabilité: false,
      Stock: false,
      "Bons de sortie": false,
      Clients: true,
      Rapports: false,
    });
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
    };
    addUser(input);
    toast({ title: "Utilisateur créé avec succès" });
    setSheetOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Utilisateurs</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gérez les comptes, rôles et permissions de l'équipe.
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
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
                      className="size-8 text-slate-500 hover:text-primary"
                      aria-label="Plus d'options"
                      title="Plus d'options"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add user sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">Nouvel utilisateur</SheetTitle>
            <SheetDescription>
              Créez un compte et définissez ses permissions.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-5 px-4 py-2 overflow-y-auto"
          >
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
                Code d'accès
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
                Code à 6 caractères, communiquez-le à l'utilisateur.
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
          </form>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </SheetClose>
            <Button type="button" onClick={handleSubmit}>
              Créer le compte
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription className="sr-only">
              Modifiez le nom, l'e-mail et le rôle de l'utilisateur.
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mon profil</h2>
        <p className="mt-1 text-sm text-slate-500">
          Vos informations personnelles et professionnelles.
        </p>
      </div>
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
              AT
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
  const [autoLogout, setAutoLogout] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");

  const loginLog = [
    { date: "2026-01-09T08:12:00", user: "Amadou Traoré", ip: "41.202.18.45", device: "Chrome · Windows" },
    { date: "2026-01-08T17:40:00", user: "Fatoumata Diallo", ip: "41.202.18.50", device: "Firefox · macOS" },
    { date: "2026-01-09T09:05:00", user: "Ibrahim Keïta", ip: "154.66.12.7", device: "Safari · iPhone" },
    { date: "2026-01-07T16:20:00", user: "Oumar Cissé", ip: "41.202.18.61", device: "Chrome · Android" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sécurité</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mot de passe, authentification et historique de connexion.
        </p>
      </div>

      {/* Mot de passe */}
      <Card className="p-6 shadow-sm border-border/80">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Mot de passe</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPwd) {
              toast({
                title: "Veuillez saisir un nouveau mot de passe",
                variant: "destructive",
              });
              return;
            }
            if (newPwd !== confPwd) {
              toast({
                title: "Les mots de passe ne correspondent pas",
                variant: "destructive",
              });
              return;
            }
            toast({ title: "Mot de passe mis à jour" });
            setCurPwd("");
            setNewPwd("");
            setConfPwd("");
          }}
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
            <Button type="submit">Mettre à jour</Button>
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

      {/* Journal des connexions */}
      <Card className="p-0 shadow-sm border-border/80 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <KeyRound className="size-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            Journal des connexions
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-border">
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Date
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Utilisateur
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Adresse IP
              </TableHead>
              <TableHead className="text-xs font-medium uppercase text-slate-500">
                Appareil
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loginLog.map((row, i) => (
              <TableRow
                key={i}
                className="hover:bg-slate-50/60 border-b border-border"
              >
                <TableCell className="py-3 text-slate-600 tabular-nums">
                  {formatDateShort(row.date)}
                </TableCell>
                <TableCell className="py-3 font-medium text-slate-900">
                  {row.user}
                </TableCell>
                <TableCell className="py-3 text-slate-600 font-mono text-xs">
                  {row.ip}
                </TableCell>
                <TableCell className="py-3 text-slate-600">{row.device}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PreferencesTab() {
  const { toast } = useToast();
  const resetAll = useStore((s) => s.resetAll);
  const [emailNotif, setEmailNotif] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Préférences</h2>
        <p className="mt-1 text-sm text-slate-500">
          Personnalisez la langue, les formats et les notifications.
        </p>
      </div>
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

export function ParametresScreen() {
  const [active, setActive] = useState<ParamTab>("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez votre compte, les utilisateurs et les préférences de l'application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left sidebar */}
        <Card className="p-2 shadow-sm border-border/80 lg:col-span-1 h-fit">
          <nav className="flex flex-col gap-1">
            {tabs.map((t) => {
              const isActive = active === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left",
                    isActive
                      ? "bg-sidebar-accent text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-primary" : "text-slate-400",
                    )}
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Right content */}
        <div className="lg:col-span-3">
          {active === "users" && <UsersTab />}
          {active === "profile" && <ProfileTab />}
          {active === "security" && <SecurityTab />}
          {active === "preferences" && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
