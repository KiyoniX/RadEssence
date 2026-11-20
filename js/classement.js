// Affichage de la liste : classement, ruptures, stations non suivies (la structure d'une fiche est dans js/commun/liste.js).
import { CONFIG } from "./config.js";
import { estAncien } from "./selection.js";
import { fiche } from "./commun/liste.js";
import { depuis, el, kilometres, lienGoogleMaps, montant, prixLitre } from "./commun/format.js";

/** Nom affiché d'une station : « Enseigne, adresse » si l'enseigne est connue (data/noms.json), sinon l'adresse. */
export const nomStation = (s) => (s.nom ? `${s.nom}, ${s.adresse}` : s.adresse);

/** Remplit la liste <ol> du classement. `surVoir(id)` montre la station sur la carte. */
export function afficherClassement(liste, selection, { surVoir }) {
  liste.replaceChildren(...selection.enVente.map((s) => ficheStation(s, selection, surVoir)));
}

function ficheStation(s, selection, surVoir) {
  const c = s.carburants[selection.code];
  const ecartPlein = (s.prix - selection.min) * CONFIG.pleinLitres;

  return fiche({
    element: s,
    selection,
    surVoir,
    infos: [
      el("strong", { class: "nom" }, nomStation(s)),
      el("span", { class: "lieu" }, `${s.ville} · ${kilometres(s.distance)}`),
      el(
        "span",
        { class: "badges" },
        el("span", { class: estAncien(c.maj) ? "badge alerte" : "badge" }, `Prix ${depuis(c.maj)}`),
        s.automate24 && el("span", { class: "badge" }, "24 h/24"),
      ),
    ],
    prix: [
      el("span", { class: "prix-principal" }, prixLitre(s.prix)),
      el(
        "span",
        { class: ecartPlein > 0 ? "ecart" : "ecart meilleur" },
        ecartPlein > 0 ? `+${montant(ecartPlein)} le plein` : "le moins cher",
      ),
    ],
  });
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
