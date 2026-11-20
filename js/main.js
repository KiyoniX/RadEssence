// Point d'entrée : garde l'état (zone, carburant), charge les données et relie les morceaux.
import { CONFIG } from "./config.js";
import { chargerStations } from "./api.js";
import { nommerPoint } from "./geocodage.js";
import { TropDeRequetes } from "./reseau.js";
import { compterParCarburant, selectionner } from "./selection.js";
import { afficherClassement, afficherNonSuivies, afficherRuptures, surligner } from "./classement.js";
import { creerCarte } from "./carte.js";
import { creerControlesZone } from "./zone.js";
import { distanceKm, el, heure, joliTexte, montant, prixLitre } from "./format.js";

const $ = (id) => document.getElementById(id);
const CLE_MEMOIRE = "radessence";

const etat = {
  ...etatInitial(), // zone {lat, lon, rayonKm, nom} et code du carburant
  stations: [], // stations du flux dans la zone
  horsFlux: [], // stations de data/hors-flux.json dans la zone et absentes du flux
  noms: {}, // data/noms.json
  horsFluxTous: [], // data/hors-flux.json
  luA: null,
};

const carte = creerCarte($("carte"), {
  surClicStation: (id) => surligner($("classement"), id),
  surDeplacerCentre: ({ lat, lon }) => changerZone({ lat, lon, nom: null }, { ajuster: false }),
});

const controles = creerControlesZone({
  surRayonProvisoire: (km) => carte.apercuRayon(km),
  surRayon: (km) => changerZone({ rayonKm: km }),
  surLieu: (lieu) => changerZone(lieu),
  surErreur: message,
});

// ---------- État, adresse de la page et mémoire du navigateur ----------

function codeValide(code) {
  return CONFIG.carburants.some((c) => c.code === code);
}
function bornerRayon(km) {
  return Math.min(CONFIG.rayon.maxKm, Math.max(CONFIG.rayon.minKm, Math.round(km)));
}

function zoneValide(zone) {
  if (!zone || !Number.isFinite(zone.lat) || !Number.isFinite(zone.lon)) return null;
  return { lat: zone.lat, lon: zone.lon, rayonKm: bornerRayon(zone.rayonKm || CONFIG.zoneParDefaut.rayonKm), nom: zone.nom ?? null };
}

/** Adresse de la page : #carburant=e10&lat=45.777&lon=3.087&rayon=8 (l'ancien #e10 marche aussi). */
function lireAdresse() {
  const brut = location.hash.slice(1);
  if (codeValide(brut)) return { code: brut, zone: null };
  const p = new URLSearchParams(brut);
  const zone = zoneValide({ lat: parseFloat(p.get("lat")), lon: parseFloat(p.get("lon")), rayonKm: parseFloat(p.get("rayon")) });
  return { code: codeValide(p.get("carburant")) ? p.get("carburant") : null, zone };
}

/** Priorité : adresse de la page, puis dernière visite, puis réglages par défaut. */
function etatInitial() {
  let memoire = {};
  try {
    memoire = JSON.parse(localStorage.getItem(CLE_MEMOIRE)) ?? {};
  } catch {}
  const adresse = lireAdresse();
  return {
    zone: adresse.zone ?? zoneValide(memoire.zone) ?? { ...CONFIG.zoneParDefaut },
    code: adresse.code ?? (codeValide(memoire.code) ? memoire.code : CONFIG.carburantParDefaut),
  };
}

/** Écrit l'état dans l'adresse (lien partageable, précision ~100 m) et dans le navigateur. */
function memoriser() {
  const { lat, lon, rayonKm } = etat.zone;
  const parametres = new URLSearchParams({ carburant: etat.code, lat: lat.toFixed(3), lon: lon.toFixed(3), rayon: rayonKm });
  history.replaceState(null, "", `#${parametres}`);
  try {
    localStorage.setItem(CLE_MEMOIRE, JSON.stringify({ zone: etat.zone, code: etat.code }));
  } catch {}
}

// ---------- Actions ----------

function changerZone(partiel, { ajuster = true } = {}) {
  etat.zone = { ...etat.zone, ...partiel };
  memoriser();
  carte.afficherZone(etat.zone, { ajuster });
  controles.majRayon(etat.zone.rayonKm);
  chargerBientot();
}

function choisirCarburant(code) {
  etat.code = code;
  memoriser();
  afficher();
}

// Tampon : on attend que la zone ne bouge plus avant de charger.
let minuterie = null;
function chargerBientot() {
  clearTimeout(minuterie);
  message("Chargement des prix…");
  minuterie = setTimeout(() => {
    charger();
    if (etat.zone.nom == null) nommerZone();
  }, CONFIG.reseau.attenteDeplacementMs);
}

let controleur = null;
async function charger({ ageMaxMs } = {}) {
  controleur?.abort();
  controleur = new AbortController();
  const { signal } = controleur;
  const zone = etat.zone;
  document.body.classList.add("chargement");
  message("Chargement des prix…");
  try {
    const { stations, luA } = await chargerStations({ centre: zone, rayonKm: zone.rayonKm, signal, ageMaxMs });
    for (const s of stations) s.nom = etat.noms[s.id] ?? null;
    etat.stations = stations;
    etat.horsFlux = horsFluxDans(zone, stations);
    etat.luA = luA;
    afficher();
  } catch (erreur) {
    if (signal.aborted) return;
    console.error(erreur);
    message(
      erreur instanceof TropDeRequetes
        ? "Trop de demandes en peu de temps : réessaie dans une minute."
        : "Impossible de lire les prix pour le moment. Réessaie dans quelques minutes.",
    );
  } finally {
    if (!signal.aborted) document.body.classList.remove("chargement");
  }
}

/** Donne un nom lisible à une zone placée à la main (« rue Blatin, Clermont-Ferrand »). */
async function nommerZone() {
  const zone = etat.zone;
  let nom = null;
  try {
    nom = await nommerPoint(zone);
  } catch {}
  if (etat.zone !== zone) return; // la zone a encore bougé entre-temps
  zone.nom = nom ?? "ce point";
  memoriser();
  if (etat.luA) afficher();
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
  afficherClassement($("classement"), selection, { surVoir: voirSurCarte });
  afficherRuptures($("ruptures"), selection);
  afficherNonSuivies($("non-suivies"), etat.horsFlux);
  carte.afficherStations(selection, etat.horsFlux);
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

  if (enVente.length === 0) {
    $("resume").replaceChildren(
      el("span", { class: "chiffres" }, "Aucune station ne vend ce carburant ici."),
      el("span", { class: "contexte" }, contexte),
    );
    return;
  }
  const ecartPlein = (max - min) * CONFIG.pleinLitres;
  $("resume").replaceChildren(
    el(
      "span",
      { class: "chiffres" },
      el("strong", {}, enVente.length > 1 ? `${enVente.length} stations` : "1 station"),
      ` · de ${prixLitre(min)} à ${prixLitre(max)}`,
      ecartPlein > 0 && ` · jusqu'à ${montant(ecartPlein)} d'écart sur un plein`,
    ),
    el("span", { class: "contexte" }, contexte),
  );
}

// ---------- Vue mobile : liste ou carte ----------

function changerVue(vue, { recadrer = true } = {}) {
  document.body.dataset.vue = vue;
  $("bascule").textContent = vue === "carte" ? "☰ Liste" : "🗺️ Carte";
  carte.redimensionner(); // la carte était masquée : elle doit recalculer sa taille
  if (vue === "carte" && recadrer) carte.afficherZone(etat.zone);
}

function voirSurCarte(id) {
  changerVue("carte", { recadrer: false });
  carte.montrer(id);
}

// ---------- Démarrage ----------

async function lireJson(chemin, parDefaut) {
  try {
    const reponse = await fetch(chemin, { cache: "no-cache" });
    return reponse.ok ? await reponse.json() : parDefaut;
  } catch {
    return parDefaut;
  }
}

async function demarrer() {
  $("lien-depot").href = CONFIG.depot;
  $("bascule").addEventListener("click", () => changerVue(document.body.dataset.vue === "carte" ? "liste" : "carte"));
  $("actualiser").addEventListener("click", () => charger({ ageMaxMs: CONFIG.reseau.actualiserApresSecondes * 1000 }));
  window.addEventListener("hashchange", () => {
    const { code, zone } = lireAdresse();
    if (code) etat.code = code;
    if (zone) changerZone(zone);
    else afficher();
  });

  carte.afficherZone(etat.zone);
  controles.majRayon(etat.zone.rayonKm);
  memoriser();

  const [noms, horsFlux] = await Promise.all([lireJson("data/noms.json", {}), lireJson("data/hors-flux.json", [])]);
  etat.noms = noms;
  etat.horsFluxTous = horsFlux.map((h) => ({ ...h, adresse: joliTexte(h.adresse) }));

  await charger();
  if (etat.zone.nom == null) nommerZone();
}

demarrer();
