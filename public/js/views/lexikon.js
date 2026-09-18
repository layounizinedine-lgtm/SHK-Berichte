/**
 * Fachdatenbank – Nachschlagewerk für Anlagenmechanik SHK und Versorgungstechnik.
 * Suche per Sprache oder Text, Filterung nach Fachbereich, Detailansicht mit
 * Kennwerten, Formeln, Regelwerken und Rückfragen.
 */
import { el, leere, meldung, hinweis, ladeAnzeige, kopiere } from '../ui.js';
import { api } from '../api.js';
import { diktatFeld, setzeErklaerHandler } from '../components.js';
import { erklaerDialog, kontextAus } from './gemeinsam.js';
import { vorlesen, vorlesenStopp } from '../speech.js';

let zwischenspeicher = null; // Bereiche und Statistik nur einmal laden

export async function ansichtLexikon(behaelter, id) {
  leere(behaelter);
  setzeErklaerHandler((text) => erklaerDialog(text, { kontext: kontextAus('Nachschlagen') }));

  if (id) {
    await zeigeEintrag(behaelter, id);
    return;
  }

  let bereich = '';
  let suchtext = '';

  const kopf = el('div', { style: 'margin-bottom:16px' }, [
    el('h1', { text: 'Nachschlagen' }),
    el('p.leise', {
      text: 'Fachdatenbank zu Sanitär, Heizung, Gas, Lüftung, Klima und Versorgungstechnik – mit Funktionsprinzipien, Kennwerten, Formeln und Regelwerken.',
    }),
  ]);

  const bereichsLeiste = el('div.chip-liste', { style: 'margin-bottom:12px' });
  const ergebnisBereich = el('div');

  const suche = diktatFeld({
    titel: 'Begriff suchen',
    hilfe: 'Zum Beispiel: „Druckminderer“, „hydraulischer Abgleich“, „Rückstauebene“ – oder gleich „erkläre einen Systemtrenner“.',
    platzhalter: 'Suchbegriff …',
    beiBefehl: async (befehl) => {
      if (befehl.aktion === 'erklaeren') {
        await erklaerDialog(befehl.begriff || befehl.text || '', { kontext: kontextAus('Nachschlagen') });
        return true;
      }
      return false;
    },
    aktionen: [
      {
        text: 'Suchen',
        klasse: 'knopf-haupt',
        aufruf: async (text, steuerung) => {
          suchtext = text;
          steuerung.stopp();
          await lade();
        },
      },
      {
        text: 'Alles anzeigen',
        klasse: 'knopf-leer',
        aufruf: async (_text, steuerung) => {
          suchtext = '';
          steuerung.leeren();
          await lade();
        },
      },
    ],
  });

  // Direkt beim Tippen suchen (entprellt)
  let tippTimer = null;
  suche.textfeld.addEventListener('input', () => {
    clearTimeout(tippTimer);
    tippTimer = setTimeout(async () => {
      suchtext = suche.hole();
      await lade();
    }, 350);
  });

  behaelter.append(kopf, suche.element, el('div', { style: 'margin-top:16px' }, [bereichsLeiste, ergebnisBereich]));

  async function lade() {
    leere(ergebnisBereich).append(ladeAnzeige('Fachdatenbank wird durchsucht …'));
    try {
      const daten = await api.wissen(suchtext, bereich);
      zwischenspeicher = { bereiche: daten.bereiche, statistik: daten.statistik };
      zeichneBereiche(daten.bereiche, daten.statistik);
      zeichneErgebnis(daten.eintraege, daten.statistik);
    } catch (fehlerObj) {
      leere(ergebnisBereich).append(hinweis(fehlerObj.message, 'fehler'));
    }
  }

  function zeichneBereiche(bereiche, statistik) {
    leere(bereichsLeiste);
    const alle = el('button.chip', {
      type: 'button',
      text: `Alle (${statistik.gesamt})`,
      class: `chip ${bereich === '' ? 'chip-akzent' : ''}`,
      onclick: async () => {
        bereich = '';
        await lade();
      },
    });
    bereichsLeiste.append(alle);
    for (const [schluessel, name] of Object.entries(bereiche)) {
      const anzahl = statistik.nachBereich[schluessel] || 0;
      bereichsLeiste.append(
        el('button.chip', {
          type: 'button',
          text: `${name} (${anzahl})`,
          class: `chip ${bereich === schluessel ? 'chip-akzent' : ''}`,
          onclick: async () => {
            bereich = schluessel;
            await lade();
          },
        }),
      );
    }
  }

  function zeichneErgebnis(eintraege, statistik) {
    leere(ergebnisBereich);
    if (!eintraege.length) {
      ergebnisBereich.append(
        el('div.karte.leer', {}, [
          el('div.leer-zeichen', { text: '🔎', 'aria-hidden': 'true' }),
          el('p', { text: 'Kein Eintrag gefunden. Anderen Begriff versuchen – oder die KI direkt fragen.' }),
          el('div.knopf-reihe', { style: 'justify-content:center' }, [
            el('button.knopf.knopf-haupt', {
              type: 'button',
              text: `„${suchtext}“ von der KI erklären lassen`,
              onclick: () => erklaerDialog(suchtext, { kontext: kontextAus('Nachschlagen') }),
            }),
          ]),
        ]),
      );
      return;
    }

    ergebnisBereich.append(
      el('p.klein.leise', {
        text: suchtext
          ? `${eintraege.length} Treffer für „${suchtext}“ – insgesamt ${statistik.gesamt} Einträge in der Fachdatenbank.`
          : `${eintraege.length} von ${statistik.gesamt} Einträgen.`,
      }),
    );

    const liste = el('div.raster.raster-2');
    for (const eintrag of eintraege) {
      liste.append(
        el('a.kachel', { href: `#/lexikon/${eintrag.id}`, style: 'padding:14px' }, [
          el('div.chip-liste', { style: 'margin-bottom:8px' }, [
            el('span.chip.chip-akzent', { text: eintrag.bereichName }),
            el('span.chip', { text: eintrag.kategorie }),
          ]),
          el('h3', { text: eintrag.begriff, style: 'margin-bottom:4px' }),
          el('p.klein.leise', { text: eintrag.kurz, style: 'margin:0' }),
        ]),
      );
    }
    ergebnisBereich.append(liste);
  }

  await lade();
}

/* -------------------------------------------------------------------------- */
/* Detailansicht                                                              */
/* -------------------------------------------------------------------------- */

async function zeigeEintrag(behaelter, id) {
  leere(behaelter).append(ladeAnzeige('Eintrag wird geladen …'));
  let eintrag;
  try {
    ({ eintrag } = await api.wissenEintrag(id));
  } catch (fehlerObj) {
    leere(behaelter).append(
      hinweis(fehlerObj.message, 'fehler'),
      el('div.knopf-reihe', { style: 'margin-top:12px' }, [
        el('a.knopf.knopf-haupt', { href: '#/lexikon', text: 'Zurück zur Suche' }),
      ]),
    );
    return;
  }

  leere(behaelter);

  const alsText = () =>
    [
      eintrag.begriff,
      eintrag.kurz,
      eintrag.funktion,
      ...(eintrag.aufbau || []).map((x) => `- ${x}`),
      ...(eintrag.einsatz || []).map((x) => `- ${x}`),
      ...(eintrag.werte || []).map((x) => `- ${x}`),
      ...(eintrag.formeln || []).map((f) => `${f.name}: ${f.formel} (${f.erklaerung})`),
      ...(eintrag.hinweise || []).map((x) => `- ${x}`),
      ...(eintrag.stoerungen || []).map((x) => `- ${x}`),
      eintrag.normen?.length ? `Regelwerke: ${eintrag.normen.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

  behaelter.append(
    el('div.knopf-reihe', { style: 'margin-bottom:12px' }, [
      el('a.knopf.knopf-leer.knopf-klein', { href: '#/lexikon', text: '← Zurück zur Suche' }),
    ]),
    el('section.karte', {}, [
      el('div.chip-liste', { style: 'margin-bottom:10px' }, [
        el('span.chip.chip-akzent', { text: eintrag.bereichName }),
        el('span.chip', { text: eintrag.kategorie }),
      ]),
      el('h1', { text: eintrag.begriff, style: 'margin-bottom:6px' }),
      el('p', { text: eintrag.kurz, 'data-erklaerbar': '1', style: 'font-size:1.05rem' }),
      eintrag.synonyme?.length
        ? el('p.klein.leise', { text: `Auch genannt: ${eintrag.synonyme.join(', ')}` })
        : null,
      el('div.knopf-reihe', { style: 'margin-top:8px' }, [
        el('button.knopf.knopf-haupt', {
          type: 'button',
          text: 'Von der KI erklären lassen',
          onclick: () => erklaerDialog(eintrag.begriff, { kontext: kontextAus('Nachschlagen') }),
        }),
        el('button.knopf', {
          type: 'button',
          text: '🔊 Vorlesen',
          onclick: () => {
            if (!vorlesen(alsText())) meldung('Vorlesen wird von diesem Browser nicht unterstützt.', 'warnung');
          },
        }),
        el('button.knopf.knopf-leer', { type: 'button', text: 'Stopp', onclick: () => vorlesenStopp() }),
        el('button.knopf.knopf-leer', { type: 'button', text: 'Text kopieren', onclick: () => kopiere(alsText()) }),
        el('button.knopf.knopf-leer', {
          type: 'button',
          text: 'Als Erklärung speichern',
          onclick: async () => {
            try {
              await api.berichtNeu({
                typ: 'erklaerung',
                titel: eintrag.begriff,
                daten: {
                  begriff: eintrag.begriff,
                  kurz: eintrag.kurz,
                  abschnitte: abschnitte(eintrag),
                  normen: eintrag.normen || [],
                  stichworte: (eintrag.verwandteEintraege || []).map((v) => v.begriff),
                  verlauf: [],
                  tiefe: 1,
                  quelle: 'datenbank',
                },
              });
              meldung('Unter „Meine Berichte“ gespeichert.', 'erfolg');
            } catch (fehlerObj) {
              meldung(fehlerObj.message, 'fehler');
            }
          },
        }),
      ]),
    ]),
  );

  for (const abschnitt of abschnitte(eintrag)) {
    behaelter.append(
      el('section.karte', {}, [
        el('div.karte-kopf', {}, [
          el('h2', { text: abschnitt.titel }),
          el('div.rechts', {}, [
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: 'Genauer erläutern',
              onclick: () =>
                erklaerDialog(`${eintrag.begriff}: ${abschnitt.titel}`, { kontext: kontextAus(eintrag.begriff) }),
            }),
          ]),
        ]),
        abschnitt.text ? el('p', { text: abschnitt.text, 'data-erklaerbar': '1' }) : null,
        abschnitt.punkte?.length
          ? el(
              'ul',
              { 'data-erklaerbar': '1', style: 'margin:0;padding-left:20px' },
              abschnitt.punkte.map((p) => el('li', { text: p, style: 'margin-bottom:4px' })),
            )
          : null,
      ]),
    );
  }

  if (eintrag.vertiefungen?.length) {
    for (const v of eintrag.vertiefungen) {
      behaelter.append(
        el('details.karte', {}, [
          el('summary', { text: v.frage, style: 'cursor:pointer;font-weight:600' }),
          el('p', { text: v.text, 'data-erklaerbar': '1', style: 'margin-top:10px' }),
        ]),
      );
    }
  }

  if (eintrag.normen?.length) {
    behaelter.append(
      el('section.karte', {}, [
        el('div.karte-kopf', {}, [el('h2', { text: 'Regelwerke' })]),
        el(
          'div.chip-liste',
          {},
          eintrag.normen.map((n) => el('span.chip.chip-gruen', { text: n })),
        ),
      ]),
    );
  }

  if (eintrag.verwandteEintraege?.length) {
    behaelter.append(
      el('section.karte', {}, [
        el('div.karte-kopf', {}, [el('h2', { text: 'Passt dazu' })]),
        el(
          'div.chip-liste',
          {},
          eintrag.verwandteEintraege.map((v) =>
            el('a.chip.chip-akzent', { href: `#/lexikon/${v.id}`, text: v.begriff, style: 'text-decoration:none' }),
          ),
        ),
      ]),
    );
  }
}

/** Erzeugt die Abschnitte eines Eintrags für Anzeige und Speicherung. */
function abschnitte(eintrag) {
  const liste = [];
  if (eintrag.funktion) liste.push({ titel: 'Funktionsprinzip', text: eintrag.funktion, punkte: [] });
  if (eintrag.aufbau?.length) liste.push({ titel: 'Aufbau', text: '', punkte: eintrag.aufbau });
  if (eintrag.einsatz?.length) liste.push({ titel: 'Einsatz und Einbau', text: '', punkte: eintrag.einsatz });
  if (eintrag.werte?.length) liste.push({ titel: 'Kennwerte und Richtwerte', text: '', punkte: eintrag.werte });
  if (eintrag.formeln?.length) {
    liste.push({
      titel: 'Berechnung',
      text: '',
      punkte: eintrag.formeln.map((f) => `${f.name}: ${f.formel} — ${f.erklaerung}`),
    });
  }
  if (eintrag.hinweise?.length) liste.push({ titel: 'Praxishinweise', text: '', punkte: eintrag.hinweise });
  if (eintrag.stoerungen?.length) liste.push({ titel: 'Typische Fehlerbilder', text: '', punkte: eintrag.stoerungen });
  return liste;
}

export { zwischenspeicher };
