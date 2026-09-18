/**
 * SHK-Berichte – Start und Navigation.
 */
import { el, leere, meldung, hinweis } from './ui.js';
import { api } from './api.js';
import { zustand, setzeStatus, themaAnwenden, themaUmschalten } from './store.js';
import { setzeErklaerHandler, starteAuswahlErkennung } from './components.js';
import { ansichtAnmeldung } from './views/auth.js';
import { ansichtStart } from './views/start.js';
import { ansichtBerichtsheft } from './views/berichtsheft.js';
import { ansichtFachbericht } from './views/fachbericht.js';
import { ansichtWissen } from './views/wissen.js';
import { ansichtKonto } from './views/konto.js';

const app = document.getElementById('app');

const NAV = [
  { pfad: '#/', text: 'Start' },
  { pfad: '#/berichtsheft/neu', text: 'Berichtsheft' },
  { pfad: '#/fachbericht/neu', text: 'Fachbericht' },
  { pfad: '#/wissen/neu', text: 'Erklären' },
];

function zeichneNav() {
  const nav = document.getElementById('haupt-nav');
  leere(nav);
  if (!zustand.benutzer) return;
  const aktuell = location.hash || '#/';
  for (const punkt of NAV) {
    const aktiv = aktuell === punkt.pfad || (punkt.pfad !== '#/' && aktuell.startsWith(punkt.pfad.replace('/neu', '')));
    nav.append(el('a', { href: punkt.pfad, text: punkt.text, 'aria-current': aktiv ? 'page' : undefined }));
  }
}

function zeigeLaden(text = 'Einen Moment …') {
  leere(app).append(el('div.arbeitet', {}, [el('span.laden'), text]));
}

async function route() {
  setzeErklaerHandler(null);
  document.getElementById('erklaer-blase').style.display = 'none';
  zeichneNav();

  const kontoKnopf = document.getElementById('konto-knopf');
  kontoKnopf.textContent = zustand.benutzer
    ? zustand.benutzer.name?.trim().split(' ')[0] || 'Konto'
    : 'Konto';

  if (!zustand.benutzer) {
    ansichtAnmeldung(app, { nachAnmeldung: () => navigiere('#/') });
    return;
  }

  const teile = (location.hash || '#/').replace(/^#\/?/, '').split('/');
  const bereich = teile[0] || '';
  const id = teile[1] || '';

  try {
    switch (bereich) {
      case '':
        await ansichtStart(app);
        break;
      case 'berichtsheft':
        await ansichtBerichtsheft(app, id || 'neu');
        break;
      case 'fachbericht':
        await ansichtFachbericht(app, id || 'neu');
        break;
      case 'wissen':
        await ansichtWissen(app, id || 'neu');
        break;
      case 'konto':
        await ansichtKonto(app, id, { nachAbmeldung: () => navigiere('#/') });
        break;
      default:
        leere(app).append(
          hinweis('Diese Seite gibt es nicht.', 'warnung'),
          el('div.knopf-reihe', { style: 'margin-top:12px' }, [
            el('a.knopf.knopf-haupt', { href: '#/', text: 'Zur Startseite' }),
          ]),
        );
    }
  } catch (fehler) {
    console.error(fehler);
    leere(app).append(hinweis(fehler.message || 'Unerwarteter Fehler.', 'fehler'));
  }

  window.scrollTo({ top: 0 });
}

function navigiere(pfad) {
  if (location.hash === pfad) route();
  else location.hash = pfad;
}

async function starte() {
  themaAnwenden();
  starteAuswahlErkennung();

  document.getElementById('thema-schalter').addEventListener('click', () => themaUmschalten());
  document.getElementById('konto-knopf').addEventListener('click', () => {
    if (zustand.benutzer) navigiere('#/konto');
    else navigiere('#/');
  });

  window.addEventListener('hashchange', route);

  zeigeLaden('App wird geladen …');
  try {
    const status = await api.status();
    setzeStatus(status);
  } catch (fehler) {
    leere(app).append(hinweis(`Server nicht erreichbar: ${fehler.message}`, 'fehler'));
    return;
  }

  await route();

  if (!zustand.kiAktiv && zustand.benutzer) {
    meldung('Fachmodus offline aktiv – für vollständige KI-Texte einen Serverschlüssel hinterlegen.', 'warnung', 7000);
  }
}

starte();
