// L'état de la page vit à deux endroits :
//  - l'adresse (#cle=valeur&…) : un lien partagé rouvre la même recherche ;
//  - le stockage du navigateur : la visite suivante reprend la dernière recherche.

/** Paramètres de l'adresse de la page (partie après #). */
export const lireParametresPage = () => new URLSearchParams(location.hash.slice(1));

/** Remplace la partie après # sans ajouter d'entrée à l'historique du navigateur. */
export function ecrireParametresPage(objet) {
  history.replaceState(null, "", `#${new URLSearchParams(objet)}`);
}

/** Petit stockage JSON sous une clé ; ne casse pas la page si le navigateur le refuse (navigation privée…). */
export function creerMemoire(cle) {
  return {
    lire() {
      try {
        return JSON.parse(localStorage.getItem(cle)) ?? {};
      } catch {
        return {};
      }
    },
    ecrire(valeur) {
      try {
        localStorage.setItem(cle, JSON.stringify(valeur));
      } catch {}
    },
  };
}
