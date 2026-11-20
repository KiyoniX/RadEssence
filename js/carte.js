// Carte Leaflet (variable globale L, chargée par index.html).
import { CONFIG } from "./config.js";
import { couleurPrix, depuis, el, lienGoogleMaps, nomStation, prixLitre } from "./format.js";

const GRIS = "#8a8a8a";
const BLEU_ZONE = "#0b6bcb";

/**
 * Crée la carte dans `conteneur`.
 *   surClicStation(id)          clic sur une station
 *   surDeplacerCentre({lat, lon}) clic sur la carte ou point central déplacé
 * Renvoie { afficherZone, apercuRayon, afficherStations, montrer, redimensionner }.
 */
export function creerCarte(conteneur, { surClicStation, surDeplacerCentre }) {
  const { lat, lon } = CONFIG.zoneParDefaut;
  const carte = L.map(conteneur).setView([lat, lon], 12);
  L.tileLayer(CONFIG.tuiles.url, { attribution: CONFIG.tuiles.attribution, maxZoom: 19 }).addTo(carte);
  ajouterLegende(carte);

  // La zone : un cercle et un point central qu'on peut faire glisser.
  const cercle = L.circle([lat, lon], {
    radius: 1000,
    color: BLEU_ZONE,
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

  function afficherStations(selection, horsFlux) {
    calque.clearLayers();
    marqueurs.clear();
    const options = { color: "#fff", weight: 2, fillOpacity: 1, bubblingMouseEvents: false };

    for (const s of horsFlux) {
      L.circleMarker([s.lat, s.lon], { ...options, radius: 6, fillColor: GRIS })
        .bindTooltip(`${nomStation(s)} : prix non publiés`)
        .bindPopup(() => bulle(s, null))
        .addTo(calque);
    }

    // Du plus cher au moins cher : les stations les moins chères sont dessinées par-dessus.
    for (const s of [...selection.enVente].reverse()) {
      const c = s.carburants[selection.code];
      const marqueur = L.circleMarker([s.lat, s.lon], {
        ...options,
        radius: s.rang === 1 ? 11 : 8,
        fillColor: couleurPrix(c.prix, selection),
      })
        .bindTooltip(prixLitre(c.prix), { direction: "top" })
        .bindPopup(() => bulle(s, c))
        .on("click", () => surClicStation(s.id))
        .addTo(calque);
      marqueurs.set(s.id, marqueur);
    }
  }

  function montrer(id) {
    const marqueur = marqueurs.get(id);
    if (!marqueur) return;
    carte.flyTo(marqueur.getLatLng(), Math.max(carte.getZoom(), 15), { duration: 0.6 });
    marqueur.openPopup();
  }

  /** À appeler quand la carte change de taille ou redevient visible (bascule mobile). */
  const redimensionner = () => carte.invalidateSize();

  return { afficherZone, apercuRayon, afficherStations, montrer, redimensionner };
}

/** Contenu de la bulle d'une station. `c` = carburant affiché, ou null pour une station hors flux. */
function bulle(s, c) {
  return el(
    "div",
    { class: "bulle" },
    el("strong", {}, nomStation(s)),
    el("br"),
    `${s.cp} ${s.ville}`,
    el("br"),
    c ? el("span", { class: "bulle-prix" }, prixLitre(c.prix)) : "Prix non publiés",
    c && ` · ${depuis(c.maj)}`,
    el("br"),
    el("a", { href: lienGoogleMaps(s), target: "_blank", rel: "noopener" }, "Ouvrir dans Google Maps ↗"),
    s.id && el("small", { class: "bulle-id" }, `n° ${s.id}`),
  );
}

function ajouterLegende(carte) {
  const legende = L.control({ position: "bottomleft" });
  legende.onAdd = () =>
    el("div", { class: "legende" }, el("span", { class: "degrade" }), el("span", {}, "moins cher → plus cher"));
  legende.addTo(carte);
}
