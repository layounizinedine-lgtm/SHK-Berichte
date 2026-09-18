/**
 * Spracherkennung (Diktat) über die Web-Speech-Schnittstelle des Browsers.
 * Läuft ohne zusätzliche Dienste. Wird sie nicht unterstützt,
 * bleibt das Textfeld als gleichwertiger Weg.
 */

const Erkenner = window.SpeechRecognition || window.webkitSpeechRecognition;

export const spracheVerfuegbar = Boolean(Erkenner);

export class Diktat {
  /**
   * @param {object} optionen
   * @param {(text:string)=>void} optionen.beiSatz     abgeschlossener Satz
   * @param {(text:string)=>void} [optionen.beiZwischen] vorläufiger Text
   * @param {(aktiv:boolean)=>void} [optionen.beiStatus]
   * @param {(nachricht:string)=>void} [optionen.beiFehler]
   */
  constructor({ beiSatz, beiZwischen, beiStatus, beiFehler } = {}) {
    this.beiSatz = beiSatz || (() => {});
    this.beiZwischen = beiZwischen || (() => {});
    this.beiStatus = beiStatus || (() => {});
    this.beiFehler = beiFehler || (() => {});
    this.laeuft = false;
    this.sollLaufen = false;
    this.erkenner = null;
  }

  erzeuge() {
    const r = new Erkenner();
    r.lang = 'de-DE';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (ereignis) => {
      let zwischen = '';
      for (let i = ereignis.resultIndex; i < ereignis.results.length; i += 1) {
        const ergebnis = ereignis.results[i];
        const text = (ergebnis[0]?.transcript || '').trim();
        if (!text) continue;
        if (ergebnis.isFinal) {
          this.beiSatz(text);
        } else {
          zwischen += `${text} `;
        }
      }
      this.beiZwischen(zwischen.trim());
    };

    r.onerror = (ereignis) => {
      const art = ereignis.error;
      if (art === 'no-speech' || art === 'aborted') return;
      if (art === 'not-allowed' || art === 'service-not-allowed') {
        this.sollLaufen = false;
        this.beiFehler(
          'Kein Zugriff auf das Mikrofon. Bitte im Browser die Mikrofon-Freigabe für diese Seite erlauben.',
        );
        return;
      }
      if (art === 'network') {
        this.beiFehler('Die Spracherkennung braucht eine Internetverbindung.');
        return;
      }
      this.beiFehler(`Spracherkennung gestört (${art}).`);
    };

    r.onend = () => {
      this.laeuft = false;
      if (this.sollLaufen) {
        // Browser beenden nach Sprechpausen automatisch – neu starten
        setTimeout(() => {
          if (this.sollLaufen) this.starteIntern();
        }, 250);
      } else {
        this.beiStatus(false);
      }
    };

    r.onstart = () => {
      this.laeuft = true;
      this.beiStatus(true);
    };

    return r;
  }

  starteIntern() {
    try {
      if (!this.erkenner) this.erkenner = this.erzeuge();
      this.erkenner.start();
    } catch {
      /* start() wirft, wenn bereits gestartet – unkritisch */
    }
  }

  start() {
    if (!spracheVerfuegbar) {
      this.beiFehler(
        'Dieser Browser kann noch nicht zuhören. In Chrome, Edge oder Safari funktioniert das Diktat – ' +
          'oder einfach ins Textfeld tippen.',
      );
      return;
    }
    this.sollLaufen = true;
    this.starteIntern();
  }

  stopp() {
    this.sollLaufen = false;
    try {
      this.erkenner?.stop();
    } catch {
      /* ignorieren */
    }
    this.beiStatus(false);
  }

  umschalten() {
    if (this.sollLaufen) this.stopp();
    else this.start();
  }
}

/* ------------------------------------------------------------------ Vorlesen */

export function vorlesen(text) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const aeusserung = new SpeechSynthesisUtterance(String(text).slice(0, 6000));
  aeusserung.lang = 'de-DE';
  aeusserung.rate = 1;
  window.speechSynthesis.speak(aeusserung);
  return true;
}

export function vorlesenStopp() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
