/**
 * Routen für Konto und Anmeldung.
 */
import { db } from '../db.js';
import { CONFIG, KI_AKTIV } from '../config.js';
import { json, fehler, leseBody, ratenBegrenzer, klientIp } from '../http.js';
import {
  registriere,
  anmelden,
  abmelden,
  aktuellerBenutzer,
  oeffentlicherBenutzer,
  pruefePasswort,
  hashPasswort,
} from '../auth.js';

const anmeldeLimit = ratenBegrenzer({ fenster: 10 * 60_000, maximum: 20 });

export async function authRouten(req, res, pfad, benutzer) {
  /* ------------------------------------------------------------ Status */
  if (pfad === '/api/status' && req.method === 'GET') {
    return json(res, 200, {
      kiAktiv: KI_AKTIV,
      modell: KI_AKTIV ? CONFIG.modell : null,
      speicher: db.art,
      registrierungGesperrt: CONFIG.registrierungGesperrt,
      erstesKonto: db.benutzerAnzahl() === 0,
      benutzer: oeffentlicherBenutzer(benutzer),
    });
  }

  /* ------------------------------------------------------------ Registrieren */
  if (pfad === '/api/auth/registrieren' && req.method === 'POST') {
    if (!anmeldeLimit(klientIp(req))) {
      return fehler(res, 429, 'Zu viele Versuche. Bitte in einigen Minuten erneut probieren.');
    }
    if (CONFIG.registrierungGesperrt && db.benutzerAnzahl() > 0) {
      return fehler(res, 403, 'Die Registrierung ist auf diesem Server gesperrt.');
    }
    const body = await leseBody(req);
    try {
      const neu = registriere(body);
      anmelden(res, neu.id);
      return json(res, 201, { benutzer: oeffentlicherBenutzer(neu) });
    } catch (err) {
      return fehler(res, err.status || 400, err.message);
    }
  }

  /* ------------------------------------------------------------ Anmelden */
  if (pfad === '/api/auth/anmelden' && req.method === 'POST') {
    if (!anmeldeLimit(klientIp(req))) {
      return fehler(res, 429, 'Zu viele Anmeldeversuche. Bitte in einigen Minuten erneut probieren.');
    }
    const { email, passwort } = await leseBody(req);
    const konto = db.benutzerPerEmail(String(email || '').trim().toLowerCase());
    if (!konto || !pruefePasswort(String(passwort || ''), konto.passwort)) {
      return fehler(res, 401, 'E-Mail-Adresse oder Passwort ist falsch.');
    }
    anmelden(res, konto.id);
    return json(res, 200, { benutzer: oeffentlicherBenutzer(konto) });
  }

  /* ------------------------------------------------------------ Abmelden */
  if (pfad === '/api/auth/abmelden' && req.method === 'POST') {
    abmelden(req, res);
    return json(res, 200, { ok: true });
  }

  /* ------------------------------------------------------------ Profil */
  if (pfad === '/api/auth/profil' && req.method === 'PUT') {
    if (!benutzer) return fehler(res, 401, 'Nicht angemeldet.');
    const { name, betrieb, lehrjahr } = await leseBody(req);
    const aktualisiert = db.benutzerAktualisieren(benutzer.id, {
      name: String(name ?? benutzer.name).slice(0, 120),
      betrieb: String(betrieb ?? benutzer.betrieb).slice(0, 160),
      lehrjahr: Math.min(4, Math.max(1, Number(lehrjahr ?? benutzer.lehrjahr) || 1)),
    });
    return json(res, 200, { benutzer: oeffentlicherBenutzer(aktualisiert) });
  }

  /* ------------------------------------------------------------ Passwort ändern */
  if (pfad === '/api/auth/passwort' && req.method === 'POST') {
    if (!benutzer) return fehler(res, 401, 'Nicht angemeldet.');
    const { alt, neu } = await leseBody(req);
    if (!pruefePasswort(String(alt || ''), benutzer.passwort)) {
      return fehler(res, 403, 'Das bisherige Passwort ist falsch.');
    }
    if (typeof neu !== 'string' || neu.length < 8) {
      return fehler(res, 400, 'Das neue Passwort muss mindestens 8 Zeichen haben.');
    }
    db.benutzerAktualisieren(benutzer.id, { passwort: hashPasswort(neu) });
    return json(res, 200, { ok: true });
  }

  return false;
}

export { aktuellerBenutzer };
