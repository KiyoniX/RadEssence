# RadEssence

Classement en direct des stations-service les moins chères autour de n'importe quel point de France, avec une carte et un lien Google Maps pour chaque station. On choisit sa zone en cherchant une adresse, avec « Autour de moi », ou en déplaçant le cercle sur la carte, et on règle le rayon (1 à 50 km).

**Site : https://kiyonix.github.io/RadEssence/**

- Les prix viennent du [flux officiel prix-carburants](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/) du ministère de l'Économie. Les stations sont obligées de les déclarer.
- La page les lit **en direct depuis le navigateur** : pas de serveur, pas de base de données, pas de tâche planifiée. Un site statique sur GitHub Pages suffit.
- Pour chaque carburant : le classement, l'écart en euros sur un plein, l'ancienneté du prix (signalée au-delà de 48 h), les ruptures en cours et une carte colorée du vert (moins cher) au rouge.
- La zone et le carburant sont dans l'adresse de la page (`#carburant=e10&lat=45.764&lon=4.836&rayon=10`), pour partager un lien direct. Le navigateur retient aussi la dernière zone.
- La recherche d'adresse passe par l'API Adresse de l'IGN (Géoplateforme), gratuite et sans clé.
- Un tampon limite les requêtes : cache de 10 minutes, délais d'attente, espacement et nouveaux essais (réglages `reseau` de `js/config.js`).
- Sur mobile, on bascule entre la liste et la carte avec un bouton flottant.

## Structure

Pas de framework ni d'étape de build : du HTML, du CSS et des modules JavaScript.

| Fichier | Rôle |
|---|---|
| `js/config.js` | **Tous les réglages** : identité, zone par défaut, rayon, carburants, taille du plein, seuils, tampon réseau |
| `js/api.js` | Lit l'API officielle (avec cache par zone) et met chaque station au même format |
| `js/selection.js` | Logique pure : trie, classe et filtre les stations pour un carburant (aucun accès au DOM) |
| `js/classement.js` | Contenu des fiches du classement, ruptures et stations sans prix |
| `js/marqueurs.js` | Ce que la carte montre pour chaque station (couleur, bulle) |
| `js/main.js` | Point d'entrée : état (zone, carburant), adresse de la page, liaison des morceaux |
| `data/noms.json` | Enseignes des stations (le flux officiel ne donne que l'adresse) |
| `data/hors-flux.json` | Stations qui existent mais ne publient pas leurs prix |
| `js/commun/` | **Briques partagées avec ControVisite** (voir « Code partagé ») : carte, zone, chargement, mémoire, vue mobile, réseau, formats |
| `css/commun.css` | Styles partagés : mise en page, thème sombre automatique, mobile en bas du fichier |
| `css/site.css` | **Identité du site** : couleur d'accent et couleur de la zone |
| `logo.svg` | Logo, aussi utilisé comme icône d'onglet |
| `tests/` | Tests (`npm test`) ; `tests/commun/` est partagé avec ControVisite |
| `outils/comparer-commun.mjs` | Vérifie que les fichiers partagés sont identiques à ceux de ControVisite |

## Modifier

**Changer la zone affichée à la première visite** : `zoneParDefaut` dans `js/config.js`.

**Changer les polices** : le lien Bunny Fonts dans `index.html`, puis `--police` et `--police-titre` dans `css/commun.css`.

**Afficher l'enseigne d'une station** : clique sur la station sur la carte, la bulle donne son numéro (`n° 63000014`). Ajoute-le dans `data/noms.json` :

```json
{
  "63000014": "Total",
  "63100003": "Leclerc"
}
```

**Signaler une station absente du flux** : ajoute-la dans `data/hors-flux.json` avec `nom`, `adresse`, `cp`, `ville`, `lat`, `lon` et une `remarque`. Elle s'affiche en gris. Elle disparaît d'elle-même dès qu'une station du flux apparaît à moins de 150 m (`rayonDoublonMetres`) : rien à nettoyer quand elle commence à publier ses prix.

**Ajouter un carburant** : une ligne dans `carburants` de `js/config.js`. Le `code` est le préfixe des champs de l'API (`gazole_prix`, `e10_prix`…).

## Développer

Aucune dépendance à installer : il suffit de Node.js 20 ou plus récent (pour les tests) et de Python (pour le serveur local).

```sh
npm run local      # serveur local sur http://localhost:8000 (les modules JS ne marchent pas en ouvrant index.html directement)
npm test           # tests de la logique (tri, rangs, formats, zone), aussi lancés par GitHub Actions à chaque push
```

### Code partagé

[ControVisite](https://github.com/KiyoniX/ControVisite) et RadEssence ont la même base : tout ce qui est dans `js/commun/`, `css/commun.css`, `tests/commun/` et `outils/comparer-commun.mjs` est **identique dans les deux dépôts**. Chaque dépôt reste autonome (aucune dépendance entre eux), mais une correction faite d'un côté doit être recopiée de l'autre. Pour vérifier, avec les deux dépôts côte à côte :

```sh
npm run verifier-commun -- ../ControVisite
```

Ce qui est propre au site reste hors de `commun/` : `config.js`, `api.js` (lecture des données), `selection.js` (tri), `classement.js` (contenu des fiches), `marqueurs.js` (contenu de la carte) et `main.js` (état et liaison).
Les modules communs lisent dans `config.js` les clés `zoneParDefaut`, `rayon`, `reseau`, `geocodage` et `tuiles`.

## Mettre en ligne

GitHub → **Settings → Pages → Build and deployment** : *Deploy from a branch*, branche `main`, dossier `/ (root)`. Chaque push sur `main` met le site à jour en une minute environ.

## Forker

Un fork marche tel quel : active GitHub Pages sur ton dépôt (voir « Mettre en ligne ») et le site sera sur `https://<ton-pseudo>.github.io/<nom-du-dépôt>/`. Tous les chemins sont relatifs.

**Te l'approprier** (nom, couleurs, logo) :

| Quoi | Où |
|---|---|
| Nom, slogan, description, couleur de la barre du navigateur | `index.html` : `<title>`, `<meta name="description">`, `<meta name="theme-color">`, `<h1>` et le `<p>` qui le suit |
| Couleurs | `css/site.css` |
| Logo et icône d'onglet | `logo.svg` |
| Lien « Code source » et clé de stockage du navigateur | `site` dans `js/config.js` (change `cleMemoire` pour ne pas mélanger tes réglages avec ceux du site d'origine) |
| Zone de la première visite | `zoneParDefaut` dans `js/config.js` |

**Brancher une autre source de données** (autre type de prix, autre pays…) : réécris `js/api.js` pour qu'il renvoie des objets `{ id, lat, lon, distance, … }`, puis adapte `selection.js`, `classement.js` et `marqueurs.js`. La carte, la zone, le tampon réseau, la mémoire et la vue mobile (`js/commun/`) n'ont pas à changer.

## Limites

- Le prix affiché est celui que la station a déclaré : il peut avoir changé depuis. L'ancienneté est indiquée pour chaque prix.
- Une station qui ne déclare pas ses prix n'apparaît pas dans le flux : d'où `data/hors-flux.json`.

## Licence

Code sous licence MIT (voir `LICENSE`). Données : ministère de l'Économie, [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Fond de carte : © contributeurs OpenStreetMap.
