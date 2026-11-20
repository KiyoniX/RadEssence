// Toutes les requêtes passent ici : écart minimal entre deux requêtes vers une même API,
// et nouveaux essais espacés quand l'API répond 429 (trop de requêtes).
// Réglages lus dans config.js : CONFIG.reseau.tentatives.
import { CONFIG } from "../config.js";

export class TropDeRequetes extends Error {
  constructor(hote) {
    super(`${hote} : trop de requêtes (HTTP 429)`);
    this.name = "TropDeRequetes";
  }
}

/** Attend `ms` millisecondes ; s'interrompt si `signal` est annulé. */
function pause(ms, signal) {
  return new Promise((resoudre, rejeter) => {
    if (signal?.aborted) return rejeter(signal.reason);
    const minuterie = setTimeout(resoudre, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(minuterie);
        rejeter(signal.reason);
      },
      { once: true },
    );
  });
}

// Prochain créneau libre pour chaque API : chaque requête réserve le sien.
const prochainDepart = new Map();

async function attendreSonTour(hote, ecartMs, signal) {
  const maintenant = Date.now();
  const depart = Math.max(maintenant, prochainDepart.get(hote) ?? 0);
  prochainDepart.set(hote, depart + ecartMs);
  if (depart > maintenant) await pause(depart - maintenant, signal);
}

/** GET d'un JSON, avec espacement et nouveaux essais. */
export async function requeteJson(url, { signal, ecartMs = 0 } = {}) {
  const { host } = new URL(url);
  for (let essai = 1; ; essai++) {
    await attendreSonTour(host, ecartMs, signal);
    const reponse = await fetch(url, { signal });
    if (reponse.status === 429) {
      if (essai >= CONFIG.reseau.tentatives) throw new TropDeRequetes(host);
      await pause(1000 * 2 ** essai, signal); // 2 s, puis 4 s…
      continue;
    }
    if (!reponse.ok) throw new Error(`${host} : HTTP ${reponse.status}`);
    return reponse.json();
  }
}
