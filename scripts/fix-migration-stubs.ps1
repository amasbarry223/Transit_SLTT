# Fix migration stubs and create component barrel files
$root = "C:\Users\cisse\Bureau\Transit_SLTT\src"

$screenExports = @{
  "archives.tsx" = "ArchivesScreen"
  "bilans.tsx" = "BilansScreen"
  "bons.tsx" = "BonsScreen"
  "calendrier.tsx" = "CalendrierScreen"
  "comptabilite.tsx" = "ComptabiliteScreen"
  "contrat-detail.tsx" = "ContratDetailScreen"
  "contrats.tsx" = "ContratsScreen"
  "dashboard.tsx" = "DashboardScreen"
  "dossier-detail.tsx" = "DossierDetailScreen"
  "dossier-form.tsx" = "DossierFormScreen"
  "dossiers-list.tsx" = "DossiersListScreen"
  "entreposage.tsx" = "EntreposageScreen"
  "facture-detail.tsx" = "FactureDetailScreen"
  "factures.tsx" = "FacturesScreen"
  "fournisseurs.tsx" = "FournisseursScreen"
  "login.tsx" = "LoginScreen"
  "parametres.tsx" = "ParametresScreen"
  "recus-paiement.tsx" = "RecusPaiementScreen"
  "supabase-required.tsx" = "SupabaseRequiredScreen"
  "transporteurs.tsx" = "TransporteursScreen"
}

$featureByScreen = @{
  "archives.tsx" = "archives"
  "bilans.tsx" = "bilans"
  "bons.tsx" = "bons"
  "calendrier.tsx" = "calendrier"
  "comptabilite.tsx" = "comptabilite"
  "contrat-detail.tsx" = "contrats"
  "contrats.tsx" = "contrats"
  "dashboard.tsx" = "dashboard"
  "dossier-detail.tsx" = "dossiers"
  "dossier-form.tsx" = "dossiers"
  "dossiers-list.tsx" = "dossiers"
  "entreposage.tsx" = "entreposage"
  "facture-detail.tsx" = "factures"
  "factures.tsx" = "factures"
  "fournisseurs.tsx" = "fournisseurs"
  "login.tsx" = "auth"
  "parametres.tsx" = "parametres"
  "recus-paiement.tsx" = "recus-paiement"
  "supabase-required.tsx" = "auth"
  "transporteurs.tsx" = "transporteurs"
}

foreach ($entry in $screenExports.GetEnumerator()) {
  $screen = $entry.Key
  $exportName = $entry.Value
  $feature = $featureByScreen[$screen]
  $stub = "/** @deprecated Import from ``@/features/$feature`` instead. */`nexport { $exportName } from `"@/features/$feature`";"
  Set-Content -Path (Join-Path $root "components/sltt/screens/$screen") -Value $stub -Encoding UTF8
}

Get-ChildItem -Path (Join-Path $root "features") -Directory | ForEach-Object {
  $featureName = $_.Name
  $componentsPath = Join-Path $_.FullName "components"
  if (-not (Test-Path $componentsPath)) { return }

  Get-ChildItem -Path $componentsPath -Directory | ForEach-Object {
    $subfolder = $_.Name
    $files = Get-ChildItem -Path $_.FullName -Filter "*.tsx" -File
    if ($files.Count -eq 0) { return }

    $lines = $files | ForEach-Object {
      $base = $_.BaseName
      $pascal = ($base -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ''
      "export * from `"./$base`";"
    }
    $indexPath = Join-Path $_.FullName "index.ts"
    Set-Content -Path $indexPath -Value (($lines -join "`n") + "`n") -Encoding UTF8

    $oldIndex = Join-Path $root "components/sltt/$subfolder/index.ts"
    if (Test-Path (Join-Path $root "components/sltt/$subfolder")) {
      $stub = "/** @deprecated Import from ``@/features/$featureName/components/$subfolder`` instead. */`nexport * from `"@/features/$featureName/components/$subfolder`";"
      Set-Content -Path $oldIndex -Value $stub -Encoding UTF8
    }
  }
}

Write-Host "Fixed stubs and barrels."
