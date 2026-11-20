// Tout ce qu'on peut vouloir changer se trouve ici.
export const CONFIG = {
  // Zone affichée à la première visite (ensuite : celle de l'adresse de la page, ou la dernière utilisée).
  zoneParDefaut: { lat: 45.7772, lon: 3.087, rayonKm: 8, nom: "la place de Jaude, Clermont-Ferrand" },
  rayon: { minKm: 1, maxKm: 50 },

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

  // Tampon contre les limites des API (prix : 50 000 requêtes/jour par visiteur ; adresses : 50/s).
  reseau: {
    cacheMinutes: 10, // une zone déjà chargée est réutilisée (et filtrée sur place) pendant ce temps
    actualiserApresSecondes: 60, // « Actualiser » réutilise les prix s'ils ont moins de 60 s
    attenteDeplacementMs: 500, // délai après le dernier déplacement de la zone avant de charger
    attenteSaisieMs: 350, // délai après la dernière frappe avant de chercher une adresse
    ecartPrixMs: 200, // écart minimal entre deux requêtes à l'API des prix
    ecartAdresseMs: 150, // écart minimal entre deux requêtes à l'API des adresses
    tentatives: 3, // essais en cas de réponse 429 (trop de requêtes)
  },

  depot: "https://github.com/KiyoniX/RadEssence",

  api: "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records",
  geocodage: "https://data.geopf.fr/geocodage", // API Adresse de l'IGN (Géoplateforme)
  tuiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};
