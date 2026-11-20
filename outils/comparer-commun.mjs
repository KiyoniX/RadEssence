// Commun à RadEssence et ControVisite : garder ce fichier identique dans les deux dépôts.
//
// Vérifie que les fichiers communs de ce dépôt sont identiques à ceux d'un autre dépôt de la famille.
// Usage : npm run verifier-commun -- ../RadEssence
// Sort en erreur (code 1) s'il y a une différence, pour pouvoir servir dans un script.
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const PARTAGES = ["js/commun", "css/commun.css", "tests/commun", "outils/comparer-commun.mjs"];

const autre = process.argv[2];
if (!autre) {
  console.error("Indique le dossier de l'autre dépôt : npm run verifier-commun -- ../RadEssence");
  process.exit(2);
}

/** Tous les fichiers sous un chemin (fichier seul ou dossier), en chemins relatifs à `racine`. */
async function lister(racine, chemin) {
  const complet = join(racine, chemin);
  try {
    const entrees = await readdir(complet, { withFileTypes: true });
    const listes = await Promise.all(entrees.map((e) => lister(racine, join(chemin, e.name))));
    return listes.flat();
  } catch (erreur) {
    if (erreur.code === "ENOTDIR") return [relative(racine, complet)];
    if (erreur.code === "ENOENT") return [];
    throw erreur;
  }
}

const lire = (racine, fichier) => readFile(join(racine, fichier), "utf8").catch(() => null);

let ecarts = 0;
for (const chemin of PARTAGES) {
  const fichiers = new Set([...(await lister(".", chemin)), ...(await lister(autre, chemin))]);
  for (const fichier of [...fichiers].sort()) {
    const [ici, la] = await Promise.all([lire(".", fichier), lire(autre, fichier)]);
    if (ici === la) continue;
    ecarts++;
    console.log(ici == null ? `absent ici      ${fichier}` : la == null ? `absent là-bas   ${fichier}` : `différent       ${fichier}`);
  }
}

console.log(ecarts ? `\n${ecarts} fichier(s) commun(s) à synchroniser.` : "Fichiers communs identiques.");
process.exit(ecarts ? 1 : 0);
