# martinlisen.com — Strates Digitales

Site statique (HTML, CSS, JS) de Martin Lisen, construit sur la charte Strates Digitales.
Aucune dépendance, aucun build : les fichiers à la racine se servent tels quels.

## Déployer sur Hostinger par Git

1. hPanel → Sites web → martinlisen.com → **Avancé → Git**.
2. Dépôt : `https://github.com/nftmooods/Site-web` · branche : `main` · répertoire : laisser vide (= `public_html`).
   Le dossier `public_html` doit être vide avant le premier déploiement : supprimer d'abord le Website Builder
   (hPanel → Sites web → menu du site → supprimer / détacher le builder).
3. Cliquer **Créer**, puis **Déployer**. Activer le déploiement automatique (webhook) si Hostinger le propose :
   chaque push sur `main` met le site à jour.
4. Vérifier https://martinlisen.com, /labs.html et une URL inexistante (page 404 du site).

## Modifier le site

Les textes de chaque page sont dans `Sources/pages/`, l'en-tête et le pied de page communs dans `Sources/parts/`.
Après une modification, regénérer les pages :

    python3 Sources/build-site.py

Couleurs, typographies et rayons : en tête de `assets/css/site.css`.
Procédure complète, règles éditoriales et liste des `[À FOURNIR]` : `LISEZ-MOI-SITE.txt`.
