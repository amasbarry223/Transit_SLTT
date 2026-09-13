# Bulk feature migration script
$root = "C:\Users\cisse\Bureau\Transit_SLTT\src"

$migrations = @(
  @{
    Name = "contrats"
    Dirs = @("components/sltt/contrat-detail")
    Screens = @("contrats.tsx", "contrat-detail.tsx")
    Exports = @("ContratsScreen", "ContratDetailScreen")
  },
  @{
    Name = "fournisseurs"
    Dirs = @("components/sltt/fournisseurs")
    Screens = @("fournisseurs.tsx")
    Exports = @("FournisseursScreen")
  },
  @{
    Name = "factures"
    Dirs = @("components/sltt/factures", "components/sltt/facture-detail")
    Screens = @("factures.tsx", "facture-detail.tsx")
    Exports = @("FacturesScreen", "FactureDetailScreen")
  },
  @{
    Name = "bons"
    Dirs = @("components/sltt/bons")
    Screens = @("bons.tsx")
    Exports = @("BonsScreen")
  },
  @{
    Name = "dossiers"
    Dirs = @("components/sltt/dossier-form", "components/sltt/dossiers-list")
    Screens = @("dossiers-list.tsx", "dossier-form.tsx", "dossier-detail.tsx")
    Exports = @("DossiersListScreen", "DossierFormScreen", "DossierDetailScreen")
  },
  @{
    Name = "entreposage"
    Dirs = @("components/sltt/entreposage")
    Screens = @("entreposage.tsx")
    Exports = @("EntreposageScreen")
  },
  @{
    Name = "comptabilite"
    Dirs = @("components/sltt/comptabilite", "components/sltt/comptabilite-generale")
    Screens = @("comptabilite.tsx")
    Exports = @("ComptabiliteScreen")
  },
  @{
    Name = "archives"
    Dirs = @("components/sltt/archives")
    Screens = @("archives.tsx")
    Exports = @("ArchivesScreen")
  },
  @{
    Name = "recus-paiement"
    Dirs = @("components/sltt/recus-paiement")
    Screens = @("recus-paiement.tsx")
    Exports = @("RecusPaiementScreen")
  },
  @{
    Name = "parametres"
    Dirs = @("components/sltt/parametres")
    Screens = @("parametres.tsx")
    Exports = @("ParametresScreen")
  },
  @{
    Name = "dashboard"
    Dirs = @("components/sltt/dashboard")
    Screens = @("dashboard.tsx")
    Exports = @("DashboardScreen")
  },
  @{
    Name = "auth"
    Dirs = @()
    Screens = @("login.tsx", "supabase-required.tsx")
    Exports = @("LoginScreen", "SupabaseRequiredScreen")
  },
  @{
    Name = "calendrier"
    Dirs = @()
    Screens = @("calendrier.tsx")
    Exports = @("CalendrierScreen")
  },
  @{
    Name = "bilans"
    Dirs = @()
    Screens = @("bilans.tsx")
    Exports = @("BilansScreen")
  },
  @{
    Name = "transporteurs"
    Dirs = @()
    Screens = @("transporteurs.tsx")
    Exports = @("TransporteursScreen")
  }
)

foreach ($m in $migrations) {
  $featurePath = Join-Path $root "features\$($m.Name)"
  $componentsPath = Join-Path $featurePath "components"
  New-Item -ItemType Directory -Force -Path $componentsPath | Out-Null

  foreach ($dir in $m.Dirs) {
    $src = Join-Path $root $dir
    if (Test-Path $src) {
      $folderName = Split-Path $src -Leaf
      Copy-Item $src (Join-Path $componentsPath $folderName) -Recurse -Force
    }
  }

  foreach ($screen in $m.Screens) {
    $src = Join-Path $root "components/sltt/screens/$screen"
    if (Test-Path $src) {
      $baseName = [System.IO.Path]::GetFileNameWithoutExtension($screen)
      $destName = if ($baseName -eq "dossiers-list") { "dossiers-list-screen.tsx" }
                  elseif ($baseName -eq "dossier-form") { "dossier-form-screen.tsx" }
                  elseif ($baseName -eq "dossier-detail") { "dossier-detail-screen.tsx" }
                  elseif ($baseName -eq "recus-paiement") { "recus-paiement-screen.tsx" }
                  elseif ($baseName -eq "supabase-required") { "supabase-required-screen.tsx" }
                  else { "$baseName-screen.tsx" }
      Copy-Item $src (Join-Path $componentsPath $destName) -Force
    }
  }

  $exportLines = $m.Exports | ForEach-Object {
    $screenFile = switch -Regex ($_) {
      "ContratsScreen" { "./components/contrats-screen" }
      "ContratDetailScreen" { "./components/contrat-detail-screen" }
      "FournisseursScreen" { "./components/fournisseurs-screen" }
      "FacturesScreen" { "./components/factures-screen" }
      "FactureDetailScreen" { "./components/facture-detail-screen" }
      "BonsScreen" { "./components/bons-screen" }
      "DossiersListScreen" { "./components/dossiers-list-screen" }
      "DossierFormScreen" { "./components/dossier-form-screen" }
      "DossierDetailScreen" { "./components/dossier-detail-screen" }
      "EntreposageScreen" { "./components/entreposage-screen" }
      "ComptabiliteScreen" { "./components/comptabilite-screen" }
      "ArchivesScreen" { "./components/archives-screen" }
      "RecusPaiementScreen" { "./components/recus-paiement-screen" }
      "ParametresScreen" { "./components/parametres-screen" }
      "DashboardScreen" { "./components/dashboard-screen" }
      "LoginScreen" { "./components/login-screen" }
      "SupabaseRequiredScreen" { "./components/supabase-required-screen" }
      "CalendrierScreen" { "./components/calendrier-screen" }
      "BilansScreen" { "./components/bilans-screen" }
      "TransporteursScreen" { "./components/transporteurs-screen" }
      default { "./components" }
    }
    "export { $_ } from `"$screenFile`";"
  }

  $indexContent = ($exportLines -join "`n") + "`n"
  Set-Content -Path (Join-Path $featurePath "index.ts") -Value $indexContent -Encoding UTF8

  foreach ($screen in $m.Screens) {
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($screen)
    $exportName = switch ($baseName) {
      "dossiers-list" { "DossiersListScreen" }
      "dossier-form" { "DossierFormScreen" }
      "dossier-detail" { "DossierDetailScreen" }
      "recus-paiement" { "RecusPaiementScreen" }
      "supabase-required" { "SupabaseRequiredScreen" }
      default {
        $parts = $baseName -split '-'
        ($parts | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join '' + "Screen"
      }
    }
    $stub = "/** @deprecated Import from ``@/features/$($m.Name)`` instead. */`nexport { $exportName } from `"@/features/$($m.Name)`";"
    Set-Content -Path (Join-Path $root "components/sltt/screens/$screen") -Value $stub -Encoding UTF8
  }

  foreach ($dir in $m.Dirs) {
    $folderName = Split-Path (Join-Path $root $dir) -Leaf
    $oldIndex = Join-Path $root "components/sltt/$folderName/index.ts"
    $oldFolder = Join-Path $root "components/sltt/$folderName"
    if (Test-Path $oldFolder) {
      $stub = "/** @deprecated Import from ``@/features/$($m.Name)`` instead. */`nexport * from `"@/features/$($m.Name)/components/$folderName`";"
      Set-Content -Path $oldIndex -Value $stub -Encoding UTF8 -ErrorAction SilentlyContinue
      if (-not (Test-Path $oldIndex)) {
        New-Item -ItemType Directory -Force -Path (Split-Path $oldIndex) | Out-Null
        Set-Content -Path $oldIndex -Value $stub -Encoding UTF8
      }
    }
  }

  Write-Host "Migrated feature: $($m.Name)"
}

Write-Host "Done."
