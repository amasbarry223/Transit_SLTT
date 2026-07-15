-- =====================================================================
-- JEU DE DONNEES INITIAL (SEED DATA) POUR TRANSIT SLTT (SUPABASE)
-- =====================================================================
-- Ce fichier contient des requêtes d'insertion pour pré-remplir les tables
-- avec les données de démonstration du frontend de l'application.
-- Projet Supabase ID : qhpmegadoumarppmdbfn
-- =====================================================================

-- Début de transaction pour garantir la cohérence
BEGIN;

-- 1. INSCRIPTION DES UTILISATEURS DANS LE SCHÉMA D'AUTHENTIFICATION DE SUPABASE
-- Note : Ces lignes insèrent des comptes utilisateurs d'exemple dans auth.users.
-- Les mots de passe ne sont pas stockés directement en clair.
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone,
  phone_confirmed_at,
  phone_change,
  reauthentication_token,
  email_change_token_current,
  is_sso_user,
  is_anonymous
)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'amadou.traore@sltt.ml', extensions.crypt('sltt2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Amadou Traoré", "role": "Administrateur"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'fatoumata.diallo@sltt.ml', extensions.crypt('compta2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Fatoumata Diallo", "role": "Comptable"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'ibrahim.keita@sltt.ml', extensions.crypt('transit2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Ibrahim Keïta", "role": "Agent de transit"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'oumar.cisse@sltt.ml', extensions.crypt('stock2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Oumar Cissé", "role": "Magasinier"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'aminata.sangare@sltt.ml', extensions.crypt('commercial2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Aminata Sangaré", "role": "Commercial"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'modybarry50@gmail.com', extensions.crypt('Transit@2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Mody Barry", "role": "Administrateur"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'mohammedtraore301@gmail.com', extensions.crypt('Transit@2026', extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"nom": "Mohammed Traoré", "role": "Administrateur"}', 'authenticated', 'authenticated', now(), now(), '', '', '', '', null, null, '', '', '', false, false)
ON CONFLICT (id) DO NOTHING;

-- Les profils correspondants dans public.profiles sont créés automatiquement par le trigger `on_auth_user_created`.
-- Nous mettons à jour leurs permissions spécifiques et statuts :
UPDATE public.profiles SET permissions = ARRAY['dossiers:read', 'dossiers:write', 'dossiers:transition', 'comptabilite:read', 'comptabilite:write', 'clients:read', 'clients:write', 'stock:read', 'stock:write', 'bons:read', 'bons:write', 'parametres:read', 'parametres:write', 'rapports:read'] WHERE email IN ('amadou.traore@sltt.ml', 'modybarry50@gmail.com', 'mohammedtraore301@gmail.com');
UPDATE public.profiles SET permissions = ARRAY['dossiers:read', 'comptabilite:read', 'comptabilite:write', 'clients:read', 'rapports:read'] WHERE email = 'fatoumata.diallo@sltt.ml';
UPDATE public.profiles SET permissions = ARRAY['dossiers:read', 'dossiers:write', 'dossiers:transition', 'clients:read'] WHERE email = 'ibrahim.keita@sltt.ml';
UPDATE public.profiles SET permissions = ARRAY['stock:read', 'stock:write', 'bons:read', 'bons:write'] WHERE email = 'oumar.cisse@sltt.ml';
UPDATE public.profiles SET permissions = ARRAY['clients:read', 'clients:write', 'bons:read', 'dossiers:read'], actif = false WHERE email = 'aminata.sangare@sltt.ml';


-- 2. INSERTION DES CLIENTS
INSERT INTO public.clients (id, nom, type, telephone, email, adresse)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'Société des Établissements Diallo', 'Entreprise', '+223 76 12 34 56', 'contact@diallo-sa.ml', 'Av. de l''Indépendance, Bamako'),
  ('c0000000-0000-0000-0000-000000000002', 'Traoré & Frères Commerce', 'Entreprise', '+223 65 98 76 54', 'traorefreres@gmail.com', 'Rue 30, Hamdallaye, Bamako'),
  ('c0000000-0000-0000-0000-000000000003', 'Aïssata Koné', 'Particulier', '+223 90 11 22 33', 'aissata.kone@orange.ml', 'Magnambougou, Bamako'),
  ('c0000000-0000-0000-0000-000000000004', 'Groupe Keïta Distribution', 'Entreprise', '+223 78 44 55 66', 'direction@keita-group.ml', 'Zone Industrielle, Ségou'),
  ('c0000000-0000-0000-0000-000000000005', 'Boutique Cissé Import', 'Entreprise', '+223 67 77 88 99', 'cisse.import@gmail.com', 'Marché Médine, Bamako'),
  ('c0000000-0000-0000-0000-000000000006', 'Moussa Diarra', 'Particulier', '+223 91 23 45 67', 'moussa.diarra@yahoo.fr', 'Kalaban Coura, Bamako'),
  ('c0000000-0000-0000-0000-000000000007', 'Sahel Agro Industries', 'Entreprise', '+223 80 00 11 22', 'contact@sahelagro.ml', 'Route de Koulikoro, Bamako')
ON CONFLICT (id) DO NOTHING;


-- 3. INSERTION DES FOURNISSEURS / SOUS-TRAITANTS
INSERT INTO public.fournisseurs (id, nom, type, contact, telephone, email, adresse, tarif_contractuel, statut)
VALUES 
  ('f0000000-0000-0000-0000-000000000001', 'Trans-Sahel Transport', 'Transporteur', 'Moussa Konaté', '+223 76 12 34 56', 'konat.moussa@transsahel.ml', 'Zone Industrielle, Bamako', 350000, 'Actif'),
  ('f0000000-0000-0000-0000-000000000002', 'Douane Conseil Mali', 'Commissionnaire en douane', 'Aminata Coulibaly', '+223 66 98 76 54', 'a.coulibaly@douanemali.ml', 'Près de la Direction des Douanes, Bamako', 200000, 'Actif'),
  ('f0000000-0000-0000-0000-000000000003', 'Manutention Express', 'Manutentionnaire', 'Ibrahim Dembélé', '+223 65 44 22 11', 'contact@manut-express.ml', 'Port Sec de Bamako', 120000, 'Actif'),
  ('f0000000-0000-0000-0000-000000000004', 'Location Camions Mali', 'Loueur', 'Seydou Traoré', '+223 75 33 11 99', 's.traore@loccam.ml', 'Route de Koulikoro, Bamako', 180000, 'Actif'),
  ('f0000000-0000-0000-0000-000000000005', 'Gestion Entrepôts SA', 'Manutentionnaire', 'Fatoumata Sissoko', '+223 79 55 66 77', 'f.sissoko@gesamali.ml', 'Zone Industrielle de Sotuba', 90000, 'Inactif')
ON CONFLICT (id) DO NOTHING;


-- 4. INSERTION DES DOSSIERS DE TRANSIT
INSERT INTO public.dossiers (id, reference, client_id, bl, camion, nature, droit_douane, frais_circuit, frais_prestation, montant_investi, montant_paye, statut, date, date_echeance, date_dedouanement, mode_transport, no_conteneur, port_entree, poids_total, notes)
VALUES 
  ('d0000000-0000-0000-0000-000000000042', 'SLTT-TR-2026-0042', 'c0000000-0000-0000-0000-000000000001', 'BL-7821', 'RJ 4521 KM', 'Matériel électronique', 1200000, 450000, 850000, 2500000, 1800000, 'En cours', '2026-01-08', '2026-01-12', NULL, 'Maritime', 'MSCU4521789', 'Port de Dakar', 12500, 'Conteneur 40 pieds, dédouanement en cours.'),
  ('d0000000-0000-0000-0000-000000000041', 'SLTT-TR-2026-0041', 'c0000000-0000-0000-0000-000000000004', 'BL-7790', 'KN 8890 PQ', 'Sacs de ciment', 980000, 320000, 600000, 1900000, 1900000, 'Soldé', '2026-01-05', '2026-01-10', '2026-01-08', 'Maritime', 'TRKU8890123', 'Port de Dakar', 24000, 'Livraison terminée.'),
  ('d0000000-0000-0000-0000-000000000040', 'SLTT-TR-2026-0040', 'c0000000-0000-0000-0000-000000000002', 'BL-7765', 'LM 3344 RT', 'Pièces automobiles', 1500000, 500000, 900000, 2900000, 2200000, 'Dédouané', '2026-01-03', '2026-01-11', '2026-01-10', 'Routier', NULL, 'Frontière Mali-Côte d''Ivoire', 8200, 'Camion en transit vers l''entrepôt.'),
  ('d0000000-0000-0000-0000-000000000039', 'SLTT-TR-2026-0039', 'c0000000-0000-0000-0000-000000000005', 'BL-7740', 'OP 1199 MN', 'Textiles & vêtements', 600000, 200000, 350000, 1150000, 800000, 'Livré', '2026-01-02', '2026-01-09', '2026-01-06', 'Routier', NULL, 'Frontière Sénégal-Mali', 5400, 'Livraison effectuée avec succès.'),
  ('d0000000-0000-0000-0000-000000000038', 'SLTT-TR-2026-0038', 'c0000000-0000-0000-0000-000000000007', 'BL-7712', 'QR 5566 ST', 'Équipements agricoles', 2100000, 700000, 1200000, 4000000, 4000000, 'Soldé', '2025-12-28', '2026-01-05', '2026-01-04', 'Maritime', 'MSCU9900223', 'Port de Dakar', 18500, NULL),
  ('d0000000-0000-0000-0000-000000000037', 'SLTT-TR-2026-0037', 'c0000000-0000-0000-0000-000000000003', 'BL-7688', 'UV 2233 WX', 'Électroménager', 450000, 150000, 300000, 900000, 900000, 'Soldé', '2025-12-22', '2025-12-29', '2025-12-27', 'Maritime', 'MSCU1122334', 'Port de Dakar', 3200, NULL),
  ('d0000000-0000-0000-0000-000000000036', 'SLTT-TR-2026-0036', 'c0000000-0000-0000-0000-000000000001', 'BL-7655', 'RJ 4521 KM', 'Conserves alimentaires', 880000, 280000, 520000, 1680000, 1300000, 'En cours', '2025-12-18', '2025-12-25', NULL, 'Maritime', 'MSCU6655778', 'Port de Dakar', 15000, 'En attente de documents complémentaires.'),
  ('d0000000-0000-0000-0000-000000000035', 'SLTT-TR-2026-0035', 'c0000000-0000-0000-0000-000000000004', 'BL-7621', 'KN 8890 PQ', 'Carburant & lubrifiants', 1750000, 560000, 980000, 3290000, 2900000, 'Dédouané', '2025-12-15', '2025-12-22', '2025-12-20', 'Routier', NULL, 'Frontière Mali-Côte d''Ivoire', 32000, NULL),
  ('d0000000-0000-0000-0000-000000000034', 'SLTT-TR-2026-0034', 'c0000000-0000-0000-0000-000000000002', 'BL-7599', 'LM 3344 RT', 'Matériel informatique', 1320000, 410000, 720000, 2450000, 2450000, 'Soldé', '2025-12-10', '2025-12-17', '2025-12-15', 'Maritime', 'MSCU5566778', 'Port de Dakar', 4500, NULL),
  ('d0000000-0000-0000-0000-000000000033', 'SLTT-TR-2026-0033', 'c0000000-0000-0000-0000-000000000006', 'BL-7570', 'YZ 7788 AB', 'Mobilier domestique', 380000, 120000, 280000, 780000, 780000, 'Soldé', '2025-12-05', '2025-12-12', '2025-12-10', 'Maritime', 'MSCU1122445', 'Port de Dakar', 2800, NULL)
ON CONFLICT (id) DO NOTHING;


-- 5. INSERTION DES DEVIS
INSERT INTO public.devis (id, reference, client_id, nature, droit_douane, frais_circuit, frais_prestation, total, statut, date_creation, date_validite, notes)
VALUES 
  ('e0000000-0000-0000-0000-000000000001', 'DEVIS-2026-0001', 'c0000000-0000-0000-0000-000000000001', 'Matériaux de construction (acier, ciment)', 1200000, 450000, 320000, 1970000, 'Envoyé', '2026-01-05', '2026-02-05', 'Lot de 20 conteneurs — port de Dakar via Bamako'),
  ('e0000000-0000-0000-0000-000000000002', 'DEVIS-2026-0002', 'c0000000-0000-0000-0000-000000000004', 'Équipements agricoles', 850000, 310000, 195000, 1355000, 'Accepté', '2025-12-20', '2026-01-20', NULL),
  ('e0000000-0000-0000-0000-000000000003', 'DEVIS-2026-0003', 'c0000000-0000-0000-0000-000000000002', 'Produits alimentaires (riz, sucre)', 620000, 230000, 145000, 995000, 'Brouillon', '2026-01-08', '2026-02-08', NULL)
ON CONFLICT (id) DO NOTHING;


-- 6. INSERTION DES SERVICES DE SOUS-TRAITANTS LIÉS AUX DOSSIERS
INSERT INTO public.dossier_fournisseurs (id, dossier_id, fournisseur_id, description, montant_budgete, montant_reel, statut, date)
VALUES 
  ('df000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000001', 'Transport Dakar → Bamako', 400000, 380000, 'En attente', '2026-01-08'),
  ('df000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000002', 'Assistance dédouanement matériel électronique', 200000, 200000, 'Payé', '2026-01-09'),
  ('df000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000001', 'Transport pièces automobiles', 350000, 370000, 'Payé', '2026-01-04'),
  ('df000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000003', 'Déchargement et mise en entrepôt', 120000, 115000, 'Payé', '2026-01-05')
ON CONFLICT (id) DO NOTHING;


-- 7. INSERTION DES ECRITURES COMPTABLES
INSERT INTO public.ecritures (id, date, date_paiement, client_id, dossier_id, montant_investi, montant_paye, mode_paiement, note)
VALUES 
  ('ec000000-0000-0000-0000-000000001001', '2026-01-08', NULL, 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000042', 2500000, 1800000, 'Virement', 'Acompte dossier SLTT-TR-2026-0042'),
  ('ec000000-0000-0000-0000-000000001000', '2026-01-05', '2026-01-05', 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000041', 1900000, 1900000, 'Virement', 'Solde dossier SLTT-TR-2026-0041'),
  ('ec000000-0000-0000-0000-000000000999', '2026-01-03', NULL, 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000040', 2900000, 2200000, 'Mobile Money', 'Acompte dossier SLTT-TR-2026-0040'),
  ('ec000000-0000-0000-0000-000000000998', '2026-01-02', NULL, 'c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000039', 1150000, 800000, 'Espèces', 'Acompte dossier SLTT-TR-2026-0039'),
  ('ec000000-0000-0000-0000-000000000997', '2025-12-28', '2025-12-28', 'c0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000038', 4000000, 4000000, 'Virement', 'Solde dossier SLTT-TR-2026-0038'),
  ('ec000000-0000-0000-0000-000000000996', '2025-12-22', '2025-12-22', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000037', 900000, 900000, 'Mobile Money', 'Solde dossier SLTT-TR-2026-0037'),
  ('ec000000-0000-0000-0000-000000000995', '2025-12-18', NULL, 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000036', 1680000, 1300000, 'Chèque', 'Acompte dossier SLTT-TR-2026-0036'),
  ('ec000000-0000-0000-0000-000000000994', '2025-12-15', NULL, 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000035', 3290000, 2900000, 'Virement', 'Acompte dossier SLTT-TR-2026-0035')
ON CONFLICT (id) DO NOTHING;


-- 8. INSERTION DES ARTICLES DE STOCK
INSERT INTO public.stock_items (id, marchandise, quantite, unite, seuil, depositaire, commercial, somme_payee, reste_a_payer)
VALUES 
  ('55000000-0000-0000-0000-000000000001', 'Sacs de ciment 50kg', 420, 'sacs', 100, 'Entrepôt A — Bamako', 'Amadou Traoré', 3500000, 500000),
  ('55000000-0000-0000-0000-000000000002', 'Riz parfumé 25kg', 65, 'sacs', 80, 'Entrepôt B — Bamako', 'Fatoumata Diallo', 2200000, 0),
  ('55000000-0000-0000-0000-000000000003', 'Huile végétale 20L', 180, 'bidons', 60, 'Entrepôt A — Bamako', 'Amadou Traoré', 1800000, 300000),
  ('55000000-0000-0000-0000-000000000004', 'Pièces automobiles diverses', 28, 'lots', 40, 'Entrepôt C — Ségou', 'Ibrahim Keïta', 4600000, 1200000),
  ('55000000-0000-0000-0000-000000000005', 'Matériel électronique', 95, 'unités', 50, 'Entrepôt A — Bamako', 'Fatoumata Diallo', 5300000, 0),
  ('55000000-0000-0000-0000-000000000006', 'Textiles & vêtements', 32, 'balles', 50, 'Entrepôt B — Bamako', 'Ibrahim Keïta', 1950000, 200000),
  ('55000000-0000-0000-0000-000000000007', 'Conserves alimentaires', 540, 'cartons', 150, 'Entrepôt A — Bamako', 'Amadou Traoré', 2850000, 1000000)
ON CONFLICT (id) DO NOTHING;


-- 9. INSERTION DES MOUVEMENTS DE STOCK
INSERT INTO public.mouvements (id, date, type, stock_id, marchandise, quantite, unite, responsable, bon_ref)
VALUES 
  ('99000000-0000-0000-0000-000000000021', '2026-01-09 10:00:00+00', 'Sortie', '55000000-0000-0000-0000-000000000001', 'Sacs de ciment 50kg', 80, 'sacs', 'Oumar Cissé', 'BS-2026-0051'),
  ('99000000-0000-0000-0000-000000000020', '2026-01-08 14:30:00+00', 'Entrée', '55000000-0000-0000-0000-000000000005', 'Matériel électronique', 120, 'unités', 'Oumar Cissé', '—'),
  ('99000000-0000-0000-0000-000000000019', '2026-01-07 09:15:00+00', 'Sortie', '55000000-0000-0000-0000-000000000003', 'Huile végétale 20L', 30, 'bidons', 'Oumar Cissé', 'BS-2026-0050'),
  ('99000000-0000-0000-0000-000000000018', '2026-01-05 11:00:00+00', 'Entrée', '55000000-0000-0000-0000-000000000007', 'Conserves alimentaires', 200, 'cartons', 'Oumar Cissé', NULL),
  ('99000000-0000-0000-0000-000000000017', '2026-01-03 16:45:00+00', 'Sortie', '55000000-0000-0000-0000-000000000006', 'Textiles & vêtements', 18, 'balles', 'Oumar Cissé', 'BS-2026-0049'),
  ('99000000-0000-0000-0000-000000000016', '2025-12-30 08:30:00+00', 'Entrée', '55000000-0000-0000-0000-000000000004', 'Pièces automobiles diverses', 45, 'lots', 'Oumar Cissé', NULL),
  ('99000000-0000-0000-0000-000000000015', '2025-12-28 10:20:00+00', 'Sortie', '55000000-0000-0000-0000-000000000002', 'Riz parfumé 25kg', 35, 'sacs', 'Oumar Cissé', 'BS-2026-0048')
ON CONFLICT (id) DO NOTHING;


-- 10. INSERTION DES BONS DE SORTIE
INSERT INTO public.bons_sortie (id, reference, date, client_id, stock_id, marchandise, quantite, unite, motif, montant, statut)
VALUES 
  ('b0000000-0000-0000-0000-000000000051', 'BS-2026-0051', '2026-01-09', 'c0000000-0000-0000-0000-000000000004', '55000000-0000-0000-0000-000000000001', 'Sacs de ciment 50kg', 80, 'sacs', 'Vente', 1600000, 'Validé'),
  ('b0000000-0000-0000-0000-000000000050', 'BS-2026-0050', '2026-01-07', 'c0000000-0000-0000-0000-000000000002', '55000000-0000-0000-0000-000000000003', 'Huile végétale 20L', 30, 'bidons', 'Vente', 360000, 'Validé'),
  ('b0000000-0000-0000-0000-000000000049', 'BS-2026-0049', '2026-01-03', 'c0000000-0000-0000-0000-000000000005', '55000000-0000-0000-0000-000000000006', 'Textiles & vêtements', 18, 'balles', 'Livraison', 1080000, 'Validé'),
  ('b0000000-0000-0000-0000-000000000048', 'BS-2026-0048', '2025-12-28', 'c0000000-0000-0000-0000-000000000003', '55000000-0000-0000-0000-000000000002', 'Riz parfumé 25kg', 35, 'sacs', 'Vente', 525000, 'Validé'),
  ('b0000000-0000-0000-0000-000000000047', 'BS-2026-0047', '2025-12-24', 'c0000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-000000000007', 'Conserves alimentaires', 120, 'cartons', 'Transfert', 1440000, 'Validé')
ON CONFLICT (id) DO NOTHING;


-- 11. INSERTION DES TRANSPORTEURS
INSERT INTO public.transporteurs (id, nom, contact, telephone, email, vehicule, immatriculation, trajet, capacite, statut, date_creation, notes)
VALUES 
  ('77000000-0000-0000-0000-000000000001', 'Société Konaté Transport', 'Mamadou Konaté', '+223 76 12 34 56', 'konate.transport@mail.ml', 'Semi-remorque', 'BK-0845-ML', 'Bamako – Dakar', 30, 'Actif', '2025-03-15', 'Partenaire fiable, délais respectés'),
  ('77000000-0000-0000-0000-000000000002', 'Diarra & Frères Logistique', 'Seydou Diarra', '+223 66 98 77 44', NULL, 'Camion', 'BK-2210-ML', 'Bamako – Abidjan', 20, 'Actif', '2025-05-01', NULL),
  ('77000000-0000-0000-0000-000000000003', 'Trans-Sahel SARL', 'Aliou Coulibaly', '+223 79 55 22 11', 'transahel@sltt.ml', 'Remorque', 'BK-3301-ML', 'Bamako – Conakry', 25, 'Actif', '2025-07-20', NULL),
  ('77000000-0000-0000-0000-000000000004', 'Touré Express Fret', 'Kadiatou Touré', '+223 65 40 33 99', NULL, 'Fourgon', 'BK-1155-ML', 'Local Bamako', 5, 'Actif', '2024-11-10', 'Spécialisé livraisons urbaines'),
  ('77000000-0000-0000-0000-000000000005', 'Sidibé Camions Lourds', 'Boubacar Sidibé', '+223 72 88 66 00', NULL, 'Benne', 'BK-0092-ML', 'Bamako – Niamey', 35, 'Inactif', '2025-01-08', 'Véhicule en maintenance')
ON CONFLICT (id) DO NOTHING;


-- 12. INSERTION DES FACTURES
INSERT INTO public.factures (id, numero, dossier_id, client_id, date, date_echeance, statut, taux_tva, montant_ht, montant_tva, montant_ttc, montant_paye, notes, cree_par, cree_le)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'SLTT-FACT-2026-0001', 'd0000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000004', '2026-01-09', '2026-02-08', 'Soldée', 18, 1900000, 342000, 2242000, 2242000, '', 'Fatoumata Diallo', '2026-01-09 09:30:00+00'),
  ('f1000000-0000-0000-0000-000000000002', 'SLTT-FACT-2026-0002', 'd0000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000001', '2026-01-10', '2026-02-09', 'Partielle', 18, 2500000, 450000, 2950000, 1500000, '', 'Fatoumata Diallo', '2026-01-10 10:15:00+00'),
  ('f1000000-0000-0000-0000-000000000003', 'SLTT-FACT-2026-0003', 'd0000000-0000-0000-0000-000000000040', 'c0000000-0000-0000-0000-000000000002', '2026-01-11', '2026-02-10', 'Envoyée', 18, 2900000, 522000, 3422000, 0, '', 'Amadou Traoré', '2026-01-11 14:00:00+00'),
  ('f1000000-0000-0000-0000-000000000004', 'SLTT-FACT-2026-0004', NULL, 'c0000000-0000-0000-0000-000000000005', '2026-01-12', '2026-02-11', 'Brouillon', 18, 180000, 32400, 212400, 0, '', 'Amadou Traoré', '2026-01-12 08:45:00+00')
ON CONFLICT (id) DO NOTHING;


-- 13. INSERTION DES LIGNES DE FACTURES
INSERT INTO public.facture_lignes (id, facture_id, description, quantite, prix_unitaire, montant_ht)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Frais de prestation — SLTT-TR-2026-0041 (Sacs de ciment)', 1, 600000, 600000),
  ('b1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'Droits de douane', 1, 980000, 980000),
  ('b1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', 'Frais de circuit', 1, 320000, 320000),
  ('b1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', 'Frais de prestation — SLTT-TR-2026-0042 (Matériel électronique)', 1, 850000, 850000),
  ('b1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000002', 'Droits de douane', 1, 1200000, 1200000),
  ('b1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000002', 'Frais de circuit', 1, 450000, 450000),
  ('b1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000003', 'Frais de prestation — SLTT-TR-2026-0040 (Pièces automobiles)', 1, 900000, 900000),
  ('b1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000003', 'Droits de douane', 1, 1500000, 1500000),
  ('b1000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000003', 'Frais de circuit', 1, 500000, 500000),
  ('b1000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000004', 'Prestation de courtage — hors dossier', 1, 180000, 180000)
ON CONFLICT (id) DO NOTHING;


-- 14. INSERTION DES JOURNAUX D'AUDIT
INSERT INTO public.audit_logs (id, date, user_name, module, action, detail, ip)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '2026-01-09 09:05:00+00', 'Ibrahim Keïta', 'Dossiers', 'Création', 'Dossier DOS-2026-0142 créé — Client SEDIM SA', '154.66.12.7'),
  ('a1000000-0000-0000-0000-000000000002', '2026-01-09 08:45:00+00', 'Fatoumata Diallo', 'Comptabilité', 'Paiement', 'Paiement 850 000 FCFA — Écriture EC-2026-0089', '41.202.18.50'),
  ('a1000000-0000-0000-0000-000000000003', '2026-01-09 08:12:00+00', 'Amadou Traoré', 'Authentification', 'Connexion', 'Connexion réussie depuis Chrome · Windows', '41.202.18.45'),
  ('a1000000-0000-0000-0000-000000000004', '2026-01-08 17:40:00+00', 'Fatoumata Diallo', 'Authentification', 'Connexion', 'Connexion réussie depuis Firefox · macOS', '41.202.18.50'),
  ('a1000000-0000-0000-0000-000000000005', '2026-01-08 16:22:00+00', 'Oumar Cissé', 'Stock', 'Modification', 'Sortie 120 sacs — Riz parfumé (entrepôt A)', '41.202.18.61'),
  ('a1000000-0000-0000-0000-000000000006', '2026-01-08 14:10:00+00', 'Amadou Traoré', 'Bons', 'Validation', 'Bon BS-2026-0048 validé — Vente', '41.202.18.45')
ON CONFLICT (id) DO NOTHING;

-- Enregistrement final des données
COMMIT;
