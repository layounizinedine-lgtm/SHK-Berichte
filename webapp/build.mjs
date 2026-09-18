/**
 * Baut die Web-App als einzelne HTML-Seite – in zwei Varianten:
 *
 *   1. vorlage.html    -> dist/shk-berichte.html
 *      Für claude.ai: KI über die Sample-Fähigkeit (Konto des Nutzers),
 *      Speicherung privat je Nutzer über die Artifact-Datenbank.
 *
 *   2. standalone.html -> dist/shk-berichte-standalone.html
 *      Eigenständig, selbst hostbar (Netlify/Vercel/GitHub Pages/eigener
 *      Webspace): KI über einen vom Nutzer selbst hinterlegten
 *      Anthropic-API-Schlüssel (direkter Browser-Aufruf, Schlüssel bleibt
 *      im localStorage dieser Seite), Speicherung nur im Browser.
 *
 * Die Fachsprache-Engine und die Fachdatenbank werden aus server/ai/
 * übernommen – eine Quelle für Server-App und beide Web-App-Varianten.
 * Die ES-Module werden dabei zu einem Browser-Bündel zusammengefasst
 * (import/export entfernt, alles landet in einem gemeinsamen
 * Gültigkeitsbereich).
 *
 * Aufruf: node webapp/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..');

/** Reihenfolge = Abhängigkeitsreihenfolge. */
const MODULE = [
  'server/ai/glossar.js',
  'server/ai/prompts.js',
  'server/ai/wissen/grundlagen.js',
  'server/ai/wissen/sanitaer.js',
  'server/ai/wissen/heizung.js',
  'server/ai/wissen/gas.js',
  'server/ai/wissen/lueftung.js',
  'server/ai/wissen/versorgung.js',
  'server/ai/wissen/index.js',
  'server/ai/fachsprache.js',
  'server/ai/svg.js',
  'server/ai/offline.js',
];

const ZIELE = [
  { vorlage: 'vorlage.html', ausgabe: 'shk-berichte.html' },
  { vorlage: 'standalone.html', ausgabe: 'shk-berichte-standalone.html' },
];

/** Entfernt import-/export-Anweisungen, ohne den restlichen Code zu verändern. */
function entmodularisieren(quelle, datei) {
  let text = quelle;

  // import { a, b } from './x.js';  – ein- und mehrzeilig
  text = text.replace(/^import\s+[^;]*?from\s*['"][^'"]+['"];\s*$/gms, '');
  text = text.replace(/^import\s+['"][^'"]+['"];\s*$/gm, '');

  // export { a, b };  – reine Re-Exporte entfallen
  text = text.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gms, '');

  // export const / function / class / async function
  text = text.replace(/^export\s+(const|let|var|function|class|async\s+function)\b/gm, '$1');

  if (/^\s*(import|export)\b/m.test(text)) {
    throw new Error(`Nicht behandelte Modulanweisung in ${datei}`);
  }
  return text.trim();
}

function baueMotor() {
  const teile = MODULE.map((rel) => {
    const quelle = fs.readFileSync(path.join(WURZEL, rel), 'utf8');
    return `/* ---------- ${rel} ---------- */\n${entmodularisieren(quelle, rel)}`;
  });
  return teile.join('\n\n');
}

function baueSeite(vorlageDatei, motor) {
  const vorlage = fs.readFileSync(path.join(HIER, vorlageDatei), 'utf8');
  if (!vorlage.includes('/*__MOTOR__*/')) {
    throw new Error(`In ${vorlageDatei} fehlt die Marke /*__MOTOR__*/`);
  }
  // $ in der Ersetzung schützen (Template-Literale im Motor enthalten $-Zeichen)
  return vorlage.replace('/*__MOTOR__*/', () => motor);
}

const motor = baueMotor();
const zielVerzeichnis = path.join(HIER, 'dist');
fs.mkdirSync(zielVerzeichnis, { recursive: true });

for (const { vorlage, ausgabe } of ZIELE) {
  const seite = baueSeite(vorlage, motor);
  const ziel = path.join(zielVerzeichnis, ausgabe);
  fs.writeFileSync(ziel, seite);
  const kb = (Buffer.byteLength(seite) / 1024).toFixed(0);
  console.log(`Web-App gebaut: ${path.relative(WURZEL, ziel)} (${kb} kB)`);
}
