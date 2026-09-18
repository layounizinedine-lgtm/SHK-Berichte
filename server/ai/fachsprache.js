/**
 * Fachsprache-Engine
 * ---------------------------------------------------------------------------
 * Wandelt Umgangssprache ("100er SML mit der Flex geschnitten") in
 * SHK-Fachsprache ("SML-Abflussrohr DN 100 mit dem Winkelschleifer abgelaengt").
 *
 * Arbeitet vollstaendig lokal. Das Ergebnis dient zugleich als Hinweis-Block
 * fuer den KI-Prompt, damit die KI die Betriebsbegriffe sicher trifft.
 */

import { GLOSSAR, WANDSTAERKEN, ZOLL_DN, ZOLL_SPRACHE, GRUNDWERKZEUG } from './glossar.js';
import { findeWissen, sucheWissen, faktenBlock } from './wissen/index.js';

// Platzhalter-Marker: Zeichen, die in normalem Text nicht vorkommen und von
// keiner Folgeregel getroffen werden (verhindert Mehrfachersetzung).
const PH_START = String.fromCharCode(1);
const PH_END = String.fromCharCode(2);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wandstärke zu einem Außendurchmesser aus der Werkstofftabelle. */
function wandstaerke(werkstoff, durchmesser) {
  const tabelle = WANDSTAERKEN[werkstoff];
  if (!tabelle) return null;
  return tabelle[durchmesser] || null;
}

function rohrText(werkstoff, dm) {
  const w = wandstaerke(werkstoff, dm);
  const masse = w ? `${dm} x ${w} mm` : `${dm} mm`;
  switch (werkstoff) {
    case 'kupfer':
      return `Kupferrohr ${masse} (DIN EN 1057)`;
    case 'edelstahl':
      return `Edelstahlrohr ${masse} (1.4401, Pressfittingsystem)`;
    case 'cstahl':
      return `C-Stahlrohr ${masse}, außen verzinkt`;
    case 'verbundrohr':
      return `Mehrschichtverbundrohr ${masse}`;
    case 'praezisionsstahl':
      return `Präzisionsstahlrohr ${masse}`;
    default:
      return `Rohr ${masse}`;
  }
}

/**
 * Dimensionsregeln. Reihenfolge ist wichtig: spezielle Regeln zuerst.
 * Jede Regel liefert Fachtext + Kategorie für die Trefferliste.
 */
const DIMENSIONS_REGELN = [
  // "100er SML", "SML 100", "SML DN 100"
  {
    re: /\b(?:dn\s*)?(\d{2,3})\s*(?:er|mm)?\s*(?:sml|guss)(?:rohr|-?rohr)?(?:\s+rohr)?\b/gi,
    fach: (m) => `SML-Abflussrohr DN ${m[1]} (DIN EN 877)`,
    kategorie: 'rohr',
    werkstoff: 'sml',
  },
  {
    re: /\b(?:sml|gussrohr)\s*(?:rohr\s*)?(?:dn\s*)?(\d{2,3})(?:\s+rohr)?\b/gi,
    fach: (m) => `SML-Abflussrohr DN ${m[1]} (DIN EN 877)`,
    kategorie: 'rohr',
    werkstoff: 'sml',
  },
  // "110er HT", "HT 110", "HT DN 110"
  {
    re: /\b(?:dn\s*)?(\d{2,3})\s*(?:er|mm)?\s*ht[- ]?(?:rohr)?\b/gi,
    fach: (m) => `HT-Rohr DN ${m[1]} (PP, DIN EN 1451)`,
    kategorie: 'rohr',
    werkstoff: 'ht',
  },
  {
    re: /\bht[- ]?(?:rohr)?\s*(?:dn\s*)?(\d{2,3})\b/gi,
    fach: (m) => `HT-Rohr DN ${m[1]} (PP, DIN EN 1451)`,
    kategorie: 'rohr',
    werkstoff: 'ht',
  },
  // "110er KG", "KG 110"
  {
    re: /\b(?:dn\s*)?(\d{2,3})\s*(?:er|mm)?\s*kg[- ]?(?:rohr)?\b/gi,
    fach: (m) => `KG-Rohr DN ${m[1]} (PVC-U, DIN EN 1401)`,
    kategorie: 'rohr',
    werkstoff: 'kg',
  },
  {
    re: /\bkg[- ]?rohr\s*(?:dn\s*)?(\d{2,3})\b/gi,
    fach: (m) => `KG-Rohr DN ${m[1]} (PVC-U, DIN EN 1401)`,
    kategorie: 'rohr',
    werkstoff: 'kg',
  },
  // "22er Kupfer" / "22 mm Kupferrohr" / "22er Kupferleitung"
  {
    re: /\b(\d{2})\s*(?:er|mm|millimeter)?\s*(?:kupfer|cu)(?:rohr|leitung|-rohr)?\b/gi,
    fach: (m) => rohrText('kupfer', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'kupfer',
  },
  {
    re: /\b(?:kupfer|cu)(?:rohr|leitung|-rohr)?\s*(\d{2})\s*(?:er|mm|millimeter)?\b/gi,
    fach: (m) => rohrText('kupfer', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'kupfer',
  },
  // Edelstahl
  {
    re: /\b(\d{2})\s*(?:er|mm|millimeter)?\s*(?:edelstahl|niro|inox)(?:rohr|leitung)?\b/gi,
    fach: (m) => rohrText('edelstahl', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'edelstahl',
  },
  {
    re: /\b(?:edelstahl|niro|inox)(?:rohr|leitung)?\s*(\d{2})\s*(?:er|mm|millimeter)?\b/gi,
    fach: (m) => rohrText('edelstahl', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'edelstahl',
  },
  // C-Stahl
  {
    re: /\b(\d{2})\s*(?:er|mm|millimeter)?\s*c-?stahl(?:rohr|leitung)?\b/gi,
    fach: (m) => rohrText('cstahl', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'cstahl',
  },
  // Mehrschichtverbundrohr
  {
    re: /\b(\d{2})\s*(?:er|mm)?\s*(?:verbundrohr|mehrschichtverbundrohr|mehrschicht(?:rohr)?|alpex|mlv(?:-?rohr)?)\b/gi,
    fach: (m) => rohrText('verbundrohr', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'verbundrohr',
  },
  // Präzisionsstahlrohr / Heizungsrohr
  {
    re: /\b(\d{2})\s*(?:er|mm)?\s*(?:präzisionsstahlrohr|heizungsrohr)\b/gi,
    fach: (m) => rohrText('praezisionsstahl', Number(m[1])),
    kategorie: 'rohr',
    werkstoff: 'praezisionsstahl',
  },
  // "16x2", "16 mal 2"
  {
    re: /\b(\d{2})\s*(?:x|mal)\s*(\d(?:[,.]\d)?)\s*(?:mm)?\b/gi,
    fach: (m) => `${m[1]} x ${String(m[2]).replace('.', ',')} mm`,
    kategorie: 'dimension',
  },
  // blanke DN-Angabe
  {
    re: /\bd\.?\s?n\.?\s*(\d{2,3})\b/gi,
    fach: (m) => `DN ${m[1]}`,
    kategorie: 'dimension',
  },
  // "80er Rohr" ohne Werkstoff
  {
    re: /\b(\d{2,3})\s*er\s*(?:rohr|leitung)\b/gi,
    fach: (m) => (Number(m[1]) >= 40 ? `Rohr DN ${m[1]}` : `Rohr ${m[1]} mm`),
    kategorie: 'dimension',
  },
];

/** Gesprochene Zoll-Angaben in "DN 20 (3/4 Zoll)" wandeln. */
function zollErsetzen(text, treffer, merke) {
  let out = text;
  for (const [re, zoll] of ZOLL_SPRACHE) {
    out = out.replace(re, (roh) => {
      const dn = ZOLL_DN[zoll];
      const fach = dn ? `DN ${dn} (${zoll} Zoll)` : `${zoll} Zoll`;
      treffer.push({ roh: roh.trim(), fach, kategorie: 'dimension' });
      return merke(fach);
    });
  }
  return out;
}

/** Glossar-Regeln aus den Aliassen erzeugen (längste Aliasse zuerst). */
const GLOSSAR_REGELN = GLOSSAR.flatMap((eintrag) =>
  eintrag.aliases.map((alias) => ({
    alias,
    laenge: alias.length,
    re: new RegExp(
      `(?<![\\wäöüßÄÖÜ])${escapeRegExp(alias).replace(/\s+/g, '\\s+')}(?:s|n|en|e)?(?![\\wäöüßÄÖÜ])`,
      'gi',
    ),
    eintrag,
  })),
).sort((a, b) => b.laenge - a.laenge);

/** Grobe Genus-Bestimmung, damit "mit einer Flex" zu "mit dem Winkelschleifer" wird. */
function dativArtikel(begriff) {
  const kopf = String(begriff).split(/[\s(,/]/)[0].toLowerCase().replace(/-/g, '');
  if (
    /(maschine|zange|säge|pumpe|waage|kluppe|presse|schere|leitung|anlage|prüfung|probe|installation|dämmung|bohrung|schelle|stange|schiene|manschette|wanne|uhr|lampe|matte|station|gruppe|klappe|hülse|scheibe|kette|armatur|einrichtung)$/.test(
      kopf,
    )
  ) {
    return 'der';
  }
  return 'dem';
}

/** Kleine sprachliche Korrekturen nach dem Ersetzen. */
function nachbearbeitung(text, treffer) {
  let out = text;
  const begriffe = [...new Set(treffer.filter((t) => t.kategorie === 'werkzeug' || t.kategorie === 'bauteil').map((t) => t.fach))];
  for (const fach of begriffe) {
    const re = new RegExp(`\\bmit\\s+(?:einer|einem|eine|ein|nem|ner|meiner|meinem|der|dem|den)\\s+${escapeRegExp(fach)}`, 'gi');
    out = out.replace(re, `mit ${dativArtikel(fach)} ${fach}`);
  }
  return out
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

/**
 * Hauptfunktion: normalisiert einen gesprochenen Text.
 * @param {string} eingabe Rohtext aus der Spracherkennung
 */
export function normalisiere(eingabe) {
  const treffer = [];
  const platzhalter = [];
  const merke = (wert) => {
    platzhalter.push(wert);
    return `${PH_START}${platzhalter.length - 1}${PH_END}`;
  };

  let text = String(eingabe || '').replace(/\s+/g, ' ').trim();

  // 1. Zoll-Angaben
  text = zollErsetzen(text, treffer, merke);

  // 2. Dimensions- und Werkstoffregeln
  for (const regel of DIMENSIONS_REGELN) {
    text = text.replace(regel.re, (...args) => {
      const m = args.slice(0, -2);
      const fach = regel.fach(m);
      treffer.push({ roh: m[0].trim(), fach, kategorie: regel.kategorie, werkstoff: regel.werkstoff });
      return merke(fach);
    });
  }

  // 3. Begriffsglossar
  for (const regel of GLOSSAR_REGELN) {
    text = text.replace(regel.re, (roh) => {
      treffer.push({
        roh: roh.trim(),
        fach: regel.eintrag.fach,
        kategorie: regel.eintrag.kategorie,
        eintrag: regel.eintrag,
      });
      return merke(regel.eintrag.fach);
    });
  }

  // 4. Platzhalter auflösen
  text = text.replace(new RegExp(`${PH_START}(\\d+)${PH_END}`, 'g'), (_, i) => platzhalter[Number(i)]);
  text = nachbearbeitung(text, treffer);

  const werkzeug = new Set();
  const material = new Set();
  const normen = new Set();
  const hinweise = new Set();

  for (const t of treffer) {
    const e = t.eintrag;
    if (!e) continue;
    (e.werkzeug || []).forEach((w) => werkzeug.add(w));
    (e.material || []).forEach((w) => material.add(w));
    (e.normen || []).forEach((w) => normen.add(w));
    if (e.hinweis) hinweise.add(e.hinweis);
  }

  // Werkstoffabhängige Listen ergänzen
  for (const t of treffer) {
    if (t.kategorie !== 'rohr') continue;
    material.add(t.fach);
    if (t.werkstoff === 'sml') {
      material.add('CV-/Rapid-Verbinder mit Edelstahlmantel in passender Nennweite');
      werkzeug.add('Winkelschleifer mit Trennscheibe bzw. Trennkette für Guss');
      normen.add('DIN EN 877');
      normen.add('DIN 1986-100');
    } else if (t.werkstoff === 'kupfer' || t.werkstoff === 'edelstahl' || t.werkstoff === 'cstahl') {
      material.add('Pressfittings des zugelassenen Systems (Bogen, T-Stück, Übergang)');
      werkzeug.add('Akku-Pressmaschine mit passender Pressbacke');
      werkzeug.add('Rohrabschneider und Innen-/Außenentgrater');
    } else if (t.werkstoff === 'ht' || t.werkstoff === 'kg') {
      material.add('Formteile (Bogen, Abzweig, Übergang) und Gleitmittel');
      werkzeug.add('Feinsäge bzw. Rohrschneider für Kunststoffrohr');
      normen.add('DIN EN 12056');
    } else if (t.werkstoff === 'verbundrohr') {
      material.add('Press- oder Schiebehülsenfittings');
      werkzeug.add('Rohrschere und Kalibrierwerkzeug');
    }
  }

  return {
    text,
    treffer,
    werkzeug: [...werkzeug],
    material: [...material],
    normen: [...normen],
    hinweise: [...hinweise],
  };
}

/**
 * Kompakter Hinweisblock für den KI-Prompt: nur die im Text erkannten Begriffe.
 * Hält den Prompt klein und die Fachsprache trotzdem verbindlich.
 */
export function promptHinweise(eingabe) {
  const n = normalisiere(eingabe);
  if (!n.treffer.length) return '';
  const zeilen = [];
  const gesehen = new Set();
  for (const t of n.treffer) {
    const key = `${t.roh.toLowerCase()}=>${t.fach}`;
    if (gesehen.has(key)) continue;
    gesehen.add(key);
    zeilen.push(`- "${t.roh}" => ${t.fach}`);
  }
  return ['Verbindliche Begriffszuordnung aus dem Betriebsglossar (so verwenden):', ...zeilen.slice(0, 40)].join('\n');
}

export { GRUNDWERKZEUG, findeWissen, sucheWissen, faktenBlock };
