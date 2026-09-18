/**
 * Fachmodus offline
 * ---------------------------------------------------------------------------
 * Erzeugt Berichtshefteinträge, Fachberichte, Erklärungen und Vertiefungen
 * ohne KI-Schlüssel – allein aus der Fachsprache-Engine und der Wissensbasis.
 * Die App bleibt damit auch ohne Serverschlüssel voll bedienbar.
 */
import { normalisiere, findeWissen, GRUNDWERKZEUG } from './fachsprache.js';
import { schemaZeichnung } from './svg.js';

export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const AKTION_ZU_NOMEN = [
  [/montiert|befestigt|verlegt|installiert/i, 'Montage'],
  [/demontiert|ausgebaut|entsorgt/i, 'Demontage'],
  [/dichtheits|druckprobe|belastungsprüfung/i, 'Dichtheitsprüfung'],
  [/gespült/i, 'Spülung'],
  [/gedämmt/i, 'Dämmarbeiten'],
  [/in betrieb/i, 'Inbetriebnahme'],
  [/abgeglichen|eingeregelt/i, 'Hydraulischer Abgleich'],
  [/gebohrt|gestemmt|durchbruch/i, 'Vorbereitende Arbeiten'],
  [/gewartet|instand/i, 'Instandhaltung'],
  [/berufsschul/i, 'Berufsschule'],
  [/unterweisung/i, 'Unterweisung'],
];

/** Text in einzelne Tätigkeitspunkte zerlegen. */
function inPunkte(text) {
  return String(text)
    .split(/(?:,\s*(?:danach|dann|anschließend|außerdem|zusätzlich)\s*|\s+und\s+(?:danach|dann|anschließend)\s+|[.;]\s+|\s*\n+\s*)/i)
    .map((s) => s.replace(/^(?:und|danach|dann|anschließend|außerdem)\s+/i, '').trim())
    .filter((s) => s.length > 2)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
}

function titelAus(normalisiert) {
  const aktion = AKTION_ZU_NOMEN.find(([re]) => re.test(normalisiert.text));
  const objekt =
    normalisiert.treffer.find((t) => t.kategorie === 'rohr')?.fach ||
    normalisiert.treffer.find((t) => t.kategorie === 'bauteil')?.fach ||
    '';
  const objektKurz = objekt.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (aktion && objektKurz) return `${aktion[1]} von ${objektKurz}`;
  if (aktion) return aktion[1];
  if (objektKurz) return `Arbeiten an ${objektKurz}`;
  return 'Tätigkeitsbericht';
}

/** Diktat an Wochentagen aufteilen. */
function tageTrennen(text) {
  const muster = new RegExp(`\\b(${WOCHENTAGE.join('|')})\\b`, 'gi');
  const treffer = [...String(text).matchAll(muster)];
  if (!treffer.length) return [{ tag: 'Ohne Zuordnung', text: String(text).trim() }];

  const bloecke = [];
  if (treffer[0].index > 0) {
    const vorlauf = text.slice(0, treffer[0].index).trim();
    if (vorlauf.length > 3) bloecke.push({ tag: 'Ohne Zuordnung', text: vorlauf });
  }
  treffer.forEach((t, i) => {
    const start = t.index + t[0].length;
    const ende = i + 1 < treffer.length ? treffer[i + 1].index : text.length;
    const tag = t[0].charAt(0).toUpperCase() + t[0].slice(1).toLowerCase();
    const inhalt = text
      .slice(start, ende)
      .replace(/^(?:\s*(?:hab(?:e)?\s+ich|war\s+ich|habe|ich|:|,|-)\s*)+/i, '')
      .trim();
    if (inhalt.length > 2) bloecke.push({ tag, text: inhalt });
  });
  return bloecke.length ? bloecke : [{ tag: 'Ohne Zuordnung', text: String(text).trim() }];
}

export function offlineBerichtsheft(transkript) {
  const tage = tageTrennen(transkript).map(({ tag, text }) => {
    const n = normalisiere(text);
    return {
      tag,
      eintraege: [
        {
          titel: titelAus(n),
          punkte: inPunkte(n.text),
          material: n.material,
          werkzeug: n.werkzeug,
          normen: n.normen,
        },
      ],
    };
  });
  const hinweise = [...new Set(tageTrennen(transkript).flatMap((b) => normalisiere(b.text).hinweise))];
  return { tage, hinweise, quelle: 'offline' };
}

export function offlineFachbericht(transkript) {
  const n = normalisiere(transkript);
  const punkte = inPunkte(n.text);
  const arbeitsschritte = punkte.map((p, i) => ({
    titel: `Arbeitsschritt ${i + 1}`,
    beschreibung: p,
    hinweis: '',
  }));

  const erklaerungen = [];
  const gesehen = new Set();
  for (const t of n.treffer) {
    const w = findeWissen(t.fach) || findeWissen(t.roh);
    if (w && !gesehen.has(w.begriff)) {
      gesehen.add(w.begriff);
      erklaerungen.push({
        begriff: w.begriff,
        text: `${w.kurz}\n\n${w.funktion}`,
      });
    }
    if (erklaerungen.length >= 5) break;
  }

  return {
    titel: titelAus(n),
    einleitung:
      'Der Fachbericht dokumentiert die ausgeführten Arbeiten, das eingesetzte Material und Werkzeug ' +
      'sowie die zugrunde liegenden technischen Regeln. Grundlage ist die Arbeitsschilderung: ' +
      `„${String(transkript).trim().slice(0, 300)}“`,
    anlage: '',
    arbeitsschritte,
    material: n.material.map((m) => ({ bezeichnung: m, dimension: '', menge: '', hinweis: '' })),
    werkzeug: [...new Set([...n.werkzeug, ...GRUNDWERKZEUG])].map((w) => ({ bezeichnung: w, zweck: '' })),
    arbeitssicherheit: [
      'Persönliche Schutzausrüstung tragen (Schutzbrille, Handschuhe, Sicherheitsschuhe, bei Trennarbeiten Gehörschutz).',
      'Vor Arbeitsbeginn Anlagenteil absperren, entleeren und gegen Wiedereinschalten sichern.',
      ...n.hinweise,
    ],
    normen: n.normen.map((x) => ({ bezeichnung: x, inhalt: '' })),
    erklaerungen,
    fazit: '',
    quelle: 'offline',
  };
}

export function offlineErklaerung(begriff) {
  const w = findeWissen(begriff);
  if (!w) {
    const n = normalisiere(begriff);
    const fach = n.treffer[0]?.fach;
    return {
      begriff: fach || String(begriff).trim(),
      kurz: fach
        ? `„${String(begriff).trim()}“ heißt in der Fachsprache ${fach}.`
        : `Zu „${String(begriff).trim()}“ liegt in der lokalen Wissensbasis noch keine ausführliche Erklärung vor.`,
      abschnitte: [
        {
          titel: 'Hinweis',
          text:
            'Der Fachmodus offline enthält nur die wichtigsten Bauteile und Vorgänge. ' +
            'Sobald auf dem Server ein KI-Schlüssel hinterlegt ist, erklärt die KI jeden Begriff ausführlich ' +
            'und beantwortet auch Rückfragen.',
          punkte: [],
        },
      ],
      normen: n.normen,
      stichworte: [],
      quelle: 'offline',
    };
  }

  const abschnitte = [
    { titel: 'Funktionsprinzip', text: w.funktion, punkte: [] },
    { titel: 'Aufbau', text: '', punkte: w.aufbau || [] },
    { titel: 'Einsatz und Einbau', text: '', punkte: w.einsatz || [] },
  ];
  if (w.hinweise?.length) abschnitte.push({ titel: 'Praxishinweise', text: '', punkte: w.hinweise });
  if (w.stoerungen?.length) abschnitte.push({ titel: 'Typische Fehlerbilder', text: '', punkte: w.stoerungen });

  return {
    begriff: w.begriff,
    kurz: w.kurz,
    abschnitte,
    normen: w.normen || [],
    stichworte: [],
    quelle: 'offline',
  };
}

export function offlineVertiefung(begriff, frage) {
  const w = findeWissen(begriff) || findeWissen(frage);
  const f = String(frage || '').toLowerCase();

  if (w && /zu\s*viel\s*druck|überdruck|druck\s*steigt|zu\s*hoher\s*druck/.test(f) && w.ueberdruck) {
    return { titel: 'Verhalten bei zu hohem Druck', text: w.ueberdruck, punkte: [], quelle: 'offline' };
  }
  if (w) {
    return {
      titel: `${w.begriff} – ausführlich`,
      text: `${w.kurz}\n\n${w.funktion}`,
      punkte: [...(w.hinweise || []), ...(w.stoerungen || [])],
      quelle: 'offline',
    };
  }
  return {
    titel: 'Vertiefung nicht möglich',
    text:
      'Für diese Rückfrage ist die KI nötig. Im Fachmodus offline stehen nur die Grundlagen der ' +
      'lokalen Wissensbasis zur Verfügung.',
    punkte: [],
    quelle: 'offline',
  };
}

export function offlineZeichnung(beschreibung, titel) {
  return { ...schemaZeichnung(beschreibung, titel), quelle: 'offline' };
}

/* -------------------------------------------------------------------------- */
/* Sprachbefehle                                                              */
/* -------------------------------------------------------------------------- */

const ZAHLWORTE = {
  eins: 1, ein: 1, eine: 1, erste: 1, ersten: 1,
  zwei: 2, zweite: 2, zweiten: 2,
  drei: 3, dritte: 3, dritten: 3,
  vier: 4, vierte: 4, vierten: 4,
  fünf: 5, fünfte: 5, fünften: 5,
  sechs: 6, sechste: 6, sechsten: 6,
  sieben: 7, siebte: 7, siebten: 7,
  acht: 8, achte: 8, achten: 8,
  neun: 9, neunte: 9, neunten: 9,
  zehn: 10, zehnte: 10, zehnten: 10,
};

function nummerAus(text) {
  const ziffer = text.match(/\b(\d{1,2})\b/);
  if (ziffer) return Number(ziffer[1]);
  for (const [wort, zahl] of Object.entries(ZAHLWORTE)) {
    if (new RegExp(`\\b${wort}\\b`, 'i').test(text)) return zahl;
  }
  return undefined;
}

/**
 * Erkennt Sprachbefehle lokal (schnell und kostenfrei).
 * Liefert null, wenn es kein Befehl, sondern normaler Diktattext ist.
 */
export function erkenneBefehl(eingabe) {
  const text = String(eingabe || '').trim();
  if (!text) return null;
  const t = text.toLowerCase();

  if (/^(?:bitte\s+)?(?:lösch|loesch|entfern|streich|nimm|weg mit)/.test(t) || /raus(?:nehmen|werfen)/.test(t)) {
    const nummer = nummerAus(t);
    const suchtext = text
      .replace(/^(?:bitte\s+)?(?:lösch(?:e|en)?|loesch(?:e|en)?|entfern(?:e|en)?|streich(?:e|en)?|nimm|weg mit)\s*/i, '')
      .replace(/\b(?:punkt|nummer|eintrag|zeile|schritt|position)\b\s*\d*/i, '')
      .replace(/\braus\b|\bweg\b/i, '')
      .trim();
    return { aktion: 'loeschen', nummer, suchtext, quelle: 'lokal' };
  }

  if (/^(?:bitte\s+)?(?:erklär|erklaer|erkläre|was ist|was bedeutet|wofür ist|wozu dient|erläuter)/.test(t)) {
    const begriff = text
      .replace(/^(?:bitte\s+)?(?:erkläre?|erklaere?|erläutere?|was ist|was bedeutet|wofür ist|wozu dient)\s*/i, '')
      .replace(/^(?:mir|uns)\s+/i, '')
      .replace(/^(?:ein|eine|einen|einem|der|die|das|den|dem)\s+/i, '')
      .replace(/[?!.]+$/, '')
      .trim();
    return { aktion: 'erklaeren', begriff, quelle: 'lokal' };
  }

  if (/(ausführlicher|ausfuehrlicher|genauer|mehr details|mehr detail|noch mehr|vertiefe|tiefer|weiter erklären)/.test(t)) {
    return { aktion: 'vertiefen', begriff: text, quelle: 'lokal' };
  }

  if (/(zeichnung|skizze|zeichne|schema|strangschema|funktionsschema)/.test(t)) {
    return { aktion: 'zeichnung', begriff: text, quelle: 'lokal' };
  }

  if (/^(?:bitte\s+)?(?:speicher|sichere|sicher ab)/.test(t)) {
    return { aktion: 'speichern', quelle: 'lokal' };
  }

  if (/^(?:der\s+)?titel\s*(?:ist|lautet|:)?\s*/.test(t)) {
    return {
      aktion: 'titel',
      text: text.replace(/^(?:der\s+)?titel\s*(?:ist|lautet|:)?\s*/i, '').trim(),
      quelle: 'lokal',
    };
  }

  return null;
}
