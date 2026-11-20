// Ce que la carte montre pour chaque station : couleur, taille, infobulle et bulle (voir js/commun/carte.js).
import { nomStation } from "./classement.js";
import { couleurPrix, depuis, el, lienGoogleMaps, prixLitre } from "./commun/format.js";

const GRIS = "#8a8a8a";

/**
 * Points de la carte : d'abord les stations sans prix (en gris), puis les stations du plus cher
 * au moins cher, pour que les moins chères soient dessinées par-dessus.
 */
export function pointsCarte(selection, horsFlux) {
  const sansPrix = horsFlux.map((s, i) => ({
    id: `hors-flux-${i}`,
    lat: s.lat,
    lon: s.lon,
    couleur: GRIS,
    taille: 6,
    infobulle: `${nomStation(s)} : prix non publiés`,
    bulle: () => bulle(s, null),
    cliquable: false, // pas de fiche dans le classement
  }));

  const enVente = [...selection.enVente].reverse().map((s) => ({
    id: s.id,
    lat: s.lat,
    lon: s.lon,
    couleur: couleurPrix(s.prix, selection),
    taille: s.rang === 1 ? 11 : 8,
    infobulle: prixLitre(s.prix),
    bulle: () => bulle(s, s.carburants[selection.code]),
  }));

  return [...sansPrix, ...enVente];
}

/** Bulle d'une station. `c` = carburant affiché, ou null pour une station hors flux. */
function bulle(s, c) {
  return el(
    "div",
    { class: "bulle" },
    el("strong", {}, nomStation(s)),
    el("br"),
    `${s.cp} ${s.ville}`,
    el("br"),
    c ? el("span", { class: "bulle-prix" }, prixLitre(c.prix)) : "Prix non publiés",
    c && ` · ${depuis(c.maj)}`,
    el("br"),
    el("a", { href: lienGoogleMaps(s), target: "_blank", rel: "noopener" }, "Ouvrir dans Google Maps ↗"),
    // Le numéro sert à ajouter l'enseigne dans data/noms.json.
    s.id && el("small", { class: "bulle-note" }, `n° ${s.id}`),
  );
}
