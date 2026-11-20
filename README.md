# RadEssence ⛽

Classement en direct des stations-service autour de Clermont-Ferrand, de la moins chère à la plus chère, avec une carte et un lien Google Maps pour chaque station.

**Site : https://kiyonix.github.io/RadEssence/**

- Les prix viennent du [flux officiel prix-carburants](https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/) du ministère de l'Économie. Les stations sont obligées de les déclarer.
- La page les lit **en direct depuis le navigateur** : pas de serveur, pas de base de données, pas de tâche planifiée. Un site statique sur GitHub Pages suffit.
- Pour chaque carburant : le classement, l'écart en euros sur un plein, l'ancienneté du prix (signalée au-delà de 48 h), les ruptures en cours et une carte colorée du vert (moins cher) au rouge.
- Le carburant choisi est dans l'adresse (`…/RadEssence/#e10`), pour partager un lien direct.

## Structure

Pas de framework ni d'étape de build : du HTML, du CSS et des modules JavaScript.

| Fichier | Rôle |
|---|---|
| `js/config.js` | **Tous les réglages** : zone (centre, rayon), carburants, taille du plein, seuils |
| `js/api.js` | Lit l'API officielle et met chaque station au même format |
| `js/selection.js` | Logique pure : trie, classe et filtre les stations pour un carburant (aucun accès au DOM) |
| `js/classement.js` | Affiche la liste, les ruptures et les stations sans prix |
| `js/carte.js` | La carte Leaflet (OpenStreetMap, sans clé) |
| `js/format.js` | Petites fonctions : prix, dates relatives, distances, création d'éléments |
| `js/main.js` | Point d'entrée : charge les données et relie le tout |
| `data/noms.json` | Enseignes des stations (le flux officiel ne donne que l'adresse) |
| `data/hors-flux.json` | Stations qui existent mais ne publient pas leurs prix |
| `css/style.css` | Styles ; couleurs dans les variables en haut du fichier (thème sombre automatique) |

## Modifier

**Changer de ville ou de rayon** : `centre` et `rayonKm` dans `js/config.js`. Rien d'autre à toucher.

**Afficher l'enseigne d'une station** : clique sur la station sur la carte, la bulle donne son numéro (`n° 63000014`). Ajoute-le dans `data/noms.json` :

```json
{
  "63000014": "Total",
  "63100003": "Leclerc"
}
```

**Signaler une station absente du flux** : ajoute-la dans `data/hors-flux.json` avec `nom`, `adresse`, `cp`, `ville`, `lat`, `lon` et une `remarque`. Elle s'affiche en gris. Elle disparaît d'elle-même dès qu'une station du flux apparaît à moins de 150 m (`rayonDoublonMetres`) : rien à nettoyer quand elle commence à publier ses prix.

**Ajouter un carburant** : une ligne dans `carburants` de `js/config.js`. Le `code` est le préfixe des champs de l'API (`gazole_prix`, `e10_prix`…).

## Tester en local

Les modules JavaScript ne marchent pas en ouvrant `index.html` directement : il faut un petit serveur.

```sh
python -m http.server 8000
# puis http://localhost:8000
```

## Mettre en ligne

GitHub → **Settings → Pages → Build and deployment** : *Deploy from a branch*, branche `main`, dossier `/ (root)`. Chaque push sur `main` met le site à jour en une minute environ.

## Limites

- Le prix affiché est celui que la station a déclaré : il peut avoir changé depuis. L'ancienneté est indiquée pour chaque prix.
- Une station qui ne déclare pas ses prix n'apparaît pas dans le flux : d'où `data/hors-flux.json`.

## Licence

Code sous licence MIT (voir `LICENSE`). Données : ministère de l'Économie, [Licence Ouverte](https://www.etalab.gouv.fr/licence-ouverte-open-licence/). Fond de carte : © contributeurs OpenStreetMap.
