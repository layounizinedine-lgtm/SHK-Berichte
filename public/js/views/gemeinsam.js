/**
 * Gemeinsame Bausteine der Bericht-Ansichten:
 * Speichern, Erklärdialog, Zeichnungsbereich.
 */
import { el, leere, meldung, hinweis, ladeAnzeige, dialog, dialogSchliessen, neueId, kopiere } from '../ui.js';
import { api } from '../api.js';
import { zustand } from '../store.js';
import { diktatFeld } from '../components.js';
import { vorlesen, vorlesenStopp } from '../speech.js';

/* ==========================================================================
   Speichern
   ========================================================================== */

/**
 * Erzeugt einen Speicher-Helfer mit Anzeige und automatischem Sichern.
 */
export function speicherHelfer({ typ, holeTitel, holeDaten, id = null }) {
  let berichtId = id;
  let timer = null;
  let laeuft = false;
  const anzeige = el('span.klein.leise', { text: berichtId ? 'gespeichert' : 'noch nicht gespeichert' });

  async function jetztSpeichern({ still = false } = {}) {
    if (laeuft) return berichtId;
    laeuft = true;
    anzeige.textContent = 'speichere …';
    try {
      const nutz = { typ, titel: holeTitel() || 'Ohne Titel', daten: holeDaten() };
      if (berichtId) {
        await api.berichtSpeichern(berichtId, nutz);
      } else {
        const { bericht } = await api.berichtNeu(nutz);
        berichtId = bericht.id;
        history.replaceState(null, '', `#/${typ === 'erklaerung' ? 'wissen' : typ}/${berichtId}`);
      }
      anzeige.textContent = `gespeichert · ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
      if (!still) meldung('Gespeichert.', 'erfolg', 2000);
      return berichtId;
    } catch (fehler) {
      anzeige.textContent = 'Speichern fehlgeschlagen';
      meldung(fehler.message, 'fehler', 6000);
      return null;
    } finally {
      laeuft = false;
    }
  }

  function merken() {
    anzeige.textContent = 'ungespeicherte Änderungen';
    clearTimeout(timer);
    timer = setTimeout(() => jetztSpeichern({ still: true }), 2500);
  }

  return {
    anzeige,
    speichern: jetztSpeichern,
    merken,
    get id() {
      return berichtId;
    },
  };
}

/** Kopfzeile einer Bericht-Ansicht mit Titel, Status und Aktionen. */
export function berichtKopf({ titel, beiTitel, helfer, aktionen = [] }) {
  const titelFeld = el('input', {
    type: 'text',
    wert: titel || '',
    placeholder: 'Titel des Berichts',
    'aria-label': 'Titel des Berichts',
    style: 'font-size:1.15rem;font-weight:600',
    oninput: (e) => beiTitel(e.currentTarget.value),
  });

  return {
    titelFeld,
    element: el('section.karte', {}, [
      el('div.feld', {}, [titelFeld]),
      el('div.karte-kopf', { style: 'margin:12px 0 0' }, [
        helfer.anzeige,
        el(
          'div.rechts',
          {},
          [
            ...aktionen.map((a) =>
              el(`button.knopf.knopf-klein.${a.klasse || 'knopf-leer'}`, {
                type: 'button',
                text: a.text,
                onclick: a.aufruf,
              }),
            ),
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: 'Drucken / PDF',
              onclick: () => window.print(),
            }),
            el('button.knopf.knopf-klein.knopf-haupt', {
              type: 'button',
              text: 'Speichern',
              onclick: () => helfer.speichern(),
            }),
          ].filter(Boolean),
        ),
      ]),
    ]),
  };
}

/* ==========================================================================
   Erklärdialog
   ========================================================================== */

/**
 * Öffnet die Erklärung zu einem Begriff – mit Vertiefung und Rückfragen.
 * @param {string} begriff
 * @param {object} [o]
 * @param {(inhalt:{begriff:string,text:string})=>void} [o.einfuegen] Übernahme in den Bericht
 * @param {object} [o.kontext]
 */
export async function erklaerDialog(begriff, { einfuegen, kontext } = {}) {
  let tiefe = 1;
  let erklaerung = null;
  const verlauf = [];

  const inhalt = el('div');
  dialog(inhalt);
  leere(inhalt).append(ladeAnzeige(`„${begriff}“ wird erklärt …`));

  async function hole(neueTiefe = tiefe) {
    tiefe = neueTiefe;
    leere(inhalt).append(ladeAnzeige(tiefe > 1 ? 'Ausführlichere Erklärung wird erstellt …' : `„${begriff}“ wird erklärt …`));
    try {
      erklaerung = await api.ki.erklaerung(begriff, tiefe, kontext);
      zeichne();
    } catch (fehler) {
      leere(inhalt).append(
        hinweis(fehler.message, 'fehler'),
        el('div.knopf-reihe', { style: 'margin-top:12px' }, [
          el('button.knopf', { type: 'button', text: 'Schließen', onclick: () => dialogSchliessen() }),
        ]),
      );
    }
  }

  async function nachfrage(frage) {
    const bereich = el('div', {}, [ladeAnzeige('Rückfrage wird beantwortet …')]);
    inhalt.append(bereich);
    bereich.scrollIntoView({ block: 'nearest' });
    try {
      const antwort = await api.ki.vertiefung({
        begriff: erklaerung?.begriff || begriff,
        frage,
        bisher: textVonErklaerung(erklaerung, verlauf),
        kontext,
      });
      verlauf.push({ frage, ...antwort });
      zeichne();
    } catch (fehler) {
      bereich.remove();
      meldung(fehler.message, 'fehler', 6000);
    }
  }

  function zeichne() {
    leere(inhalt);
    if (!erklaerung) return;

    inhalt.append(
      el('div.karte-kopf', {}, [
        el('h2', { text: erklaerung.begriff }),
        el('div.rechts', {}, [
          el('span.chip', {
            text: erklaerung.quelle === 'ki' ? `KI · Stufe ${tiefe}` : 'Fachmodus offline',
            class: `chip ${erklaerung.quelle === 'ki' ? 'chip-akzent' : 'chip-kupfer'}`,
          }),
        ]),
      ]),
      erklaerung.warnung ? hinweis(erklaerung.warnung, 'warnung') : null,
      el('p', { text: erklaerung.kurz, 'data-erklaerbar': '1', style: 'font-size:1.03rem' }),
    );

    for (const abschnitt of erklaerung.abschnitte || []) {
      inhalt.append(
        el('div', { style: 'margin-top:14px' }, [
          el('h3.abschnitt-titel', { text: abschnitt.titel }),
          abschnitt.text ? el('p', { text: abschnitt.text, 'data-erklaerbar': '1' }) : null,
          abschnitt.punkte?.length
            ? el(
                'ul',
                { 'data-erklaerbar': '1', style: 'margin:0;padding-left:20px' },
                abschnitt.punkte.map((p) => el('li', { text: p })),
              )
            : null,
          el('div.knopf-reihe', {}, [
            el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              text: 'Diesen Punkt erläutern',
              onclick: () => nachfrage(`Erläutere genauer: ${abschnitt.titel} – ${abschnitt.text || (abschnitt.punkte || []).join('; ')}`),
            }),
          ]),
        ]),
      );
    }

    if (erklaerung.normen?.length) {
      inhalt.append(
        el('div', { style: 'margin-top:14px' }, [
          el('h3.abschnitt-titel', { text: 'Regelwerke' }),
          el(
            'div.chip-liste',
            {},
            erklaerung.normen.map((n) => el('span.chip.chip-gruen', { text: n })),
          ),
        ]),
      );
    }

    for (const eintrag of verlauf) {
      inhalt.append(
        el('div.punkt-zusatz', { style: 'margin-top:14px' }, [
          el('div.klein.leise', { text: `Rückfrage: ${eintrag.frage}` }),
          el('strong', { text: eintrag.titel || 'Vertiefung' }),
          el('p', { text: eintrag.text, 'data-erklaerbar': '1', style: 'margin:6px 0 0' }),
          eintrag.punkte?.length
            ? el(
                'ul',
                { style: 'margin:6px 0 0;padding-left:20px' },
                eintrag.punkte.map((p) => el('li', { text: p })),
              )
            : null,
        ]),
      );
    }

    if (erklaerung.stichworte?.length) {
      inhalt.append(
        el('div', { style: 'margin-top:14px' }, [
          el('h3.abschnitt-titel', { text: 'Passt dazu' }),
          el(
            'div.chip-liste',
            {},
            erklaerung.stichworte.map((s) =>
              el('button.chip.chip-akzent', {
                type: 'button',
                text: s,
                onclick: () => {
                  dialogSchliessen();
                  erklaerDialog(s, { einfuegen, kontext });
                },
              }),
            ),
          ),
        ]),
      );
    }

    /* Rückfrage per Sprache oder Text */
    const frageFeld = diktatFeld({
      titel: 'Nachfragen',
      hilfe: 'Zum Beispiel: „Erläutere was genau passiert, wenn zu viel Druck kommt.“',
      platzhalter: 'Rückfrage eingeben oder einsprechen …',
      aktionen: [
        {
          text: 'Rückfrage stellen',
          klasse: 'knopf-haupt',
          aufruf: async (text, steuerung) => {
            if (!text) {
              meldung('Bitte zuerst eine Rückfrage sprechen oder eingeben.', 'warnung');
              return;
            }
            steuerung.stopp();
            steuerung.leeren();
            await nachfrage(text);
          },
        },
      ],
    });

    inhalt.append(
      el('hr.trenner'),
      el('div.knopf-reihe', {}, [
        tiefe < 3
          ? el('button.knopf.knopf-kupfer', {
              type: 'button',
              text: tiefe === 1 ? 'Ausführlicher' : 'Noch ausführlicher',
              onclick: () => hole(tiefe + 1),
            })
          : null,
        el('button.knopf', {
          type: 'button',
          text: '🔊 Vorlesen',
          onclick: () => {
            if (!vorlesen(textVonErklaerung(erklaerung, verlauf))) {
              meldung('Vorlesen wird von diesem Browser nicht unterstützt.', 'warnung');
            }
          },
        }),
        el('button.knopf.knopf-leer', { type: 'button', text: 'Stopp', onclick: () => vorlesenStopp() }),
        el('button.knopf.knopf-leer', {
          type: 'button',
          text: 'Text kopieren',
          onclick: () => kopiere(textVonErklaerung(erklaerung, verlauf)),
        }),
        einfuegen
          ? el('button.knopf.knopf-haupt', {
              type: 'button',
              text: 'In Bericht übernehmen',
              onclick: () => {
                einfuegen({ begriff: erklaerung.begriff, text: textVonErklaerung(erklaerung, verlauf, false) });
                dialogSchliessen();
                meldung('Erklärung in den Bericht übernommen.', 'erfolg');
              },
            })
          : null,
        el('button.knopf.knopf-leer', {
          type: 'button',
          text: 'Als Erklärung speichern',
          onclick: async () => {
            try {
              await api.berichtNeu({
                typ: 'erklaerung',
                titel: erklaerung.begriff,
                daten: { ...erklaerung, verlauf, tiefe },
              });
              meldung('Unter „Meine Berichte“ gespeichert.', 'erfolg');
            } catch (fehler) {
              meldung(fehler.message, 'fehler');
            }
          },
        }),
        el('button.knopf.knopf-leer', { type: 'button', text: 'Schließen', onclick: () => dialogSchliessen() }),
      ]),
      el('div', { style: 'margin-top:14px' }, [frageFeld.element]),
    );
  }

  await hole(1);
}

/** Erklärung als Fließtext (für Vorlesen, Kopieren, Übernahme). */
export function textVonErklaerung(erklaerung, verlauf = [], mitTitel = true) {
  if (!erklaerung) return '';
  const teile = [];
  if (mitTitel) teile.push(erklaerung.begriff);
  teile.push(erklaerung.kurz);
  for (const a of erklaerung.abschnitte || []) {
    teile.push(`${a.titel}: ${a.text || ''}`.trim());
    for (const p of a.punkte || []) teile.push(`– ${p}`);
  }
  if (erklaerung.normen?.length) teile.push(`Regelwerke: ${erklaerung.normen.join(', ')}`);
  for (const v of verlauf) {
    teile.push(`Rückfrage: ${v.frage}`);
    teile.push(`${v.titel || 'Vertiefung'}: ${v.text}`);
    for (const p of v.punkte || []) teile.push(`– ${p}`);
  }
  return teile.filter(Boolean).join('\n\n');
}

/* ==========================================================================
   Zeichnung
   ========================================================================== */

/**
 * Bereich für die technische Skizze mit Erstellung per Sprache.
 */
export function zeichnungsBereich({ daten, beiAenderung, kontext }) {
  const bereich = el('section.karte');

  function zeichne() {
    leere(bereich);
    bereich.append(
      el('div.karte-kopf', {}, [
        el('h2', { text: 'Zeichnung / Schema' }),
        el('div.rechts', {}, [
          daten.zeichnung
            ? el('button.knopf.knopf-klein.knopf-gefahr', {
                type: 'button',
                text: 'Zeichnung löschen',
                onclick: () => {
                  delete daten.zeichnung;
                  beiAenderung();
                  zeichne();
                },
              })
            : null,
        ]),
      ]),
    );

    if (daten.zeichnung?.svg) {
      bereich.append(
        el('div.zeichnung', { html: daten.zeichnung.svg }),
        daten.zeichnung.beschreibung
          ? el('p.klein.leise', { text: daten.zeichnung.beschreibung, style: 'margin-top:10px' })
          : null,
        daten.zeichnung.legende?.length
          ? el('div', { style: 'margin-top:8px' }, [
              el('h3.abschnitt-titel', { text: 'Legende' }),
              el(
                'div.chip-liste',
                {},
                daten.zeichnung.legende.map((l) => el('span.chip', { text: `${l.zeichen} – ${l.bedeutung}` })),
              ),
            ])
          : null,
      );
    } else {
      bereich.append(
        el('p.klein.leise', {
          text: 'Noch keine Zeichnung. Beschreibe, was gezeichnet werden soll – zum Beispiel „Zeichne eine Hauswasserstation mit Filter, Druckminderer und Wasserzähler“.',
        }),
      );
    }

    const feld = diktatFeld({
      titel: 'Zeichnung erstellen',
      hilfe: 'Anlagenteil beschreiben – die Skizze wird passend zum Bericht erzeugt.',
      platzhalter: 'z. B. Strangschema der Trinkwasserinstallation mit Hauswasserstation …',
      aktionen: [
        {
          text: daten.zeichnung ? 'Neu zeichnen' : 'Zeichnen lassen',
          klasse: 'knopf-haupt',
          aufruf: async (text, steuerung) => {
            const beschreibung = text || kontext?.titel || '';
            if (!beschreibung) {
              meldung('Bitte kurz beschreiben, was gezeichnet werden soll.', 'warnung');
              return;
            }
            steuerung.stopp();
            const ergebnis = await api.ki.zeichnung({ beschreibung, titel: kontext?.titel, kontext });
            daten.zeichnung = ergebnis;
            beiAenderung();
            zeichne();
            if (ergebnis.warnung) meldung(ergebnis.warnung, 'warnung', 6000);
            else meldung('Zeichnung erstellt.', 'erfolg');
          },
        },
      ],
    });

    bereich.append(el('div', { style: 'margin-top:14px' }, [feld.element]));
  }

  zeichne();
  return { element: bereich, neuZeichnen: zeichne };
}

/* ==========================================================================
   Hilfsfunktionen
   ========================================================================== */

export function kontextAus(titel, daten) {
  return {
    betrieb: zustand.benutzer?.betrieb,
    lehrjahr: zustand.benutzer?.lehrjahr,
    titel,
    vorhandenes: daten ? String(daten).slice(0, 4000) : '',
  };
}

export { neueId };
