/**
 * SHK-Berichte – Webserver
 * ---------------------------------------------------------------------------
 * Start:  node server/index.js      (oder: npm start)
 * Läuft ohne Fremdbibliotheken – nur mit Node-Bordmitteln.
 */
import http from 'node:http';
import { CONFIG, KI_AKTIV } from './config.js';
import { db } from './db.js';
import { statisch, fehler, json, klientIp } from './http.js';
import { aktuellerBenutzer } from './auth.js';
import { authRouten } from './routes/auth.js';
import { berichtRouten } from './routes/berichte.js';
import { kiRouten } from './routes/ki.js';
import { wissenRouten } from './routes/wissen.js';

const SICHERHEITS_HEADER = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'microphone=(self), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
};

/** Einfacher CSRF-Schutz: bei schreibenden Anfragen muss die Herkunft passen. */
function herkunftOk(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const herkunft = req.headers.origin;
  if (!herkunft) return true; // z. B. curl / Tests ohne Origin
  try {
    const u = new URL(herkunft);
    return u.host === req.headers.host;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SICHERHEITS_HEADER)) res.setHeader(k, v);

  let pfad;
  try {
    pfad = new URL(req.url, 'http://localhost').pathname;
  } catch {
    return fehler(res, 400, 'Ungültige Anfrage.');
  }

  try {
    if (pfad.startsWith('/api/')) {
      if (!herkunftOk(req)) return fehler(res, 403, 'Anfrage von fremder Herkunft abgelehnt.');

      const benutzer = aktuellerBenutzer(req);

      // Jede Routengruppe liefert false, wenn sie nicht zuständig ist.
      for (const gruppe of [authRouten, berichtRouten, wissenRouten, kiRouten]) {
        const ergebnis = await gruppe(req, res, pfad, benutzer);
        if (ergebnis !== false || res.writableEnded) return undefined;
      }
      if (!res.writableEnded) return fehler(res, 404, 'Unbekannter Endpunkt.');
      return undefined;
    }

    // Statische Dateien; unbekannte Pfade liefern die App (Client-Routing)
    if (statisch(req, res, pfad)) return undefined;
    return statisch(req, res, '/index.html') ? undefined : fehler(res, 404, 'Nicht gefunden.');
  } catch (err) {
    console.error(`[fehler] ${req.method} ${pfad} (${klientIp(req)}):`, err.message);
    if (!res.headersSent) return fehler(res, err.status || 500, err.message || 'Serverfehler.');
    return res.end();
  }
});

// Abgelaufene Sitzungen regelmäßig aufräumen
db.sitzungenAufraeumen();
setInterval(() => db.sitzungenAufraeumen(), 6 * 3600_000).unref();

server.listen(CONFIG.port, () => {
  const kiText = KI_AKTIV
    ? `KI aktiv (Modell ${CONFIG.modell})`
    : 'KI nicht konfiguriert – Fachmodus offline (ANTHROPIC_API_KEY in .env setzen)';
  console.log('');
  console.log('  SHK-Berichte');
  console.log(`  Server läuft auf http://localhost:${CONFIG.port}`);
  console.log(`  Speicher: ${db.art === 'sqlite' ? 'SQLite (data/shk-berichte.db)' : 'JSON (data/store.json)'}`);
  console.log(`  ${kiText}`);
  console.log('');
});

export { server };

// Kleiner Hinweis: 'json' wird hier nur re-exportiert, damit Tests darauf zugreifen können.
export { json };
