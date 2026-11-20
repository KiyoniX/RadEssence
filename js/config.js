// Tout ce qu'on peut vouloir changer se trouve ici.
export const CONFIG = {
  // Zone couverte : un cercle autour de ce point.
  centre: { lat: 45.7772, lon: 3.087, nom: "la place de Jaude" },
  rayonKm: 8,

  // Carburants proposés, dans l'ordre des onglets. `code` = préfixe des champs de l'API (gazole_prix, e10_prix…).
  carburants: [
    { code: "gazole", nom: "Gazole" },
    { code: "e10", nom: "SP95-E10" },
    { code: "sp98", nom: "SP98" },
    { code: "sp95", nom: "SP95" },
    { code: "e85", nom: "E85" },
    { code: "gplc", nom: "GPL" },
  ],
  carburantParDefaut: "gazole",

  pleinLitres: 50, // pour traduire l'écart de prix en euros sur un plein
  prixAncienHeures: 48, // au-delà, le prix est signalé comme ancien
  ruptureRecenteJours: 30, // une rupture « temporaire » plus vieille veut dire que la station n'en vend plus
  rayonDoublonMetres: 150, // une station de data/hors-flux.json disparaît si une station du flux est aussi près

  depot: "https://github.com/KiyoniX/RadEssence",

  api: "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records",
  tuiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};
