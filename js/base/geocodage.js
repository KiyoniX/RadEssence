// Recherche d'adresses et nom d'un point : API Adresse de l'IGN (Géoplateforme), gratuite et sans clé.
// Réglages lus dans config.js : CONFIG.geocodage, CONFIG.reseau.ecartAdresseMs.
import { CONFIG } from "../config.js";
import { requeteJson } from "./reseau.js";

const dejaCherche = new Map(); // texte → lieux, pour ne pas redemander la même chose

function url(chemin, parametres) {
  const u = new URL(`${CONFIG.geocodage}/${chemin}`);
  u.search = new URLSearchParams(parametres);
  return u;
}

/** Lieux correspondant à un texte (ville, adresse…). @returns {Promise<{nom, contexte, lat, lon}[]>} */
export async function rechercherLieux(texte, signal) {
  const cle = texte.toLowerCase();
  if (dejaCherche.has(cle)) return dejaCherche.get(cle);

  const { features = [] } = await requeteJson(url("search", { q: texte, limit: 5, autocomplete: 1 }), {
    signal,
    ecartMs: CONFIG.reseau.ecartAdresseMs,
  });
  const lieux = features.map((f) => ({
    nom: f.properties.label,
    contexte: f.properties.context,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
  }));
  dejaCherche.set(cle, lieux);
  return lieux;
}

/** Nom lisible d'un point (« rue Blatin, Clermont-Ferrand »), ou null s'il n'y a rien autour. */
export async function nommerPoint({ lat, lon }, signal) {
  const { features = [] } = await requeteJson(url("reverse", { lat, lon, limit: 1 }), {
    signal,
    ecartMs: CONFIG.reseau.ecartAdresseMs,
  });
  const p = features[0]?.properties;
  if (!p) return null;
  if (p.type === "municipality") return p.city ?? p.name;
  return `${p.street ?? p.name}, ${p.city}`;
}
