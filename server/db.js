/**
 * Datenhaltung
 * ---------------------------------------------------------------------------
 * Nutzt das in Node eingebaute SQLite (node:sqlite, ab Node 22.5).
 * Steht das nicht zur Verfügung, wird automatisch auf eine JSON-Datei
 * umgeschaltet – die App läuft dadurch überall ohne Installation.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATEN_VERZEICHNIS } from './config.js';

const DB_DATEI = path.join(DATEN_VERZEICHNIS, 'shk-berichte.db');
const JSON_DATEI = path.join(DATEN_VERZEICHNIS, 'store.json');

export function id() {
  return crypto.randomUUID();
}

function jetzt() {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/* SQLite-Backend                                                             */
/* -------------------------------------------------------------------------- */

function sqliteBackend(DatabaseSync) {
  const db = new DatabaseSync(DB_DATEI);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS benutzer (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      passwort TEXT NOT NULL,
      betrieb TEXT NOT NULL DEFAULT '',
      lehrjahr INTEGER NOT NULL DEFAULT 1,
      erstellt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sitzungen (
      token TEXT PRIMARY KEY,
      benutzer_id TEXT NOT NULL,
      erstellt TEXT NOT NULL,
      laeuft_ab TEXT NOT NULL,
      FOREIGN KEY (benutzer_id) REFERENCES benutzer(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS berichte (
      id TEXT PRIMARY KEY,
      benutzer_id TEXT NOT NULL,
      typ TEXT NOT NULL,
      titel TEXT NOT NULL DEFAULT '',
      daten TEXT NOT NULL DEFAULT '{}',
      erstellt TEXT NOT NULL,
      geaendert TEXT NOT NULL,
      FOREIGN KEY (benutzer_id) REFERENCES benutzer(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_berichte_benutzer ON berichte(benutzer_id, geaendert DESC);
    CREATE INDEX IF NOT EXISTS idx_sitzungen_benutzer ON sitzungen(benutzer_id);
  `);

  const plain = (row) => (row ? { ...row } : null);

  return {
    art: 'sqlite',

    benutzerAnlegen(daten) {
      const satz = {
        id: id(),
        email: daten.email,
        name: daten.name || '',
        passwort: daten.passwort,
        betrieb: daten.betrieb || '',
        lehrjahr: Number(daten.lehrjahr || 1),
        erstellt: jetzt(),
      };
      db.prepare(
        `INSERT INTO benutzer (id, email, name, passwort, betrieb, lehrjahr, erstellt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(satz.id, satz.email, satz.name, satz.passwort, satz.betrieb, satz.lehrjahr, satz.erstellt);
      return satz;
    },

    benutzerPerEmail(email) {
      return plain(db.prepare('SELECT * FROM benutzer WHERE email = ?').get(String(email).toLowerCase()));
    },

    benutzerPerId(bid) {
      return plain(db.prepare('SELECT * FROM benutzer WHERE id = ?').get(bid));
    },

    benutzerAktualisieren(bid, felder) {
      const erlaubt = ['name', 'betrieb', 'lehrjahr', 'passwort'];
      const keys = Object.keys(felder).filter((k) => erlaubt.includes(k));
      if (!keys.length) return this.benutzerPerId(bid);
      const sql = `UPDATE benutzer SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...keys.map((k) => felder[k]), bid);
      return this.benutzerPerId(bid);
    },

    benutzerAnzahl() {
      return db.prepare('SELECT COUNT(*) AS n FROM benutzer').get().n;
    },

    sitzungAnlegen(benutzerId, token, tage = 60) {
      const ab = new Date(Date.now() + tage * 86400000).toISOString();
      db.prepare('INSERT INTO sitzungen (token, benutzer_id, erstellt, laeuft_ab) VALUES (?, ?, ?, ?)').run(
        token,
        benutzerId,
        jetzt(),
        ab,
      );
      return { token, benutzer_id: benutzerId, laeuft_ab: ab };
    },

    sitzungLesen(token) {
      const s = plain(db.prepare('SELECT * FROM sitzungen WHERE token = ?').get(token));
      if (!s) return null;
      if (new Date(s.laeuft_ab).getTime() < Date.now()) {
        this.sitzungLoeschen(token);
        return null;
      }
      return s;
    },

    sitzungLoeschen(token) {
      db.prepare('DELETE FROM sitzungen WHERE token = ?').run(token);
    },

    sitzungenAufraeumen() {
      db.prepare('DELETE FROM sitzungen WHERE laeuft_ab < ?').run(jetzt());
    },

    berichteListe(benutzerId, typ) {
      const rows = typ
        ? db
            .prepare('SELECT id, typ, titel, erstellt, geaendert FROM berichte WHERE benutzer_id = ? AND typ = ? ORDER BY geaendert DESC')
            .all(benutzerId, typ)
        : db
            .prepare('SELECT id, typ, titel, erstellt, geaendert FROM berichte WHERE benutzer_id = ? ORDER BY geaendert DESC')
            .all(benutzerId);
      return rows.map((r) => ({ ...r }));
    },

    berichtLesen(bid, benutzerId) {
      const r = plain(db.prepare('SELECT * FROM berichte WHERE id = ? AND benutzer_id = ?').get(bid, benutzerId));
      if (!r) return null;
      return { ...r, daten: JSON.parse(r.daten || '{}') };
    },

    berichtAnlegen(benutzerId, { typ, titel, daten }) {
      const satz = {
        id: id(),
        benutzer_id: benutzerId,
        typ,
        titel: titel || '',
        daten: JSON.stringify(daten || {}),
        erstellt: jetzt(),
        geaendert: jetzt(),
      };
      db.prepare(
        `INSERT INTO berichte (id, benutzer_id, typ, titel, daten, erstellt, geaendert)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(satz.id, satz.benutzer_id, satz.typ, satz.titel, satz.daten, satz.erstellt, satz.geaendert);
      return { ...satz, daten: daten || {} };
    },

    berichtSpeichern(bid, benutzerId, { titel, daten }) {
      const vorhanden = db.prepare('SELECT id FROM berichte WHERE id = ? AND benutzer_id = ?').get(bid, benutzerId);
      if (!vorhanden) return null;
      db.prepare('UPDATE berichte SET titel = ?, daten = ?, geaendert = ? WHERE id = ? AND benutzer_id = ?').run(
        titel || '',
        JSON.stringify(daten || {}),
        jetzt(),
        bid,
        benutzerId,
      );
      return this.berichtLesen(bid, benutzerId);
    },

    berichtLoeschen(bid, benutzerId) {
      const r = db.prepare('DELETE FROM berichte WHERE id = ? AND benutzer_id = ?').run(bid, benutzerId);
      return r.changes > 0;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* JSON-Backend (Rückfallebene)                                               */
/* -------------------------------------------------------------------------- */

function jsonBackend() {
  let daten = { benutzer: [], sitzungen: [], berichte: [] };
  if (fs.existsSync(JSON_DATEI)) {
    try {
      daten = { ...daten, ...JSON.parse(fs.readFileSync(JSON_DATEI, 'utf8')) };
    } catch {
      /* beschädigte Datei wird neu aufgebaut */
    }
  }
  let schreibTimer = null;
  const speichern = () => {
    clearTimeout(schreibTimer);
    schreibTimer = setTimeout(() => {
      fs.writeFileSync(JSON_DATEI, JSON.stringify(daten, null, 2), { mode: 0o600 });
    }, 50);
  };
  const sofortSpeichern = () => {
    clearTimeout(schreibTimer);
    fs.writeFileSync(JSON_DATEI, JSON.stringify(daten, null, 2), { mode: 0o600 });
  };

  return {
    art: 'json',

    benutzerAnlegen(d) {
      const satz = {
        id: id(),
        email: d.email,
        name: d.name || '',
        passwort: d.passwort,
        betrieb: d.betrieb || '',
        lehrjahr: Number(d.lehrjahr || 1),
        erstellt: jetzt(),
      };
      daten.benutzer.push(satz);
      sofortSpeichern();
      return satz;
    },
    benutzerPerEmail(email) {
      return daten.benutzer.find((b) => b.email === String(email).toLowerCase()) || null;
    },
    benutzerPerId(bid) {
      return daten.benutzer.find((b) => b.id === bid) || null;
    },
    benutzerAktualisieren(bid, felder) {
      const b = this.benutzerPerId(bid);
      if (!b) return null;
      for (const k of ['name', 'betrieb', 'lehrjahr', 'passwort']) {
        if (felder[k] !== undefined) b[k] = felder[k];
      }
      sofortSpeichern();
      return b;
    },
    benutzerAnzahl() {
      return daten.benutzer.length;
    },
    sitzungAnlegen(benutzerId, token, tage = 60) {
      const s = {
        token,
        benutzer_id: benutzerId,
        erstellt: jetzt(),
        laeuft_ab: new Date(Date.now() + tage * 86400000).toISOString(),
      };
      daten.sitzungen.push(s);
      sofortSpeichern();
      return s;
    },
    sitzungLesen(token) {
      const s = daten.sitzungen.find((x) => x.token === token);
      if (!s) return null;
      if (new Date(s.laeuft_ab).getTime() < Date.now()) {
        this.sitzungLoeschen(token);
        return null;
      }
      return s;
    },
    sitzungLoeschen(token) {
      daten.sitzungen = daten.sitzungen.filter((x) => x.token !== token);
      sofortSpeichern();
    },
    sitzungenAufraeumen() {
      const n = Date.now();
      daten.sitzungen = daten.sitzungen.filter((x) => new Date(x.laeuft_ab).getTime() > n);
      speichern();
    },
    berichteListe(benutzerId, typ) {
      return daten.berichte
        .filter((b) => b.benutzer_id === benutzerId && (!typ || b.typ === typ))
        .sort((a, b) => (a.geaendert < b.geaendert ? 1 : -1))
        .map(({ id: i, typ: t, titel, erstellt, geaendert }) => ({ id: i, typ: t, titel, erstellt, geaendert }));
    },
    berichtLesen(bid, benutzerId) {
      const b = daten.berichte.find((x) => x.id === bid && x.benutzer_id === benutzerId);
      return b ? JSON.parse(JSON.stringify(b)) : null;
    },
    berichtAnlegen(benutzerId, { typ, titel, daten: inhalt }) {
      const satz = {
        id: id(),
        benutzer_id: benutzerId,
        typ,
        titel: titel || '',
        daten: inhalt || {},
        erstellt: jetzt(),
        geaendert: jetzt(),
      };
      daten.berichte.push(satz);
      sofortSpeichern();
      return JSON.parse(JSON.stringify(satz));
    },
    berichtSpeichern(bid, benutzerId, { titel, daten: inhalt }) {
      const b = daten.berichte.find((x) => x.id === bid && x.benutzer_id === benutzerId);
      if (!b) return null;
      b.titel = titel || '';
      b.daten = inhalt || {};
      b.geaendert = jetzt();
      sofortSpeichern();
      return JSON.parse(JSON.stringify(b));
    },
    berichtLoeschen(bid, benutzerId) {
      const vorher = daten.berichte.length;
      daten.berichte = daten.berichte.filter((x) => !(x.id === bid && x.benutzer_id === benutzerId));
      sofortSpeichern();
      return daten.berichte.length < vorher;
    },
  };
}

/* -------------------------------------------------------------------------- */

let backend;
try {
  const { DatabaseSync } = await import('node:sqlite');
  backend = sqliteBackend(DatabaseSync);
} catch (err) {
  console.warn('[db] node:sqlite nicht verfügbar – nutze JSON-Speicher (data/store.json).');
  backend = jsonBackend();
}

export const db = backend;
