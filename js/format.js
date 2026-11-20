// Petites fonctions d'affichage, sans état.

const eurosLitre = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 3 });
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const relatif = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const heureMinute = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export const prixLitre = (prix) => eurosLitre.format(prix); // 2,007 €
export const montant = (valeur) => euros.format(valeur); // 11,90 €
export const heure = (date) => heureMinute.format(date); // 14:32
export const kilometres = (km) => `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;

/** « il y a 3 heures », « hier »… */
export function depuis(date, maintenant = new Date()) {
  const minutes = Math.round((date - maintenant) / 60000);
  if (Math.abs(minutes) < 60) return relatif.format(minutes, "minute");
  const heures = Math.round(minutes / 60);
  if (Math.abs(heures) < 48) return relatif.format(heures, "hour");
  return relatif.format(Math.round(heures / 24), "day");
}

/** Distance à vol d'oiseau entre deux objets {lat, lon}, en km. */
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const PETITS_MOTS = new Set(["de", "du", "des", "la", "le", "les", "et", "d", "l", "à", "au", "aux"]);

/** « 8 BOULEVARD WINSTON CHURCHILL » → « 8 Boulevard Winston Churchill ». Laisse intact un texte déjà en casse mixte. */
export function joliTexte(texte) {
  if (!texte || texte !== texte.toUpperCase()) return texte;
  return texte
    .toLowerCase()
    .replace(/[\p{L}]+/gu, (mot, position) =>
      position > 0 && PETITS_MOTS.has(mot) ? mot : mot[0].toUpperCase() + mot.slice(1),
    );
}

/** Nom affiché d'une station : « Enseigne, adresse » si l'enseigne est connue, sinon l'adresse. */
export const nomStation = (s) => (s.nom ? `${s.nom}, ${s.adresse}` : s.adresse);

export const lienGoogleMaps = (s) => `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`;

/**
 * Crée un élément DOM. Le texte passe toujours par des nœuds texte : rien venant des données n'est
 * interprété comme du HTML.
 *   el("a", { class: "lien", href: "…", onclick: f }, "texte", autreElement)
 */
export function el(balise, attributs = {}, ...enfants) {
  const noeud = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur == null || valeur === false) continue;
    if (nom.startsWith("on")) noeud.addEventListener(nom.slice(2), valeur);
    else if (nom === "class") noeud.className = valeur;
    else noeud.setAttribute(nom, valeur === true ? "" : valeur);
  }
  for (const enfant of enfants.flat()) {
    if (enfant == null || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : String(enfant));
  }
  return noeud;
}

/** Vert pour le moins cher, rouge pour le plus cher : même couleur sur la carte et dans la liste. */
export function couleurPrix(prix, { min, max }) {
  const t = max > min ? (prix - min) / (max - min) : 0;
  return `hsl(${Math.round(120 * (1 - t))}, 70%, 40%)`;
}
