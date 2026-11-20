// Commun à RadEssence et ControVisite : garder ce fichier identique dans les deux dépôts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { couleurPrix, depuis, distanceKm, joliTexte, montant, prixLitre, telephoneLisible } from "../../js/commun/format.js";

// Intl met des espaces insécables : on les remplace par des espaces simples pour comparer.
const espaces = (texte) => texte.replace(/\s/g, " ");

test("montant : arrondi seulement s'il est rond", () => {
  assert.equal(espaces(montant(67)), "67 €");
  assert.equal(espaces(montant(67.5)), "67,50 €");
});

test("prixLitre : trois décimales", () => {
  assert.equal(espaces(prixLitre(2.007)), "2,007 €");
  assert.equal(espaces(prixLitre(2)), "2,000 €");
});

test("depuis : choisit l'unité selon l'ancienneté", () => {
  const maintenant = new Date("2026-11-20T12:00:00Z");
  const ilYa = (ms) => depuis(new Date(maintenant - ms), maintenant);
  assert.equal(ilYa(5 * 60e3), "il y a 5 minutes");
  assert.equal(ilYa(3 * 3600e3), "il y a 3 heures");
  assert.equal(ilYa(10 * 86400e3), "il y a 10 jours");
  assert.equal(ilYa(150 * 86400e3), "il y a 5 mois");
  assert.equal(ilYa(6 * 365.25 * 86400e3), "il y a 6 ans");
});

test("distanceKm : Clermont-Ferrand → Lyon ≈ 134 km à vol d'oiseau", () => {
  const d = distanceKm({ lat: 45.7772, lon: 3.087 }, { lat: 45.764, lon: 4.8357 });
  assert.ok(d > 130 && d < 140, `distance obtenue : ${d}`);
  assert.equal(distanceKm({ lat: 45, lon: 3 }, { lat: 45, lon: 3 }), 0);
});

test("joliTexte : casse lisible pour les textes en majuscules seulement", () => {
  assert.equal(joliTexte("8 BOULEVARD WINSTON CHURCHILL"), "8 Boulevard Winston Churchill");
  assert.equal(joliTexte("RUE DE LA REPUBLIQUE"), "Rue de la Republique");
  assert.equal(joliTexte("Avenue de Royat"), "Avenue de Royat");
  assert.equal(joliTexte(null), null);
});

test("telephoneLisible : groupe les numéros français à 10 chiffres", () => {
  assert.equal(telephoneLisible("0473123456"), "04 73 12 34 56");
  assert.equal(telephoneLisible("+33473123456"), "+33473123456");
});

test("couleurPrix : vert au minimum, rouge au maximum", () => {
  assert.equal(couleurPrix(1, { min: 1, max: 2 }), "hsl(120, 70%, 40%)");
  assert.equal(couleurPrix(2, { min: 1, max: 2 }), "hsl(0, 70%, 40%)");
  assert.equal(couleurPrix(5, { min: 5, max: 5 }), "hsl(120, 70%, 40%)");
});
