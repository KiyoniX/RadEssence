// Sur mobile, on voit la liste OU la carte : <body data-vue="liste|carte">, le CSS fait le reste
// (css/base.css, en bas). Sur ordinateur, data-vue ne change rien à l'affichage.

/**
 * @param bouton               bouton flottant de bascule
 * @param carte                objet renvoyé par creerCarte()
 * @param surCarteAffichee()   appelée quand on passe à la carte par le bouton (pour la recadrer)
 * @returns {{ montrerSurCarte(id) }}
 */
export function creerVueMobile({ bouton, carte, surCarteAffichee }) {
  function changer(vue, { recadrer = true } = {}) {
    document.body.dataset.vue = vue;
    bouton.textContent = vue === "carte" ? "☰ Liste" : "🗺️ Carte";
    carte.redimensionner(); // la carte était masquée : elle doit recalculer sa taille
    if (vue === "carte" && recadrer) surCarteAffichee();
  }

  bouton.addEventListener("click", () => changer(document.body.dataset.vue === "carte" ? "liste" : "carte"));

  return {
    montrerSurCarte(id) {
      changer("carte", { recadrer: false });
      carte.montrer(id);
    },
  };
}
