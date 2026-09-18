/**
 * Fachaufgaben: KI-Aufruf mit automatischem Rückfall auf den Fachmodus offline.
 * Jede Funktion liefert zusätzlich `quelle` ("ki" | "offline") und ggf. `warnung`.
 */
import { KI_AKTIV, jsonAnfrage, KIFehler } from './client.js';
import {
  SYSTEM_BERICHTSHEFT,
  SYSTEM_FACHBERICHT,
  SYSTEM_ERKLAERUNG,
  SYSTEM_ZEICHNUNG,
  SCHEMA_BERICHTSHEFT,
  SCHEMA_FACHBERICHT,
  SCHEMA_ERKLAERUNG,
  SCHEMA_VERTIEFUNG,
  SCHEMA_ZEICHNUNG,
  SCHEMA_BEFEHL,
  FACHSPRACHE_REGELN,
} from './prompts.js';
import { promptHinweise } from './fachsprache.js';
import { faktenBlock } from './wissen/index.js';
import {
  offlineBerichtsheft,
  offlineFachbericht,
  offlineErklaerung,
  offlineVertiefung,
  offlineZeichnung,
  erkenneBefehl,
} from './offline.js';
import { saeubereSvg, schemaZeichnung } from './svg.js';

const OFFLINE_HINWEIS =
  'Auf dem Server ist kein KI-Zugang hinterlegt – es wurde der eingebaute Fachmodus offline verwendet.';

function mitRueckfall(offlineErgebnis, fehler) {
  return {
    ...offlineErgebnis,
    quelle: 'offline',
    warnung: fehler
      ? `KI nicht erreichbar (${fehler.message}) – es wurde der Fachmodus offline verwendet.`
      : OFFLINE_HINWEIS,
  };
}

function kontextBlock(kontext) {
  if (!kontext) return '';
  const teile = [];
  if (kontext.betrieb) teile.push(`Betrieb/Gewerk: ${kontext.betrieb}`);
  if (kontext.lehrjahr) teile.push(`Ausbildungsjahr: ${kontext.lehrjahr}`);
  if (kontext.titel) teile.push(`Titel des Berichts: ${kontext.titel}`);
  if (kontext.bereich) teile.push(`Fachbereich: ${kontext.bereich}`);
  if (kontext.vorhandenes) teile.push(`Bereits im Bericht enthalten:\n${kontext.vorhandenes}`);
  return teile.length ? `\n\nZusatzinformationen:\n${teile.join('\n')}` : '';
}

/* ------------------------------------------------------------------ Berichtsheft */

export async function baueBerichtsheft({ transkript, kontext }) {
  if (!KI_AKTIV) return mitRueckfall(offlineBerichtsheft(transkript));
  try {
    const ergebnis = await jsonAnfrage({
      system: SYSTEM_BERICHTSHEFT,
      schema: SCHEMA_BERICHTSHEFT,
      name: 'berichtsheft',
      maxTokens: 4000,
      prompt: [
        'Wandle das folgende Diktat in Berichtshefteinträge um.',
        '',
        `Diktat:\n"""${transkript}"""`,
        promptHinweise(transkript),
        faktenBlock(transkript, 2),
        kontextBlock(kontext),
        '',
        'Erzeuge je genanntem Wochentag einen Block. Formuliere die Punkte in Fachsprache,',
        'füge fachlich notwendige Zwischenschritte hinzu (z. B. entgraten, Einstecktiefe prüfen),',
        'erfinde aber keine Mengen, Zeiten oder Objekte.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
    return { ...ergebnis, quelle: 'ki' };
  } catch (err) {
    if (!(err instanceof KIFehler)) throw err;
    return mitRueckfall(offlineBerichtsheft(transkript), err);
  }
}

/* ------------------------------------------------------------------ Fachbericht */

export async function baueFachbericht({ transkript, kontext }) {
  if (!KI_AKTIV) return mitRueckfall(offlineFachbericht(transkript));
  try {
    const ergebnis = await jsonAnfrage({
      system: SYSTEM_FACHBERICHT,
      schema: SCHEMA_FACHBERICHT,
      name: 'fachbericht',
      maxTokens: 8000,
      prompt: [
        'Erstelle aus der folgenden Arbeitsschilderung einen vollständigen Fachbericht.',
        '',
        `Schilderung:\n"""${transkript}"""`,
        promptHinweise(transkript),
        faktenBlock(transkript, 4),
        kontextBlock(kontext),
        '',
        'Anforderungen:',
        '- Arbeitsschritte in technisch richtiger Reihenfolge, jeder Schritt mit kurzer Begründung.',
        '- Materialliste mit Werkstoff, Dimension (DN bzw. Außendurchmesser x Wandstärke) und Verbindungstechnik.',
        '- Werkzeugliste mit Zweck des jeweiligen Werkzeugs.',
        '- Arbeitssicherheit konkret auf die Tätigkeit bezogen.',
        '- Abschnitt "erklaerungen": die 3 bis 6 wichtigsten Fachbegriffe bzw. Funktionsprinzipien',
        '  lehrbuchartig erklären (Aufbau, Funktion, Zweck, Folgen bei Fehlern).',
        '- Mengen nur angeben, wenn sie in der Schilderung genannt wurden.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
    return { ...ergebnis, quelle: 'ki' };
  } catch (err) {
    if (!(err instanceof KIFehler)) throw err;
    return mitRueckfall(offlineFachbericht(transkript), err);
  }
}

/* ------------------------------------------------------------------ Erklärung */

export async function baueErklaerung({ begriff, kontext, tiefe = 1 }) {
  if (!KI_AKTIV) return mitRueckfall(offlineErklaerung(begriff));
  const umfang =
    tiefe >= 3
      ? 'Sehr ausführlich (Prüfungsniveau Gesellenprüfung Teil 2), mit Zahlenwerten, Berechnungsgrundlagen und Grenzwerten.'
      : tiefe === 2
        ? 'Ausführlich, mit typischen Einstellwerten und Fehlerbildern.'
        : 'Klar und verständlich, aber vollständig: Aufbau, Funktionsprinzip, Zweck, Einsatzort.';
  try {
    const ergebnis = await jsonAnfrage({
      system: SYSTEM_ERKLAERUNG,
      schema: SCHEMA_ERKLAERUNG,
      name: 'erklaerung',
      maxTokens: tiefe >= 3 ? 6000 : 4000,
      temperatur: 0.25,
      prompt: [
        `Erkläre für einen Auszubildenden Anlagenmechaniker SHK: "${begriff}"`,
        '',
        `Umfang: ${umfang}`,
        promptHinweise(begriff),
        faktenBlock(begriff, 2),
        kontextBlock(kontext),
        '',
        'Gliedere in Abschnitte wie: Kurzdefinition, Aufbau, Funktionsprinzip, Einsatz und Einbau,',
        'Einstellwerte/Kennzahlen, typische Fehlerbilder, einschlägige Regelwerke.',
        'Nenne im Feld "stichworte" 3 bis 6 verwandte Begriffe zum Weiterfragen.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
    return { ...ergebnis, quelle: 'ki' };
  } catch (err) {
    if (!(err instanceof KIFehler)) throw err;
    return mitRueckfall(offlineErklaerung(begriff), err);
  }
}

/* ------------------------------------------------------------------ Vertiefung */

export async function baueVertiefung({ begriff, frage, kontext, bisher, tiefe = 2 }) {
  if (!KI_AKTIV) return mitRueckfall(offlineVertiefung(begriff, frage));
  try {
    const ergebnis = await jsonAnfrage({
      system: SYSTEM_ERKLAERUNG,
      schema: SCHEMA_VERTIEFUNG,
      name: 'vertiefung',
      maxTokens: 4000,
      temperatur: 0.3,
      prompt: [
        frage
          ? `Beantworte diese Rückfrage ausführlich und fachlich genau: "${frage}"`
          : `Erläutere diesen Punkt deutlich ausführlicher: "${begriff}"`,
        begriff && frage ? `Zusammenhang / Bezugspunkt: "${begriff}"` : '',
        bisher ? `Bisher wurde dazu gesagt:\n"""${String(bisher).slice(0, 4000)}"""` : '',
        'Wiederhole das Bisherige nicht, sondern gehe fachlich tiefer:',
        'Ursachen, physikalische Zusammenhänge, Zahlenwerte, Folgen, Gegenmaßnahmen, Regelwerke.',
        promptHinweise(`${begriff || ''} ${frage || ''}`),
        faktenBlock(`${begriff || ''} ${frage || ''}`, 2),
        kontextBlock(kontext),
      ]
        .filter(Boolean)
        .join('\n'),
    });
    return { ...ergebnis, quelle: 'ki' };
  } catch (err) {
    if (!(err instanceof KIFehler)) throw err;
    return mitRueckfall(offlineVertiefung(begriff, frage), err);
  }
}

/* ------------------------------------------------------------------ Zeichnung */

export async function baueZeichnung({ beschreibung, kontext, titel }) {
  if (!KI_AKTIV) return mitRueckfall(offlineZeichnung(beschreibung, titel));
  try {
    const ergebnis = await jsonAnfrage({
      system: SYSTEM_ZEICHNUNG,
      schema: SCHEMA_ZEICHNUNG,
      name: 'zeichnung',
      maxTokens: 8000,
      temperatur: 0.2,
      prompt: [
        `Erstelle eine technische Prinzipskizze zu: "${beschreibung}"`,
        promptHinweise(beschreibung),
        faktenBlock(beschreibung, 2),
        kontextBlock(kontext),
        '',
        'Die Skizze muss fachlich korrekt sein: richtige Einbaureihenfolge, richtige Fließrichtung,',
        'alle wesentlichen Bauteile beschriftet. Halte dich strikt an die SVG-Vorgaben.',
      ]
        .filter(Boolean)
        .join('\n'),
    });
    const svg = saeubereSvg(ergebnis.svg);
    if (!svg) {
      const ersatz = schemaZeichnung(beschreibung, ergebnis.titel || titel);
      return {
        ...ersatz,
        quelle: 'offline',
        warnung: 'Die KI-Skizze war nicht verwertbar – es wurde eine Prinzipskizze aus der Bauteilerkennung erzeugt.',
      };
    }
    return { ...ergebnis, svg, quelle: 'ki' };
  } catch (err) {
    if (!(err instanceof KIFehler)) throw err;
    return mitRueckfall(offlineZeichnung(beschreibung, titel), err);
  }
}

/* ------------------------------------------------------------------ Sprachbefehl */

/**
 * Erkennt, ob ein Diktat ein Befehl ist. Zuerst lokal (schnell, kostenfrei),
 * bei Unklarheit optional über die KI.
 */
export async function deuteBefehl({ text, mitKi = true }) {
  const lokal = erkenneBefehl(text);
  if (lokal) return lokal;
  if (!KI_AKTIV || !mitKi) return { aktion: 'eintrag', text, quelle: 'lokal' };
  try {
    const ergebnis = await jsonAnfrage({
      system: `${FACHSPRACHE_REGELN}\n\nDu erkennst, was ein Nutzer per Sprache in einer Berichtsheft-App möchte.`,
      schema: SCHEMA_BEFEHL,
      name: 'befehl',
      maxTokens: 700,
      temperatur: 0,
      prompt: [
        `Gesprochener Satz: "${text}"`,
        '',
        'Entscheide, ob es sich um einen Steuerbefehl handelt oder um normalen Diktattext',
        'für den Bericht. Bei normalem Diktattext: aktion = "eintrag" und text = Originalsatz.',
      ].join('\n'),
    });
    return { ...ergebnis, quelle: 'ki' };
  } catch {
    return { aktion: 'eintrag', text, quelle: 'lokal' };
  }
}

export { KI_AKTIV };
