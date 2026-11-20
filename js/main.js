// Point d'entrée : charge les données, garde l'état (carburant choisi) et relie les morceaux.
import { CONFIG } from "./config.js";
import { chargerStations } from "./api.js";
import { compterParCarburant, selectionner } from "./selection.js";
import { afficherClassement, afficherNonSuivies, afficherRuptures, surligner } from "./classement.js";
import { creerCarte } from "./carte.js";
import { distanceKm, el, heure, joliTexte, montant, prixLitre } from "./format.js";

const $ = (id) => document.getElementById(id);

const etat = {
  stations: [], // stations du flux officiel
  horsFlux: [], // stations de data/hors-flux.json encore absentes du flux
  code: carburantDepuisUrl(),
  luA: null,
};

const carte = creerCarte($("carte"), { surClic: (id) => surligner($("classement"), id) });

/** Le carburant choisi est gardé dans l'URL (#e10) : on peut partager le lien. */
function carburantDepuisUrl() {
  const code = location.hash.slice(1);
  return CONFIG.carburants.some((c) => c.code === code) ? code : CONFIG.carburantParDefaut;
}

/** Lit un fichier JSON du site ; renvoie `parDefaut` s'il manque, pour ne pas bloquer la page. */
async function lireJson(chemin, parDefaut) {
  try {
    const reponse = await fetch(chemin, { cache: "no-cache" });
    return reponse.ok ? await reponse.json() : parDefaut;
  } catch {
    return parDefaut;
  }
}

async function charger() {
  $("resume").textContent = "Chargement des prix…";
  try {
    const [stations, noms, horsFlux] = await Promise.all([
      chargerStations(),
      lireJson("data/noms.json", {}),
      lireJson("data/hors-flux.json", []),
    ]);
    for (const s of stations) s.nom = noms[s.id] ?? null;

    etat.stations = stations;
    // Une station ajoutée à la main disparaît d'elle-même dès qu'elle apparaît dans le flux.
    etat.horsFlux = horsFlux
      .filter((h) => !stations.some((s) => distanceKm(h, s) * 1000 < CONFIG.rayonDoublonMetres))
      .map((h) => ({ ...h, adresse: joliTexte(h.adresse) }));
    etat.luA = new Date();
    afficher();
  } catch (erreur) {
    console.error(erreur);
    $("resume").textContent = "Impossible de lire les prix pour le moment. Réessaie dans quelques minutes.";
  }
}

function afficher() {
  const selection = selectionner(etat.stations, etat.code);
  afficherOnglets();
  afficherResume(selection);
  afficherClassement($("classement"), selection, { surVoir: (id) => carte.montrer(id) });
  afficherRuptures($("ruptures"), selection);
  afficherNonSuivies($("non-suivies"), etat.horsFlux);
  carte.afficher(selection, etat.horsFlux);
}

function afficherOnglets() {
  const nombres = compterParCarburant(etat.stations);
  $("carburants").replaceChildren(
    ...CONFIG.carburants
      .filter(({ code }) => nombres[code] > 0)
      .map(({ code, nom }) =>
        el(
          "button",
          {
            type: "button",
            class: "onglet",
            "aria-pressed": String(code === etat.code),
            onclick: () => choisir(code),
          },
          nom,
          el("span", { class: "compte" }, nombres[code]),
        ),
      ),
  );
}

function afficherResume({ code, enVente, min, max }) {
  const nom = CONFIG.carburants.find((c) => c.code === code).nom;
  const zone = `dans un rayon de ${CONFIG.rayonKm} km autour de ${CONFIG.centre.nom}`;
  const lu = `Prix lus à ${heure(etat.luA)}.`;

  if (enVente.length === 0) {
    $("resume").textContent = `${nom} : aucune station ${zone}. ${lu}`;
    return;
  }
  const ecartPlein = (max - min) * CONFIG.pleinLitres;
  $("resume").textContent =
    `${nom} : de ${prixLitre(min)} à ${prixLitre(max)} le litre, ${enVente.length} stations ${zone}. ` +
    `Jusqu'à ${montant(ecartPlein)} d'écart sur un plein de ${CONFIG.pleinLitres} L. ${lu}`;
}

function choisir(code) {
  etat.code = code;
  history.replaceState(null, "", `#${code}`);
  afficher();
}

window.addEventListener("hashchange", () => choisir(carburantDepuisUrl()));
$("actualiser").addEventListener("click", charger);
$("lien-depot").href = CONFIG.depot;
charger();
