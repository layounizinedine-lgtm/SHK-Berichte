/**
 * Kleine HTTP-Hilfsfunktionen (ohne Fremdbibliotheken).
 */
import fs from 'node:fs';
import path from 'node:path';
import { OEFFENTLICH } from './config.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

export function json(res, status, daten) {
  const body = JSON.stringify(daten);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function fehler(res, status, nachricht, extra = {}) {
  json(res, status, { fehler: nachricht, ...extra });
}

const MAX_BODY = 1_500_000; // 1,5 MB – reicht für lange Diktate und SVG

export function leseBody(req) {
  return new Promise((resolve, reject) => {
    let groesse = 0;
    const teile = [];
    req.on('data', (chunk) => {
      groesse += chunk.length;
      if (groesse > MAX_BODY) {
        reject(Object.assign(new Error('Anfrage zu groß'), { status: 413 }));
        req.destroy();
        return;
      }
      teile.push(chunk);
    });
    req.on('end', () => {
      const roh = Buffer.concat(teile).toString('utf8');
      if (!roh) return resolve({});
      try {
        resolve(JSON.parse(roh));
      } catch {
        reject(Object.assign(new Error('Ungültiges JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

export function cookies(req) {
  const roh = req.headers.cookie || '';
  const out = {};
  for (const teil of roh.split(';')) {
    const i = teil.indexOf('=');
    if (i < 1) continue;
    out[teil.slice(0, i).trim()] = decodeURIComponent(teil.slice(i + 1).trim());
  }
  return out;
}

export function setzeCookie(res, name, wert, { maxAge = 60 * 86400, secure = false } = {}) {
  const teile = [
    `${name}=${encodeURIComponent(wert)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) teile.push('Secure');
  const vorhanden = res.getHeader('Set-Cookie');
  const liste = vorhanden ? [].concat(vorhanden) : [];
  liste.push(teile.join('; '));
  res.setHeader('Set-Cookie', liste);
}

export function loescheCookie(res, name, { secure = false } = {}) {
  const teile = [`${name}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) teile.push('Secure');
  res.setHeader('Set-Cookie', teile.join('; '));
}

/** Statische Datei aus public/ ausliefern (mit Pfad-Absicherung). */
export function statisch(req, res, pfad) {
  const relativ = decodeURIComponent(pfad).replace(/^\/+/, '');
  const ziel = path.resolve(OEFFENTLICH, relativ === '' ? 'index.html' : relativ);
  if (!ziel.startsWith(OEFFENTLICH)) {
    res.writeHead(403).end('Verboten');
    return true;
  }
  let datei = ziel;
  if (!fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    if (fs.existsSync(path.join(datei, 'index.html'))) {
      datei = path.join(datei, 'index.html');
    } else {
      return false;
    }
  }
  const ext = path.extname(datei).toLowerCase();
  const typ = MIME[ext] || 'application/octet-stream';
  const stat = fs.statSync(datei);
  const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304).end();
    return true;
  }
  res.writeHead(200, {
    'Content-Type': typ,
    'Content-Length': stat.size,
    ETag: etag,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
  });
  fs.createReadStream(datei).pipe(res);
  return true;
}

/** Sehr einfacher Ratenbegrenzer (im Speicher, pro Schlüssel). */
export function ratenBegrenzer({ fenster = 60_000, maximum = 30 } = {}) {
  const eintraege = new Map();
  return function pruefe(schluessel) {
    const jetzt = Date.now();
    const liste = (eintraege.get(schluessel) || []).filter((t) => jetzt - t < fenster);
    if (liste.length >= maximum) {
      eintraege.set(schluessel, liste);
      return false;
    }
    liste.push(jetzt);
    eintraege.set(schluessel, liste);
    if (eintraege.size > 5000) {
      for (const [k, v] of eintraege) if (!v.some((t) => jetzt - t < fenster)) eintraege.delete(k);
    }
    return true;
  };
}

export function klientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unbekannt'
  );
}
