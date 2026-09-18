/**
 * Tests der Fachdatenbank: Datenqualität, Suche und Faktenblock.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WISSENSBASIS,
  WISSEN_NACH_ID,
  BEREICHE,
  sucheWissen,
  findeWissen,
  findeMehrere,
  faktenBlock,
  vollstaendig,
  statistik,
} from '../server/ai/wissen/index.js';

test('Fachdatenbank deckt alle Bereiche ab', () => {
  const s = statistik();
  assert.ok(s.gesamt >= 100, `zu wenige Einträge: ${s.gesamt}`);
  for (const bereich of Object.keys(BEREICHE)) {
    assert.ok(s.nachBereich[bereich] >= 10, `Bereich ${bereich} hat nur ${s.nachBereich[bereich] || 0} Einträge`);
  }
});

test('Jeder Eintrag ist vollständig und eindeutig', () => {
  const gesehen = new Set();
  for (const e of WISSENSBASIS) {
    assert.match(e.id, /^[a-z0-9_]+$/, `ungültige id: ${e.id}`);
    assert.ok(!gesehen.has(e.id), `doppelte id: ${e.id}`);
    gesehen.add(e.id);

    assert.ok(e.begriff?.length > 2, `Begriff fehlt: ${e.id}`);
    assert.ok(BEREICHE[e.bereich], `unbekannter Bereich in ${e.id}: ${e.bereich}`);
    assert.ok(e.kategorie?.length > 2, `Kategorie fehlt: ${e.id}`);
    assert.ok(e.kurz?.length > 30, `Kurzdefinition zu knapp: ${e.id}`);
    assert.ok(e.funktion?.length > 80, `Funktionsbeschreibung zu knapp: ${e.id}`);
    assert.ok(Array.isArray(e.normen) && e.normen.length >= 1, `keine Regelwerke: ${e.id}`);
  }
});

test('Alle Querverweise zeigen auf vorhandene Einträge', () => {
  const tot = [];
  for (const e of WISSENSBASIS) {
    for (const v of e.verwandt || []) if (!WISSEN_NACH_ID.has(v)) tot.push(`${e.id} -> ${v}`);
  }
  assert.deepEqual(tot, []);
});

test('Formeln sind vollständig beschrieben', () => {
  for (const e of WISSENSBASIS) {
    for (const f of e.formeln || []) {
      assert.ok(f.name && f.formel && f.erklaerung, `unvollständige Formel in ${e.id}`);
    }
  }
});

test('Suche findet die erwarteten Einträge', () => {
  const proben = [
    ['erkläre einen Druckminderer', 'druckminderer'],
    ['was ist ein MAG', 'ausdehnungsgefaess'],
    ['hydraulischer Abgleich', 'hydraulischer_abgleich'],
    ['Legionellen', 'legionellen'],
    ['SML Rohr', 'sml_rohr'],
    ['Rückstauebene', 'rueckstau'],
    ['TRGI', 'gasinstallation'],
    ['Wärmerückgewinnung', 'waermerueckgewinnung'],
    ['Kältemittel', 'kaeltetechnik'],
    ['Fettabscheider', 'fettabscheider'],
    ['Heizkurve', 'heizkurve'],
    ['Funktionsheizen Estrich', 'estrich_funktionsheizen'],
    ['Wasserhärte', 'enthaertung'],
    ['Abgasverlust', 'abgasmessung'],
    ['Pressfitting', 'pressverbindung'],
    ['Fernwärme Übergabestation', 'fernwaerme'],
    ['h,x-Diagramm', 'luftzustand'],
    ['Löschwasser', 'loeschwasser'],
    ['Wärmedehnung Dehnungsausgleich', 'waermedehnung'],
    ['Gasgeruch', 'gasgeruch'],
  ];
  for (const [anfrage, erwartet] of proben) {
    const treffer = sucheWissen(anfrage, { grenze: 3 });
    assert.ok(treffer.length, `kein Treffer für "${anfrage}"`);
    assert.equal(treffer[0].eintrag.id, erwartet, `"${anfrage}" liefert ${treffer[0].eintrag.id} statt ${erwartet}`);
  }
});

test('Suche lässt sich auf einen Bereich einschränken', () => {
  const treffer = sucheWissen('Prüfung', { bereich: 'gas', grenze: 10 });
  assert.ok(treffer.length);
  assert.ok(treffer.every((t) => t.eintrag.bereich === 'gas'));
});

test('findeWissen liefert null bei fachfremden Anfragen', () => {
  assert.equal(findeWissen('quantenphysik'), null);
  assert.equal(findeWissen(''), null);
  assert.equal(findeWissen('xyzabc'), null);
});

test('findeMehrere liefert nur deutliche Treffer', () => {
  const treffer = findeMehrere('22er Kupfer verpresst und Druckminderer eingebaut', 4);
  const ids = treffer.map((t) => t.id);
  assert.ok(ids.includes('druckminderer'));
  assert.ok(ids.length <= 4);
});

test('Faktenblock enthält Kennwerte und Regelwerke für den Prompt', () => {
  const block = faktenBlock('Druckminderer einstellen', 1);
  assert.match(block, /Fachdatenbank/);
  assert.match(block, /Druckminderer/);
  assert.match(block, /Kennwerte:/);
  assert.match(block, /Regelwerke:/);
  assert.equal(faktenBlock('völlig fachfremder text ohne bezug'), '');
});

test('Vollständiger Eintrag löst Querverweise auf', () => {
  const e = vollstaendig(WISSEN_NACH_ID.get('druckminderer'));
  assert.equal(e.bereichName, BEREICHE.sanitaer);
  assert.ok(e.verwandteEintraege.length >= 2);
  assert.ok(e.verwandteEintraege.every((v) => v.id && v.begriff));
});

test('Hinterlegte Rückfragen sind beantwortet', () => {
  const mitVertiefung = WISSENSBASIS.filter((e) => e.vertiefungen?.length);
  assert.ok(mitVertiefung.length >= 3);
  for (const e of mitVertiefung) {
    for (const v of e.vertiefungen) {
      assert.ok(v.frage?.length > 10, `Frage zu kurz in ${e.id}`);
      assert.ok(v.text?.length > 200, `Antwort zu knapp in ${e.id}`);
    }
  }
});
