// Commun à RadEssence et ControVisite : garder ce fichier identique dans les deux dépôts
// (vérification : npm run verifier-commun -- ../AutreDepot).
//
// Commandes de la zone dans l'en-tête : recherche d'adresse, « Autour de moi », curseur du rayon.
// Éléments attendus dans index.html : #recherche, #recherche-texte, #suggestions, #ma-position, #rayon, #rayon-valeur.
// Réglages lus dans config.js : CONFIG.rayon, CONFIG.reseau.attenteSaisieMs.
import { CONFIG } from "../config.js";
import { rechercherLieux } from "./geocodage.js";
import { el } from "./format.js";

const $ = (id) => document.getElementById(id);

/**
 * @param surRayonProvisoire(km)   pendant que le curseur bouge (aperçu)
 * @param surRayon(km)             curseur relâché
 * @param surLieu({lat, lon, nom}) lieu choisi (recherche ou position)
 * @param surErreur(message)
 * @returns {{ majRayon(km) }}
 */
export function creerControlesZone({ surRayonProvisoire, surRayon, surLieu, surErreur }) {
  brancherRayon(surRayonProvisoire, surRayon);
  brancherRecherche(surLieu, surErreur);
  brancherPosition(surLieu, surErreur);
  return {
    majRayon(km) {
      $("rayon").value = km;
      $("rayon-valeur").textContent = `${km} km`;
    },
  };
}

function brancherRayon(surRayonProvisoire, surRayon) {
  const curseur = $("rayon");
  curseur.min = CONFIG.rayon.minKm;
  curseur.max = CONFIG.rayon.maxKm;
  curseur.addEventListener("input", () => {
    $("rayon-valeur").textContent = `${curseur.value} km`;
    surRayonProvisoire(Number(curseur.value));
  });
  curseur.addEventListener("change", () => surRayon(Number(curseur.value)));
}

function brancherRecherche(surLieu, surErreur) {
  const formulaire = $("recherche");
  const champ = $("recherche-texte");
  const liste = $("suggestions");

  let lieux = []; // suggestions affichées
  let pourTexte = ""; // texte auquel correspondent ces suggestions
  let actif = -1; // suggestion choisie au clavier
  let minuterie = null;
  let controleur = null;

  async function chercher(texte) {
    controleur?.abort();
    controleur = new AbortController();
    try {
      lieux = await rechercherLieux(texte, controleur.signal);
      pourTexte = texte;
      actif = -1;
      afficher();
    } catch (erreur) {
      if (erreur.name !== "AbortError") surErreur("Recherche d'adresse indisponible pour le moment.");
    }
  }

  function afficher() {
    liste.replaceChildren(
      ...lieux.map((lieu, i) =>
        el(
          "li",
          {
            role: "option",
            "aria-selected": String(i === actif),
            // mousedown plutôt que click : passe avant la perte de focus du champ
            onmousedown: (e) => {
              e.preventDefault();
              choisir(lieu);
            },
          },
          el("strong", {}, lieu.nom),
          el("small", {}, lieu.contexte),
        ),
      ),
    );
    liste.hidden = lieux.length === 0;
  }

  function fermer() {
    liste.hidden = true;
    actif = -1;
  }

  function choisir(lieu) {
    fermer();
    champ.value = lieu.nom;
    champ.blur();
    surLieu({ lat: lieu.lat, lon: lieu.lon, nom: lieu.nom });
  }

  champ.addEventListener("input", () => {
    clearTimeout(minuterie);
    const texte = champ.value.trim();
    if (texte.length < 3) return fermer(); // l'API demande au moins 3 caractères
    minuterie = setTimeout(() => chercher(texte), CONFIG.reseau.attenteSaisieMs);
  });

  champ.addEventListener("keydown", (e) => {
    if (liste.hidden || !lieux.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const pas = e.key === "ArrowDown" ? 1 : -1;
      actif = (actif + pas + lieux.length) % lieux.length;
      afficher();
    } else if (e.key === "Escape") {
      fermer();
    }
  });

  champ.addEventListener("blur", fermer);

  formulaire.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texte = champ.value.trim();
    if (texte.length < 3) return;
    clearTimeout(minuterie);
    if (texte !== pourTexte) await chercher(texte);
    if (lieux.length) choisir(lieux[Math.max(actif, 0)]);
    else surErreur(`Aucun lieu trouvé pour « ${texte} ».`);
  });
}

function brancherPosition(surLieu, surErreur) {
  const bouton = $("ma-position");
  bouton.addEventListener("click", () => {
    if (!navigator.geolocation) return surErreur("Ton navigateur ne donne pas ta position : cherche une ville.");
    bouton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        bouton.disabled = false;
        surLieu({ lat: coords.latitude, lon: coords.longitude, nom: "ta position" });
      },
      () => {
        bouton.disabled = false;
        surErreur("Position refusée ou indisponible : cherche une ville à la place.");
      },
      { timeout: 10000, maximumAge: 5 * 60000 },
    );
  });
}
