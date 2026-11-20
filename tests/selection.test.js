import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../js/config.js";
import { compterParCarburant, estAncien, selectionner } from "../js/selection.js";

const maintenant = new Date("2026-11-20T12:00:00Z");
const ilYaJours = (j) => new Date(maintenant - j * 86400e3);

/** Station de test : seuls les carburants donnés sont vendus. */
function station(id, distance, carburants) {
  const tous = Object.fromEntries(
    CONFIG.carburants.map(({ code }) => [code, { prix: null, maj: null, rupture: null, ruptureDepuis: null }]),
  );
  for (const [code, valeurs] of Object.entries(carburants)) Object.assign(tous[code], valeurs);
  return { id, distance, carburants: tous };
}

const stations = [
  station("a", 3, { gazole: { prix: 2.05 }, e10: { prix: 1.9 } }),
  station("b", 1, { gazole: { prix: 2.0 } }),
  station("c", 2, { gazole: { prix: 2.05 }, e10: { rupture: "temporaire", ruptureDepuis: ilYaJours(2) } }),
  station("d", 4, { e10: { rupture: "temporaire", ruptureDepuis: ilYaJours(400) } }),
];

test("selectionner : classement, rangs ex aequo et prix recopié", () => {
  const { enVente, min, max } = selectionner(stations, "gazole", maintenant);
  assert.deepEqual(enVente.map((s) => [s.id, s.rang, s.prix]), [["b", 1, 2.0], ["c", 2, 2.05], ["a", 2, 2.05]]);
  assert.equal(min, 2.0);
  assert.equal(max, 2.05);
});

test("selectionner : seules les ruptures temporaires récentes sont listées", () => {
  const { enVente, ruptures } = selectionner(stations, "e10", maintenant);
  assert.deepEqual(enVente.map((s) => s.id), ["a"]);
  assert.deepEqual(ruptures.map((s) => s.id), ["c"]);
});

test("compterParCarburant : nombre de stations qui vendent chaque carburant", () => {
  const nombres = compterParCarburant(stations);
  assert.equal(nombres.gazole, 3);
  assert.equal(nombres.e10, 1);
  assert.equal(nombres.gplc, 0);
});

test("estAncien : au-delà de CONFIG.prixAncienHeures", () => {
  const ilYaHeures = (h) => new Date(maintenant - h * 3600e3);
  assert.equal(estAncien(ilYaHeures(CONFIG.prixAncienHeures - 1), maintenant), false);
  assert.equal(estAncien(ilYaHeures(CONFIG.prixAncienHeures + 1), maintenant), true);
});
