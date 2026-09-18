/**
 * Erklären lassen: Fachbegriffe, Bauteile und Vorgänge – mit Rückfragen.
 */
import { el, leere, meldung, hinweis, neueId, kopiere, bestaetigen } from '../ui.js';
import { api } from '../api.js';
import { diktatFeld, setzeErklaerHandler } from '../components.js';
import { speicherHelfer, berichtKopf, erklaerDialog, kontextAus, textVonErklaerung, zeichnungsBereich } from './gemeinsam.js';
import { vorlesen, vorlesenStopp } from '../speech.js';

const VORSCHLAEGE = [
  'Druckminderer',
  'Sicherheitsventil',
  'Membran-Ausdehnungsgefäß',
  'Systemtrenner BA',
  'Hydraulischer Abgleich',
  'Legionellenschutz nach DVGW W 551',
  'Pressfitting',
  'Geruchsverschluss',
  'Abwasserhebeanlage',
  'Gas-Brennwertgerät',
];

export async function ansichtWissen(behaelter, id) {
  leere(behaelter);

  let titel = 'Neue Erklärung';
  let daten = { begriff: '', kurz: '', abschnitte: [], normen: [], stichworte: [], verlauf: [], tiefe: 1 };

  if (id && id !== 'neu') {
    try {
      const { bericht } = await api.bericht(id);
      titel = bericht.titel;
      daten = { verlauf: [], tiefe: 1, abschnitte: [], normen: [], stichworte: [], ...bericht.daten };
    } catch (fehler) {
      behaelter.append(hinweis(fehler.message, 'fehler'));
      return;
    }
  }

  daten.abschnitte = (daten.abschnitte || []).map((a) => ({ id: a.id || neueId(), ...a }));
  daten.verlauf = (daten.verlauf || []).map((v) => ({ id: v.id || neueId(), ...v }));

  const helfer = speicherHelfer({
    typ: 'erklaerung',
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
    aktionen: [
      { text: 'Text kopieren', aufruf: () => kopiere(textVonErklaerung(daten, daten.verlauf)) },
      {
        text: '🔊 Vorlesen',
        aufruf: () => {
          if (!vorlesen(textVonErklaerung(daten, daten.verlauf))) {
            meldung('Vorlesen wird von diesem Browser nicht unterstützt.', 'warnung');
          }
        },
      },
      { text: 'Stopp', aufruf: () => vorlesenStopp() },
    ],
  });

  const inhaltsBereich = el('div');

  /* ------------------------------------------------------------ Erklären */

  async function erklaere(begriff, tiefe = 1) {
    leere(inhaltsBereich).append(
      el('div.karte', {}, [el('div.arbeitet', {}, [el('span.laden'), `„${begriff}“ wird erklärt …`])]),
    );
    try {
      const ergebnis = await api.ki.erklaerung(begriff, tiefe, kontextAus(titel));
      daten = {
        ...ergebnis,
        abschnitte: (ergebnis.abschnitte || []).map((a) => ({ id: neueId(), ...a })),
        verlauf: tiefe === 1 ? [] : daten.verlauf,
        tiefe,
        zeichnung: daten.zeichnung,
      };
      if (titel === 'Neue Erklärung' || !titel) {
        titel = ergebnis.begriff;
        kopf.titelFeld.value = titel;
      }
      helfer.merken();
      zeichneAlles();
      if (ergebnis.warnung) meldung(ergebnis.warnung, 'warnung', 6000);
    } catch (fehler) {
      leere(inhaltsBereich).append(hinweis(fehler.message, 'fehler'));
    }
  }

  async function nachfrage(frage) {
    const laden = el('div.karte', {}, [el('div.arbeitet', {}, [el('span.laden'), 'Rückfrage wird beantwortet …'])]);
    inhaltsBereich.append(laden);
    laden.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try {
      const antwort = await api.ki.vertiefung({
        begriff: daten.begriff || titel,
        frage,
        bisher: textVonErklaerung(daten, daten.verlauf),
        kontext: kontextAus(titel),
      });
      daten.verlauf.push({ id: neueId(), frage, ...antwort });
      helfer.merken();
      zeichneAlles();
    } catch (fehler) {
      meldung(fehler.message, 'fehler', 6000);
    } finally {
      laden.remove();
    }
  }

  /* ------------------------------------------------------------ Diktat */

  const diktat = diktatFeld({
    titel: 'Was soll erklärt werden?',
    hilfe: 'Zum Beispiel: „Erkläre einen Druckminderer“ – danach beliebig nachfragen.',
    platzhalter: 'Begriff oder Frage …',
    beiBefehl: async (befehl) => {
      if (befehl.aktion === 'erklaeren') {
        await erklaere(befehl.begriff || befehl.text || '');
        return true;
      }
      if (befehl.aktion === 'vertiefen') {
        if (!daten.begriff) {
          meldung('Bitte zuerst einen Begriff erklären lassen.', 'warnung');
          return true;
        }
        if (daten.tiefe < 3) await erklaere(daten.begriff, daten.tiefe + 1);
        else await nachfrage('Bitte noch tiefer und mit Zahlenwerten erläutern.');
        return true;
      }
      if (befehl.aktion === 'zeichnung') {
        const ergebnis = await api.ki.zeichnung({
          beschreibung: befehl.begriff || daten.begriff || titel,
          titel: daten.begriff || titel,
          kontext: kontextAus(titel),
        });
        daten.zeichnung = ergebnis;
        helfer.merken();
        zeichneAlles();
        return true;
      }
      if (befehl.aktion === 'speichern') {
        await helfer.speichern();
        return true;
      }
      return false;
    },
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
          await erklaere(text);
        },
      },
      {
        text: 'Als Rückfrage stellen',
        klasse: 'knopf-leer',
        aufruf: async (text, steuerung) => {
          if (!text) return;
          if (!daten.begriff) {
            meldung('Bitte zuerst einen Begriff erklären lassen.', 'warnung');
            return;
          }
          steuerung.stopp();
          steuerung.leeren();
          await nachfrage(text);
        },
      },
    ],
  });

  /* ------------------------------------------------------------ Darstellung */

  function zeichneAlles() {
    leere(inhaltsBereich);

    if (!daten.begriff) {
      inhaltsBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [el('h2', { text: 'Häufig gefragt' })]),
          el('p.klein.leise', { text: 'Antippen oder einfach einsprechen.' }),
          el(
            'div.chip-liste',
            {},
            VORSCHLAEGE.map((v) =>
              el('button.chip.chip-akzent', { type: 'button', text: v, onclick: () => erklaere(v) }),
            ),
          ),
        ]),
      );
      return;
    }

    if (daten.warnung) inhaltsBereich.append(hinweis(daten.warnung, 'warnung'));

    inhaltsBereich.append(
      el('section.karte', {}, [
        el('div.karte-kopf', {}, [
          el('h2', { text: daten.begriff }),
          el('div.rechts', {}, [
            el(`span.chip.${daten.quelle === 'ki' ? 'chip-akzent' : 'chip-kupfer'}`, {
              text: daten.quelle === 'ki' ? `KI · Stufe ${daten.tiefe || 1}` : 'Fachmodus offline',
            }),
          ]),
        ]),
        el('p', { text: daten.kurz, 'data-erklaerbar': '1', style: 'font-size:1.05rem' }),
        el('div.knopf-reihe', {}, [
          (daten.tiefe || 1) < 3
            ? el('button.knopf.knopf-kupfer', {
                type: 'button',
                text: (daten.tiefe || 1) === 1 ? 'Ausführlicher' : 'Noch ausführlicher',
                onclick: () => erklaere(daten.begriff, (daten.tiefe || 1) + 1),
              })
            : null,
          el('button.knopf.knopf-leer', {
            type: 'button',
            text: 'Neu erklären',
            onclick: () => erklaere(daten.begriff, 1),
          }),
        ]),
      ]),
    );

    for (const abschnitt of daten.abschnitte) {
      inhaltsBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [
            el('h3', { text: abschnitt.titel }),
            el('div.rechts', {}, [
              el('button.knopf.knopf-klein.knopf-leer', {
                type: 'button',
                text: 'Genauer erläutern',
                onclick: () =>
                  nachfrage(
                    `Erläutere genauer: ${abschnitt.titel} – ${abschnitt.text || (abschnitt.punkte || []).join('; ')}`,
                  ),
              }),
              el('button.knopf.knopf-klein.knopf-leer', {
                type: 'button',
                text: '🗑',
                title: 'Abschnitt löschen',
                onclick: () => {
                  daten.abschnitte = daten.abschnitte.filter((a) => a !== abschnitt);
                  helfer.merken();
                  zeichneAlles();
                },
              }),
            ]),
          ]),
          abschnitt.text ? el('p', { text: abschnitt.text, 'data-erklaerbar': '1' }) : null,
          abschnitt.punkte?.length
            ? el(
                'ul',
                { 'data-erklaerbar': '1', style: 'margin:0;padding-left:20px' },
                abschnitt.punkte.map((p, i) =>
                  el('li', { style: 'margin-bottom:4px' }, [
                    el('span', { text: p }),
                    ' ',
                    el('button.knopf.knopf-klein.knopf-leer', {
                      type: 'button',
                      text: '×',
                      title: 'Punkt entfernen',
                      onclick: () => {
                        abschnitt.punkte.splice(i, 1);
                        helfer.merken();
                        zeichneAlles();
                      },
                    }),
                  ]),
                ),
              )
            : null,
        ]),
      );
    }

    if (daten.normen?.length) {
      inhaltsBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [el('h3', { text: 'Regelwerke' })]),
          el(
            'div.chip-liste',
            {},
            daten.normen.map((n, i) =>
              el('span.chip.chip-gruen', {}, [
                el('span', { text: n }),
                el('button', {
                  type: 'button',
                  text: '×',
                  'aria-label': `${n} entfernen`,
                  onclick: () => {
                    daten.normen.splice(i, 1);
                    helfer.merken();
                    zeichneAlles();
                  },
                }),
              ]),
            ),
          ),
        ]),
      );
    }

    for (const eintrag of daten.verlauf) {
      inhaltsBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [
            el('div', {}, [
              el('div.klein.leise', { text: `Rückfrage: ${eintrag.frage}` }),
              el('h3', { text: eintrag.titel || 'Vertiefung', style: 'margin:0' }),
            ]),
            el('div.rechts', {}, [
              el('button.knopf.knopf-klein.knopf-leer', {
                type: 'button',
                text: 'Noch genauer',
                onclick: () => nachfrage(`Noch genauer und mit Zahlenwerten: ${eintrag.frage}`),
              }),
              el('button.knopf.knopf-klein.knopf-leer', {
                type: 'button',
                text: '🗑',
                title: 'Vertiefung löschen',
                onclick: () => {
                  daten.verlauf = daten.verlauf.filter((v) => v !== eintrag);
                  helfer.merken();
                  zeichneAlles();
                },
              }),
            ]),
          ]),
          el('p', { text: eintrag.text, 'data-erklaerbar': '1' }),
          eintrag.punkte?.length
            ? el(
                'ul',
                { 'data-erklaerbar': '1', style: 'margin:0;padding-left:20px' },
                eintrag.punkte.map((p) => el('li', { text: p })),
              )
            : null,
        ]),
      );
    }

    if (daten.stichworte?.length) {
      inhaltsBereich.append(
        el('section.karte', {}, [
          el('div.karte-kopf', {}, [el('h3', { text: 'Passt dazu' })]),
          el(
            'div.chip-liste',
            {},
            daten.stichworte.map((s) =>
              el('button.chip.chip-akzent', {
                type: 'button',
                text: s,
                onclick: () => erklaerDialog(s, { kontext: kontextAus(titel) }),
              }),
            ),
          ),
        ]),
      );
    }

    inhaltsBereich.append(
      el('details.karte', {}, [
        el('summary', { text: 'Passende Zeichnung erstellen', style: 'cursor:pointer;font-weight:600' }),
        el('div', { style: 'margin-top:12px' }, [
          zeichnungsBereich({
            daten,
            beiAenderung: () => helfer.merken(),
            kontext: kontextAus(daten.begriff || titel),
          }).element,
        ]),
      ]),
      el('div.knopf-reihe', { style: 'margin-top:16px' }, [
        el('button.knopf.knopf-gefahr.knopf-klein', {
          type: 'button',
          text: 'Erklärung zurücksetzen',
          onclick: async () => {
            const ja = await bestaetigen({
              titel: 'Erklärung zurücksetzen?',
              text: 'Alle Abschnitte und Rückfragen werden entfernt.',
              knopf: 'Zurücksetzen',
            });
            if (!ja) return;
            daten = { begriff: '', kurz: '', abschnitte: [], normen: [], stichworte: [], verlauf: [], tiefe: 1 };
            helfer.merken();
            zeichneAlles();
          },
        }),
      ]),
    );
  }

  setzeErklaerHandler((text) => erklaerDialog(text, { kontext: kontextAus(titel) }));

  behaelter.append(
    kopf.element,
    el('div', { style: 'margin-top:16px' }, [diktat.element]),
    el('div', { style: 'margin-top:16px' }, [inhaltsBereich]),
  );

  zeichneAlles();
}
