// La zone de recherche { lat, lon, rayonKm, nom } : validation et passage par l'adresse de la page.
// Logique pure, sans navigateur (testée dans tests/base/zone.test.js).
// Réglages lus dans config.js : CONFIG.rayon, CONFIG.zoneParDefaut.
import { CONFIG } from "../config.js";

/** Rayon entier, ramené entre CONFIG.rayon.minKm et CONFIG.rayon.maxKm. */
export function bornerRayon(km) {
  return Math.min(CONFIG.rayon.maxKm, Math.max(CONFIG.rayon.minKm, Math.round(km)));
}

/** Zone propre, ou null si elle n'a pas de coordonnées valables. Sans rayon : celui de la zone par défaut. */
export function zoneValide(zone) {
  if (!zone || !Number.isFinite(zone.lat) || !Number.isFinite(zone.lon)) return null;
  if (Math.abs(zone.lat) > 90 || Math.abs(zone.lon) > 180) return null;
  return {
    lat: zone.lat,
    lon: zone.lon,
    rayonKm: bornerRayon(zone.rayonKm || CONFIG.zoneParDefaut.rayonKm),
    nom: zone.nom ?? null,
  };
}

/** Zone lue dans les paramètres de l'adresse (lat, lon, rayon), ou null. */
export function zoneDepuisParametres(parametres) {
  return zoneValide({
    lat: parseFloat(parametres.get("lat")),
    lon: parseFloat(parametres.get("lon")),
    rayonKm: parseFloat(parametres.get("rayon")),
  });
}

/** Paramètres d'adresse d'une zone, arrondis à ~100 m pour ne pas publier une position exacte. */
export function parametresDeZone({ lat, lon, rayonKm }) {
  return { lat: lat.toFixed(3), lon: lon.toFixed(3), rayon: rayonKm };
}
