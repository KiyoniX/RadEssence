// Point d'entrée de RadEssence : état (zone, carburant), chargement et affichage.
// Les briques génériques (carte, zone, chargement, mémoire, vue mobile) sont dans js/commun/.
import { CONFIG } from "./config.js";
import { chargerStations } from "./api.js";
import { compterParCarburant, selectionner } from "./selection.js";
import { afficherClassement, afficherNonSuivies, afficherRuptures } from "./classement.js";
import { pointsCarte } from "./marqueurs.js";
import { creerCarte } from "./commun/carte.js";
import { creerChargeur } from "./commun/chargeur.js";
import { creerControlesZone } from "./commun/controles-zone.js";
import { distanceKm, el, heure, joliTexte, montant, prixLitre } from "./commun/format.js";
import { nommerPoint } from "./commun/geocodage.js";
import { surligner } from "./commun/liste.js";
import { creerMemoire, ecrireParametresPage, lireParametresPage } from "./commun/memoire.js";
import { creerVueMobile } from "./commun/vue-mobile.js";
import { parametresDeZone, zoneDepuisParametres, zoneValide } from "./commun/zone.js";

const $ = (id) => document.getElementById(id);
const memoire = creerMemoire(CONFIG.site.cleMemoire);

const etat = {
  ...etatInitial(), // zone {lat, lon, rayonKm, nom} et code du carburant
  stations: [], // stations du flux dans la zone
  horsFlux: [], // stations de data/hors-flux.json dans la zone et absentes du flux
  noms: {}, // data/noms.json : enseigne par numéro de station
  horsFluxTous: [], // data/hors-flux.json
  luA: null, // heure de lecture des prix
};

const carte = creerCarte($("carte"), {
  surClicPoint: (id) => surligner($("classement"), id),
  surDeplacerCentre: ({ lat, lon }) => changerZone({ lat, lon, nom: null }, { ajuster: false }),
});

const controles = creerControlesZone({
  surRayonProvisoire: (km) => carte.apercuRayon(km),
  surRayon: (km) => changerZone({ rayonKm: km }),
  surLieu: (lieu) => changerZone(lieu),
  surErreur: message,
});

const chargeur = creerChargeur({
  charger: (signal, { ageMaxMs } = {}) => chargerStations({ centre: etat.zone, rayonKm: etat.zone.rayonKm, signal, ageMaxMs }),
  surResultat: ({ stations, luA }) => {
    for (const s of stations) s.nom = etat.noms[s.id] ?? null;
    etat.stations = stations;
    etat.horsFlux = horsFluxDans(etat.zone, stations);
    etat.luA = luA;
    afficher();
    if (etat.zone.nom == null) nommerZone();
  },
  surMessage: message,
});

const vue = creerVueMobile({ bouton: $("bascule"), carte, surCarteAffichee: () => carte.afficherZone(etat.zone) });

// ---------- État : adresse de la page et mémoire du navigateur ----------

function codeValide(code) {
  return CONFIG.carburants.some((c) => c.code === code);
}

/** Carburant lu dans l'adresse : #carburant=e10&… (l'ancien format #e10 marche aussi), ou null. */
function codeDepuisAdresse(p) {
  const ancien = location.hash.slice(1);
  return [ancien, p.get("carburant")].find(codeValide) ?? null;
}

/** Priorité : adresse de la page, puis dernière visite, puis réglages par défaut. */
function etatInitial() {
  const p = lireParametresPage();
  const m = memoire.lire();
  return {
    zone: zoneDepuisParametres(p) ?? zoneValide(m.zone) ?? { ...CONFIG.zoneParDefaut },
    code: codeDepuisAdresse(p) ?? (codeValide(m.code) ? m.code : CONFIG.carburantParDefaut),
  };
}

function memoriser() {
  ecrireParametresPage({ carburant: etat.code, ...parametresDeZone(etat.zone) });
  memoire.ecrire({ zone: etat.zone, code: etat.code });
}

// ---------- Actions ----------

function changerZone(partiel, { ajuster = true } = {}) {
  etat.zone = { ...etat.zone, ...partiel };
  memoriser();
  carte.afficherZone(etat.zone, { ajuster });
  controles.majRayon(etat.zone.rayonKm);
  chargeur.lancerBientot(); // tampon : on attend que la zone ne bouge plus
}

function choisirCarburant(code) {
  etat.code = code;
  memoriser();
  afficher(); // toutes les stations sont déjà chargées : rien à demander à l'API
}

/** Donne un nom lisible à une zone placée à la main (« rue Blatin, Clermont-Ferrand »). */
async function nommerZone() {
  const zone = etat.zone;
  const nom = await nommerPoint(zone).catch(() => null);
  if (etat.zone !== zone) return; // la zone a encore bougé entre-temps
  zone.nom = nom ?? "ce point";
  memoriser();
  afficher();
}

/** Stations ajoutées à la main dans la zone, sauf si le flux en contient déjà une au même endroit. */
function horsFluxDans(zone, stations) {
  return etat.horsFluxTous
    .map((h) => ({ ...h, distance: distanceKm(zone, h) }))
    .filter((h) => h.distance <= zone.rayonKm)
    .filter((h) => !stations.some((s) => distanceKm(h, s) * 1000 < CONFIG.rayonDoublonMetres));
}

// ---------- Affichage ----------

function message(texte) {
  $("resume").textContent = texte;
}

function afficher() {
  const selection = selectionner(etat.stations, etat.code);
  afficherOnglets();
  afficherResume(selection);
  afficherClassement($("classement"), selection, { surVoir: vue.montrerSurCarte });
  afficherRuptures($("ruptures"), selection);
  afficherNonSuivies($("non-suivies"), etat.horsFlux);
  carte.afficherPoints(pointsCarte(selection, etat.horsFlux));
}

function afficherOnglets() {
  const nombres = compterParCarburant(etat.stations);
  $("carburants").replaceChildren(
    ...CONFIG.carburants
      .filter(({ code }) => nombres[code] > 0 || code === etat.code)
      .map(({ code, nom }) =>
        el(
          "button",
          { type: "button", class: "onglet", "aria-pressed": String(code === etat.code), onclick: () => choisirCarburant(code) },
          nom,
          el("span", { class: "compte" }, nombres[code]),
        ),
      ),
  );
}

function afficherResume({ enVente, min, max }) {
  const { rayonKm, nom } = etat.zone;
  const contexte = `${rayonKm} km autour de ${nom ?? "ce point"} · prix lus à ${heure(etat.luA)}`;
  const ecartPlein = (max - min) * CONFIG.pleinLitres;

  const chiffres =
    enVente.length === 0
      ? ["Aucune station ne vend ce carburant ici."]
      : [
          el("strong", {}, enVente.length > 1 ? `${enVente.length} stations` : "1 station"),
          ` · de ${prixLitre(min)} à ${prixLitre(max)}`,
          ecartPlein > 0 && ` · jusqu'à ${montant(ecartPlein)} d'écart sur un plein`,
        ];
  $("resume").replaceChildren(el("span", { class: "chiffres" }, chiffres), el("span", { class: "contexte" }, contexte));
}

// ---------- Démarrage ----------

/** Lit un fichier JSON du site ; renvoie `parDefaut` s'il manque, pour ne pas bloquer la page. */
async function lireJson(chemin, parDefaut) {
  try {
    const reponse = await fetch(chemin, { cache: "no-cache" });
    return reponse.ok ? await reponse.json() : parDefaut;
  } catch {
    return parDefaut;
  }
}

async function demarrer() {
  $("lien-depot").href = CONFIG.site.depot;
  $("actualiser").addEventListener("click", () => chargeur.lancer({ ageMaxMs: CONFIG.reseau.actualiserApresSecondes * 1000 }));
  window.addEventListener("hashchange", () => {
    const p = lireParametresPage();
    etat.code = codeDepuisAdresse(p) ?? etat.code;
    const zone = zoneDepuisParametres(p);
    if (zone) changerZone(zone);
    else afficher();
  });

  carte.afficherZone(etat.zone);
  controles.majRayon(etat.zone.rayonKm);
  memoriser();

  const [noms, horsFlux] = await Promise.all([lireJson("data/noms.json", {}), lireJson("data/hors-flux.json", [])]);
  etat.noms = noms;
  etat.horsFluxTous = horsFlux.map((h) => ({ ...h, adresse: joliTexte(h.adresse) }));

  chargeur.lancer();
}

demarrer();
