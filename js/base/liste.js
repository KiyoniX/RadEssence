// Briques de la liste du classement, utilisées par js/classement.js.
import { couleurPrix, el, lienGoogleMaps } from "./format.js";

/**
 * Une fiche du classement (<li class="fiche">), cliquable en entier sauf ses boutons et liens.
 * @param element    objet affiché : { id, rang, prix, lat, lon }
 * @param selection  { min, max } pour la couleur de la pastille
 * @param infos      contenu de la colonne du milieu (nom, adresse, badges…)
 * @param prix       contenu de la colonne de droite
 * @param actions    liens en plus de « Sur la carte » et « Google Maps »
 * @param surVoir(id)
 */
export function fiche({ element, selection, infos, prix, actions = [], surVoir }) {
  return el(
    "li",
    {
      class: "fiche",
      "data-id": element.id,
      onclick: (e) => e.target.closest("a, button") || surVoir(element.id),
    },
    el(
      "span",
      { class: "rang", style: `background: ${couleurPrix(element.prix, selection)}`, "aria-label": `${element.rang}e` },
      element.rang,
    ),
    el("div", { class: "infos" }, infos),
    el("div", { class: "prix" }, prix),
    el(
      "div",
      { class: "actions" },
      el("button", { type: "button", onclick: () => surVoir(element.id) }, "Sur la carte"),
      el("a", { href: lienGoogleMaps(element), target: "_blank", rel: "noopener" }, "Google Maps ↗"),
      actions,
    ),
  );
}

/** Met en évidence une fiche de la liste (clic sur la carte) et la fait défiler jusqu'à elle. */
export function surligner(liste, id) {
  for (const ligne of liste.children) ligne.classList.toggle("active", ligne.dataset.id === id);
  liste.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Classe des éléments par prix croissant (à prix égal, le plus proche d'abord), avec un rang « sportif » :
 * deux éléments au même prix ont le même rang (1, 1, 3…). Logique pure (tests/base/liste.test.js).
 * @param prixDe(element) → nombre
 */
export function classerParPrix(elements, prixDe) {
  const tries = [...elements].sort((a, b) => prixDe(a) - prixDe(b) || a.distance - b.distance);
  const classes = tries.map((e, i) => ({ ...e, rang: i + 1 }));
  for (let i = 1; i < classes.length; i++) {
    if (prixDe(classes[i]) === prixDe(classes[i - 1])) classes[i].rang = classes[i - 1].rang;
  }
  return classes;
}
