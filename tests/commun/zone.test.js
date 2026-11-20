// Commun à RadEssence et ControVisite : garder ce fichier identique dans les deux dépôts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../../js/config.js";
import { bornerRayon, parametresDeZone, zoneDepuisParametres, zoneValide } from "../../js/commun/zone.js";

test("bornerRayon : entier, entre le minimum et le maximum", () => {
  assert.equal(bornerRayon(0), CONFIG.rayon.minKm);
  assert.equal(bornerRayon(9999), CONFIG.rayon.maxKm);
  assert.equal(bornerRayon(7.6), 8);
});

test("zoneValide : refuse les coordonnées absentes ou impossibles", () => {
  assert.equal(zoneValide(null), null);
  assert.equal(zoneValide({ lat: NaN, lon: 3 }), null);
  assert.equal(zoneValide({ lat: 95, lon: 3 }), null);
  assert.deepEqual(zoneValide({ lat: 45, lon: 3 }), { lat: 45, lon: 3, rayonKm: CONFIG.zoneParDefaut.rayonKm, nom: null });
});

test("zone ↔ paramètres de l'adresse : aller-retour, arrondi à ~100 m", () => {
  const p = new URLSearchParams(parametresDeZone({ lat: 45.77721, lon: 3.08695, rayonKm: 12 }));
  assert.equal(p.toString(), "lat=45.777&lon=3.087&rayon=12");
  assert.deepEqual(zoneDepuisParametres(p), { lat: 45.777, lon: 3.087, rayonKm: 12, nom: null });
  assert.equal(zoneDepuisParametres(new URLSearchParams("rayon=5")), null);
});
