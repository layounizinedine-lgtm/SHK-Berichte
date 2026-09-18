/**
 * Tests der Fachsprache-Engine.
 * Start: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalisiere, findeWissen, promptHinweise } from '../server/ai/fachsprache.js';

test('100er SML mit der Flex wird zur Fachsprache', () => {
  const n = normalisiere('Montag hab ich 100er SML Rohr mit einer flex geschnitten und anschließend anmontiert');
  assert.match(n.text, /SML-Abflussrohr DN 100/);
  assert.match(n.text, /Winkelschleifer/);
  assert.match(n.text, /abgelängt/);
  assert.match(n.text, /montiert/);
  assert.ok(!/flex/i.test(n.text), 'Umgangssprache "Flex" darf nicht stehen bleiben');
});

test('Kupfer und Edelstahl bekommen Außendurchmesser x Wandstärke', () => {
  assert.match(normalisiere('22er kupferleitung').text, /Kupferrohr 22 x 1,0 mm/);
  assert.match(normalisiere('28er Kupfer').text, /28 x 1,5 mm/);
  assert.match(normalisiere('18er edelstahl').text, /Edelstahlrohr 18 x 1,0 mm/);
  assert.match(normalisiere('22 mm Edelstahlrohr').text, /22 x 1,2 mm/);
  assert.match(normalisiere('16er Verbundrohr').text, /Mehrschichtverbundrohr 16 x 2,0 mm/);
});

test('Zollangaben werden in DN übersetzt', () => {
  assert.match(normalisiere('halbzoll Eckventil').text, /DN 15 \(1\/2 Zoll\)/);
  assert.match(normalisiere('dreiviertel zoll Leitung').text, /DN 20 \(3\/4 Zoll\)/);
  assert.match(normalisiere('1 1/4 Zoll Absperrung').text, /DN 32/);
});

test('Abflussrohre erhalten Nennweite und Werkstoffnorm', () => {
  assert.match(normalisiere('HT 110 zusammengesteckt').text, /HT-Rohr DN 110/);
  assert.match(normalisiere('110er KG Rohr verlegt').text, /KG-Rohr DN 110/);
  assert.match(normalisiere('HT 110 zusammengesteckt').text, /Steckmuffenverbindung/);
});

test('Werkzeug- und Materiallisten werden mitgeliefert', () => {
  const n = normalisiere('22er Kupfer verpresst und abgedrückt');
  assert.ok(n.werkzeug.some((w) => /Pressmaschine/.test(w)));
  assert.ok(n.werkzeug.some((w) => /Druckprüfpumpe/.test(w)));
  assert.ok(n.material.some((m) => /Kupferrohr 22/.test(m)));
  assert.ok(n.normen.some((x) => /DIN EN 806-4/.test(x)));
});

test('Keine doppelte Ersetzung innerhalb bereits ersetzter Begriffe', () => {
  const n = normalisiere('100er SML Rohr');
  const treffer = (n.text.match(/SML-Abflussrohr/g) || []).length;
  assert.equal(treffer, 1);
  assert.ok(!/Rohr Rohr/.test(n.text));
});

test('Artikel wird an den Fachbegriff angepasst', () => {
  assert.match(normalisiere('mit einer flex geschnitten').text, /mit dem Winkelschleifer/);
});

test('Promptbausteine enthalten die erkannten Zuordnungen', () => {
  const h = promptHinweise('100er SML mit der Flex geschnitten');
  assert.match(h, /Betriebsglossar/);
  assert.match(h, /Winkelschleifer/);
  assert.equal(promptHinweise('hallo welt'), '');
});

test('Wissensbasis findet Begriffe auch umgangssprachlich', () => {
  assert.equal(findeWissen('erkläre einen druckminderer')?.begriff, 'Druckminderer');
  assert.equal(findeWissen('was ist ein MAG')?.begriff, 'Membran-Ausdehnungsgefäß (MAG)');
  assert.equal(findeWissen('geruchverschluss')?.begriff, 'Geruchsverschluss (Siphon)');
  assert.equal(findeWissen('quantenphysik'), null);
});
