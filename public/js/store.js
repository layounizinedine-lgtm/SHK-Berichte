/**
 * Anwendungszustand und Design-Umschaltung (hell/dunkel).
 */

const THEMA_SCHLUESSEL = 'shk-thema';

export const zustand = {
  benutzer: null,
  kiAktiv: false,
  modell: null,
  speicher: '',
  registrierungGesperrt: false,
  erstesKonto: false,
};

export function setzeStatus(daten) {
  Object.assign(zustand, daten);
}

/* ------------------------------------------------------------------ Design */

export function themaLesen() {
  return localStorage.getItem(THEMA_SCHLUESSEL) || 'auto';
}

export function themaAnwenden(thema = themaLesen()) {
  const wurzel = document.documentElement;
  if (thema === 'auto') wurzel.removeAttribute('data-theme');
  else wurzel.setAttribute('data-theme', thema);

  const zeichen = document.getElementById('thema-zeichen');
  const text = document.getElementById('thema-text');
  if (zeichen) zeichen.textContent = thema === 'dark' ? '☾' : thema === 'light' ? '☀' : '◐';
  if (text) text.textContent = thema === 'dark' ? 'Dunkel' : thema === 'light' ? 'Hell' : 'Automatisch';
}

export function themaUmschalten() {
  const reihenfolge = ['auto', 'light', 'dark'];
  const jetzt = themaLesen();
  const naechstes = reihenfolge[(reihenfolge.indexOf(jetzt) + 1) % reihenfolge.length];
  localStorage.setItem(THEMA_SCHLUESSEL, naechstes);
  themaAnwenden(naechstes);
  return naechstes;
}
