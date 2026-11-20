// Carte Leaflet (variable globale L, chargée par index.html) : la zone (cercle + point central à faire
// glisser) et des points colorés. Ce que montre chaque point est décidé par le site (js/marqueurs.js).
// Couleur de la zone : variable CSS --couleur-zone (css/site.css).
// Réglages lus dans config.js : CONFIG.zoneParDefaut, CONFIG.tuiles.
import { CONFIG } from "../config.js";
import { el } from "./format.js";

/**
 * Un point à afficher :
 *   { id, lat, lon, couleur, taille = 8, infobulle, bulle: () => Element, cliquable = true }
 * Les points sont dessinés dans l'ordre du tableau : le dernier passe au-dessus.
 *
 * @param conteneur                     élément qui reçoit la carte
 * @param surClicPoint(id)              clic sur un point cliquable
 * @param surDeplacerCentre({lat, lon}) clic sur la carte ou point central déplacé
 * @returns {{ afficherZone, apercuRayon, afficherPoints, montrer, redimensionner }}
 */
export function creerCarte(conteneur, { surClicPoint, surDeplacerCentre }) {
  const { lat, lon } = CONFIG.zoneParDefaut;
  const couleurZone = getComputedStyle(document.documentElement).getPropertyValue("--couleur-zone").trim() || "#0b6bcb";

  const carte = L.map(conteneur).setView([lat, lon], 12);
  L.tileLayer(CONFIG.tuiles.url, { attribution: CONFIG.tuiles.attribution, maxZoom: 19 }).addTo(carte);
  ajouterLegende(carte);

  // La zone : un cercle et un point central qu'on peut faire glisser.
  const cercle = L.circle([lat, lon], {
    radius: 1000,
    color: couleurZone,
    weight: 2,
    dashArray: "6 6",
    fillOpacity: 0.04,
    interactive: false,
  }).addTo(carte);
  const pointCentral = L.marker([lat, lon], {
    draggable: true,
    autoPan: true,
    zIndexOffset: 1000,
    title: "Fais-moi glisser pour déplacer la zone",
    icon: L.divIcon({ className: "centre-zone", iconSize: [22, 22] }),
  }).addTo(carte);
  pointCentral.on("drag", () => cercle.setLatLng(pointCentral.getLatLng()));
  pointCentral.on("dragend", () => {
    const { lat, lng } = pointCentral.getLatLng();
    surDeplacerCentre({ lat, lon: lng });
  });

  // Un clic sur la carte déplace la zone, sauf s'il sert juste à fermer une bulle.
  let derniereFermeture = 0;
  carte.on("popupclose", () => (derniereFermeture = Date.now()));
  carte.on("click", (e) => {
    if (Date.now() - derniereFermeture < 400) return;
    surDeplacerCentre({ lat: e.latlng.lat, lon: e.latlng.lng });
  });

  const calque = L.layerGroup().addTo(carte);
  const marqueurs = new Map();

  /** Place le cercle ; `ajuster` recadre la carte dessus. */
  function afficherZone({ lat, lon, rayonKm }, { ajuster = true } = {}) {
    cercle.setLatLng([lat, lon]).setRadius(rayonKm * 1000);
    pointCentral.setLatLng([lat, lon]);
    if (ajuster) carte.fitBounds(cercle.getBounds(), { padding: [10, 10] });
  }

  /** Change seulement la taille du cercle (pendant que le curseur bouge). */
  function apercuRayon(rayonKm) {
    cercle.setRadius(rayonKm * 1000);
  }

  function afficherPoints(points) {
    calque.clearLayers();
    marqueurs.clear();
    for (const p of points) {
      const marqueur = L.circleMarker([p.lat, p.lon], {
        radius: p.taille ?? 8,
        color: "#fff",
        weight: 2,
        fillColor: p.couleur,
        fillOpacity: 1,
        bubblingMouseEvents: false, // un clic sur un point ne déplace pas la zone
      })
        .bindTooltip(p.infobulle, { direction: "top" })
        .bindPopup(p.bulle)
        .addTo(calque);
      if (p.cliquable !== false) marqueur.on("click", () => surClicPoint(p.id));
      marqueurs.set(p.id, marqueur);
    }
  }

  /** Centre la carte sur un point et ouvre sa bulle. */
  function montrer(id) {
    const marqueur = marqueurs.get(id);
    if (!marqueur) return;
    carte.flyTo(marqueur.getLatLng(), Math.max(carte.getZoom(), 15), { duration: 0.6 });
    marqueur.openPopup();
  }

  /** À appeler quand la carte change de taille ou redevient visible (bascule mobile). */
  const redimensionner = () => carte.invalidateSize();

  return { afficherZone, apercuRayon, afficherPoints, montrer, redimensionner };
}

function ajouterLegende(carte) {
  const legende = L.control({ position: "bottomleft" });
  legende.onAdd = () =>
    el("div", { class: "legende" }, el("span", { class: "degrade" }), el("span", {}, "moins cher → plus cher"));
  legende.addTo(carte);
}
