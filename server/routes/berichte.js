/**
 * Routen für Berichte (Berichtsheft, Fachbericht, Erklärungen).
 * Alle Daten sind streng an das Benutzerkonto gebunden.
 */
import { db } from '../db.js';
import { json, fehler, leseBody } from '../http.js';

const TYPEN = new Set(['berichtsheft', 'fachbericht', 'erklaerung']);
const MAX_DATEN = 900_000; // Zeichen im JSON-Feld

function pruefeDaten(daten) {
  const text = JSON.stringify(daten ?? {});
  if (text.length > MAX_DATEN) {
    throw Object.assign(new Error('Der Bericht ist zu groß zum Speichern.'), { status: 413 });
  }
  return JSON.parse(text);
}

export async function berichtRouten(req, res, pfad, benutzer) {
  if (!pfad.startsWith('/api/berichte')) return false;
  if (!benutzer) return fehler(res, 401, 'Bitte zuerst anmelden.');

  const rest = pfad.slice('/api/berichte'.length).replace(/^\//, '');
  const url = new URL(req.url, 'http://localhost');

  /* Liste */
  if (!rest && req.method === 'GET') {
    const typ = url.searchParams.get('typ') || undefined;
    if (typ && !TYPEN.has(typ)) return fehler(res, 400, 'Unbekannter Berichtstyp.');
    return json(res, 200, { berichte: db.berichteListe(benutzer.id, typ) });
  }

  /* Neu anlegen */
  if (!rest && req.method === 'POST') {
    const body = await leseBody(req);
    if (!TYPEN.has(body.typ)) return fehler(res, 400, 'Unbekannter Berichtstyp.');
    try {
      const bericht = db.berichtAnlegen(benutzer.id, {
        typ: body.typ,
        titel: String(body.titel || '').slice(0, 200),
        daten: pruefeDaten(body.daten),
      });
      return json(res, 201, { bericht });
    } catch (err) {
      return fehler(res, err.status || 400, err.message);
    }
  }

  const id = rest.split('/')[0];
  if (!id) return fehler(res, 404, 'Bericht nicht gefunden.');

  /* Einzelbericht lesen */
  if (req.method === 'GET') {
    const bericht = db.berichtLesen(id, benutzer.id);
    if (!bericht) return fehler(res, 404, 'Bericht nicht gefunden.');
    return json(res, 200, { bericht });
  }

  /* Speichern */
  if (req.method === 'PUT') {
    const body = await leseBody(req);
    try {
      const bericht = db.berichtSpeichern(id, benutzer.id, {
        titel: String(body.titel || '').slice(0, 200),
        daten: pruefeDaten(body.daten),
      });
      if (!bericht) return fehler(res, 404, 'Bericht nicht gefunden.');
      return json(res, 200, { bericht });
    } catch (err) {
      return fehler(res, err.status || 400, err.message);
    }
  }

  /* Löschen */
  if (req.method === 'DELETE') {
    const ok = db.berichtLoeschen(id, benutzer.id);
    if (!ok) return fehler(res, 404, 'Bericht nicht gefunden.');
    return json(res, 200, { ok: true });
  }

  return fehler(res, 405, 'Methode nicht erlaubt.');
}
