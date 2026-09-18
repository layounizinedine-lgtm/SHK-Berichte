/**
 * Anmeldung, Registrierung, Sitzungen.
 * Passwörter werden mit scrypt gehasht (Node-Bordmittel, kein bcrypt nötig).
 */
import crypto from 'node:crypto';
import { db } from './db.js';
import { CONFIG } from './config.js';
import { cookies, setzeCookie, loescheCookie } from './http.js';

export const COOKIE_NAME = 'shk_sid';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPasswort(passwort) {
  const salz = crypto.randomBytes(16);
  const hash = crypto.scryptSync(passwort.normalize('NFKC'), salz, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salz.toString('hex')}$${hash.toString('hex')}`;
}

export function pruefePasswort(passwort, gespeichert) {
  try {
    const [art, N, r, p, salzHex, hashHex] = String(gespeichert).split('$');
    if (art !== 'scrypt') return false;
    const salz = Buffer.from(salzHex, 'hex');
    const erwartet = Buffer.from(hashHex, 'hex');
    const hash = crypto.scryptSync(passwort.normalize('NFKC'), salz, erwartet.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    return crypto.timingSafeEqual(hash, erwartet);
  } catch {
    return false;
  }
}

export function emailGueltig(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim()) && email.length < 200;
}

export function registriere({ email, passwort, name, betrieb, lehrjahr }) {
  const mail = String(email || '').trim().toLowerCase();
  if (!emailGueltig(mail)) throw Object.assign(new Error('Bitte eine gültige E-Mail-Adresse angeben.'), { status: 400 });
  if (typeof passwort !== 'string' || passwort.length < 8) {
    throw Object.assign(new Error('Das Passwort muss mindestens 8 Zeichen haben.'), { status: 400 });
  }
  if (db.benutzerPerEmail(mail)) {
    throw Object.assign(new Error('Für diese E-Mail-Adresse gibt es bereits ein Konto.'), { status: 409 });
  }
  return db.benutzerAnlegen({
    email: mail,
    passwort: hashPasswort(passwort),
    name: String(name || '').slice(0, 120),
    betrieb: String(betrieb || '').slice(0, 160),
    lehrjahr: Math.min(4, Math.max(1, Number(lehrjahr) || 1)),
  });
}

export function anmelden(res, benutzerId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sitzungAnlegen(benutzerId, token, 60);
  setzeCookie(res, COOKIE_NAME, token, { maxAge: 60 * 86400, secure: CONFIG.secureCookies });
  return token;
}

export function abmelden(req, res) {
  const token = cookies(req)[COOKIE_NAME];
  if (token) db.sitzungLoeschen(token);
  loescheCookie(res, COOKIE_NAME, { secure: CONFIG.secureCookies });
}

/** Liefert den angemeldeten Benutzer oder null. */
export function aktuellerBenutzer(req) {
  const token = cookies(req)[COOKIE_NAME];
  if (!token) return null;
  const sitzung = db.sitzungLesen(token);
  if (!sitzung) return null;
  const benutzer = db.benutzerPerId(sitzung.benutzer_id);
  if (!benutzer) return null;
  return benutzer;
}

export function oeffentlicherBenutzer(b) {
  if (!b) return null;
  return { id: b.id, email: b.email, name: b.name, betrieb: b.betrieb, lehrjahr: b.lehrjahr, erstellt: b.erstellt };
}
