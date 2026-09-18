/**
 * Tests des KI-Pfads gegen einen nachgebildeten API-Server.
 * Prüft Prompt-Aufbau, Auswertung der Werkzeugantwort, SVG-Absicherung
 * und den Rückfall auf den Fachmodus offline bei Störungen.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const PORT = 3986;

let server;
let letzteAnfrage = null;
let antwortModus = 'ok';

function werkzeugAntwort(eingabe) {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'tu_1', name: 'antwort', input: eingabe }],
    stop_reason: 'tool_use',
  };
}

before(async () => {
  server = http.createServer((req, res) => {
    let roh = '';
    req.on('data', (c) => {
      roh += c;
    });
    req.on('end', () => {
      letzteAnfrage = { pfad: req.url, kopf: req.headers, koerper: JSON.parse(roh || '{}') };

      if (antwortModus === 'fehler') {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'kaputt' } }));
        return;
      }

      const werkzeug = letzteAnfrage.koerper.tools?.[0]?.name;
      let eingabe = {};
      if (werkzeug === 'berichtsheft') {
        eingabe = {
          tage: [{ tag: 'Montag', eintraege: [{ titel: 'Montage von SML DN 100', punkte: ['Rohr abgelängt'] }] }],
          hinweise: ['PSA tragen'],
        };
      } else if (werkzeug === 'fachbericht') {
        eingabe = {
          titel: 'Hauswasserstation',
          einleitung: 'Einleitung',
          arbeitsschritte: [{ titel: 'Schritt 1', beschreibung: 'Absperren' }],
          material: [{ bezeichnung: 'Kupferrohr', dimension: '28 x 1,5 mm' }],
          werkzeug: [{ bezeichnung: 'Akku-Pressmaschine', zweck: 'Verpressen' }],
          erklaerungen: [{ begriff: 'Druckminderer', text: 'Reduziert den Druck.' }],
        };
      } else if (werkzeug === 'erklaerung') {
        eingabe = { begriff: 'Druckminderer', kurz: 'Kurz.', abschnitte: [{ titel: 'Funktion', text: 'Text' }] };
      } else if (werkzeug === 'zeichnung') {
        eingabe =
          antwortModus === 'schlechtes-svg'
            ? { titel: 'Schema', svg: 'kein svg markup' }
            : {
                titel: 'Schema',
                svg: '<svg viewBox="0 0 200 100" width="800"><script>alert(1)</script><rect x="1" y="1" width="10" height="10" onclick="x()"/><text x="2" y="2">Filter</text></svg>',
              };
      } else {
        eingabe = { aktion: 'eintrag', text: 'egal' };
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(werkzeugAntwort(eingabe)));
    });
  });
  await new Promise((r) => server.listen(PORT, r));

  process.env.ANTHROPIC_API_KEY = 'test-schluessel';
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${PORT}`;
  process.env.SHK_AI_MODEL = 'claude-sonnet-5';
});

after(() => {
  server?.close();
});

test('Berichtsheft nutzt die KI und überträgt das Ergebnis', async () => {
  const { baueBerichtsheft } = await import('../server/ai/tasks.js');
  const ergebnis = await baueBerichtsheft({
    transkript: 'Montag 100er SML mit der Flex geschnitten',
    kontext: { lehrjahr: 3 },
  });

  assert.equal(ergebnis.quelle, 'ki');
  assert.equal(ergebnis.tage[0].tag, 'Montag');
  assert.equal(letzteAnfrage.pfad, '/v1/messages');
  assert.equal(letzteAnfrage.kopf['x-api-key'], 'test-schluessel');
  assert.equal(letzteAnfrage.kopf['anthropic-version'], '2023-06-01');
  assert.equal(letzteAnfrage.koerper.model, 'claude-sonnet-5');
  assert.equal(letzteAnfrage.koerper.tool_choice.name, 'berichtsheft');
  // Der Prompt enthält das Betriebsglossar mit der erkannten Zuordnung
  const prompt = letzteAnfrage.koerper.messages[0].content;
  assert.match(prompt, /Winkelschleifer/);
  assert.match(prompt, /SML-Abflussrohr DN 100/);
  assert.match(letzteAnfrage.koerper.system, /Anlagenmechaniker/);
});

test('Fachbericht kommt vollständig aus der KI', async () => {
  const { baueFachbericht } = await import('../server/ai/tasks.js');
  const ergebnis = await baueFachbericht({ transkript: 'Hauswasserstation montiert', kontext: {} });
  assert.equal(ergebnis.quelle, 'ki');
  assert.equal(ergebnis.material[0].dimension, '28 x 1,5 mm');
  assert.equal(ergebnis.erklaerungen[0].begriff, 'Druckminderer');
});

test('Erklärung berücksichtigt die gewünschte Tiefe', async () => {
  const { baueErklaerung } = await import('../server/ai/tasks.js');
  const ergebnis = await baueErklaerung({ begriff: 'Druckminderer', tiefe: 3, kontext: {} });
  assert.equal(ergebnis.quelle, 'ki');
  assert.match(letzteAnfrage.koerper.messages[0].content, /Sehr ausführlich/);
});

test('KI-Zeichnung wird abgesichert übernommen', async () => {
  const { baueZeichnung } = await import('../server/ai/tasks.js');
  const ergebnis = await baueZeichnung({ beschreibung: 'Hauswasserstation', kontext: {} });
  assert.equal(ergebnis.quelle, 'ki');
  assert.ok(!/script|onclick/i.test(ergebnis.svg), 'Skripte und Ereignisattribute müssen entfernt sein');
  assert.ok(!/width="800"/.test(ergebnis.svg), 'Feste Breite wird entfernt');
  assert.match(ergebnis.svg, /viewBox="0 0 200 100"/);
  assert.match(ergebnis.svg, /Filter/);
});

test('Unbrauchbares SVG fällt auf die erzeugte Prinzipskizze zurück', async () => {
  antwortModus = 'schlechtes-svg';
  const { baueZeichnung } = await import('../server/ai/tasks.js');
  const ergebnis = await baueZeichnung({ beschreibung: 'Hauswasserstation mit Filter und Druckminderer', kontext: {} });
  antwortModus = 'ok';
  assert.equal(ergebnis.quelle, 'offline');
  assert.match(ergebnis.svg, /^<svg /);
  assert.match(ergebnis.warnung, /nicht verwertbar/);
});

test('Serverfehler der KI führt zum Fachmodus offline mit Warnung', async () => {
  antwortModus = 'fehler';
  const { baueBerichtsheft } = await import('../server/ai/tasks.js');
  const ergebnis = await baueBerichtsheft({ transkript: 'Montag 22er Kupfer verpresst', kontext: {} });
  antwortModus = 'ok';
  assert.equal(ergebnis.quelle, 'offline');
  assert.match(ergebnis.warnung, /KI nicht erreichbar/);
  assert.equal(ergebnis.tage[0].tag, 'Montag');
});

test('Lokal erkannte Sprachbefehle kommen ohne KI-Aufruf aus', async () => {
  const { deuteBefehl } = await import('../server/ai/tasks.js');
  const vorher = letzteAnfrage;
  const befehl = await deuteBefehl({ text: 'lösche Punkt 2' });
  assert.equal(befehl.aktion, 'loeschen');
  assert.equal(befehl.quelle, 'lokal');
  assert.equal(letzteAnfrage, vorher, 'es darf keine KI-Anfrage gestellt werden');
});
