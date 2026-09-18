/**
 * Berichtsheft: Woche einsprechen, KI ordnet nach Tagen und formuliert fachlich.
 */
import {
  el,
  leere,
  meldung,
  hinweis,
  neueId,
  kopiere,
  bestaetigen,
  frageText,
  datumDeutsch,
  dialog,
  dialogSchliessen,
} from '../ui.js';
import { api } from '../api.js';
import { zustand } from '../store.js';
import { diktatFeld, punktListe, chipListe, zuPunkten, setzeErklaerHandler } from '../components.js';
import { speicherHelfer, berichtKopf, erklaerDialog, zeichnungsBereich, kontextAus } from './gemeinsam.js';

const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

function leeresBerichtsheft() {
  const heute = new Date();
  const montag = new Date(heute);
  montag.setDate(heute.getDate() - ((heute.getDay() + 6) % 7));
  return {
    von: montag.toISOString().slice(0, 10),
    bis: new Date(montag.getTime() + 4 * 86400000).toISOString().slice(0, 10),
    tage: [],
    hinweise: [],
    rohtext: '',
  };
}

export async function ansichtBerichtsheft(behaelter, id) {
  leere(behaelter);

  let titel = '';
  let daten = leeresBerichtsheft();

  if (id && id !== 'neu') {
    try {
      const { bericht } = await api.bericht(id);
      titel = bericht.titel;
      daten = { ...leeresBerichtsheft(), ...bericht.daten };
    } catch (fehler) {
      behaelter.append(hinweis(fehler.message, 'fehler'));
      return;
    }
  } else {
    const kw = wochenNummer(new Date());
    titel = `Berichtsheft KW ${kw} / ${new Date().getFullYear()}`;
  }

  const helfer = speicherHelfer({
    typ: 'berichtsheft',
    id: id && id !== 'neu' ? id : null,
    holeTitel: () => titel,
    holeDaten: () => daten,
  });

  let fokusListe = null;

  const kopf = berichtKopf({
    titel,
    beiTitel: (wert) => {
      titel = wert;
      helfer.merken();
    },
    helfer,
    aktionen: [
      {
        text: 'Text kopieren',
        aufruf: () => kopiere(alsText(titel, daten)),
      },
    ],
  });

  const inhaltsBereich = el('div');
  const hinweisBereich = el('div');

  /* ------------------------------------------------------------ Diktat */

  const diktat = diktatFeld({
    titel: 'Woche einsprechen',
    hilfe:
      'Zum Beispiel: „Montag hab ich 100er SML Rohr mit der Flex geschnitten und anmontiert, Dienstag 22er Kupfer verpresst.“',
    platzhalter: 'Diktat der Woche …',
    beiBefehl: befehlAusfuehren,
    aktionen: [
      {
        text: zustand.kiAktiv ? 'In Fachsprache umwandeln' : 'Fachsprache erzeugen',
        klasse: 'knopf-haupt',
        aufruf: async (text, steuerung) => {
          if (!text) {
            meldung('Bitte zuerst etwas sprechen oder eintippen.', 'warnung');
            return;
          }
          steuerung.stopp();
          const ergebnis = await api.ki.berichtsheft(text, kontextAus(titel, alsText(titel, daten)));
          uebernehmen(ergebnis);
          daten.rohtext = `${daten.rohtext ? `${daten.rohtext}\n` : ''}${text}`;
          steuerung.leeren();
          helfer.merken();
          meldung(
            ergebnis.quelle === 'ki' ? 'Eintrag in Fachsprache erstellt.' : 'Eintrag im Fachmodus offline erstellt.',
            'erfolg',
          );
        },
      },
      {
        text: 'Vorschau Fachbegriffe',
        klasse: 'knopf-leer',
        aufruf: async (text) => {
          if (!text) return;
          const vorschau = await api.ki.fachsprache(text);
          zeigeVorschau(vorschau);
        },
      },
    ],
  });

  /* ------------------------------------------------------------ Befehle */

  async function befehlAusfuehren(befehl) {
    switch (befehl.aktion) {
      case 'loeschen': {
        const liste = fokusListe || letzteListe();
        if (!liste) {
          meldung('Es gibt noch keine Punkte zum Löschen.', 'warnung');
          return true;
        }
        const weg = befehl.nummer
          ? liste.loescheNummer(befehl.nummer)
          : liste.loescheText(befehl.suchtext || befehl.text || '');
        meldung(weg ? `Gelöscht: „${kurz(weg.text)}“` : 'Dazu wurde kein passender Punkt gefunden.', weg ? 'erfolg' : 'warnung');
        return true;
      }
      case 'erklaeren':
        await erklaerDialog(befehl.begriff || befehl.text || '', { kontext: kontextAus(titel) });
        return true;
      case 'vertiefen': {
        const liste = fokusListe || letzteListe();
        const punkt = liste?.punkteRoh?.[liste.punkteRoh.length - 1];
        if (punkt) await vertiefePunkt(punkt, liste);
        else meldung('Bitte zuerst einen Punkt auswählen.', 'warnung');
        return true;
      }
      case 'zeichnung': {
        const ergebnis = await api.ki.zeichnung({
          beschreibung: befehl.begriff || befehl.text || titel,
          titel,
          kontext: kontextAus(titel),
        });
        daten.zeichnung = ergebnis;
        helfer.merken();
        zeichneAlles();
        meldung('Zeichnung erstellt.', 'erfolg');
        return true;
      }
      case 'titel':
        if (befehl.text) {
          titel = befehl.text;
          kopf.titelFeld.value = titel;
          helfer.merken();
          meldung('Titel übernommen.', 'erfolg');
        }
        return true;
      case 'speichern':
        await helfer.speichern();
        return true;
      default:
        return false;
    }
  }

  function letzteListe() {
    return listenSpeicher[listenSpeicher.length - 1] || null;
  }

  const listenSpeicher = [];

  /* ------------------------------------------------------------ KI-Ergebnis übernehmen */

  function uebernehmen(ergebnis) {
    for (const tag of ergebnis.tage || []) {
      const name = normTag(tag.tag);
      let vorhanden = daten.tage.find((t) => t.tag === name);
      if (!vorhanden) {
        vorhanden = { id: neueId(), tag: name, eintraege: [] };
        daten.tage.push(vorhanden);
      }
      for (const eintrag of tag.eintraege || []) {
        vorhanden.eintraege.push({
          id: neueId(),
          titel: eintrag.titel || 'Tätigkeit',
          punkte: zuPunkten(eintrag.punkte),
          material: eintrag.material || [],
          werkzeug: eintrag.werkzeug || [],
          normen: eintrag.normen || [],
        });
      }
    }
    daten.tage.sort((a, b) => tagIndex(a.tag) - tagIndex(b.tag));
    if (ergebnis.hinweise?.length) daten.hinweise = [...new Set([...(daten.hinweise || []), ...ergebnis.hinweise])];
    daten.warnung = ergebnis.warnung || '';
    zeichneAlles();
  }

  /* ------------------------------------------------------------ Vertiefung */

  async function vertiefePunkt(punkt, liste) {
    meldung('Punkt wird ausführlicher erklärt …', 'info', 2200);
    try {
      const antwort = await api.ki.vertiefung({
        begriff: punkt.text,
        frage: '',
        bisher: punkt.zusatz || '',
        kontext: kontextAus(titel, alsText(titel, daten)),
      });
      punkt.zusatz = [antwort.text, ...(antwort.punkte || []).map((p) => `• ${p}`)].filter(Boolean).join('\n');
      punkt.zusatzTitel = antwort.titel || 'Vertiefung';
      helfer.merken();
      liste.neuZeichnen();
    } catch (fehler) {
      meldung(fehler.message, 'fehler', 6000);
    }
  }

  /* ------------------------------------------------------------ Aufbau */

  function zeichneAlles() {
    leere(inhaltsBereich);
    listenSpeicher.length = 0;

    leere(hinweisBereich);
    if (daten.warnung) hinweisBereich.append(hinweis(daten.warnung, 'warnung'));
    if (daten.hinweise?.length) {
      hinweisBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [
            el('h3', { text: 'Fachliche Hinweise' }),
            el('div.rechts', {}, [
              el('button.knopf.knopf-klein.knopf-leer', {
                type: 'button',
                text: 'Hinweise ausblenden',
                onclick: () => {
                  daten.hinweise = [];
                  helfer.merken();
                  zeichneAlles();
                },
              }),
            ]),
          ]),
          el(
            'ul',
            { style: 'margin:0;padding-left:20px' },
            daten.hinweise.map((h) => el('li.klein', { text: h })),
          ),
        ]),
      );
    }

    if (!daten.tage.length) {
      inhaltsBereich.append(
        el('div.karte.leer', {}, [
          el('div.leer-zeichen', { text: '🎙', 'aria-hidden': 'true' }),
          el('p', { text: 'Noch keine Einträge. Oben aufs Mikrofon tippen und die Woche erzählen.' }),
          el('div.knopf-reihe', { style: 'justify-content:center' }, [
            el('button.knopf.knopf-leer', { type: 'button', text: '+ Tag von Hand anlegen', onclick: tagAnlegen }),
          ]),
        ]),
      );
      return;
    }

    for (const tag of daten.tage) {
      inhaltsBereich.append(tagKarte(tag));
    }

    inhaltsBereich.append(
      el('div.knopf-reihe', { style: 'margin-top:14px' }, [
        el('button.knopf.knopf-leer', { type: 'button', text: '+ Tag hinzufügen', onclick: tagAnlegen }),
      ]),
    );
  }

  async function tagAnlegen() {
    const name = await frageText({
      titel: 'Welcher Tag?',
      text: 'Zum Beispiel Montag, Dienstag oder ein eigener Text.',
      vorgabe: WOCHENTAGE.find((t) => !daten.tage.some((x) => x.tag === t)) || '',
      knopf: 'Tag anlegen',
    });
    if (!name) return;
    daten.tage.push({ id: neueId(), tag: normTag(name), eintraege: [] });
    daten.tage.sort((a, b) => tagIndex(a.tag) - tagIndex(b.tag));
    helfer.merken();
    zeichneAlles();
  }

  function tagKarte(tag) {
    const karte = el('section.karte');
    const kopfZeile = el('div.karte-kopf', {}, [
      el('h2', { text: tag.tag }),
      el('div.rechts', {}, [
        el('button.knopf.knopf-klein.knopf-leer', {
          type: 'button',
          text: '+ Tätigkeit',
          onclick: () => {
            tag.eintraege.push({ id: neueId(), titel: 'Neue Tätigkeit', punkte: [], material: [], werkzeug: [], normen: [] });
            helfer.merken();
            zeichneAlles();
          },
        }),
        el('button.knopf.knopf-klein.knopf-gefahr', {
          type: 'button',
          text: 'Tag löschen',
          onclick: async () => {
            const ja = await bestaetigen({ titel: `${tag.tag} löschen?`, text: 'Alle Tätigkeiten dieses Tages werden entfernt.' });
            if (!ja) return;
            daten.tage = daten.tage.filter((t) => t !== tag);
            helfer.merken();
            zeichneAlles();
          },
        }),
      ]),
    ]);
    karte.append(kopfZeile);

    if (!tag.eintraege.length) {
      karte.append(el('p.klein.leise', { text: 'Keine Tätigkeit erfasst.' }));
    }

    for (const eintrag of tag.eintraege) {
      karte.append(eintragBlock(tag, eintrag));
    }
    return karte;
  }

  function eintragBlock(tag, eintrag) {
    const liste = punktListe({
      punkte: eintrag.punkte,
      beiAenderung: () => helfer.merken(),
      beiVertiefen: (punkt) => vertiefePunkt(punkt, liste),
      beiErklaeren: (text) => erklaerDialog(text, { kontext: kontextAus(titel) }),
      leerText: 'Noch keine Tätigkeitspunkte – Mikrofon nutzen oder Punkt hinzufügen.',
    });
    liste.punkteRoh = eintrag.punkte;
    listenSpeicher.push(liste);

    const block = el(
      'div',
      {
        style: 'margin-top:14px',
        onfocusin: () => {
          fokusListe = liste;
        },
        onclick: () => {
          fokusListe = liste;
        },
      },
      [
        el('div.karte-kopf', { style: 'margin-bottom:8px' }, [
          el('input', {
            type: 'text',
            wert: eintrag.titel,
            'aria-label': 'Überschrift der Tätigkeit',
            style: 'font-weight:600;max-width:420px',
            oninput: (e) => {
              eintrag.titel = e.currentTarget.value;
              helfer.merken();
            },
          }),
          el('div.rechts', {}, [
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: '+ Punkt',
              onclick: () => {
                eintrag.punkte.push({ id: neueId(), text: 'Neuer Punkt' });
                helfer.merken();
                liste.neuZeichnen();
              },
            }),
            el('button.knopf.knopf-klein.knopf-gefahr', {
              type: 'button',
              text: 'Tätigkeit löschen',
              onclick: () => {
                tag.eintraege = tag.eintraege.filter((x) => x !== eintrag);
                helfer.merken();
                zeichneAlles();
              },
            }),
          ]),
        ]),
        liste.element,
      ],
    );

    /* Material / Werkzeug / Normen */
    const zusatz = el('div.raster.raster-3', { style: 'margin-top:12px' });
    for (const [feld, beschriftung, klasse] of [
      ['material', 'Material', 'chip-kupfer'],
      ['werkzeug', 'Werkzeug', 'chip-akzent'],
      ['normen', 'Regelwerke', 'chip-gruen'],
    ]) {
      eintrag[feld] = eintrag[feld] || [];
      const chips = chipListe({
        werte: eintrag[feld],
        klasse,
        beiAenderung: () => helfer.merken(),
        hinzufuegenText: beschriftung,
      });
      zusatz.append(el('div', {}, [el('h3.abschnitt-titel', { text: beschriftung }), chips.element]));
    }
    block.append(zusatz);
    return block;
  }

  /* ------------------------------------------------------------ Vorschau */

  function zeigeVorschau(vorschau) {
    dialog([
      el('h3', { text: 'So schreibt die Fachsprache-Engine' }),
      el('p', { text: vorschau.text, 'data-erklaerbar': '1' }),
      vorschau.treffer.length
        ? el('div', {}, [
            el('h3.abschnitt-titel', { text: 'Erkannte Begriffe' }),
            el(
              'div.chip-liste',
              {},
              vorschau.treffer.map((t) => el('span.chip.chip-akzent', { text: `${t.roh} \u2192 ${t.fach}` })),
            ),
          ])
        : null,
      el('p.klein.leise', {
        text: 'Diese Vorschau entsteht ohne KI direkt im Betriebsglossar. Mit „In Fachsprache umwandeln“ wird daraus ein vollständiger Eintrag.',
      }),
      el('div.knopf-reihe', { style: 'margin-top:14px;justify-content:flex-end' }, [
        el('button.knopf.knopf-haupt', { type: 'button', text: 'Alles klar', onclick: () => dialogSchliessen() }),
      ]),
    ]);
  }

  /* ------------------------------------------------------------ Ausgabe */

  setzeErklaerHandler((text) => erklaerDialog(text, { kontext: kontextAus(titel) }));

  const zeichnung = zeichnungsBereich({
    daten,
    beiAenderung: () => helfer.merken(),
    kontext: kontextAus(titel),
  });

  behaelter.append(
    kopf.element,
    el('div', { style: 'margin-top:16px' }, [diktat.element]),
    el('div', { style: 'margin-top:16px' }, [hinweisBereich]),
    el('div', { style: 'margin-top:16px' }, [inhaltsBereich]),
    el('details.karte', { style: 'margin-top:16px' }, [
      el('summary', { text: 'Zeichnung zum Berichtsheft (optional)', style: 'cursor:pointer;font-weight:600' }),
      el('div', { style: 'margin-top:12px' }, [zeichnung.element]),
    ]),
    el('p.klein.leise', { style: 'margin-top:16px' }, [
      `Woche: ${datumDeutsch(daten.von)} – ${datumDeutsch(daten.bis)} · Änderungen werden automatisch gespeichert.`,
    ]),
  );

  zeichneAlles();
}

/* -------------------------------------------------------------------------- */

function normTag(name) {
  const t = String(name || '').trim();
  const treffer = WOCHENTAGE.find((w) => w.toLowerCase() === t.toLowerCase());
  return treffer || (t || 'Ohne Zuordnung');
}

function tagIndex(name) {
  const i = WOCHENTAGE.indexOf(name);
  return i < 0 ? 99 : i;
}

function wochenNummer(datum) {
  const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
  const tag = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - tag);
  const jahresStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - jahresStart) / 86400000 + 1) / 7);
}

function kurz(text, laenge = 60) {
  const t = String(text || '');
  return t.length > laenge ? `${t.slice(0, laenge)}…` : t;
}

export function alsText(titel, daten) {
  const zeilen = [titel, ''];
  for (const tag of daten.tage || []) {
    zeilen.push(`${tag.tag}`);
    for (const eintrag of tag.eintraege || []) {
      zeilen.push(`  ${eintrag.titel}`);
      for (const punkt of eintrag.punkte || []) {
        zeilen.push(`   - ${punkt.text}`);
        if (punkt.zusatz) zeilen.push(`     ${punkt.zusatz.replace(/\n/g, '\n     ')}`);
      }
      if (eintrag.material?.length) zeilen.push(`   Material: ${eintrag.material.join(', ')}`);
      if (eintrag.werkzeug?.length) zeilen.push(`   Werkzeug: ${eintrag.werkzeug.join(', ')}`);
      if (eintrag.normen?.length) zeilen.push(`   Regelwerke: ${eintrag.normen.join(', ')}`);
    }
    zeilen.push('');
  }
  return zeilen.join('\n');
}
