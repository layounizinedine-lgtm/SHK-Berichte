/**
 * Anmeldung und Registrierung.
 */
import { el, leere, meldung } from '../ui.js';
import { api } from '../api.js';
import { zustand, setzeStatus } from '../store.js';

export function ansichtAnmeldung(behaelter, { nachAnmeldung }) {
  leere(behaelter);
  let modus = zustand.erstesKonto || !zustand.benutzerVorhanden ? 'registrieren' : 'anmelden';
  if (zustand.registrierungGesperrt && !zustand.erstesKonto) modus = 'anmelden';

  const formular = el('form');

  const reiter = el('div.reiter', {}, [
    el('button', {
      type: 'button',
      text: 'Anmelden',
      'aria-selected': String(modus === 'anmelden'),
      onclick: () => {
        modus = 'anmelden';
        zeichne();
      },
    }),
    el('button', {
      type: 'button',
      text: 'Konto anlegen',
      'aria-selected': String(modus === 'registrieren'),
      onclick: () => {
        modus = 'registrieren';
        zeichne();
      },
    }),
  ]);

  function feld(beschriftung, attribute) {
    return el('div.feld', {}, [el('label', { text: beschriftung, for: attribute.id }), el('input', attribute)]);
  }

  function zeichne() {
    [...reiter.children].forEach((knopf, i) => {
      knopf.setAttribute('aria-selected', String((i === 0) === (modus === 'anmelden')));
    });

    leere(formular);
    formular.append(
      feld('E-Mail-Adresse', { id: 'f-email', type: 'email', name: 'email', required: true, autocomplete: 'email' }),
      feld('Passwort', {
        id: 'f-passwort',
        type: 'password',
        name: 'passwort',
        required: true,
        minlength: 8,
        autocomplete: modus === 'anmelden' ? 'current-password' : 'new-password',
      }),
    );

    if (modus === 'registrieren') {
      formular.append(
        feld('Name (optional)', { id: 'f-name', type: 'text', name: 'name', autocomplete: 'name' }),
        feld('Ausbildungsbetrieb (optional)', { id: 'f-betrieb', type: 'text', name: 'betrieb' }),
        el('div.feld', {}, [
          el('label', { text: 'Ausbildungsjahr', for: 'f-lehrjahr' }),
          el('select', { id: 'f-lehrjahr', name: 'lehrjahr' }, [
            el('option', { value: '1', text: '1. Ausbildungsjahr' }),
            el('option', { value: '2', text: '2. Ausbildungsjahr' }),
            el('option', { value: '3', text: '3. Ausbildungsjahr' }),
            el('option', { value: '4', text: '4. Ausbildungsjahr / Geselle' }),
          ]),
        ]),
        el('p.klein.leise', {
          text:
            'Das Konto dient der Datensicherung: Berichte bleiben gespeichert und sind auf jedem Gerät ' +
            'nach der Anmeldung wieder da.',
        }),
      );
    }

    formular.append(
      el('button.knopf.knopf-haupt', {
        type: 'submit',
        text: modus === 'anmelden' ? 'Anmelden' : 'Konto anlegen und starten',
        style: 'width:100%;margin-top:14px;padding:12px',
      }),
    );
  }

  formular.addEventListener('submit', async (ereignis) => {
    ereignis.preventDefault();
    const knopf = formular.querySelector('button[type=submit]');
    knopf.disabled = true;
    const daten = Object.fromEntries(new FormData(formular).entries());
    try {
      const antwort = modus === 'anmelden' ? await api.anmelden(daten) : await api.registrieren(daten);
      setzeStatus({ benutzer: antwort.benutzer });
      meldung(`Willkommen${antwort.benutzer.name ? `, ${antwort.benutzer.name}` : ''}!`, 'erfolg');
      nachAnmeldung();
    } catch (fehler) {
      meldung(fehler.message, 'fehler', 6000);
      knopf.disabled = false;
    }
  });

  zeichne();

  behaelter.append(
    el('div.start', {}, [
      el('div.start-logo', {}, [
        el('div.marke-zeichen', { text: '⚒', style: 'width:54px;height:54px;font-size:26px;margin:0 auto 12px' }),
        el('h1', { text: 'SHK-Berichte' }),
        el('p.leise', {
          text: 'Berichtsheft und Fachbericht einfach einsprechen – die KI schreibt es in Fachsprache.',
        }),
      ]),
      el('div.karte', {}, [zustand.registrierungGesperrt && !zustand.erstesKonto ? null : reiter, formular]),
      el('p.klein.leise', { style: 'text-align:center;margin-top:14px' }, [
        zustand.kiAktiv
          ? 'KI-Fachsprache ist auf diesem Server aktiv – es muss kein Schlüssel eingegeben werden.'
          : 'Hinweis: Auf diesem Server ist noch kein KI-Zugang hinterlegt. Die App läuft im Fachmodus offline.',
      ]),
    ]),
  );
}
