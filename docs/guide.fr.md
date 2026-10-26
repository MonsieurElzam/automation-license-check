## À quoi ça sert

Chaque dépendance que vous installez arrive avec une licence. La plupart sont permissives (MIT, ISC…), mais une licence à copyleft fort (GPL, AGPL) peut vous obliger à publier votre propre code. Ce script dresse l'inventaire des licences de `node_modules` et signale ce qui mérite d'être examiné.

## Avant de commencer

- Un projet avec dépendances installées (`npm install`).

## Pas à pas

1. Lancez l'inventaire :
   ```bash
   node src/license-check.mjs ./node_modules
   ```
2. Lisez la répartition par licence, puis la liste « à examiner » : copyleft **fort** et licences **inconnues** (absentes ou non standard).
3. Pour chaque cas, décidez : remplacer la dépendance, ou obtenir un avis sur la compatibilité avec votre usage.

## Lire le résultat

Classes : `permissive` (usage libre), `weak` (LGPL, MPL : obligations limitées au composant), `strong` (GPL, AGPL), `unknown`. Une expression `(MIT OR GPL-3.0)` est classée selon le meilleur choix ; `MIT AND GPL-3.0`, selon le pire.

## L'automatiser

En CI : code de sortie 2 s'il y a du copyleft fort ou une licence inconnue (`--allow-unknown` tolère ces dernières).

## Pièges à éviter

- C'est une **information**, pas un avis juridique : un cas limite se fait relire.
- Le script lit les licences déclarées dans `package.json` ; il ne vérifie pas les fichiers `LICENSE` des paquets.
