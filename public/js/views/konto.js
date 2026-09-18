/**
 * Konto: Profil, Passwort, Datensicherung, Abmelden.
 */
import { el, leere, meldung, hinweis, zeitDeutsch, bestaetigen } from '../ui.js';
import { api } from '../api.js';
import { zustand, setzeStatus, themaLesen, themaAnwenden } from '../store.js';

export async function ansichtKonto(behaelter, _id, { nachAbmeldung }) {
  leere(behaelter);
  const b = zustand.benutzer;

  const profil = el('form.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Profil' })]),
    el('div.feld', {}, [el('label', { text: 'E-Mail-Adresse' }), el('input', { type: 'email', wert: b.email, disabled: true })]),
    el('div.feld', {}, [el('label', { text: 'Name', for: 'k-name' }), el('input', { id: 'k-name', name: 'name', type: 'text', wert: b.name || '' })]),
    el('div.feld', {}, [
      el('label', { text: 'Ausbildungsbetrieb', for: 'k-betrieb' }),
      el('input', { id: 'k-betrieb', name: 'betrieb', type: 'text', wert: b.betrieb || '' }),
    ]),
    el('div.feld', {}, [
      el('label', { text: 'Ausbildungsjahr', for: 'k-lehrjahr' }),
      el('select', { id: 'k-lehrjahr', name: 'lehrjahr' }, [1, 2, 3, 4].map((j) =>
        el('option', { value: String(j), text: j === 4 ? '4. Jahr / Geselle' : `${j}. Ausbildungsjahr`, selected: Number(b.lehrjahr) === j }),
      )),
    ]),
    el('div.knopf-reihe', { style: 'margin-top:14px' }, [
      el('button.knopf.knopf-haupt', { type: 'submit', text: 'Profil speichern' }),
    ]),
  ]);

  profil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const daten = Object.fromEntries(new FormData(profil).entries());
    try {
      const antwort = await api.profil(daten);
      setzeStatus({ benutzer: antwort.benutzer });
      meldung('Profil gespeichert. Die KI berücksichtigt das Ausbildungsjahr bei Erklärungen.', 'erfolg');
    } catch (fehler) {
      meldung(fehler.message, 'fehler');
    }
  });

  const passwort = el('form.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Passwort ändern' })]),
    el('div.feld', {}, [
      el('label', { text: 'Bisheriges Passwort', for: 'k-alt' }),
      el('input', { id: 'k-alt', name: 'alt', type: 'password', required: true, autocomplete: 'current-password' }),
    ]),
    el('div.feld', {}, [
      el('label', { text: 'Neues Passwort (mindestens 8 Zeichen)', for: 'k-neu' }),
      el('input', { id: 'k-neu', name: 'neu', type: 'password', required: true, minlength: 8, autocomplete: 'new-password' }),
    ]),
    el('div.knopf-reihe', { style: 'margin-top:14px' }, [el('button.knopf', { type: 'submit', text: 'Passwort ändern' })]),
  ]);

  passwort.addEventListener('submit', async (e) => {
    e.preventDefault();
    const daten = Object.fromEntries(new FormData(passwort).entries());
    try {
      await api.passwort(daten);
      passwort.reset();
      meldung('Passwort geändert.', 'erfolg');
    } catch (fehler) {
      meldung(fehler.message, 'fehler');
    }
  });

  const themen = ['auto', 'light', 'dark'];
  const themaNamen = { auto: 'Automatisch (wie das Gerät)', light: 'Immer hell', dark: 'Immer dunkel' };
  const design = el('section.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Darstellung' })]),
    el('div.feld', {}, [
      el('label', { text: 'Design', for: 'k-thema' }),
      el(
        'select',
        {
          id: 'k-thema',
          onchange: (e) => {
            localStorage.setItem('shk-thema', e.currentTarget.value);
            themaAnwenden(e.currentTarget.value);
            meldung('Darstellung übernommen.', 'erfolg', 1800);
          },
        },
        themen.map((t) => el('option', { value: t, text: themaNamen[t], selected: themaLesen() === t })),
      ),
    ]),
  ]);

  const daten = el('section.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Datensicherung' })]),
    el('p.klein.leise', {
      text:
        `Alle Berichte liegen im Konto auf dem Server (${zustand.speicher === 'sqlite' ? 'SQLite-Datenbank' : 'JSON-Datei'}) ` +
        'und sind nach der Anmeldung auf jedem Gerät verfügbar.',
    }),
    el('div.knopf-reihe', {}, [
      el('button.knopf', {
        type: 'button',
        text: 'Alle Berichte exportieren (JSON)',
        onclick: async (e) => {
          const knopf = e.currentTarget;
          knopf.disabled = true;
          try {
            const { berichte } = await api.berichte();
            const vollstaendig = [];
            for (const kurz of berichte) {
              const { bericht } = await api.bericht(kurz.id);
              vollstaendig.push(bericht);
            }
            const blob = new Blob([JSON.stringify({ exportiert: new Date().toISOString(), berichte: vollstaendig }, null, 2)], {
              type: 'application/json',
            });
            const verweis = document.createElement('a');
            verweis.href = URL.createObjectURL(blob);
            verweis.download = `shk-berichte-export-${new Date().toISOString().slice(0, 10)}.json`;
            verweis.click();
            URL.revokeObjectURL(verweis.href);
            meldung(`${vollstaendig.length} Berichte exportiert.`, 'erfolg');
          } catch (fehler) {
            meldung(fehler.message, 'fehler');
          } finally {
            knopf.disabled = false;
          }
        },
      }),
    ]),
  ]);

  const info = el('section.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Über die KI' })]),
    zustand.kiAktiv
      ? hinweis(
          `KI aktiv – Modell ${zustand.modell}. Der Zugang liegt auf dem Server; es muss nie ein Schlüssel eingegeben werden.`,
          'erfolg',
        )
      : hinweis(
          'Kein KI-Zugang auf dem Server hinterlegt. Die App arbeitet im Fachmodus offline: Die eingebaute ' +
            'SHK-Fachsprache-Engine schreibt Umgangssprache in Fachbegriffe um, Erklärungen kommen aus der ' +
            'lokalen Wissensbasis. Für vollständige KI-Texte in der .env den Schlüssel ANTHROPIC_API_KEY setzen.',
          'warnung',
        ),
    el('p.klein.leise', { text: `Konto angelegt am ${zeitDeutsch(b.erstellt)}` }),
  ]);

  const abmelden = el('section.karte', {}, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Abmelden' })]),
    el('div.knopf-reihe', {}, [
      el('button.knopf.knopf-gefahr', {
        type: 'button',
        text: 'Von diesem Gerät abmelden',
        onclick: async () => {
          const ja = await bestaetigen({
            titel: 'Abmelden?',
            text: 'Die Berichte bleiben gespeichert und sind nach der nächsten Anmeldung wieder da.',
            knopf: 'Abmelden',
            gefahr: false,
          });
          if (!ja) return;
          await api.abmelden();
          setzeStatus({ benutzer: null });
          nachAbmeldung();
        },
      }),
    ]),
  ]);

  behaelter.append(el('h1', { text: 'Konto' }), profil, passwort, design, daten, info, abmelden);
}
