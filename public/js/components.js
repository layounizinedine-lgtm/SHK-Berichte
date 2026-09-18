/**
 * Wiederverwendbare Bausteine: Diktatfeld, Punktlisten, Chips,
 * Begriffserklärung über Textauswahl.
 */
import { el, leere, meldung, neueId } from './ui.js';
import { Diktat, spracheVerfuegbar } from './speech.js';
import { api } from './api.js';

/* ==========================================================================
   Diktatfeld
   ========================================================================== */

/**
 * Baut ein Diktatfeld mit Mikrofon, Textbereich und Aktionsknöpfen.
 *
 * @param {object} o
 * @param {string} o.titel
 * @param {string} [o.hilfe]           Erklärtext unter dem Titel
 * @param {string} [o.platzhalter]
 * @param {Array}  [o.aktionen]        [{text, klasse, aufruf(text, steuerung)}]
 * @param {(befehl:object, steuerung:object)=>Promise<boolean>} [o.beiBefehl]
 *        Wird bei erkannten Sprachbefehlen aufgerufen. true = erledigt.
 */
export function diktatFeld({ titel, hilfe, platzhalter, aktionen = [], beiBefehl } = {}) {
  const textfeld = el('textarea', {
    rows: 4,
    placeholder: platzhalter || 'Hier erscheint das Diktat – Text kann jederzeit von Hand geändert werden.',
    'aria-label': 'Diktattext',
  });

  const zwischenAnzeige = el('div.klein.leise', { style: 'min-height:1.4em' });
  const statusAnzeige = el('div.klein.leise', {
    text: spracheVerfuegbar ? 'Mikrofon antippen und sprechen.' : 'Diktat in diesem Browser nicht möglich – bitte tippen.',
  });

  const steuerung = {
    hole: () => textfeld.value.trim(),
    setze: (t) => {
      textfeld.value = t;
    },
    anfuegen: (t) => {
      const alt = textfeld.value.trim();
      textfeld.value = alt ? `${alt} ${t}` : t;
      textfeld.scrollTop = textfeld.scrollHeight;
    },
    leeren: () => {
      textfeld.value = '';
    },
    stopp: () => diktat.stopp(),
    textfeld,
  };

  const mikro = el('button.mikro', {
    type: 'button',
    title: 'Diktat starten / beenden',
    'aria-label': 'Diktat starten oder beenden',
    dataset: { aktiv: 'false' },
    text: '🎙',
  });

  const diktat = new Diktat({
    beiSatz: async (satz) => {
      zwischenAnzeige.textContent = '';
      if (beiBefehl) {
        try {
          const befehl = await api.ki.befehl(satz);
          if (befehl.aktion && befehl.aktion !== 'eintrag') {
            const erledigt = await beiBefehl(befehl, steuerung);
            if (erledigt !== false) {
              statusAnzeige.textContent = `Befehl erkannt: ${befehlName(befehl.aktion)}`;
              return;
            }
          }
        } catch {
          /* Befehlserkennung optional – im Zweifel als Text übernehmen */
        }
      }
      steuerung.anfuegen(satz);
    },
    beiZwischen: (text) => {
      zwischenAnzeige.textContent = text ? `… ${text}` : '';
    },
    beiStatus: (aktiv) => {
      mikro.dataset.aktiv = String(aktiv);
      mikro.textContent = aktiv ? '⏹' : '🎙';
      statusAnzeige.textContent = aktiv
        ? 'Ich höre zu … einfach frei erzählen.'
        : spracheVerfuegbar
          ? 'Mikrofon antippen und sprechen.'
          : 'Diktat in diesem Browser nicht möglich – bitte tippen.';
    },
    beiFehler: (nachricht) => meldung(nachricht, 'warnung', 6000),
  });

  mikro.addEventListener('click', () => diktat.umschalten());

  const knopfReihe = el(
    'div.knopf-reihe',
    { style: 'margin-top:12px' },
    aktionen.map((a) =>
      el(`button.knopf.${a.klasse || 'knopf-haupt'}`, {
        type: 'button',
        text: a.text,
        onclick: async (ereignis) => {
          const knopf = ereignis.currentTarget;
          const alt = knopf.textContent;
          knopf.disabled = true;
          knopf.textContent = 'Bitte warten …';
          try {
            await a.aufruf(steuerung.hole(), steuerung);
          } catch (fehler) {
            meldung(fehler.message || 'Das hat nicht funktioniert.', 'fehler', 6000);
          } finally {
            knopf.disabled = false;
            knopf.textContent = alt;
          }
        },
      }),
    ),
  );

  const element = el('section.diktat', {}, [
    el('div.diktat-reihe', {}, [
      mikro,
      el('div.diktat-text', {}, [
        el('h3', { text: titel, style: 'margin-bottom:2px' }),
        hilfe ? el('div.klein.leise', { text: hilfe }) : null,
        statusAnzeige,
      ]),
    ]),
    el('div', { style: 'margin-top:12px' }, [textfeld]),
    zwischenAnzeige,
    knopfReihe,
  ]);

  steuerung.element = element;
  return steuerung;
}

function befehlName(aktion) {
  return (
    {
      loeschen: 'Punkt löschen',
      erklaeren: 'Begriff erklären',
      vertiefen: 'Ausführlicher erklären',
      zeichnung: 'Zeichnung erstellen',
      titel: 'Titel setzen',
      speichern: 'Speichern',
    }[aktion] || aktion
  );
}

/* ==========================================================================
   Punktliste (auswählen, ändern, löschen, vertiefen)
   ========================================================================== */

/**
 * @param {object} o
 * @param {Array} o.punkte              [{id, text, zusatz?}]
 * @param {(punkte:Array)=>void} o.beiAenderung
 * @param {(punkt:object)=>void} [o.beiVertiefen]
 * @param {(text:string)=>void} [o.beiErklaeren]
 * @param {string} [o.leerText]
 */
export function punktListe({ punkte, beiAenderung, beiVertiefen, beiErklaeren, leerText }) {
  const liste = el('ul.punkte');
  const gewaehlt = new Set();
  const auswahlLeiste = el('div.auswahl-leiste', { style: 'display:none' });

  function zeichne() {
    leere(liste);
    if (!punkte.length) {
      liste.append(el('li.leise.klein', { text: leerText || 'Noch keine Einträge.' }));
    }

    punkte.forEach((punkt, index) => {
      const kasten = el('input', {
        type: 'checkbox',
        'aria-label': `Punkt ${index + 1} auswählen`,
        onchange: (e) => {
          if (e.currentTarget.checked) gewaehlt.add(punkt.id);
          else gewaehlt.delete(punkt.id);
          zeile.dataset.gewaehlt = String(e.currentTarget.checked);
          zeichneAuswahl();
        },
      });
      kasten.checked = gewaehlt.has(punkt.id);

      const titelKnoten = punkt.titel
        ? el('div.punkt-text', {
            contenteditable: 'true',
            'data-erklaerbar': '1',
            style: 'font-weight:600',
            text: punkt.titel,
            onblur: (e) => {
              const neu = e.currentTarget.textContent.trim();
              if (neu !== punkt.titel) {
                punkt.titel = neu;
                beiAenderung(punkte);
              }
            },
          })
        : null;

      const textKnoten = el('div.punkt-text', {
        contenteditable: 'true',
        'data-erklaerbar': '1',
        text: punkt.text,
        onblur: (e) => {
          const neu = e.currentTarget.textContent.trim();
          if (neu !== punkt.text) {
            punkt.text = neu;
            beiAenderung(punkte);
          }
        },
        onkeydown: (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        },
      });

      const werkzeuge = el('div.punkt-werkzeuge', {}, [
        beiVertiefen
          ? el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              title: 'Diesen Punkt ausführlicher machen',
              text: 'Genauer',
              onclick: () => beiVertiefen(punkt),
            })
          : null,
        beiErklaeren
          ? el('button.knopf.knopf-klein.knopf-leer', {
              type: 'button',
              title: 'Fachbegriffe in diesem Punkt erklären',
              text: 'Erklären',
              onclick: () => beiErklaeren(punkt.text),
            })
          : null,
        el('button.knopf.knopf-klein.knopf-leer', {
          type: 'button',
          title: 'Punkt löschen',
          text: '🗑',
          onclick: () => {
            const i = punkte.indexOf(punkt);
            if (i >= 0) punkte.splice(i, 1);
            gewaehlt.delete(punkt.id);
            beiAenderung(punkte);
            zeichne();
            zeichneAuswahl();
          },
        }),
      ]);

      const zeile = el('li.punkt', { dataset: { gewaehlt: String(gewaehlt.has(punkt.id)) } }, [
        kasten,
        el('div.punkt-inhalt', {}, [
          titelKnoten,
          textKnoten,
          punkt.zusatz
            ? el('div.punkt-zusatz', {}, [
                el('strong.klein', { text: punkt.zusatzTitel || 'Vertiefung' }),
                el('div', { text: punkt.zusatz }),
                el('div.knopf-reihe', { style: 'margin-top:8px' }, [
                  el('button.knopf.knopf-klein.knopf-leer', {
                    type: 'button',
                    text: 'Vertiefung entfernen',
                    onclick: () => {
                      delete punkt.zusatz;
                      delete punkt.zusatzTitel;
                      beiAenderung(punkte);
                      zeichne();
                    },
                  }),
                ]),
              ])
            : null,
        ]),
        werkzeuge,
      ]);

      liste.append(zeile);
    });
  }

  function zeichneAuswahl() {
    leere(auswahlLeiste);
    if (!gewaehlt.size) {
      auswahlLeiste.style.display = 'none';
      return;
    }
    auswahlLeiste.style.display = 'flex';
    auswahlLeiste.append(
      el('strong.klein', { text: `${gewaehlt.size} ausgewählt` }),
      el('button.knopf.knopf-klein.knopf-gefahr', {
        type: 'button',
        text: 'Löschen',
        onclick: () => {
          for (let i = punkte.length - 1; i >= 0; i -= 1) {
            if (gewaehlt.has(punkte[i].id)) punkte.splice(i, 1);
          }
          gewaehlt.clear();
          beiAenderung(punkte);
          zeichne();
          zeichneAuswahl();
        },
      }),
      beiVertiefen
        ? el('button.knopf.knopf-klein', {
            type: 'button',
            text: 'Genauer machen',
            onclick: async () => {
              for (const punkt of punkte.filter((p) => gewaehlt.has(p.id))) {
                await beiVertiefen(punkt);
              }
            },
          })
        : null,
      beiErklaeren
        ? el('button.knopf.knopf-klein', {
            type: 'button',
            text: 'Begriffe erklären',
            onclick: () => beiErklaeren(punkte.filter((p) => gewaehlt.has(p.id)).map((p) => p.text).join(' ')),
          })
        : null,
      el('button.knopf.knopf-klein.knopf-leer', {
        type: 'button',
        text: 'Auswahl aufheben',
        onclick: () => {
          gewaehlt.clear();
          zeichne();
          zeichneAuswahl();
        },
      }),
    );
  }

  zeichne();

  return {
    element: el('div', {}, [liste, auswahlLeiste]),
    neuZeichnen: () => {
      zeichne();
      zeichneAuswahl();
    },
    loescheNummer: (nummer) => {
      const i = Number(nummer) - 1;
      if (i >= 0 && i < punkte.length) {
        const weg = punkte.splice(i, 1)[0];
        gewaehlt.delete(weg.id);
        beiAenderung(punkte);
        zeichne();
        zeichneAuswahl();
        return weg;
      }
      return null;
    },
    loescheText: (suchtext) => {
      const s = String(suchtext || '').toLowerCase().trim();
      if (!s) return null;
      const i = punkte.findIndex((p) => p.text.toLowerCase().includes(s));
      if (i < 0) return null;
      const weg = punkte.splice(i, 1)[0];
      gewaehlt.delete(weg.id);
      beiAenderung(punkte);
      zeichne();
      zeichneAuswahl();
      return weg;
    },
  };
}

/** Hilfsfunktion: Textliste in Punktobjekte wandeln. */
export function zuPunkten(liste) {
  return (liste || [])
    .map((eintrag) => {
      if (typeof eintrag === 'string') return { id: neueId(), text: eintrag };
      return { id: eintrag.id || neueId(), ...eintrag };
    })
    .filter((p) => (p.text || '').trim().length > 0);
}

/* ==========================================================================
   Chipliste (Material, Werkzeug, Normen)
   ========================================================================== */

export function chipListe({ werte, klasse = '', beiAenderung, hinzufuegenText = 'Hinzufügen' }) {
  const behaelter = el('div.chip-liste');

  function zeichne() {
    leere(behaelter);
    if (!werte.length) behaelter.append(el('span.klein.leise', { text: 'Noch nichts erfasst.' }));
    werte.forEach((wert, index) => {
      behaelter.append(
        el(`span.chip.${klasse}`, {}, [
          el('span', { text: wert }),
          el('button', {
            type: 'button',
            title: 'Entfernen',
            text: '×',
            'aria-label': `${wert} entfernen`,
            onclick: () => {
              werte.splice(index, 1);
              beiAenderung(werte);
              zeichne();
            },
          }),
        ]),
      );
    });
    behaelter.append(
      el('button.knopf.knopf-klein.knopf-leer', {
        type: 'button',
        text: `+ ${hinzufuegenText}`,
        onclick: async () => {
          const { frageText } = await import('./ui.js');
          const neu = await frageText({ titel: hinzufuegenText, knopf: 'Hinzufügen' });
          if (neu) {
            werte.push(neu);
            beiAenderung(werte);
            zeichne();
          }
        },
      }),
    );
  }

  zeichne();
  return { element: behaelter, neuZeichnen: zeichne };
}

/* ==========================================================================
   Begriffserklärung über Textauswahl
   ========================================================================== */

let erklaerFunktion = null;

export function setzeErklaerHandler(fn) {
  erklaerFunktion = fn;
}

export function starteAuswahlErkennung() {
  const blase = document.getElementById('erklaer-blase');
  const knopf = document.getElementById('erklaer-blase-knopf');

  // Der Klick hebt die Markierung auf – deshalb den Text vorher sichern.
  let gemerkterText = '';
  knopf.addEventListener('pointerdown', () => {
    gemerkterText = String(window.getSelection?.().toString() || '').trim();
  });
  knopf.addEventListener('click', () => {
    const text = gemerkterText || String(window.getSelection?.().toString() || '').trim();
    blase.style.display = 'none';
    gemerkterText = '';
    if (text && erklaerFunktion) erklaerFunktion(text);
  });

  const pruefe = () => {
    const auswahl = window.getSelection?.();
    const text = String(auswahl?.toString() || '').trim();
    if (!erklaerFunktion || !text || text.length < 3 || text.length > 400 || !auswahl.rangeCount) {
      blase.style.display = 'none';
      return;
    }
    const bereich = auswahl.getRangeAt(0);
    const knoten = bereich.commonAncestorContainer;
    const element = knoten.nodeType === 1 ? knoten : knoten.parentElement;
    if (!element?.closest('[data-erklaerbar]')) {
      blase.style.display = 'none';
      return;
    }
    const kasten = bereich.getBoundingClientRect();
    blase.style.display = 'block';
    blase.style.top = `${window.scrollY + kasten.top - 42}px`;
    blase.style.left = `${Math.max(12, window.scrollX + kasten.left)}px`;
  };

  document.addEventListener('mouseup', () => setTimeout(pruefe, 10));
  document.addEventListener('touchend', () => setTimeout(pruefe, 140));
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') document.getElementById('erklaer-blase').style.display = 'none';
  });
  // Beim Scrollen die Blase mitführen statt sie auszublenden.
  let angefordert = false;
  document.addEventListener(
    'scroll',
    () => {
      if (angefordert) return;
      angefordert = true;
      requestAnimationFrame(() => {
        angefordert = false;
        pruefe();
      });
    },
    { passive: true },
  );
}
