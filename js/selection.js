// Logique pure : quelles stations afficher pour un carburant, et dans quel ordre.
// Aucun accès au DOM (testée dans tests/selection.test.js).
import { CONFIG } from "./config.js";
import { classerParPrix } from "./base/liste.js";

const HEURE = 3600 * 1000;
const JOUR = 24 * HEURE;

/**
 * @returns {{ code, enVente, ruptures, min, max }}
 *   enVente : stations qui vendent ce carburant, de la moins chère à la plus chère, avec `rang`
 *   ruptures : stations en rupture temporaire récente
 */
export function selectionner(stations, code, maintenant = new Date()) {
  const prix = (s) => s.carburants[code].prix;

  // Le prix de la station pour ce carburant est recopié dans `prix`, comme attendu par js/base/.
  const enVente = classerParPrix(
    stations.filter((s) => prix(s) != null && !s.carburants[code].rupture).map((s) => ({ ...s, prix: prix(s) })),
    (s) => s.prix,
  );

  const ruptures = stations
    .filter((s) => {
      const c = s.carburants[code];
      return c.rupture === "temporaire" && c.ruptureDepuis && maintenant - c.ruptureDepuis < CONFIG.ruptureRecenteJours * JOUR;
    })
    .sort((a, b) => b.carburants[code].ruptureDepuis - a.carburants[code].ruptureDepuis);

  return {
    code,
    enVente,
    ruptures,
    min: enVente.length ? enVente[0].prix : null,
    max: enVente.length ? enVente.at(-1).prix : null,
  };
}

/** Nombre de stations qui vendent chaque carburant, pour les onglets. */
export function compterParCarburant(stations) {
  return Object.fromEntries(
    CONFIG.carburants.map(({ code }) => [code, selectionner(stations, code).enVente.length]),
  );
}

/** Vrai si le prix date de plus de CONFIG.prixAncienHeures heures. */
export const estAncien = (date, maintenant = new Date()) => maintenant - date > CONFIG.prixAncienHeures * HEURE;
