/**
 * SVG-Werkzeuge
 * ---------------------------------------------------------------------------
 * 1. saeubereSvg(): härtet von der KI geliefertes SVG-Markup ab
 *    (nur erlaubte Elemente/Attribute, keine Skripte, keine externen Verweise).
 * 2. schemaZeichnung(): erzeugt ohne KI eine einfache Prinzipskizze
 *    aus erkannten Bauteilen (Fachmodus offline).
 */

const ERLAUBTE_ELEMENTE = new Set([
  'svg', 'g', 'defs', 'title', 'desc',
  'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'path',
  'text', 'tspan',
]);

const ERLAUBTE_ATTRIBUTE = new Set([
  'viewbox', 'xmlns', 'class', 'id', 'transform', 'opacity',
  'd', 'points', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'dx', 'dy',
  'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
  'fill', 'fill-opacity', 'fill-rule',
  'font-size', 'font-family', 'font-weight', 'font-style',
  'text-anchor', 'dominant-baseline', 'letter-spacing',
]);

const BOESE_WERTE = /(javascript:|data:text\/html|expression\(|url\s*\(|<\s*script)/i;

// SVG-Attribute mit vorgeschriebener Schreibweise (Rest ist klein geschrieben).
const SCHREIBWEISE = { viewbox: 'viewBox' };

function attributeLesen(roh) {
  const out = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let m;
  while ((m = re.exec(roh))) {
    const name = m[1].toLowerCase();
    const wert = m[3] ?? m[4] ?? m[5] ?? '';
    out.push([name, wert]);
  }
  return out;
}

/**
 * Säubert SVG-Markup. Liefert null, wenn nichts Brauchbares übrig bleibt.
 */
export function saeubereSvg(roh) {
  if (typeof roh !== 'string' || !roh.trim()) return null;
  let markup = roh.trim();

  // Codefences und XML-Deklaration entfernen
  markup = markup
    .replace(/^```(?:svg|xml|html)?/i, '')
    .replace(/```$/i, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const start = markup.search(/<svg[\s>]/i);
  if (start < 0) return null;
  const ende = markup.toLowerCase().lastIndexOf('</svg>');
  markup = ende > start ? markup.slice(start, ende + 6) : markup.slice(start);

  let ergebnis = '';
  let pos = 0;
  let wurzelGesehen = false;
  const tiefe = [];
  // Verbotene Elemente werden samt Inhalt verworfen (z. B. <script>).
  let ueberspringen = null;
  let ueberspringTiefe = 0;

  while (pos < markup.length) {
    const auf = markup.indexOf('<', pos);
    if (auf < 0) {
      if (!ueberspringen) ergebnis += markup.slice(pos).replace(/[<>]/g, '');
      break;
    }
    // Text vor dem Tag
    if (!ueberspringen) ergebnis += markup.slice(pos, auf).replace(/[<>]/g, '');

    const zu = markup.indexOf('>', auf);
    if (zu < 0) break;
    const inhalt = markup.slice(auf + 1, zu).trim();
    pos = zu + 1;

    if (!inhalt || inhalt.startsWith('!') || inhalt.startsWith('?')) continue;

    /* ----------------------------------------------- schließendes Tag */
    if (inhalt.startsWith('/')) {
      const name = inhalt.slice(1).trim().toLowerCase();
      if (ueberspringen) {
        if (name === ueberspringen) {
          ueberspringTiefe -= 1;
          if (ueberspringTiefe <= 0) ueberspringen = null;
        }
        continue;
      }
      if (ERLAUBTE_ELEMENTE.has(name) && tiefe[tiefe.length - 1] === name) {
        tiefe.pop();
        ergebnis += `</${name}>`;
      }
      continue;
    }

    /* ----------------------------------------------- öffnendes Tag */
    const selbstschliessend = inhalt.endsWith('/');
    const kern = selbstschliessend ? inhalt.slice(0, -1).trim() : inhalt;
    const name = (kern.match(/^[a-zA-Z_:][-a-zA-Z0-9_:.]*/) || [''])[0].toLowerCase();

    if (ueberspringen) {
      if (name === ueberspringen && !selbstschliessend) ueberspringTiefe += 1;
      continue;
    }

    if (!ERLAUBTE_ELEMENTE.has(name)) {
      if (!selbstschliessend && name) {
        ueberspringen = name;
        ueberspringTiefe = 1;
      }
      continue;
    }
    if (name === 'svg') {
      if (wurzelGesehen) continue;
      wurzelGesehen = true;
    }

    const attrRoh = kern.slice(name.length);
    const attribute = [];
    let hatViewBox = false;
    for (const [an, av] of attributeLesen(attrRoh)) {
      if (an.startsWith('on')) continue;
      if (an === 'style') continue;
      if (an === 'href' || an.endsWith(':href') || an === 'src') continue;
      if (!ERLAUBTE_ATTRIBUTE.has(an)) continue;
      if (BOESE_WERTE.test(av)) continue;
      if (name === 'svg' && (an === 'width' || an === 'height')) continue; // responsiv halten
      if (an === 'viewbox') hatViewBox = true;
      attribute.push(`${SCHREIBWEISE[an] || an}="${av.replace(/"/g, '&quot;')}"`);
    }

    if (name === 'svg') {
      if (!hatViewBox) attribute.push('viewBox="0 0 900 460"');
      attribute.push('xmlns="http://www.w3.org/2000/svg"');
      attribute.push('class="zeichnung-svg"');
    }

    const attrText = attribute.length ? ` ${attribute.join(' ')}` : '';
    if (selbstschliessend) {
      ergebnis += `<${name}${attrText} />`;
    } else {
      tiefe.push(name);
      ergebnis += `<${name}${attrText}>`;
    }
  }

  while (tiefe.length) ergebnis += `</${tiefe.pop()}>`;
  if (!wurzelGesehen) return null;
  if (!/<(line|rect|circle|path|polyline|polygon|ellipse|text)/i.test(ergebnis)) return null;
  return ergebnis;
}

/* -------------------------------------------------------------------------- */
/* Offline-Prinzipskizze                                                      */
/* -------------------------------------------------------------------------- */

/** Bauteilerkennung für die Offline-Skizze (Reihenfolge = Einbaureihenfolge). */
const BAUTEIL_MUSTER = [
  { re: /hausanschluss|hauptabsperr|hae\b|übergabestelle/i, name: 'Hausanschluss', symbol: 'ventil' },
  { re: /absperr|kugelhahn|kugelventil|hahn/i, name: 'Absperrventil', symbol: 'ventil' },
  { re: /filter|schmutzfänger|schlammfänger/i, name: 'Filter', symbol: 'filter' },
  { re: /wasserzähler|wasseruhr|zähler/i, name: 'Wasserzähler', symbol: 'zaehler' },
  { re: /rückflussverhinderer|rückschlag/i, name: 'Rückflussverhinderer', symbol: 'rv' },
  { re: /systemtrenner/i, name: 'Systemtrenner BA', symbol: 'kasten' },
  { re: /druckminderer|druckreduzier/i, name: 'Druckminderer', symbol: 'minderer' },
  { re: /enthärt|weichwasser/i, name: 'Enthärtungsanlage', symbol: 'kasten' },
  { re: /speicher|trinkwassererwärmer|boiler/i, name: 'Trinkwassererwärmer', symbol: 'speicher' },
  { re: /frischwasserstation/i, name: 'Frischwasserstation', symbol: 'kasten' },
  { re: /wärmepumpe/i, name: 'Wärmepumpe', symbol: 'kasten' },
  { re: /brennwert|kessel|therme/i, name: 'Wärmeerzeuger', symbol: 'kessel' },
  { re: /ausdehnungsgefäß|\bmag\b/i, name: 'Ausdehnungsgefäß', symbol: 'mag' },
  { re: /sicherheitsventil|\bsv\b/i, name: 'Sicherheitsventil', symbol: 'sv' },
  { re: /pumpe|umwälz|zirkulation/i, name: 'Pumpe', symbol: 'pumpe' },
  { re: /mischer|dreiwege/i, name: 'Mischer', symbol: 'ventil' },
  { re: /verteiler|heizkreis/i, name: 'Heizkreisverteiler', symbol: 'verteiler' },
  { re: /heizkörper|radiator/i, name: 'Heizkörper', symbol: 'heizkoerper' },
  { re: /fußbodenheizung|flächenheizung/i, name: 'Fußbodenheizung', symbol: 'fbh' },
  { re: /entnahmestelle|zapfstelle|armatur|waschtisch|dusche/i, name: 'Entnahmestelle', symbol: 'entnahme' },
  { re: /fallleitung|fall-leitung/i, name: 'Fallleitung', symbol: 'rohr' },
  { re: /sammelleitung|grundleitung/i, name: 'Sammelleitung', symbol: 'rohr' },
  { re: /hebeanlage/i, name: 'Hebeanlage', symbol: 'kasten' },
  { re: /geruchsverschluss|siphon/i, name: 'Geruchsverschluss', symbol: 'siphon' },
  { re: /kanal|öffentliche entwässerung/i, name: 'Kanalanschluss', symbol: 'rohr' },
];

function symbolZeichnen(art, x, y, b, h) {
  const mx = x + b / 2;
  const my = y + h / 2;
  switch (art) {
    case 'ventil':
      return `<polygon points="${x + 8},${y + 8} ${x + 8},${y + h - 8} ${mx},${my}" />
              <polygon points="${x + b - 8},${y + 8} ${x + b - 8},${y + h - 8} ${mx},${my}" />`;
    case 'rv':
      return `<polygon points="${x + 10},${y + 8} ${x + 10},${y + h - 8} ${x + b - 14},${my}" />
              <line x1="${x + b - 12}" y1="${y + 8}" x2="${x + b - 12}" y2="${y + h - 8}" />`;
    case 'filter':
      return `<rect x="${x + 10}" y="${y + 8}" width="${b - 20}" height="${h - 16}" />
              <line x1="${x + 10}" y1="${y + 8}" x2="${x + b - 10}" y2="${y + h - 8}" stroke-dasharray="3 3" />`;
    case 'zaehler':
      return `<circle cx="${mx}" cy="${my}" r="${Math.min(b, h) / 2 - 8}" />
              <line x1="${mx}" y1="${my}" x2="${mx + 8}" y2="${my - 8}" />`;
    case 'minderer':
      return `<rect x="${x + 10}" y="${y + 12}" width="${b - 20}" height="${h - 24}" />
              <line x1="${mx}" y1="${y + 12}" x2="${mx}" y2="${y - 2}" />
              <polyline points="${mx - 8},${y - 2} ${mx + 8},${y - 2} ${mx + 8},${y - 8} ${mx - 8},${y - 8} ${mx - 8},${y - 2}" />`;
    case 'pumpe':
      return `<circle cx="${mx}" cy="${my}" r="${Math.min(b, h) / 2 - 8}" />
              <polygon points="${mx - 6},${my - 8} ${mx - 6},${my + 8} ${mx + 9},${my}" />`;
    case 'speicher':
      return `<rect x="${x + 12}" y="${y + 6}" width="${b - 24}" height="${h - 12}" rx="8" />
              <path d="M ${x + 20} ${my + 10} q 10 -14 20 0 q 10 14 20 0" />`;
    case 'kessel':
      return `<rect x="${x + 10}" y="${y + 6}" width="${b - 20}" height="${h - 12}" rx="4" />
              <polyline points="${mx - 8},${my + 10} ${mx},${my - 4} ${mx + 8},${my + 10}" />`;
    case 'mag':
      return `<ellipse cx="${mx}" cy="${my}" rx="${b / 2 - 12}" ry="${h / 2 - 8}" />
              <line x1="${x + 12}" y1="${my}" x2="${x + b - 12}" y2="${my}" stroke-dasharray="4 3" />`;
    case 'sv':
      return `<polygon points="${x + 12},${my} ${mx},${y + 10} ${x + b - 12},${my}" />
              <line x1="${mx}" y1="${y + 10}" x2="${mx}" y2="${y - 6}" />`;
    case 'verteiler':
      return `<rect x="${x + 8}" y="${my - 8}" width="${b - 16}" height="16" />
              ${[0, 1, 2, 3]
                .map((i) => `<line x1="${x + 18 + i * 16}" y1="${my + 8}" x2="${x + 18 + i * 16}" y2="${y + h - 4}" />`)
                .join('')}`;
    case 'heizkoerper':
      return `<rect x="${x + 10}" y="${y + 8}" width="${b - 20}" height="${h - 16}" />
              ${[0, 1, 2, 3]
                .map((i) => `<line x1="${x + 18 + i * 14}" y1="${y + 8}" x2="${x + 18 + i * 14}" y2="${y + h - 8}" />`)
                .join('')}`;
    case 'fbh':
      return `<path d="M ${x + 10} ${y + h - 12} q 12 -26 24 0 q 12 26 24 0 q 12 -26 24 0" />`;
    case 'siphon':
      return `<path d="M ${mx - 12} ${y + 8} v ${h / 2} q 0 14 12 14 q 12 0 12 -14 v -${h / 2 - 6}" />`;
    case 'entnahme':
      return `<polyline points="${x + 12},${y + h - 10} ${x + 12},${y + 14} ${x + b - 14},${y + 14}" />
              <line x1="${x + b - 14}" y1="${y + 14}" x2="${x + b - 14}" y2="${y + 26}" />`;
    case 'rohr':
      return `<line x1="${x + 10}" y1="${my}" x2="${x + b - 10}" y2="${my}" stroke-width="4" />`;
    default:
      return `<rect x="${x + 10}" y="${y + 8}" width="${b - 20}" height="${h - 16}" rx="4" />`;
  }
}

function pfeil(x, y) {
  return `<polygon points="${x},${y - 5} ${x},${y + 5} ${x + 9},${y}" fill="currentColor" />`;
}

/**
 * Erzeugt eine einfache Prinzipskizze aus einer Beschreibung.
 * @param {string} beschreibung
 * @param {string} [titel]
 */
export function schemaZeichnung(beschreibung, titel) {
  const text = String(beschreibung || '');
  const bauteile = [];
  for (const m of BAUTEIL_MUSTER) {
    if (m.re.test(text) && !bauteile.some((b) => b.name === m.name)) bauteile.push(m);
  }
  if (bauteile.length < 2) {
    // Standard: Hauswasserstation als häufigster Fall
    bauteile.length = 0;
    bauteile.push(
      BAUTEIL_MUSTER.find((m) => m.name === 'Hausanschluss'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Absperrventil'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Filter'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Wasserzähler'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Rückflussverhinderer'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Druckminderer'),
      BAUTEIL_MUSTER.find((m) => m.name === 'Entnahmestelle'),
    );
  }

  const proZeile = 4;
  const bB = 150;
  const bH = 90;
  const abstand = 60;
  const zeilen = Math.ceil(bauteile.length / proZeile);
  const breite = proZeile * bB + (proZeile - 1) * abstand + 80;
  const hoehe = 60 + zeilen * (bH + 78);

  let teile = '';
  bauteile.forEach((bt, i) => {
    const zeile = Math.floor(i / proZeile);
    const spalte = i % proZeile;
    const x = 40 + spalte * (bB + abstand);
    const y = 70 + zeile * (bH + 80);
    teile += `<g>${symbolZeichnen(bt.symbol, x, y, bB, bH)}
      <rect x="${x}" y="${y}" width="${bB}" height="${bH}" rx="6" stroke-dasharray="2 4" opacity="0.35" />
      <text x="${x + bB / 2}" y="${y + bH + 22}" text-anchor="middle" font-size="13" stroke="none" fill="currentColor">${escapeText(bt.name)}</text></g>`;

    const letzterDerZeile = spalte === proZeile - 1 || i === bauteile.length - 1;
    if (!letzterDerZeile) {
      const my = y + bH / 2;
      teile += `<line x1="${x + bB}" y1="${my}" x2="${x + bB + abstand}" y2="${my}" stroke-width="3" />`;
      teile += pfeil(x + bB + abstand / 2 - 4, my);
    } else if (i !== bauteile.length - 1) {
      // Zeilenumbruch: rechts heraus, unterhalb der Zeile zurueck, dann von links herein
      const my = y + bH / 2;
      const zwischen = y + bH + 44;
      const nyMitte = y + bH + 80 + bH / 2;
      teile +=
        `<polyline points="${x + bB},${my} ${x + bB + 25},${my} ${x + bB + 25},${zwischen} ` +
        `20,${zwischen} 20,${nyMitte} 40,${nyMitte}" stroke-width="3" />`;
      teile += pfeil(26, nyMitte);
    }
  });

  const kopf = escapeText(titel || 'Prinzipskizze');
  const svg = `<svg viewBox="0 0 ${breite} ${hoehe}" xmlns="http://www.w3.org/2000/svg" class="zeichnung-svg">
  <g stroke="currentColor" fill="none" stroke-width="2" font-family="system-ui, sans-serif">
    <text x="40" y="34" font-size="17" font-weight="600" stroke="none" fill="currentColor">${kopf}</text>
    ${teile}
  </g>
</svg>`;

  return {
    titel: titel || 'Prinzipskizze',
    svg,
    beschreibung:
      'Prinzipskizze in Fließrichtung: Die Bauteile sind in ihrer Einbaureihenfolge dargestellt. ' +
      'Die Skizze wurde ohne KI aus den erkannten Bauteilen erzeugt und kann nachbearbeitet werden.',
    legende: bauteile.map((b) => ({ zeichen: b.name, bedeutung: 'Bauteil in Einbaureihenfolge' })),
  };
}

function escapeText(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
