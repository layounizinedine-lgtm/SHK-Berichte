/**
 * Kleine Bausteine für die Oberfläche: Elemente erzeugen, Meldungen, Dialoge.
 */

/**
 * Element erzeugen.
 * el('div.karte', { onclick }, [kinder])
 */
export function el(beschreibung, attribute = {}, kinder = []) {
  const [tagTeil, ...klassen] = String(beschreibung).split('.');
  const knoten = document.createElement(tagTeil || 'div');
  if (klassen.length) knoten.className = klassen.join(' ');

  for (const [name, wert] of Object.entries(attribute || {})) {
    if (wert === undefined || wert === null || wert === false) continue;
    if (name === 'text') {
      knoten.textContent = String(wert);
    } else if (name === 'html') {
      knoten.innerHTML = wert; // nur für serverseitig gesäubertes SVG verwenden
    } else if (name.startsWith('on') && typeof wert === 'function') {
      knoten.addEventListener(name.slice(2), wert);
    } else if (name === 'dataset') {
      Object.assign(knoten.dataset, wert);
    } else if (name === 'wert') {
      knoten.value = wert;
    } else {
      knoten.setAttribute(name, wert === true ? '' : String(wert));
    }
  }

  for (const kind of [].concat(kinder)) {
    if (kind === null || kind === undefined || kind === false) continue;
    knoten.append(kind instanceof Node ? kind : document.createTextNode(String(kind)));
  }
  return knoten;
}

export function leere(knoten) {
  while (knoten.firstChild) knoten.removeChild(knoten.firstChild);
  return knoten;
}

/** Kurze Meldung unten einblenden. */
export function meldung(text, art = 'info', dauer = 4200) {
  const behaelter = document.getElementById('meldungen');
  const knoten = el(`div.meldung.meldung-${art}`, { text });
  behaelter.append(knoten);
  setTimeout(() => {
    knoten.style.opacity = '0';
    knoten.style.transition = 'opacity .25s';
    setTimeout(() => knoten.remove(), 260);
  }, dauer);
}

export function hinweis(text, art = 'info') {
  const zeichen = { info: 'i', warnung: '!', fehler: '×', erfolg: '✓' }[art] || 'i';
  return el(`div.hinweis.hinweis-${art}`, {}, [el('strong', { text: zeichen, 'aria-hidden': 'true' }), el('div', { text })]);
}

export function ladeAnzeige(text = 'Die KI arbeitet …') {
  return el('div.arbeitet', {}, [el('span.laden'), text]);
}

/** Dialog mit eigenem Inhalt; liefert die Dialog-Elemente zurück. */
export function dialog(inhalt) {
  const d = document.getElementById('dialog');
  const box = leere(document.getElementById('dialog-inhalt'));
  box.append(...[].concat(inhalt));
  if (!d.open) d.showModal();
  return { dialog: d, schliessen: () => d.close() };
}

export function dialogSchliessen() {
  const d = document.getElementById('dialog');
  if (d.open) d.close();
}

/** Bestätigungsdialog (Promise<boolean>). */
export function bestaetigen({ titel, text, knopf = 'Löschen', gefahr = true }) {
  return new Promise((resolve) => {
    const fertig = (wert) => {
      dialogSchliessen();
      resolve(wert);
    };
    dialog([
      el('h3', { text: titel }),
      el('p.leise', { text }),
      el('div.knopf-reihe', { style: 'justify-content:flex-end;margin-top:14px' }, [
        el('button.knopf', { type: 'button', text: 'Abbrechen', onclick: () => fertig(false) }),
        el(`button.knopf.${gefahr ? 'knopf-gefahr' : 'knopf-haupt'}`, {
          type: 'button',
          text: knopf,
          onclick: () => fertig(true),
        }),
      ]),
    ]);
  });
}

/** Einfache Texteingabe im Dialog (Promise<string|null>). */
export function frageText({ titel, text, vorgabe = '', knopf = 'Übernehmen', mehrzeilig = false }) {
  return new Promise((resolve) => {
    const eingabe = mehrzeilig
      ? el('textarea', { wert: vorgabe, rows: 5 })
      : el('input', { type: 'text', wert: vorgabe });
    const fertig = (wert) => {
      dialogSchliessen();
      resolve(wert);
    };
    dialog([
      el('h3', { text: titel }),
      text ? el('p.leise.klein', { text }) : null,
      el('div.feld', {}, [eingabe]),
      el('div.knopf-reihe', { style: 'justify-content:flex-end;margin-top:14px' }, [
        el('button.knopf', { type: 'button', text: 'Abbrechen', onclick: () => fertig(null) }),
        el('button.knopf.knopf-haupt', {
          type: 'button',
          text: knopf,
          onclick: () => fertig(eingabe.value.trim()),
        }),
      ]),
    ]);
    setTimeout(() => eingabe.focus(), 30);
  });
}

export function datumDeutsch(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function zeitDeutsch(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Zufällige, kurze ID für Listenpunkte. */
export function neueId() {
  return `p${Math.random().toString(36).slice(2, 9)}`;
}

/** Text in die Zwischenablage kopieren. */
export async function kopiere(text) {
  try {
    await navigator.clipboard.writeText(text);
    meldung('In die Zwischenablage kopiert.', 'erfolg');
  } catch {
    meldung('Kopieren hat nicht funktioniert. Bitte manuell markieren.', 'warnung');
  }
}
