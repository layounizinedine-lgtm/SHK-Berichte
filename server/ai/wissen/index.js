/**
 * Fachdatenbank Anlagenmechanik SHK / Versorgungstechnik
 * ---------------------------------------------------------------------------
 * Strukturierte Wissensbasis über alle Bereiche des Berufsfeldes.
 * Sie wird dreifach genutzt:
 *   1. Nachschlagewerk in der App (Suche, Bereiche, Detailansicht)
 *   2. Grundlage für Erklärungen im Fachmodus offline
 *   3. Faktenblock im KI-Prompt, damit die KI mit den gleichen Werten,
 *      Normen und Formeln arbeitet wie das Nachschlagewerk
 *
 * Aufbau eines Eintrags:
 *   id          eindeutiger Schlüssel (klein, ohne Umlaute)
 *   begriff     Anzeigename
 *   bereich     sanitaer | heizung | gas | lueftung | versorgung | grundlagen
 *   kategorie   Bauteil | Anlage | Werkstoff | Verfahren | Regelwerk | Berechnung | Sicherheit | Grundlagen
 *   synonyme[]  Umgangssprache, Abkürzungen, Schreibvarianten
 *   kurz        Definition in ein bis zwei Sätzen
 *   funktion    Funktionsprinzip / Zusammenhang als Fließtext
 *   aufbau[]    Bestandteile
 *   einsatz[]   Einsatzorte und Anwendungsfälle
 *   hinweise[]  Praxis-, Montage- und Wartungshinweise
 *   stoerungen[]typische Fehlerbilder mit Ursache
 *   werte[]     Kennwerte und Richtwerte
 *   formeln[]   { name, formel, erklaerung }
 *   normen[]    einschlägige Regelwerke
 *   verwandt[]  ids verwandter Einträge
 *   vertiefungen[] { frage, text } – Antworten auf typische Rückfragen
 */

import { GRUNDLAGEN } from './grundlagen.js';
import { SANITAER } from './sanitaer.js';
import { HEIZUNG } from './heizung.js';
import { GAS } from './gas.js';
import { LUEFTUNG } from './lueftung.js';
import { VERSORGUNG } from './versorgung.js';

export const BEREICHE = {
  grundlagen: 'Grundlagen und Werkstoffe',
  sanitaer: 'Sanitär- und Trinkwassertechnik',
  heizung: 'Heizungstechnik',
  gas: 'Gastechnik',
  lueftung: 'Lüftung, Klima und Kälte',
  versorgung: 'Versorgungs- und Anlagentechnik',
};

/** Alle Einträge in einer Liste. */
export const WISSENSBASIS = [...GRUNDLAGEN, ...SANITAER, ...HEIZUNG, ...GAS, ...LUEFTUNG, ...VERSORGUNG];

/** Schnellzugriff über die id. */
export const WISSEN_NACH_ID = new Map(WISSENSBASIS.map((e) => [e.id, e]));

/* -------------------------------------------------------------------------- */
/* Suche                                                                      */
/* -------------------------------------------------------------------------- */

const STOPPWOERTER = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'und', 'oder', 'ist', 'sind', 'was', 'wie', 'wer', 'wo', 'wozu', 'wofuer', 'fuer', 'von', 'mit',
  'bitte', 'mir', 'uns', 'mal', 'erklaere', 'erklaer', 'erklaeren', 'erlaeutere', 'erlaeuter',
  'bedeutet', 'genau', 'dient', 'funktioniert', 'zeige', 'sag', 'sage',
]);

/** Text für den Vergleich vereinheitlichen (Umlaute, Sonderzeichen, Kleinschreibung). */
export function schluessel(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function woerter(text) {
  return schluessel(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPPWOERTER.has(w));
}

/** Volltext eines Eintrags für die Suche. */
function volltext(eintrag) {
  return schluessel(
    [
      eintrag.begriff,
      ...(eintrag.synonyme || []),
      eintrag.kurz,
      eintrag.funktion,
      ...(eintrag.aufbau || []),
      ...(eintrag.einsatz || []),
      ...(eintrag.hinweise || []),
      ...(eintrag.stoerungen || []),
      ...(eintrag.werte || []),
      ...(eintrag.normen || []),
      ...(eintrag.formeln || []).map((f) => `${f.name} ${f.formel} ${f.erklaerung}`),
      ...(eintrag.vertiefungen || []).map((v) => `${v.frage} ${v.text}`),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

const VOLLTEXT = new Map(WISSENSBASIS.map((e) => [e.id, volltext(e)]));
const BEGRIFF_SCHLUESSEL = new Map(WISSENSBASIS.map((e) => [e.id, schluessel(e.begriff)]));
const SYNONYM_SCHLUESSEL = new Map(
  WISSENSBASIS.map((e) => [e.id, (e.synonyme || []).map((s) => schluessel(s))]),
);

/**
 * Bewertet, wie gut ein Eintrag zur Anfrage passt.
 * Höhere Zahl = besserer Treffer, 0 = kein Treffer.
 */
function bewerte(eintrag, anfrage, anfrageWoerter) {
  const begriff = BEGRIFF_SCHLUESSEL.get(eintrag.id);
  const synonyme = SYNONYM_SCHLUESSEL.get(eintrag.id);
  const text = VOLLTEXT.get(eintrag.id);
  let punkte = 0;

  if (anfrage === eintrag.id || anfrage === begriff) punkte += 120;
  else if (synonyme.includes(anfrage)) punkte += 100;

  if (anfrage.length > 2) {
    if (begriff.includes(anfrage)) punkte += 55;
    else if (anfrage.includes(begriff) && begriff.length > 4) punkte += 45;
    // Synonym nur werten, wenn es als ganzes Wort (bzw. ganze Wortfolge) vorkommt
    const anfrageWoerterMenge = new Set(anfrage.split(' '));
    if (
      synonyme.some(
        (s) =>
          s.length > 2 &&
          (s === anfrage || anfrageWoerterMenge.has(s) || (s.includes(' ') && anfrage.includes(s)) || s.includes(anfrage)),
      )
    ) {
      punkte += 35;
    }
  }

  for (const wort of anfrageWoerter) {
    if (begriff.includes(wort)) punkte += 14;
    else if (synonyme.some((s) => s.includes(wort))) punkte += 10;
    else if (text.includes(wort)) punkte += 3;
  }

  return punkte;
}

/**
 * Sucht in der Fachdatenbank.
 * @param {string} anfrage
 * @param {object} [o]
 * @param {number} [o.grenze] maximale Trefferzahl
 * @param {string} [o.bereich] nur dieser Bereich
 */
export function sucheWissen(anfrage, { grenze = 12, bereich } = {}) {
  const a = schluessel(anfrage);
  const aw = woerter(anfrage);
  const grundmenge = bereich ? WISSENSBASIS.filter((e) => e.bereich === bereich) : WISSENSBASIS;

  if (!a) {
    return grundmenge.slice(0, grenze).map((eintrag) => ({ eintrag, punkte: 0 }));
  }

  return grundmenge
    .map((eintrag) => ({ eintrag, punkte: bewerte(eintrag, a, aw) }))
    .filter((t) => t.punkte > 0)
    .sort((x, y) => y.punkte - x.punkte || x.eintrag.begriff.localeCompare(y.eintrag.begriff, 'de'))
    .slice(0, grenze);
}

/** Bester Treffer zu einem Begriff oder null. */
export function findeWissen(begriff) {
  const direkt = WISSEN_NACH_ID.get(schluessel(begriff).replace(/ /g, '_'));
  if (direkt) return direkt;
  const treffer = sucheWissen(begriff, { grenze: 1 });
  if (!treffer.length) return null;
  // Zu schwache Treffer (nur ein Wort im Fließtext) gelten nicht als Erklärung.
  return treffer[0].punkte >= 14 ? treffer[0].eintrag : null;
}

/** Mehrere passende Einträge, z. B. für den Faktenblock im KI-Prompt. */
export function findeMehrere(text, anzahl = 4) {
  return sucheWissen(text, { grenze: anzahl })
    .filter((t) => t.punkte >= 20)
    .map((t) => t.eintrag);
}

/** Kurzübersicht für Listen in der App. */
export function uebersicht(eintrag) {
  return {
    id: eintrag.id,
    begriff: eintrag.begriff,
    bereich: eintrag.bereich,
    bereichName: BEREICHE[eintrag.bereich] || eintrag.bereich,
    kategorie: eintrag.kategorie,
    kurz: eintrag.kurz,
  };
}

/** Eintrag mit aufgelösten Verweisen. */
export function vollstaendig(eintrag) {
  return {
    ...eintrag,
    bereichName: BEREICHE[eintrag.bereich] || eintrag.bereich,
    verwandteEintraege: (eintrag.verwandt || [])
      .map((id) => WISSEN_NACH_ID.get(id))
      .filter(Boolean)
      .map((e) => ({ id: e.id, begriff: e.begriff })),
  };
}

/**
 * Faktenblock für den KI-Prompt: verdichtete Angaben aus der Datenbank,
 * damit KI-Texte dieselben Werte und Regelwerke verwenden.
 */
export function faktenBlock(text, anzahl = 3) {
  const treffer = findeMehrere(text, anzahl);
  if (!treffer.length) return '';
  const bloecke = treffer.map((e) => {
    const zeilen = [`### ${e.begriff} (${BEREICHE[e.bereich]})`, e.kurz];
    if (e.funktion) zeilen.push(`Funktion: ${e.funktion}`);
    if (e.werte?.length) zeilen.push(`Kennwerte: ${e.werte.join('; ')}`);
    if (e.formeln?.length) zeilen.push(`Formeln: ${e.formeln.map((f) => `${f.name}: ${f.formel}`).join('; ')}`);
    if (e.hinweise?.length) zeilen.push(`Praxis: ${e.hinweise.slice(0, 3).join('; ')}`);
    if (e.normen?.length) zeilen.push(`Regelwerke: ${e.normen.join(', ')}`);
    return zeilen.join('\n');
  });
  return [
    'Auszug aus der betrieblichen Fachdatenbank – diese Angaben sind verbindlich und dürfen nicht durch andere Werte ersetzt werden:',
    ...bloecke,
  ].join('\n\n');
}

/** Statistik für Startseite und Tests. */
export function statistik() {
  const nachBereich = {};
  for (const e of WISSENSBASIS) nachBereich[e.bereich] = (nachBereich[e.bereich] || 0) + 1;
  return { gesamt: WISSENSBASIS.length, nachBereich };
}
