/**
 * Konfiguration
 * Liest .env (ohne Fremdbibliothek) und stellt Standardwerte bereit.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const WURZEL = path.resolve(HIER, '..');
// Ablageort der Daten; über SHK_DATENVERZEICHNIS umstellbar (z. B. für Tests
// oder ein Datenverzeichnis außerhalb des Projekts).
export const DATEN_VERZEICHNIS = process.env.SHK_DATENVERZEICHNIS
  ? path.resolve(process.env.SHK_DATENVERZEICHNIS)
  : path.join(WURZEL, 'data');
export const OEFFENTLICH = path.join(WURZEL, 'public');

/** Minimaler .env-Parser (KEY=VALUE, # als Kommentar). */
function ladeEnvDatei(datei) {
  if (!fs.existsSync(datei)) return;
  const inhalt = fs.readFileSync(datei, 'utf8');
  for (const zeile of inhalt.split(/\r?\n/)) {
    const t = zeile.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx < 1) continue;
    const key = t.slice(0, idx).trim();
    let wert = t.slice(idx + 1).trim();
    if (
      (wert.startsWith('"') && wert.endsWith('"')) ||
      (wert.startsWith("'") && wert.endsWith("'"))
    ) {
      wert = wert.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = wert;
  }
}

ladeEnvDatei(path.join(WURZEL, '.env'));

fs.mkdirSync(DATEN_VERZEICHNIS, { recursive: true });

/** Sitzungsgeheimnis: aus .env oder einmalig erzeugt und in data/ abgelegt. */
function sitzungsGeheimnis() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const datei = path.join(DATEN_VERZEICHNIS, '.session-secret');
  if (fs.existsSync(datei)) return fs.readFileSync(datei, 'utf8').trim();
  const neu = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(datei, neu, { mode: 0o600 });
  return neu;
}

export const CONFIG = {
  port: Number(process.env.PORT || 3000),
  apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
  modell: (process.env.SHK_AI_MODEL || 'claude-sonnet-5').trim(),
  apiBasis: (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, ''),
  sessionSecret: sitzungsGeheimnis(),
  secureCookies: process.env.SECURE_COOKIES === '1',
  registrierungGesperrt: process.env.DISABLE_REGISTRATION === '1',
};

export const KI_AKTIV = Boolean(CONFIG.apiKey);
