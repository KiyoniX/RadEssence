// Logique pure : quelles stations afficher pour un carburant, et dans quel ordre. Aucun accès au DOM.
import { CONFIG } from "./config.js";

const HEURE = 3600 * 1000;
const JOUR = 24 * HEURE;

/**
 * @returns {{ code, enVente, ruptures, min, max }}
 *   enVente : stations qui vendent ce carburant, de la moins chère à la plus chère, avec `rang`
 *   ruptures : stations en rupture temporaire récente
 */
export function selectionner(stations, code, maintenant = new Date()) {
  const prix = (s) => s.carburants[code].prix;

  const enVente = stations
    .filter((s) => prix(s) != null && !s.carburants[code].rupture)
    .sort((a, b) => prix(a) - prix(b) || a.distance - b.distance);

  // Rang « sportif » : deux stations au même prix ont le même rang (1, 1, 3…).
  const classees = enVente.map((s, i) => ({
    ...s,
    rang: i > 0 && prix(s) === prix(enVente[i - 1]) ? null : i + 1,
  }));
  classees.forEach((s, i) => (s.rang ??= classees[i - 1].rang));

  const ruptures = stations
    .filter((s) => {
      const c = s.carburants[code];
      return c.rupture === "temporaire" && c.ruptureDepuis && maintenant - c.ruptureDepuis < CONFIG.ruptureRecenteJours * JOUR;
    })
    .sort((a, b) => b.carburants[code].ruptureDepuis - a.carburants[code].ruptureDepuis);

  return {
    code,
    enVente: classees,
    ruptures,
    min: enVente.length ? prix(enVente[0]) : null,
    max: enVente.length ? prix(enVente.at(-1)) : null,
  };
}

/** Nombre de stations qui vendent chaque carburant, pour les onglets. */
export function compterParCarburant(stations) {
  return Object.fromEntries(
    CONFIG.carburants.map(({ code }) => [code, selectionner(stations, code).enVente.length]),
  );
}

export const estAncien = (date, maintenant = new Date()) => maintenant - date > CONFIG.prixAncienHeures * HEURE;
