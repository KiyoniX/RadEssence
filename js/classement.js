// Affichage de la liste : classement, ruptures, stations non suivies.
import { CONFIG } from "./config.js";
import { estAncien } from "./selection.js";
import { couleurPrix, depuis, el, kilometres, lienGoogleMaps, montant, nomStation, prixLitre } from "./format.js";

/** Remplit la liste <ol> du classement. `surVoir(id)` est appelé par le bouton « Sur la carte ». */
export function afficherClassement(liste, selection, { surVoir }) {
  liste.replaceChildren(...selection.enVente.map((s) => ligneStation(s, selection, surVoir)));
}

function ligneStation(s, selection, surVoir) {
  const { code, min } = selection;
  const c = s.carburants[code];
  const ecartPlein = (c.prix - min) * CONFIG.pleinLitres;
  const ancien = estAncien(c.maj);

  return el(
    "li",
    {
      class: "station",
      "data-id": s.id,
      // Toute la carte est cliquable, sauf ses boutons et liens.
      onclick: (e) => e.target.closest("a, button") || surVoir(s.id),
    },
    el("span", { class: "rang", style: `background: ${couleurPrix(c.prix, selection)}`, "aria-label": `${s.rang}e` }, s.rang),
    el(
      "div",
      { class: "infos" },
      el("strong", { class: "nom" }, nomStation(s)),
      el("span", { class: "lieu" }, `${s.ville} · ${kilometres(s.distance)}`),
      el(
        "span",
        { class: "badges" },
        el("span", { class: ancien ? "badge alerte" : "badge" }, `Prix ${depuis(c.maj)}`),
        s.automate24 && el("span", { class: "badge" }, "24 h/24"),
      ),
    ),
    el(
      "div",
      { class: "prix" },
      el("span", { class: "prix-litre" }, prixLitre(c.prix)),
      el(
        "span",
        { class: ecartPlein > 0 ? "ecart" : "ecart meilleur" },
        ecartPlein > 0 ? `+${montant(ecartPlein)} le plein` : "le moins cher",
      ),
    ),
    el(
      "div",
      { class: "actions" },
      el("button", { type: "button", onclick: () => surVoir(s.id) }, "Sur la carte"),
      el("a", { href: lienGoogleMaps(s), target: "_blank", rel: "noopener" }, "Google Maps ↗"),
    ),
  );
}

/** Met en évidence une station de la liste (clic sur la carte). */
export function surligner(liste, id) {
  for (const ligne of liste.children) ligne.classList.toggle("active", ligne.dataset.id === id);
  liste.querySelector(`[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/** Section des stations en rupture temporaire pour ce carburant. */
export function afficherRuptures(section, { code, ruptures }) {
  section.hidden = ruptures.length === 0;
  section.querySelector("ul").replaceChildren(
    ...ruptures.map((s) =>
      el("li", {}, `${nomStation(s)}, ${s.ville} : en rupture ${depuis(s.carburants[code].ruptureDepuis)}`),
    ),
  );
}

/** Section des stations connues mais absentes du flux officiel (data/hors-flux.json). */
export function afficherNonSuivies(section, stations) {
  section.hidden = stations.length === 0;
  section.querySelector("ul").replaceChildren(
    ...stations.map((s) =>
      el(
        "li",
        {},
        el("strong", {}, nomStation(s)),
        `, ${s.ville}. ${s.remarque ?? ""} `,
        el("a", { href: lienGoogleMaps(s), target: "_blank", rel: "noopener" }, "Google Maps ↗"),
      ),
    ),
  );
}
