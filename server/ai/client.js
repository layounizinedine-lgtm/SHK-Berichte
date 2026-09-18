/**
 * Anbindung an die Claude-API (ohne Fremdbibliothek, nur fetch).
 * Der Schlüssel liegt ausschließlich auf dem Server – die App fragt ihn
 * niemals beim Benutzer ab.
 */
import { CONFIG, KI_AKTIV } from '../config.js';

const API_VERSION = '2023-06-01';
const TIMEOUT_MS = 90_000;

export class KIFehler extends Error {
  constructor(nachricht, status = 502, details = '') {
    super(nachricht);
    this.status = status;
    this.details = details;
  }
}

async function anfrage(koerper, versuch = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${CONFIG.apiBasis}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': CONFIG.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(koerper),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Überlast/Ratenlimit: einmal mit Wartezeit wiederholen
      if ((res.status === 429 || res.status >= 500) && versuch < 2) {
        await new Promise((r) => setTimeout(r, 1200 * (versuch + 1)));
        return anfrage(koerper, versuch + 1);
      }
      if (res.status === 401 || res.status === 403) {
        throw new KIFehler('Der KI-Zugang ist nicht gültig. Bitte den Serverschlüssel prüfen.', 502, text);
      }
      if (res.status === 429) {
        throw new KIFehler('Die KI ist gerade überlastet. Bitte in einem Moment erneut versuchen.', 503, text);
      }
      throw new KIFehler('Die KI konnte die Anfrage nicht verarbeiten.', 502, text.slice(0, 500));
    }
    return res.json();
  } catch (err) {
    if (err instanceof KIFehler) throw err;
    if (err.name === 'AbortError') {
      throw new KIFehler('Die KI hat zu lange gebraucht. Bitte kürzer diktieren und erneut versuchen.', 504);
    }
    throw new KIFehler('Keine Verbindung zur KI möglich.', 502, String(err.message || err));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strukturierte Antwort über einen erzwungenen Werkzeugaufruf.
 * Dadurch kommt garantiert gültiges JSON im gewünschten Schema zurück.
 */
export async function jsonAnfrage({ system, prompt, schema, name = 'antwort', maxTokens = 4000, temperatur = 0.2 }) {
  if (!KI_AKTIV) throw new KIFehler('KI ist nicht konfiguriert.', 503);
  const antwort = await anfrage({
    model: CONFIG.modell,
    max_tokens: maxTokens,
    temperature: temperatur,
    system,
    messages: [{ role: 'user', content: prompt }],
    tools: [
      {
        name,
        description: 'Ergebnis strukturiert zurückgeben.',
        input_schema: schema,
      },
    ],
    tool_choice: { type: 'tool', name },
  });

  const block = (antwort.content || []).find((c) => c.type === 'tool_use');
  if (!block) throw new KIFehler('Die KI hat kein verwertbares Ergebnis geliefert.', 502);
  return block.input;
}

/** Freier Text (für Vertiefungen und Erklärungen). */
export async function textAnfrage({ system, prompt, maxTokens = 2500, temperatur = 0.3 }) {
  if (!KI_AKTIV) throw new KIFehler('KI ist nicht konfiguriert.', 503);
  const antwort = await anfrage({
    model: CONFIG.modell,
    max_tokens: maxTokens,
    temperature: temperatur,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return (antwort.content || [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n')
    .trim();
}

export { KI_AKTIV };
