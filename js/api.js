// Lecture du flux officiel prix-carburants (data.economie.gouv.fr), directement depuis le navigateur.
import { CONFIG } from "./config.js";
import { distanceKm, joliTexte } from "./format.js";

const PAR_PAGE = 100; // maximum accepté par l'API
const OFFSET_MAX = 10000; // l'API refuse au-delà

/** Toutes les stations du flux dans la zone de CONFIG, au format de normaliser(). */
export async function chargerStations() {
  const { lat, lon } = CONFIG.centre;
  const where = `within_distance(geom, geom'POINT(${lon} ${lat})', ${CONFIG.rayonKm}km)`;
  const brutes = [];

  for (let offset = 0; offset + PAR_PAGE <= OFFSET_MAX; offset += PAR_PAGE) {
    const url = new URL(CONFIG.api);
    url.search = new URLSearchParams({ where, limit: PAR_PAGE, offset });
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`API prix-carburants : HTTP ${reponse.status}`);
    const { results } = await reponse.json();
    brutes.push(...results);
    if (results.length < PAR_PAGE) break;
  }
  return brutes.map(normaliser);
}

const date = (valeur) => (valeur ? new Date(valeur) : null);

/** Une station de l'API → l'objet utilisé partout dans la page. */
function normaliser(brute) {
  const position = { lat: brute.geom.lat, lon: brute.geom.lon };
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
    ...position,
    distance: distanceKm(CONFIG.centre, position),
    automate24: brute.horaires_automate_24_24 === "Oui",
    carburants,
  };
}
