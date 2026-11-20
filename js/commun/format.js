// Commun à RadEssence et ControVisite : garder ce fichier identique dans les deux dépôts
// (vérification : npm run verifier-commun -- ../AutreDepot).
//
// Petites fonctions d'affichage, sans état. Seule el() a besoin d'un navigateur.

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const eurosRonds = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurosMillimes = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 3 });
const relatif = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const heureMinute = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** 67 € pour un montant rond, 67,50 € sinon. */
export const montant = (valeur) => (Number.isInteger(valeur) ? eurosRonds : euros).format(valeur);
/** Prix au litre, au millième : 2,007 €. */
export const prixLitre = (prix) => eurosMillimes.format(prix);
export const heure = (date) => heureMinute.format(date); // 14:32
export const kilometres = (km) => `${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;

/** « il y a 3 heures », « il y a 5 mois », « il y a 6 ans »… */
export function depuis(date, maintenant = new Date()) {
  const minutes = Math.round((date - maintenant) / 60000);
  if (Math.abs(minutes) < 60) return relatif.format(minutes, "minute");
  const heures = Math.round(minutes / 60);
  if (Math.abs(heures) < 48) return relatif.format(heures, "hour");
  const jours = Math.round(heures / 24);
  if (Math.abs(jours) < 45) return relatif.format(jours, "day");
  const mois = Math.round(jours / 30.44);
  if (Math.abs(mois) < 18) return relatif.format(mois, "month");
  return relatif.format(Math.round(jours / 365.25), "year");
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

/** Lien Google Maps vers un point {lat, lon}. */
export const lienGoogleMaps = ({ lat, lon }) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

/** « 0473123456 » → « 04 73 12 34 56 » ; laisse intact un autre format. */
export const telephoneLisible = (tel) => (/^0\d{9}$/.test(tel) ? tel.replace(/(\d{2})(?=\d)/g, "$1 ") : tel);

/** Vert pour le moins cher, rouge pour le plus cher : même couleur sur la carte et dans la liste. */
export function couleurPrix(prix, { min, max }) {
  const t = max > min ? (prix - min) / (max - min) : 0;
  return `hsl(${Math.round(120 * (1 - t))}, 70%, 40%)`;
}

/**
 * Crée un élément DOM. Le texte passe toujours par des nœuds texte : rien venant des données n'est
 * interprété comme du HTML.
 *   el("a", { class: "lien", href: "…", onclick: f }, "texte", autreElement, [tableau, d'enfants])
 * Les enfants null, undefined ou false sont ignorés.
 */
export function el(balise, attributs = {}, ...enfants) {
  const noeud = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur == null || valeur === false) continue;
    if (nom.startsWith("on")) noeud.addEventListener(nom.slice(2), valeur);
    else if (nom === "class") noeud.className = valeur;
    else noeud.setAttribute(nom, valeur === true ? "" : valeur);
  }
  for (const enfant of enfants.flat(Infinity)) {
    if (enfant == null || enfant === false) continue;
    noeud.append(enfant instanceof Node ? enfant : String(enfant));
  }
  return noeud;
}
