// Lecture du flux officiel prix-carburants (data.economie.gouv.fr), directement depuis le navigateur.
import { CONFIG } from "./config.js";
import { distanceKm, joliTexte } from "./commun/format.js";
import { requeteJson } from "./commun/reseau.js";

const PAR_PAGE = 100; // maximum accepté par l'API
const OFFSET_MAX = 10000; // l'API refuse au-delà

// Seulement les champs utiles : réponses bien plus légères.
const CHAMPS = [
  "id",
  "adresse",
  "cp",
  "ville",
  "geom",
  "horaires_automate_24_24",
  ...CONFIG.carburants.flatMap(({ code }) => [`${code}_prix`, `${code}_maj`, `${code}_rupture_type`, `${code}_rupture_debut`]),
].join(",");

// Zones déjà téléchargées : { centre, rayonKm, stations, lu }.
const cache = [];
const TAILLE_CACHE = 10;

/**
 * Stations du cercle (centre, rayonKm), avec leur distance au centre.
 * Si une zone récente du cache contient tout le cercle, aucune requête n'est faite.
 * @returns {Promise<{ stations, luA: Date }>}
 */
export async function chargerStations({ centre, rayonKm, signal, ageMaxMs = CONFIG.reseau.cacheMinutes * 60000 }) {
  const maintenant = Date.now();
  let zone = cache.find(
    (z) => maintenant - z.lu < ageMaxMs && distanceKm(z.centre, centre) + rayonKm <= z.rayonKm + 0.01,
  );

  if (!zone) {
    zone = { centre: { lat: centre.lat, lon: centre.lon }, rayonKm, stations: await telecharger(centre, rayonKm, signal), lu: Date.now() };
    cache.unshift(zone);
    cache.length = Math.min(cache.length, TAILLE_CACHE);
  }

  const stations = zone.stations
    .map((s) => ({ ...s, distance: distanceKm(centre, s) }))
    .filter((s) => s.distance <= rayonKm);
  return { stations, luA: new Date(zone.lu) };
}

async function telecharger(centre, rayonKm, signal) {
  const where = `within_distance(geom, geom'POINT(${centre.lon} ${centre.lat})', ${rayonKm}km)`;
  const brutes = [];
  for (let offset = 0; offset + PAR_PAGE <= OFFSET_MAX; offset += PAR_PAGE) {
    const url = new URL(CONFIG.api);
    url.search = new URLSearchParams({ where, select: CHAMPS, limit: PAR_PAGE, offset });
    const { results } = await requeteJson(url, { signal, ecartMs: CONFIG.reseau.ecartPrixMs });
    brutes.push(...results);
    if (results.length < PAR_PAGE) break;
  }
  return brutes.filter((b) => b.geom).map(normaliser);
}

const date = (valeur) => (valeur ? new Date(valeur) : null);

/** Une station de l'API → l'objet utilisé partout dans la page. */
function normaliser(brute) {
  const carburants = {};
  for (const { code } of CONFIG.carburants) {
    carburants[code] = {
      prix: brute[`${code}_prix`] ?? null,
      maj: date(brute[`${code}_maj`]),
      rupture: brute[`${code}_rupture_type`] ?? null, // "temporaire", "definitive" ou null
      ruptureDepuis: date(brute[`${code}_rupture_debut`]),
    };
  }
  return {
    id: String(brute.id),
    nom: null, // enseigne, complétée depuis data/noms.json
    adresse: joliTexte(brute.adresse),
    cp: brute.cp,
    ville: joliTexte(brute.ville),
    lat: brute.geom.lat,
    lon: brute.geom.lon,
    automate24: brute.horaires_automate_24_24 === "Oui",
    carburants,
  };
}
