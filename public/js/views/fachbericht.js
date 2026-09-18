/**
 * Fachbericht: Arbeitsschritte, Material, Werkzeug, Erklärungen, Zeichnung.
 */
import { el, leere, meldung, hinweis, neueId, kopiere, dialog, dialogSchliessen, frageText } from '../ui.js';
import { api } from '../api.js';
import { zustand } from '../store.js';
import { diktatFeld, punktListe, zuPunkten, setzeErklaerHandler } from '../components.js';
import { speicherHelfer, berichtKopf, erklaerDialog, zeichnungsBereich, kontextAus } from './gemeinsam.js';

function leererFachbericht() {
  return {
    einleitung: '',
    anlage: '',
    arbeitsschritte: [],
    material: [],
    werkzeug: [],
    arbeitssicherheit: [],
    normen: [],
    erklaerungen: [],
    fazit: '',
    rohtext: '',
  };
}

export async function ansichtFachbericht(behaelter, id) {
  leere(behaelter);

  let titel = 'Neuer Fachbericht';
  let daten = leererFachbericht();

  if (id && id !== 'neu') {
    try {
      const { bericht } = await api.bericht(id);
      titel = bericht.titel;
      daten = { ...leererFachbericht(), ...bericht.daten };
    } catch (fehler) {
      behaelter.append(hinweis(fehler.message, 'fehler'));
      return;
    }
  }

  const helfer = speicherHelfer({
    typ: 'fachbericht',
    id: id && id !== 'neu' ? id : null,
    holeTitel: () => titel,
    holeDaten: () => daten,
  });

  const kopf = berichtKopf({
    titel,
    beiTitel: (wert) => {
      titel = wert;
      helfer.merken();
    },
    helfer,
    aktionen: [{ text: 'Text kopieren', aufruf: () => kopiere(alsText(titel, daten)) }],
  });

  const inhaltsBereich = el('div');
  let fokusListe = null;
  const listen = [];

  /* ------------------------------------------------------------ Diktat */

  const diktat = diktatFeld({
    titel: 'Fachbericht einsprechen',
    hilfe:
      'Zum Beispiel: „Montage einer Hauswasserstation im Keller, Absperrung, Filter, Druckminderer und Wasserzähler in 1 Zoll, Anschluss mit 28er Kupfer.“',
    platzhalter: 'Arbeit beschreiben …',
    beiBefehl: befehlAusfuehren,
    aktionen: [
      {
        text: zustand.kiAktiv ? 'Fachbericht erstellen' : 'Fachbericht erzeugen',
        klasse: 'knopf-haupt',
        aufruf: async (text, steuerung) => {
          if (!text) {
            meldung('Bitte zuerst die Arbeit beschreiben.', 'warnung');
            return;
          }
          steuerung.stopp();
          const ergebnis = await api.ki.fachbericht(text, kontextAus(titel, alsText(titel, daten)));
          uebernehmen(ergebnis);
          daten.rohtext = `${daten.rohtext ? `${daten.rohtext}\n` : ''}${text}`;
          steuerung.leeren();
          helfer.merken();
          meldung(ergebnis.quelle === 'ki' ? 'Fachbericht erstellt.' : 'Fachbericht im Fachmodus offline erstellt.', 'erfolg');
        },
      },
      {
        text: 'Ergänzen',
        klasse: 'knopf-leer',
        aufruf: async (text, steuerung) => {
          if (!text) return;
          steuerung.stopp();
          const ergebnis = await api.ki.fachbericht(
            `Ergänzung zum bestehenden Bericht: ${text}`,
            kontextAus(titel, alsText(titel, daten)),
          );
          uebernehmen(ergebnis, { ergaenzen: true });
          steuerung.leeren();
          helfer.merken();
          meldung('Ergänzung übernommen.', 'erfolg');
        },
      },
      {
        text: 'Vorschau Fachbegriffe',
        klasse: 'knopf-leer',
        aufruf: async (text) => {
          if (!text) return;
          const vorschau = await api.ki.fachsprache(text);
          dialog([
            el('h3', { text: 'Erkannte Fachbegriffe' }),
            el('p', { text: vorschau.text, 'data-erklaerbar': '1' }),
            el(
              'div.chip-liste',
              {},
              vorschau.treffer.map((t) => el('span.chip.chip-akzent', { text: `${t.roh} → ${t.fach}` })),
            ),
            el('div.knopf-reihe', { style: 'margin-top:14px;justify-content:flex-end' }, [
              el('button.knopf.knopf-haupt', { type: 'button', text: 'Schließen', onclick: () => dialogSchliessen() }),
            ]),
          ]);
        },
      },
    ],
  });

  /* ------------------------------------------------------------ Befehle */

  async function befehlAusfuehren(befehl) {
    switch (befehl.aktion) {
      case 'loeschen': {
        const liste = fokusListe || listen[0];
        if (!liste) {
          meldung('Es gibt noch keine Punkte zum Löschen.', 'warnung');
          return true;
        }
        const weg = befehl.nummer
          ? liste.loescheNummer(befehl.nummer)
          : liste.loescheText(befehl.suchtext || befehl.text || '');
        meldung(weg ? `Gelöscht: „${(weg.titel || weg.text || '').slice(0, 60)}“` : 'Kein passender Punkt gefunden.', weg ? 'erfolg' : 'warnung');
        return true;
      }
      case 'erklaeren':
        await erklaerDialog(befehl.begriff || befehl.text || '', {
          kontext: kontextAus(titel),
          einfuegen: ({ begriff, text }) => {
            daten.erklaerungen.push({ id: neueId(), titel: begriff, text });
            helfer.merken();
            zeichneAlles();
          },
        });
        return true;
      case 'zeichnung': {
        const ergebnis = await api.ki.zeichnung({
          beschreibung: befehl.begriff || befehl.text || `${titel}. ${daten.anlage || daten.einleitung || ''}`,
          titel,
          kontext: kontextAus(titel),
        });
        daten.zeichnung = ergebnis;
        helfer.merken();
        zeichneAlles();
        meldung(ergebnis.warnung || 'Zeichnung erstellt.', ergebnis.warnung ? 'warnung' : 'erfolg');
        return true;
      }
      case 'titel':
        if (befehl.text) {
          titel = befehl.text;
          kopf.titelFeld.value = titel;
          helfer.merken();
        }
        return true;
      case 'speichern':
        await helfer.speichern();
        return true;
      case 'vertiefen': {
        const liste = fokusListe || listen[0];
        const punkt = liste?.punkteRoh?.[liste.punkteRoh.length - 1];
        if (punkt) await vertiefePunkt(punkt, liste);
        return true;
      }
      default:
        return false;
    }
  }

  /* ------------------------------------------------------------ Übernahme */

  function uebernehmen(ergebnis, { ergaenzen = false } = {}) {
    if (!ergaenzen) {
      if (ergebnis.titel && (titel === 'Neuer Fachbericht' || !titel)) {
        titel = ergebnis.titel;
        kopf.titelFeld.value = titel;
      }
      daten.einleitung = ergebnis.einleitung || daten.einleitung;
      daten.anlage = ergebnis.anlage || daten.anlage;
      daten.fazit = ergebnis.fazit || daten.fazit;
    } else {
      if (ergebnis.einleitung && !daten.einleitung) daten.einleitung = ergebnis.einleitung;
    }

    daten.arbeitsschritte.push(
      ...(ergebnis.arbeitsschritte || []).map((s) => ({
        id: neueId(),
        titel: s.titel || '',
        text: [s.beschreibung, s.hinweis ? `Hinweis: ${s.hinweis}` : ''].filter(Boolean).join(' '),
      })),
    );

    daten.material.push(
      ...(ergebnis.material || []).map((m) => ({
        id: neueId(),
        bezeichnung: m.bezeichnung || '',
        dimension: m.dimension || '',
        menge: m.menge || '',
        hinweis: m.hinweis || '',
      })),
    );

    daten.werkzeug.push(
      ...(ergebnis.werkzeug || []).map((w) => ({
        id: neueId(),
        bezeichnung: w.bezeichnung || '',
        zweck: w.zweck || '',
      })),
    );

    daten.arbeitssicherheit.push(...zuPunkten(ergebnis.arbeitssicherheit || []));
    daten.normen.push(
      ...(ergebnis.normen || []).map((n) => ({ id: neueId(), titel: n.bezeichnung || '', text: n.inhalt || '' })),
    );
    daten.erklaerungen.push(
      ...(ergebnis.erklaerungen || []).map((e) => ({ id: neueId(), titel: e.begriff || '', text: e.text || '' })),
    );
    daten.warnung = ergebnis.warnung || '';

    entdoppeln();
    zeichneAlles();
  }

  function entdoppeln() {
    const einmalig = (liste, schluessel) => {
      const gesehen = new Set();
      return liste.filter((eintrag) => {
        const k = String(schluessel(eintrag) || '').toLowerCase().trim();
        if (!k || gesehen.has(k)) return false;
        gesehen.add(k);
        return true;
      });
    };
    daten.material = einmalig(daten.material, (m) => `${m.bezeichnung}|${m.dimension}`);
    daten.werkzeug = einmalig(daten.werkzeug, (w) => w.bezeichnung);
    daten.normen = einmalig(daten.normen, (n) => n.titel);
    daten.erklaerungen = einmalig(daten.erklaerungen, (e) => e.titel);
    daten.arbeitssicherheit = einmalig(daten.arbeitssicherheit, (s) => s.text);
  }

  async function vertiefePunkt(punkt, liste) {
    meldung('Wird ausführlicher erklärt …', 'info', 2000);
    try {
      const antwort = await api.ki.vertiefung({
        begriff: [punkt.titel, punkt.text].filter(Boolean).join(': '),
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

  /* ------------------------------------------------------------ Textbereiche */

  function textAbschnitt(beschriftung, feld, platzhalter) {
    return el('section.karte', {}, [
      el('div.karte-kopf', {}, [el('h2', { text: beschriftung })]),
      el('textarea', {
        rows: 4,
        placeholder: platzhalter,
        wert: daten[feld] || '',
        'data-erklaerbar': '1',
        oninput: (e) => {
          daten[feld] = e.currentTarget.value;
          helfer.merken();
        },
      }),
      el('div.knopf-reihe', { style: 'margin-top:10px' }, [
        el('button.knopf.knopf-klein.knopf-leer', {
          type: 'button',
          text: 'Ausführlicher formulieren',
          onclick: async (ereignis) => {
            const knopf = ereignis.currentTarget;
            const feldKnoten = knopf.closest('section').querySelector('textarea');
            if (!feldKnoten.value.trim()) {
              meldung('Bitte zuerst etwas eintragen.', 'warnung');
              return;
            }
            knopf.disabled = true;
            try {
              const antwort = await api.ki.vertiefung({
                begriff: `${beschriftung} des Fachberichts`,
                frage: `Formuliere ausführlicher und fachlich genauer: ${feldKnoten.value}`,
                bisher: feldKnoten.value,
                kontext: kontextAus(titel),
              });
              feldKnoten.value = antwort.text;
              daten[feld] = antwort.text;
              helfer.merken();
            } catch (fehler) {
              meldung(fehler.message, 'fehler', 6000);
            } finally {
              knopf.disabled = false;
            }
          },
        }),
      ]),
    ]);
  }

  /* ------------------------------------------------------------ Tabellen */

  function tabellenBereich({ beschriftung, liste, spalten, hinzufuegen }) {
    const bereich = el('section.karte');

    function zeichne() {
      leere(bereich);
      bereich.append(
        el('div.karte-kopf', {}, [
          el('h2', { text: beschriftung }),
          el('div.rechts', {}, [
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: '+ Zeile',
              onclick: () => {
                liste.push({ id: neueId(), ...hinzufuegen });
                helfer.merken();
                zeichne();
              },
            }),
          ]),
        ]),
      );

      if (!liste.length) {
        bereich.append(el('p.klein.leise', { text: 'Noch nichts erfasst.' }));
        return;
      }

      const kopfZeile = el(
        'tr',
        {},
        [...spalten.map((s) => el('th', { text: s.titel })), el('th', { text: '', 'aria-label': 'Aktion' })],
      );

      const zeilen = liste.map((eintrag) =>
        el('tr', {}, [
          ...spalten.map((s) =>
            el('td', {
              contenteditable: 'true',
              'data-erklaerbar': '1',
              text: eintrag[s.feld] || '',
              onblur: (e) => {
                const neu = e.currentTarget.textContent.trim();
                if (neu !== eintrag[s.feld]) {
                  eintrag[s.feld] = neu;
                  helfer.merken();
                }
              },
            }),
          ),
          el('td', { style: 'white-space:nowrap' }, [
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: 'Erklären',
              title: 'Diesen Begriff erklären lassen',
              onclick: () => erklaerDialog(eintrag[spalten[0].feld], { kontext: kontextAus(titel) }),
            }),
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: '🗑',
              title: 'Zeile löschen',
              onclick: () => {
                const i = liste.indexOf(eintrag);
                if (i >= 0) liste.splice(i, 1);
                helfer.merken();
                zeichne();
              },
            }),
          ]),
        ]),
      );

      bereich.append(
        el('div', { style: 'overflow-x:auto' }, [
          el('table.tabelle', {}, [el('thead', {}, [kopfZeile]), el('tbody', {}, zeilen)]),
        ]),
      );
    }

    zeichne();
    return { element: bereich, neuZeichnen: zeichne };
  }

  /* ------------------------------------------------------------ Punktbereiche */

  function punktBereich({ beschriftung, feld, leerText, mitVertiefung = true }) {
    const bereich = el('section.karte');
    daten[feld] = daten[feld] || [];

    const liste = punktListe({
      punkte: daten[feld],
      beiAenderung: () => helfer.merken(),
      beiVertiefen: mitVertiefung ? (punkt) => vertiefePunkt(punkt, liste) : undefined,
      beiErklaeren: (text) => erklaerDialog(text, { kontext: kontextAus(titel) }),
      leerText,
    });
    liste.punkteRoh = daten[feld];
    listen.push(liste);

    bereich.append(
      el('div.karte-kopf', {}, [
        el('h2', { text: beschriftung }),
        el('div.rechts', {}, [
          el('button.knopf.knopf-klein.knopf-leer', {
            type: 'button',
            text: '+ Punkt',
            onclick: async () => {
              const text = await frageText({ titel: `${beschriftung}: neuer Punkt`, knopf: 'Hinzufügen', mehrzeilig: true });
              if (!text) return;
              daten[feld].push({ id: neueId(), text });
              helfer.merken();
              liste.neuZeichnen();
            },
          }),
        ]),
      ]),
      liste.element,
    );

    bereich.addEventListener('focusin', () => {
      fokusListe = liste;
    });
    bereich.addEventListener('click', () => {
      fokusListe = liste;
    });

    return bereich;
  }

  /* ------------------------------------------------------------ Aufbau */

  function zeichneAlles() {
    leere(inhaltsBereich);
    listen.length = 0;

    if (daten.warnung) inhaltsBereich.append(hinweis(daten.warnung, 'warnung'));

    inhaltsBereich.append(
      textAbschnitt('Einleitung / Ausgangslage', 'einleitung', 'Warum wurde die Arbeit ausgeführt, was war der Zustand vorher?'),
      textAbschnitt('Objekt und Anlage', 'anlage', 'Gebäude, Anlagenteil, Besonderheiten …'),
      punktBereich({
        beschriftung: 'Arbeitsschritte',
        feld: 'arbeitsschritte',
        leerText: 'Noch keine Arbeitsschritte – oben einsprechen.',
      }),
      tabellenBereich({
        beschriftung: 'Materialliste',
        liste: daten.material,
        spalten: [
          { titel: 'Bezeichnung', feld: 'bezeichnung' },
          { titel: 'Dimension', feld: 'dimension' },
          { titel: 'Menge', feld: 'menge' },
          { titel: 'Hinweis', feld: 'hinweis' },
        ],
        hinzufuegen: { bezeichnung: '', dimension: '', menge: '', hinweis: '' },
      }).element,
      tabellenBereich({
        beschriftung: 'Werkzeugliste',
        liste: daten.werkzeug,
        spalten: [
          { titel: 'Werkzeug', feld: 'bezeichnung' },
          { titel: 'Zweck', feld: 'zweck' },
        ],
        hinzufuegen: { bezeichnung: '', zweck: '' },
      }).element,
      punktBereich({
        beschriftung: 'Arbeitssicherheit',
        feld: 'arbeitssicherheit',
        leerText: 'Noch keine Sicherheitshinweise.',
        mitVertiefung: false,
      }),
      punktBereich({
        beschriftung: 'Regelwerke und Normen',
        feld: 'normen',
        leerText: 'Noch keine Regelwerke erfasst.',
      }),
      erklaerungsBereich(),
      zeichnungsBereich({ daten, beiAenderung: () => helfer.merken(), kontext: kontextAus(titel) }).element,
      textAbschnitt('Fazit', 'fazit', 'Ergebnis, Prüfung, Übergabe, was gelernt wurde …'),
    );
  }

  function erklaerungsBereich() {
    const bereich = el('section.karte');
    daten.erklaerungen = daten.erklaerungen || [];

    const liste = punktListe({
      punkte: daten.erklaerungen,
      beiAenderung: () => helfer.merken(),
      beiVertiefen: (punkt) => vertiefePunkt(punkt, liste),
      beiErklaeren: (text) => erklaerDialog(text, { kontext: kontextAus(titel) }),
      leerText: 'Noch keine Erklärungen. Begriff einsprechen: „Erkläre einen Druckminderer“.',
    });
    liste.punkteRoh = daten.erklaerungen;
    listen.push(liste);

    const begriffFeld = diktatFeld({
      titel: 'Begriff erklären lassen',
      hilfe: 'Der erklärte Begriff kann direkt in den Fachbericht übernommen werden.',
      platzhalter: 'z. B. Druckminderer, Systemtrenner, hydraulischer Abgleich …',
      aktionen: [
        {
          text: 'Erklären',
          klasse: 'knopf-haupt',
          aufruf: async (text, steuerung) => {
            if (!text) {
              meldung('Bitte einen Begriff nennen.', 'warnung');
              return;
            }
            steuerung.stopp();
            steuerung.leeren();
            await erklaerDialog(text, {
              kontext: kontextAus(titel),
              einfuegen: ({ begriff, text: inhalt }) => {
                daten.erklaerungen.push({ id: neueId(), titel: begriff, text: inhalt });
                helfer.merken();
                liste.neuZeichnen();
              },
            });
          },
        },
      ],
    });

    bereich.append(
      el('div.karte-kopf', {}, [el('h2', { text: 'Erklärungen und Funktionsprinzipien' })]),
      liste.element,
      el('div', { style: 'margin-top:14px' }, [begriffFeld.element]),
    );
    return bereich;
  }

  setzeErklaerHandler((text) =>
    erklaerDialog(text, {
      kontext: kontextAus(titel),
      einfuegen: ({ begriff, text: inhalt }) => {
        daten.erklaerungen.push({ id: neueId(), titel: begriff, text: inhalt });
        helfer.merken();
        zeichneAlles();
      },
    }),
  );

  behaelter.append(
    kopf.element,
    el('div', { style: 'margin-top:16px' }, [diktat.element]),
    el('div', { style: 'margin-top:16px' }, [inhaltsBereich]),
  );

  zeichneAlles();
}

/* -------------------------------------------------------------------------- */

export function alsText(titel, daten) {
  const z = [titel, ''];
  const abschnitt = (name, inhalt) => {
    if (!inhalt) return;
    z.push(name.toUpperCase(), inhalt, '');
  };
  abschnitt('Einleitung', daten.einleitung);
  abschnitt('Objekt und Anlage', daten.anlage);

  if (daten.arbeitsschritte?.length) {
    z.push('ARBEITSSCHRITTE');
    daten.arbeitsschritte.forEach((s, i) => {
      z.push(`${i + 1}. ${[s.titel, s.text].filter(Boolean).join(' – ')}`);
      if (s.zusatz) z.push(`   ${s.zusatz.replace(/\n/g, '\n   ')}`);
    });
    z.push('');
  }
  if (daten.material?.length) {
    z.push('MATERIALLISTE');
    daten.material.forEach((m) =>
      z.push(`- ${[m.bezeichnung, m.dimension, m.menge, m.hinweis].filter(Boolean).join(' | ')}`),
    );
    z.push('');
  }
  if (daten.werkzeug?.length) {
    z.push('WERKZEUGLISTE');
    daten.werkzeug.forEach((w) => z.push(`- ${[w.bezeichnung, w.zweck].filter(Boolean).join(' – ')}`));
    z.push('');
  }
  if (daten.arbeitssicherheit?.length) {
    z.push('ARBEITSSICHERHEIT');
    daten.arbeitssicherheit.forEach((s) => z.push(`- ${s.text}`));
    z.push('');
  }
  if (daten.normen?.length) {
    z.push('REGELWERKE');
    daten.normen.forEach((n) => z.push(`- ${[n.titel, n.text].filter(Boolean).join(': ')}`));
    z.push('');
  }
  if (daten.erklaerungen?.length) {
    z.push('ERKLÄRUNGEN');
    daten.erklaerungen.forEach((e) => {
      z.push(`${e.titel}`);
      z.push(e.text);
      if (e.zusatz) z.push(e.zusatz);
      z.push('');
    });
  }
  abschnitt('Fazit', daten.fazit);
  return z.join('\n');
}
