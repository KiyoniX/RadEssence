// Carte Leaflet (variable globale L, chargée par index.html).
import { CONFIG } from "./config.js";
import { depuis, el, lienGoogleMaps, nomStation, prixLitre } from "./format.js";

/** Vert pour le moins cher, rouge pour le plus cher. */
function couleur(prix, { min, max }) {
  const t = max > min ? (prix - min) / (max - min) : 0;
  return `hsl(${Math.round(120 * (1 - t))}, 70%, 40%)`;
}

const GRIS = "#8a8a8a";

/**
 * Crée la carte dans `conteneur`.
 * `surClic(id)` est appelé quand on clique sur une station.
 * Renvoie { afficher(selection, horsFlux), montrer(id) }.
 */
export function creerCarte(conteneur, { surClic }) {
  const centre = [CONFIG.centre.lat, CONFIG.centre.lon];
  const carte = L.map(conteneur).setView(centre, 12);
  L.tileLayer(CONFIG.tuiles.url, { attribution: CONFIG.tuiles.attribution, maxZoom: 19 }).addTo(carte);
  L.circle(centre, {
    radius: CONFIG.rayonKm * 1000,
    color: GRIS,
    weight: 1,
    dashArray: "4 6",
    fill: false,
    interactive: false,
  }).addTo(carte);
  ajouterLegende(carte);

  const calque = L.layerGroup().addTo(carte);
  const marqueurs = new Map();

  function afficher(selection, horsFlux) {
    calque.clearLayers();
    marqueurs.clear();

    for (const s of horsFlux) {
      L.circleMarker([s.lat, s.lon], { radius: 6, color: "#fff", weight: 2, fillColor: GRIS, fillOpacity: 1 })
        .bindTooltip(`${nomStation(s)} : prix non publiés`)
        .bindPopup(() => bulle(s, null))
        .addTo(calque);
    }

    // Du plus cher au moins cher : les stations les moins chères sont dessinées par-dessus.
    for (const s of [...selection.enVente].reverse()) {
      const c = s.carburants[selection.code];
      const marqueur = L.circleMarker([s.lat, s.lon], {
        radius: s.rang === 1 ? 11 : 8,
        color: "#fff",
        weight: 2,
        fillColor: couleur(c.prix, selection),
        fillOpacity: 1,
      })
        .bindTooltip(prixLitre(c.prix), { direction: "top" })
        .bindPopup(() => bulle(s, c))
        .on("click", () => surClic(s.id))
        .addTo(calque);
      marqueurs.set(s.id, marqueur);
    }
  }

  function montrer(id) {
    const marqueur = marqueurs.get(id);
    if (!marqueur) return;
    carte.flyTo(marqueur.getLatLng(), Math.max(carte.getZoom(), 15), { duration: 0.6 });
    marqueur.openPopup();
    conteneur.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return { afficher, montrer };
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
    el(
      "div",
      { class: "legende" },
      el("span", { class: "degrade" }),
      el("span", {}, "moins cher → plus cher"),
    );
  legende.addTo(carte);
}
