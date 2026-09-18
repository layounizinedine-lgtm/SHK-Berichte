/**
 * Routen für die KI-Funktionen.
 * Der API-Schlüssel bleibt auf dem Server – der Klient sendet nur Text.
 */
import { json, fehler, leseBody, ratenBegrenzer } from '../http.js';
import {
  baueBerichtsheft,
  baueFachbericht,
  baueErklaerung,
  baueVertiefung,
  baueZeichnung,
  deuteBefehl,
} from '../ai/tasks.js';
import { normalisiere } from '../ai/fachsprache.js';

const kiLimit = ratenBegrenzer({ fenster: 5 * 60_000, maximum: 60 });

const MAX_TEXT = 12_000;

function text(wert, feld) {
  const t = String(wert ?? '').trim();
  if (!t) throw Object.assign(new Error(`Bitte ${feld} angeben.`), { status: 400 });
  if (t.length > MAX_TEXT) throw Object.assign(new Error('Der Text ist zu lang. Bitte in Abschnitten diktieren.'), { status: 413 });
  return t;
}

export async function kiRouten(req, res, pfad, benutzer) {
  if (!pfad.startsWith('/api/ki')) return false;
  if (!benutzer) return fehler(res, 401, 'Bitte zuerst anmelden.');
  if (req.method !== 'POST') return fehler(res, 405, 'Methode nicht erlaubt.');
  if (!kiLimit(benutzer.id)) {
    return fehler(res, 429, 'Sehr viele Anfragen in kurzer Zeit. Bitte einen Moment warten.');
  }

  const body = await leseBody(req);
  const kontext = {
    betrieb: body?.kontext?.betrieb || benutzer.betrieb,
    lehrjahr: body?.kontext?.lehrjahr || benutzer.lehrjahr,
    titel: body?.kontext?.titel,
    bereich: body?.kontext?.bereich,
    vorhandenes: body?.kontext?.vorhandenes ? String(body.kontext.vorhandenes).slice(0, 6000) : '',
  };

  try {
    switch (pfad) {
      /* Sofortige, kostenlose Vorschau der Fachsprache-Umschreibung */
      case '/api/ki/fachsprache': {
        const n = normalisiere(text(body.text, 'einen Text'));
        return json(res, 200, {
          text: n.text,
          treffer: n.treffer.map(({ roh, fach, kategorie }) => ({ roh, fach, kategorie })),
          werkzeug: n.werkzeug,
          material: n.material,
          normen: n.normen,
        });
      }

      case '/api/ki/berichtsheft':
        return json(res, 200, await baueBerichtsheft({ transkript: text(body.transkript, 'ein Diktat'), kontext }));

      case '/api/ki/fachbericht':
        return json(res, 200, await baueFachbericht({ transkript: text(body.transkript, 'ein Diktat'), kontext }));

      case '/api/ki/erklaerung':
        return json(
          res,
          200,
          await baueErklaerung({
            begriff: text(body.begriff, 'einen Begriff'),
            tiefe: Math.min(3, Math.max(1, Number(body.tiefe) || 1)),
            kontext,
          }),
        );

      case '/api/ki/vertiefung':
        return json(
          res,
          200,
          await baueVertiefung({
            begriff: String(body.begriff || '').slice(0, MAX_TEXT),
            frage: String(body.frage || '').slice(0, MAX_TEXT),
            bisher: String(body.bisher || '').slice(0, 8000),
            kontext,
          }),
        );

      case '/api/ki/zeichnung':
        return json(
          res,
          200,
          await baueZeichnung({
            beschreibung: text(body.beschreibung, 'eine Beschreibung'),
            titel: String(body.titel || '').slice(0, 200),
            kontext,
          }),
        );

      case '/api/ki/befehl':
        return json(res, 200, await deuteBefehl({ text: text(body.text, 'einen Satz'), mitKi: body.mitKi !== false }));

      default:
        return fehler(res, 404, 'Unbekannte KI-Funktion.');
    }
  } catch (err) {
    return fehler(res, err.status || 500, err.message || 'Unerwarteter Fehler.', {
      details: err.details || undefined,
    });
  }
}
