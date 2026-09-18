/**
 * Routen für die Fachdatenbank (Nachschlagewerk).
 * Nur lesend – die Datenbank ist Teil der Anwendung.
 */
import { json, fehler } from '../http.js';
import {
  WISSENSBASIS,
  WISSEN_NACH_ID,
  BEREICHE,
  sucheWissen,
  uebersicht,
  vollstaendig,
  statistik,
} from '../ai/wissen/index.js';

export async function wissenRouten(req, res, pfad, benutzer) {
  if (!pfad.startsWith('/api/wissen')) return false;
  if (!benutzer) return fehler(res, 401, 'Bitte zuerst anmelden.');
  if (req.method !== 'GET') return fehler(res, 405, 'Methode nicht erlaubt.');

  const url = new URL(req.url, 'http://localhost');
  const rest = pfad.slice('/api/wissen'.length).replace(/^\//, '');

  /* Einzelner Eintrag */
  if (rest) {
    const eintrag = WISSEN_NACH_ID.get(rest);
    if (!eintrag) return fehler(res, 404, 'Zu diesem Begriff gibt es keinen Eintrag.');
    return json(res, 200, { eintrag: vollstaendig(eintrag) });
  }

  /* Liste bzw. Suche */
  const suche = (url.searchParams.get('suche') || '').trim();
  const bereich = url.searchParams.get('bereich') || undefined;
  const grenze = Math.min(300, Math.max(1, Number(url.searchParams.get('grenze')) || 300));

  if (bereich && !BEREICHE[bereich]) return fehler(res, 400, 'Unbekannter Fachbereich.');

  let eintraege;
  if (suche) {
    // Bei einer Suche nur die besten Treffer zeigen, nicht die halbe Datenbank.
    eintraege = sucheWissen(suche, { grenze: Math.min(grenze, 25), bereich }).map((t) => ({
      ...uebersicht(t.eintrag),
      punkte: t.punkte,
    }));
  } else {
    eintraege = WISSENSBASIS.filter((e) => !bereich || e.bereich === bereich)
      .slice()
      .sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
      .slice(0, grenze)
      .map(uebersicht);
  }

  return json(res, 200, {
    eintraege,
    bereiche: BEREICHE,
    statistik: statistik(),
    gefiltert: Boolean(suche || bereich),
  });
}
