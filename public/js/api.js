/**
 * Zugriff auf die Server-Schnittstelle.
 * Der KI-Schlüssel liegt ausschließlich auf dem Server.
 */

async function anfrage(pfad, { methode = 'GET', daten } = {}) {
  const antwort = await fetch(pfad, {
    method: methode,
    headers: daten ? { 'Content-Type': 'application/json' } : undefined,
    body: daten ? JSON.stringify(daten) : undefined,
    credentials: 'same-origin',
  });

  let inhalt = null;
  try {
    inhalt = await antwort.json();
  } catch {
    inhalt = null;
  }

  if (!antwort.ok) {
    const fehler = new Error(inhalt?.fehler || `Serverfehler (${antwort.status})`);
    fehler.status = antwort.status;
    fehler.details = inhalt?.details;
    throw fehler;
  }
  return inhalt;
}

export const api = {
  status: () => anfrage('/api/status'),

  registrieren: (daten) => anfrage('/api/auth/registrieren', { methode: 'POST', daten }),
  anmelden: (daten) => anfrage('/api/auth/anmelden', { methode: 'POST', daten }),
  abmelden: () => anfrage('/api/auth/abmelden', { methode: 'POST', daten: {} }),
  profil: (daten) => anfrage('/api/auth/profil', { methode: 'PUT', daten }),
  passwort: (daten) => anfrage('/api/auth/passwort', { methode: 'POST', daten }),

  berichte: (typ) => anfrage(`/api/berichte${typ ? `?typ=${encodeURIComponent(typ)}` : ''}`),
  berichtNeu: (daten) => anfrage('/api/berichte', { methode: 'POST', daten }),
  bericht: (id) => anfrage(`/api/berichte/${encodeURIComponent(id)}`),
  berichtSpeichern: (id, daten) => anfrage(`/api/berichte/${encodeURIComponent(id)}`, { methode: 'PUT', daten }),
  berichtLoeschen: (id) => anfrage(`/api/berichte/${encodeURIComponent(id)}`, { methode: 'DELETE' }),

  wissen: (suche, bereich) => {
    const p = new URLSearchParams();
    if (suche) p.set('suche', suche);
    if (bereich) p.set('bereich', bereich);
    const q = p.toString();
    return anfrage(`/api/wissen${q ? `?${q}` : ''}`);
  },
  wissenEintrag: (id) => anfrage(`/api/wissen/${encodeURIComponent(id)}`),

  ki: {
    fachsprache: (text) => anfrage('/api/ki/fachsprache', { methode: 'POST', daten: { text } }),
    berichtsheft: (transkript, kontext) =>
      anfrage('/api/ki/berichtsheft', { methode: 'POST', daten: { transkript, kontext } }),
    fachbericht: (transkript, kontext) =>
      anfrage('/api/ki/fachbericht', { methode: 'POST', daten: { transkript, kontext } }),
    erklaerung: (begriff, tiefe, kontext) =>
      anfrage('/api/ki/erklaerung', { methode: 'POST', daten: { begriff, tiefe, kontext } }),
    vertiefung: (daten) => anfrage('/api/ki/vertiefung', { methode: 'POST', daten }),
    zeichnung: (daten) => anfrage('/api/ki/zeichnung', { methode: 'POST', daten }),
    befehl: (text) => anfrage('/api/ki/befehl', { methode: 'POST', daten: { text } }),
  },
};
