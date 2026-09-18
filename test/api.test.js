/**
 * Ende-zu-Ende-Tests der Schnittstelle: Konto, Berichte, Zugriffsschutz.
 * Startet den Server in einem eigenen Prozess mit temporärem Datenverzeichnis.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3987;
const BASIS = `http://127.0.0.1:${PORT}`;

let prozess;
let tempVerzeichnis;

function warteAufServer(versuche = 60) {
  return new Promise((resolve, reject) => {
    const pruefe = async () => {
      try {
        const res = await fetch(`${BASIS}/api/status`);
        if (res.ok) return resolve();
      } catch {
        /* noch nicht bereit */
      }
      if (versuche-- <= 0) return reject(new Error('Server startet nicht'));
      setTimeout(pruefe, 120);
      return undefined;
    };
    pruefe();
  });
}

/** fetch mit Cookie-Verwaltung. */
function klient() {
  let cookie = '';
  return async function ruf(pfad, { methode = 'GET', daten } = {}) {
    const res = await fetch(`${BASIS}${pfad}`, {
      method: methode,
      headers: {
        ...(daten ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: daten ? JSON.stringify(daten) : undefined,
    });
    const gesetzt = res.headers.getSetCookie?.() || [];
    if (gesetzt.length) cookie = gesetzt.map((c) => c.split(';')[0]).join('; ');
    let inhalt = null;
    try {
      inhalt = await res.json();
    } catch {
      inhalt = null;
    }
    return { status: res.status, inhalt };
  };
}

before(async () => {
  tempVerzeichnis = fs.mkdtempSync(path.join(os.tmpdir(), 'shk-test-'));
  prozess = spawn(process.execPath, [path.join(WURZEL, 'server', 'index.js')], {
    cwd: WURZEL,
    env: {
      ...process.env,
      PORT: String(PORT),
      ANTHROPIC_API_KEY: '',
      SESSION_SECRET: 'test-geheimnis-fuer-die-testlaeufe',
      SHK_DATENVERZEICHNIS: tempVerzeichnis,
    },
    stdio: 'ignore',
  });
  await warteAufServer();
});

after(() => {
  prozess?.kill();
});

test('Status ist ohne Anmeldung abrufbar', async () => {
  const ruf = klient();
  const { status, inhalt } = await ruf('/api/status');
  assert.equal(status, 200);
  assert.equal(inhalt.benutzer, null);
  assert.equal(typeof inhalt.kiAktiv, 'boolean');
});

test('Geschützte Endpunkte verlangen eine Anmeldung', async () => {
  const ruf = klient();
  assert.equal((await ruf('/api/berichte')).status, 401);
  assert.equal((await ruf('/api/ki/berichtsheft', { methode: 'POST', daten: { transkript: 'test' } })).status, 401);
});

test('Registrierung prüft Eingaben', async () => {
  const ruf = klient();
  assert.equal((await ruf('/api/auth/registrieren', { methode: 'POST', daten: { email: 'keine-mail', passwort: 'langgenug1' } })).status, 400);
  assert.equal((await ruf('/api/auth/registrieren', { methode: 'POST', daten: { email: 'a@b.de', passwort: 'kurz' } })).status, 400);
});

test('Konto anlegen, Bericht speichern, lesen und löschen', async () => {
  const ruf = klient();
  const email = `test${Date.now()}@example.de`;

  const reg = await ruf('/api/auth/registrieren', { methode: 'POST', daten: { email, passwort: 'passwort1234', name: 'Test' } });
  assert.equal(reg.status, 201);
  assert.equal(reg.inhalt.benutzer.email, email);

  const neu = await ruf('/api/berichte', {
    methode: 'POST',
    daten: { typ: 'berichtsheft', titel: 'KW 1', daten: { tage: [{ tag: 'Montag', eintraege: [] }] } },
  });
  assert.equal(neu.status, 201);
  const id = neu.inhalt.bericht.id;

  const liste = await ruf('/api/berichte?typ=berichtsheft');
  assert.equal(liste.inhalt.berichte.length, 1);

  const gespeichert = await ruf(`/api/berichte/${id}`, {
    methode: 'PUT',
    daten: { titel: 'KW 1 geändert', daten: { tage: [] } },
  });
  assert.equal(gespeichert.inhalt.bericht.titel, 'KW 1 geändert');

  const gelesen = await ruf(`/api/berichte/${id}`);
  assert.equal(gelesen.inhalt.bericht.titel, 'KW 1 geändert');

  assert.equal((await ruf(`/api/berichte/${id}`, { methode: 'DELETE' })).status, 200);
  assert.equal((await ruf(`/api/berichte/${id}`)).status, 404);
});

test('Berichte eines Kontos sind für andere Konten unsichtbar', async () => {
  const einer = klient();
  const anderer = klient();

  await einer('/api/auth/registrieren', {
    methode: 'POST',
    daten: { email: `a${Date.now()}@example.de`, passwort: 'passwort1234' },
  });
  const neu = await einer('/api/berichte', { methode: 'POST', daten: { typ: 'fachbericht', titel: 'Geheim', daten: {} } });
  const id = neu.inhalt.bericht.id;

  await anderer('/api/auth/registrieren', {
    methode: 'POST',
    daten: { email: `b${Date.now()}@example.de`, passwort: 'passwort1234' },
  });
  assert.equal((await anderer(`/api/berichte/${id}`)).status, 404);
  assert.equal((await anderer(`/api/berichte/${id}`, { methode: 'DELETE' })).status, 404);
  assert.equal((await anderer('/api/berichte')).inhalt.berichte.length, 0);
});

test('Falsches Passwort wird abgewiesen', async () => {
  const ruf = klient();
  const email = `pw${Date.now()}@example.de`;
  await ruf('/api/auth/registrieren', { methode: 'POST', daten: { email, passwort: 'passwort1234' } });
  await ruf('/api/auth/abmelden', { methode: 'POST', daten: {} });
  assert.equal((await ruf('/api/auth/anmelden', { methode: 'POST', daten: { email, passwort: 'falschfalsch' } })).status, 401);
  assert.equal((await ruf('/api/auth/anmelden', { methode: 'POST', daten: { email, passwort: 'passwort1234' } })).status, 200);
});

test('KI-Endpunkte antworten im Fachmodus offline', async () => {
  const ruf = klient();
  await ruf('/api/auth/registrieren', {
    methode: 'POST',
    daten: { email: `ki${Date.now()}@example.de`, passwort: 'passwort1234' },
  });

  const fachsprache = await ruf('/api/ki/fachsprache', {
    methode: 'POST',
    daten: { text: '22er Kupfer mit der Presse verpresst' },
  });
  assert.match(fachsprache.inhalt.text, /Kupferrohr 22 x 1,0 mm/);

  const heft = await ruf('/api/ki/berichtsheft', {
    methode: 'POST',
    daten: { transkript: 'Montag 100er SML mit der Flex geschnitten' },
  });
  assert.equal(heft.status, 200);
  assert.equal(heft.inhalt.tage[0].tag, 'Montag');

  const zeichnung = await ruf('/api/ki/zeichnung', {
    methode: 'POST',
    daten: { beschreibung: 'Hauswasserstation mit Filter und Druckminderer' },
  });
  assert.match(zeichnung.inhalt.svg, /^<svg /);

  const leer = await ruf('/api/ki/erklaerung', { methode: 'POST', daten: { begriff: '' } });
  assert.equal(leer.status, 400);
});
