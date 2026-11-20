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
| `js/config.js` | **Tous les réglages** : zone par défaut, rayon, carburants, taille du plein, seuils, tampon réseau |
| `js/api.js` | Lit l'API officielle (avec cache par zone) et met chaque station au même format |
| `js/reseau.js` | Passage obligé des requêtes : espacement et nouveaux essais sur erreur 429 |
| `js/geocodage.js` | Recherche d'adresses et nom d'un point (API de l'IGN) |
| `js/zone.js` | Commandes de la zone : recherche, « Autour de moi », curseur du rayon |
| `js/selection.js` | Logique pure : trie, classe et filtre les stations pour un carburant (aucun accès au DOM) |
| `js/classement.js` | Affiche la liste, les ruptures et les stations sans prix |
| `js/carte.js` | La carte Leaflet (OpenStreetMap, sans clé) |
| `js/format.js` | Petites fonctions : prix, dates relatives, distances, création d'éléments |
| `js/main.js` | Point d'entrée : état (zone, carburant), adresse de la page, liaison des morceaux |
| `data/noms.json` | Enseignes des stations (le flux officiel ne donne que l'adresse) |
| `data/hors-flux.json` | Stations qui existent mais ne publient pas leurs prix |
| `css/style.css` | Styles ; couleurs et polices dans les variables en haut du fichier (thème sombre automatique, mobile en bas) |

## Modifier

**Changer la zone affichée à la première visite** : `zoneParDefaut` dans `js/config.js`.

**Changer les polices** : le lien Bunny Fonts dans `index.html`, puis `--police` et `--police-titre` dans `css/style.css`.

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
