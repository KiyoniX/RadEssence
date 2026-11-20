import { test } from "node:test";
import assert from "node:assert/strict";
import { classerParPrix } from "../../js/base/liste.js";

const elements = [
  { id: "c", prix: 80, distance: 5 },
  { id: "a", prix: 70, distance: 9 },
  { id: "b", prix: 80, distance: 2 },
  { id: "d", prix: 90, distance: 1 },
];

test("classerParPrix : du moins cher au plus cher, le plus proche d'abord à prix égal", () => {
  const classes = classerParPrix(elements, (e) => e.prix);
  assert.deepEqual(classes.map((e) => e.id), ["a", "b", "c", "d"]);
});

test("classerParPrix : rang « sportif » (1, 2, 2, 4)", () => {
  const classes = classerParPrix(elements, (e) => e.prix);
  assert.deepEqual(classes.map((e) => e.rang), [1, 2, 2, 4]);
});

test("classerParPrix : ne modifie pas le tableau reçu", () => {
  const copie = structuredClone(elements);
  classerParPrix(elements, (e) => e.prix);
  assert.deepEqual(elements, copie);
});
