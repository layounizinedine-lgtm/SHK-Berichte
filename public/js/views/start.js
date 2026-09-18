/**
 * Startseite: Auswahl der Bereiche und Liste der gespeicherten Berichte.
 */
import { el, leere, meldung, zeitDeutsch, bestaetigen, ladeAnzeige } from '../ui.js';
import { api } from '../api.js';
import { zustand } from '../store.js';

const TYP_NAME = {
  berichtsheft: 'Berichtsheft',
  fachbericht: 'Fachbericht',
  erklaerung: 'Erklärung',
};

const TYP_PFAD = {
  berichtsheft: '#/berichtsheft/',
  fachbericht: '#/fachbericht/',
  erklaerung: '#/wissen/',
};

export async function ansichtStart(behaelter) {
  leere(behaelter);

  const vorname = (zustand.benutzer?.name || '').split(' ')[0];

  behaelter.append(
    el('div', { style: 'margin-bottom:18px' }, [
      el('h1', { text: vorname ? `Moin ${vorname}!` : 'Moin!' }),
      el('p.leise', {
        text: zustand.kiAktiv
          ? 'Sprich einfach, wie du auf der Baustelle sprichst – die KI macht daraus einen Fachtext.'
          : 'Fachmodus offline: Die eingebaute Fachsprache-Engine schreibt um. Für KI-Texte einen Serverschlüssel hinterlegen.',
      }),
    ]),
  );

  behaelter.append(
    el('div.raster.raster-3', {}, [
      kachel({
        pfad: '#/berichtsheft/neu',
        zeichen: '📋',
        titel: 'Berichtsheft',
        text: 'Wochenbericht einsprechen. Die KI ordnet die Tage zu und formuliert in Fachsprache.',
      }),
      kachel({
        pfad: '#/fachbericht/neu',
        zeichen: '🧰',
        titel: 'Fachbericht',
        klasse: 'kachel-kupfer',
        text: 'Arbeitsschritte, Materialliste, Werkzeugliste, Erklärungen und Zeichnung – aus einem Diktat.',
      }),
      kachel({
        pfad: '#/wissen/neu',
        zeichen: '💡',
        titel: 'Erklären lassen',
        klasse: 'kachel-gruen',
        text: '„Erkläre einen Druckminderer“ – mit Rückfragen so tief, wie du willst.',
      }),
    ]),
  );

  const listenBereich = el('section.karte', { style: 'margin-top:20px' }, [
    el('div.karte-kopf', {}, [el('h2', { text: 'Meine Berichte' })]),
    ladeAnzeige('Berichte werden geladen …'),
  ]);
  behaelter.append(listenBereich);

  try {
    const { berichte } = await api.berichte();
    zeichneListe(listenBereich, berichte);
  } catch (fehler) {
    leere(listenBereich).append(el('p.leise', { text: fehler.message }));
  }
}

function kachel({ pfad, zeichen, titel, text, klasse = '' }) {
  return el(`a.kachel.${klasse}`.replace(/\.$/, ''), { href: pfad }, [
    el('div.kachel-zeichen', { text: zeichen, 'aria-hidden': 'true' }),
    el('h3', { text: titel }),
    el('p.klein.leise', { text, style: 'margin:0' }),
  ]);
}

function zeichneListe(bereich, berichte) {
  leere(bereich);
  bereich.append(
    el('div.karte-kopf', {}, [
      el('h2', { text: 'Meine Berichte' }),
      el('div.rechts', {}, [el('span.klein.leise', { text: `${berichte.length} gespeichert` })]),
    ]),
  );

  if (!berichte.length) {
    bereich.append(
      el('div.leer', {}, [
        el('div.leer-zeichen', { text: '🗂', 'aria-hidden': 'true' }),
        el('p', { text: 'Noch keine Berichte. Oben einen Bereich wählen und losreden.' }),
      ]),
    );
    return;
  }

  const liste = el('div');
  for (const bericht of berichte) {
    const zeile = el('div.liste-zeile', {}, [
      el('span.chip', { text: TYP_NAME[bericht.typ] || bericht.typ }),
      el('div', { style: 'flex:1;min-width:0' }, [
        el('a.titel', {
          href: `${TYP_PFAD[bericht.typ] || '#/'}${bericht.id}`,
          text: bericht.titel || 'Ohne Titel',
        }),
        el('div.klein.leise', { text: `geändert ${zeitDeutsch(bericht.geaendert)}` }),
      ]),
      el('button.knopf.knopf-klein.knopf-leer', {
        type: 'button',
        text: '🗑',
        title: 'Bericht löschen',
        onclick: async () => {
          const ja = await bestaetigen({
            titel: 'Bericht löschen?',
            text: `„${bericht.titel || 'Ohne Titel'}“ wird endgültig gelöscht.`,
          });
          if (!ja) return;
          try {
            await api.berichtLoeschen(bericht.id);
            zeile.remove();
            meldung('Bericht gelöscht.', 'erfolg');
          } catch (fehler) {
            meldung(fehler.message, 'fehler');
          }
        },
      }),
    ]);
    liste.append(zeile);
  }
  bereich.append(liste);
}
