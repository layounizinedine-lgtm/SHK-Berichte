/**
 * Tests für Fachmodus offline, Sprachbefehle und SVG-Absicherung.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  offlineBerichtsheft,
  offlineFachbericht,
  offlineErklaerung,
  offlineVertiefung,
  erkenneBefehl,
} from '../server/ai/offline.js';
import { saeubereSvg, schemaZeichnung } from '../server/ai/svg.js';

test('Berichtsheft wird nach Wochentagen getrennt', () => {
  const e = offlineBerichtsheft(
    'Montag hab ich 100er SML mit der Flex geschnitten und anmontiert. Dienstag 22er Kupfer verpresst. Mittwoch war ich in der Berufsschule.',
  );
  assert.deepEqual(
    e.tage.map((t) => t.tag),
    ['Montag', 'Dienstag', 'Mittwoch'],
  );
  assert.match(e.tage[0].eintraege[0].titel, /Montage von SML-Abflussrohr DN 100/);
  assert.ok(e.tage[0].eintraege[0].punkte.length >= 1);
  assert.ok(e.tage[1].eintraege[0].material.some((m) => /Kupferrohr 22/.test(m)));
});

test('Berichtsheft formuliert Heizkörperarbeiten fachgerecht und fragt bei fehlendem Typ nach', () => {
  const e = offlineBerichtsheft('Demontage Heizkörper, danach neu Montage');
  assert.match(e.tage[0].eintraege[0].titel, /Heizkörper/);
  assert.ok(!e.tage[0].eintraege[0].punkte.some((p) => /^(Ein\s)?Heizkörper (ist|gibt)/i.test(p)), 'Keine Lexikon-Erklärung in den Tätigkeitspunkten');
  assert.ok(e.hinweise.some((h) => /Heizkörpertyp nicht genannt/.test(h)));

  const mitTyp = offlineBerichtsheft('Demontage 200cm Gussheizkörper, danach neuen Gussheizkörper montiert');
  assert.match(mitTyp.tage[0].eintraege[0].titel, /Gussheizkörper/);
  assert.ok(!mitTyp.hinweise.some((h) => /Heizkörpertyp nicht genannt/.test(h)));
});

test('Diktat ohne Wochentag landet unter "Ohne Zuordnung"', () => {
  const e = offlineBerichtsheft('Waschtisch montiert und Eckventile gehanft');
  assert.equal(e.tage[0].tag, 'Ohne Zuordnung');
});

test('Fachbericht enthält alle Pflichtabschnitte', () => {
  const f = offlineFachbericht(
    'Montage einer Hauswasserstation mit Filter, Wasserzähler, Rückflussverhinderer und Druckminderer, Anschluss mit 28er Kupfer verpresst',
  );
  assert.ok(f.titel.length > 3);
  assert.ok(f.arbeitsschritte.length >= 1);
  assert.ok(f.material.length >= 1);
  assert.ok(f.werkzeug.length >= 1);
  assert.ok(f.arbeitssicherheit.length >= 2);
  assert.ok(f.erklaerungen.some((e) => /Druckminderer/.test(e.begriff)));
});

test('Erklärung liefert gegliederte Abschnitte', () => {
  const e = offlineErklaerung('erkläre einen Druckminderer');
  assert.equal(e.begriff, 'Druckminderer');
  const titel = e.abschnitte.map((a) => a.titel);
  assert.ok(titel.includes('Funktionsprinzip'));
  assert.ok(titel.includes('Aufbau'));
  assert.ok(e.normen.some((n) => /DIN EN 1567/.test(n)));
});

test('Rückfrage zu Überdruck wird gezielt beantwortet', () => {
  const v = offlineVertiefung('Druckminderer', 'erläutere was genau passiert wenn zu viel Druck kommt');
  assert.match(v.titel, /Druck/);
  assert.match(v.text, /Sicherheitsventil/);
});

test('Sprachbefehle werden lokal erkannt', () => {
  assert.equal(erkenneBefehl('lösche Punkt 3').aktion, 'loeschen');
  assert.equal(erkenneBefehl('lösche Punkt 3').nummer, 3);
  assert.equal(erkenneBefehl('lösch den zweiten Punkt').nummer, 2);
  assert.equal(erkenneBefehl('entferne die Materialliste').aktion, 'loeschen');
  assert.equal(erkenneBefehl('erkläre mir einen Druckminderer').begriff, 'Druckminderer');
  assert.equal(erkenneBefehl('mach das mal ausführlicher').aktion, 'vertiefen');
  assert.equal(erkenneBefehl('zeichne mir eine Hauswasserstation').aktion, 'zeichnung');
  assert.equal(erkenneBefehl('speichern').aktion, 'speichern');
  assert.equal(erkenneBefehl('der Titel ist Hauswasserstation').text, 'Hauswasserstation');
  assert.equal(erkenneBefehl('Montag habe ich Rohre montiert'), null);
});

test('SVG-Absicherung entfernt Skripte und Fremdverweise', () => {
  const boese =
    '<svg viewBox="0 0 100 100" onload="alert(1)"><script>alert(2)</script>' +
    '<image href="http://fremd/x.png"/><a href="javascript:alert(3)">x</a>' +
    '<rect x="1" y="1" width="8" height="8" style="fill:url(#x)" onclick="alert(4)"/>' +
    '<text x="5" y="5">Filter</text></svg>';
  const sauber = saeubereSvg(boese);
  assert.ok(sauber);
  assert.ok(!/script/i.test(sauber));
  assert.ok(!/onload|onclick/i.test(sauber));
  assert.ok(!/href/i.test(sauber));
  assert.ok(!/style=/i.test(sauber));
  assert.match(sauber, /<rect /);
  assert.match(sauber, /Filter/);
  assert.match(sauber, /viewBox="0 0 100 100"/);
});

test('SVG-Absicherung lehnt Nicht-SVG ab', () => {
  assert.equal(saeubereSvg('nur text'), null);
  assert.equal(saeubereSvg('<div><p>kein svg</p></div>'), null);
  assert.equal(saeubereSvg(''), null);
  assert.equal(saeubereSvg('<svg viewBox="0 0 10 10"></svg>'), null, 'leeres SVG ist nicht verwertbar');
});

test('Offline-Prinzipskizze enthält erkannte Bauteile in Einbaureihenfolge', () => {
  const z = schemaZeichnung('Hauswasserstation mit Absperrventil, Filter, Wasserzähler und Druckminderer', 'Test');
  assert.match(z.svg, /^<svg /);
  assert.match(z.svg, /Absperrventil/);
  assert.match(z.svg, /Druckminderer/);
  assert.ok(z.svg.indexOf('Filter') < z.svg.indexOf('Druckminderer'), 'Reihenfolge Filter vor Druckminderer');
  assert.ok(z.legende.length >= 3);
});
