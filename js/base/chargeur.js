// Lance les chargements de données : un nouveau chargement annule le précédent, et lancerBientot()
// attend que l'utilisateur ait fini de bouger la zone (tampon contre les limites des API).
// Pendant un chargement, <body> porte la classe « chargement ».
// Réglages lus dans config.js : CONFIG.reseau.attenteDeplacementMs.
import { CONFIG } from "../config.js";
import { TropDeRequetes } from "./reseau.js";

const MESSAGES = {
  chargement: "Chargement des prix…",
  tropDeRequetes: "Trop de demandes en peu de temps : réessaie dans une minute.",
  erreur: "Impossible de lire les prix pour le moment. Réessaie dans quelques minutes.",
};

/**
 * @param charger(signal, options)  fonction asynchrone qui renvoie le résultat
 * @param surResultat(resultat)     appelée seulement si le chargement n'a pas été annulé entre-temps
 * @param surMessage(texte)         message d'attente ou d'erreur à afficher
 */
export function creerChargeur({ charger, surResultat, surMessage }) {
  let controleur = null;
  let minuterie = null;

  async function lancer(options = {}) {
    clearTimeout(minuterie);
    controleur?.abort();
    controleur = new AbortController();
    const { signal } = controleur;
    document.body.classList.add("chargement");
    surMessage(MESSAGES.chargement);
    try {
      const resultat = await charger(signal, options);
      if (!signal.aborted) surResultat(resultat);
    } catch (erreur) {
      if (signal.aborted) return;
      console.error(erreur);
      surMessage(erreur instanceof TropDeRequetes ? MESSAGES.tropDeRequetes : MESSAGES.erreur);
    } finally {
      if (!signal.aborted) document.body.classList.remove("chargement");
    }
  }

  function lancerBientot(options) {
    clearTimeout(minuterie);
    surMessage(MESSAGES.chargement);
    minuterie = setTimeout(() => lancer(options), CONFIG.reseau.attenteDeplacementMs);
  }

  return { lancer, lancerBientot };
}
