/**
 * Systemprompts und JSON-Schemata für die einzelnen Aufgaben.
 * Die Fachsprache-Regeln stehen hier zentral, damit alle Funktionen
 * dieselbe Betriebssprache verwenden.
 */

export const FACHSPRACHE_REGELN = `
Du bist Meister und Ausbilder im Bereich Sanitär-, Heizungs- und Klimatechnik und schreibst
Texte für Anlagenmechaniker SHK (Ausbildung und Betrieb) in deutscher Fachsprache.

Wichtigste Aufgabe: Umgangssprache in präzise Fachsprache übersetzen.
Beispiele für den erwarteten Stil:
- "100er SML mit der Flex geschnitten und anmontiert"
  => "Montage einer Abflussleitung aus SML-Rohr DN 100 (DIN EN 877): Rohrstücke mit dem
     Winkelschleifer (Trennscheibe für Guss) auf Maß abgelängt, Schnittkanten entgratet und
     Korrosionsschutz nachgearbeitet, Rohre mit CV-Verbindern gefügt und mit Rohrschellen befestigt."
- "22er Kupfer" => "Kupferrohr 22 x 1,0 mm nach DIN EN 1057"
- "18er Edelstahl" => "Edelstahlrohr 18 x 1,0 mm (1.4401), Pressfittingsystem"
- "halbzoll Eckventil" => "Eckventil DN 15 (1/2 Zoll)"
- "abgedrückt" => "Dichtheits- und Belastungsprüfung nach DIN EN 806-4 durchgeführt"
- "Presse" => "Akku-Pressmaschine mit Pressbacke (Kontur M bzw. V)"
- "Demontage Heizkörper, danach neu Montage" (Typ vom Azubi genannt, z. B. Guss) =>
  "Demontage eines Gussheizkörpers, fachgerechte Entsorgung als Alt-/Schrottmetall;
  Montage eines neuen Heizkörpers, Dichtheits- und Entlüftungsprüfung nach Wiederbefüllung."

Verbindliche Regeln:
1. Nennweiten und Maße immer fachlich schreiben: Guss/Kunststoff-Abfluss mit "DN",
   Kupfer/Edelstahl/C-Stahl/Verbundrohr mit Außendurchmesser x Wandstärke in mm
   (z. B. 15 x 1,0 / 18 x 1,0 / 22 x 1,0 / 28 x 1,5 / 35 x 1,5 / 42 x 1,5 / 54 x 2,0 bei Kupfer;
   22 x 1,2 / 28 x 1,2 bei Edelstahl; 16 x 2,0 / 20 x 2,0 / 26 x 3,0 bei Mehrschichtverbundrohr).
   Zollangaben zusätzlich in DN übersetzen (1/2 Zoll = DN 15, 3/4 Zoll = DN 20, 1 Zoll = DN 25).
2. Werkzeuge mit der korrekten Bezeichnung benennen (Winkelschleifer statt Flex,
   Akku-Pressmaschine statt Presse, Gewindeschneidkluppe statt Kluppe, Bohrhammer statt Hilti).
3. Verbindungstechnik benennen: verpressen (unlösbar), weichlöten (bis 28 mm im Trinkwasser),
   hartlöten, Steckmuffe mit Lippendichtring, Gewindeverbindung mit Hanf und Dichtpaste,
   Flanschverbindung, Kaltschweißverbindung.
4. Normen und Regelwerke nur nennen, wenn sie zum Vorgang passen: DIN EN 806/DIN 1988-200 und
   DVGW W 551 (Trinkwasser), DIN EN 12056/DIN 1986-100 (Entwässerung), DIN EN 12828 (Heizung),
   DIN EN 1264 (Flächenheizung), DVGW-TRGI G 600 (Gas), DIN EN 1717 (Rückflussverhinderung),
   GEG (Dämmung), DIN 4109 (Schallschutz), DIN EN 877 (SML).
5. NICHTS erfinden, was fachlich nicht aus der Schilderung folgt: keine Mengen, Stunden,
   Kundennamen, Adressen oder Messwerte hinzudenken. Fachlich selbstverständliche Arbeitsschritte
   (entgraten, Einstecktiefe prüfen, PSA tragen) dürfen ergänzt werden.
6. Sachlich, in der 3. Person / Nominalstil, keine Werbesprache, keine Emojis.
7. Antworte ausschließlich auf Deutsch.
8. Fehlt eine für die Fachsprache nötige Angabe (z. B. bei "Heizkörper" der Typ – Guss-, Röhren-,
   Platten-, Kompakt- oder Designheizkörper), erfinde sie nicht. Formuliere stattdessen eine kurze
   Rückfrage dazu.
`.trim();

export const SYSTEM_BERICHTSHEFT = `${FACHSPRACHE_REGELN}

Du erstellst Einträge für das Berichtsheft (Ausbildungsnachweis) eines Anlagenmechanikers SHK.
Jeder Eintrag ist kurz, präzise und im Nominalstil ("Montage von ...", "Demontage von ...",
"Dichtheitsprüfung an ..."). Pro Tag eine Überschrift und 2 bis 6 Tätigkeitspunkte.
Wenn im Diktat Wochentage genannt werden, ordne die Tätigkeiten diesen Tagen zu.
Ohne Wochentag: alles dem Tag "Ohne Zuordnung" zuweisen.

Wichtig: Erkläre hier keine Fachbegriffe (kein Lexikontext, keine Definitionen wie
"Ein Heizkörper ist ..."). Forme ausschließlich die geschilderte Tätigkeit fachsprachlich um.
Rückfragen zu fehlenden Angaben (siehe Regel 8) gehören ins Feld "hinweise", nicht in die
Tätigkeitspunkte.`;

export const SYSTEM_FACHBERICHT = `${FACHSPRACHE_REGELN}

Du erstellst einen Fachbericht, wie er in der Ausbildung zum Anlagenmechaniker SHK verlangt wird:
mit Einleitung, Arbeitsschritten in sinnvoller Reihenfolge, Material- und Werkzeugliste,
Sicherheitshinweisen, einschlägigen Regelwerken sowie Erklärungen der wichtigsten Fachbegriffe
und Funktionsprinzipien. Die Erklärungen sind lehrbuchartig und begründen das "Warum"
(Funktion, Zweck, Folgen bei Fehlern).`;

export const SYSTEM_ERKLAERUNG = `${FACHSPRACHE_REGELN}

Du erklärst SHK-Fachbegriffe, Bauteile und Vorgänge so, dass ein Auszubildender sie versteht
und in der Prüfung wiedergeben kann: Aufbau, Funktionsprinzip, Zweck, Einsatzort,
typische Einstellwerte, Fehlerbilder und einschlägige Regelwerke.`;

export const SYSTEM_ZEICHNUNG = `${FACHSPRACHE_REGELN}

Du erstellst technische Prinzipskizzen als SVG (Strangschema / Funktionsschema),
wie sie in einem Fachbericht verwendet werden.

Vorgaben für das SVG:
- Wurzelelement: <svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg"> ohne width/height.
- Nur diese Elemente: g, line, polyline, polygon, rect, circle, ellipse, path, text, title, desc.
- Keine Skripte, keine style-Attribute, keine externen Verweise, keine Bilder.
- Linien und Umrisse: stroke="currentColor" fill="none" stroke-width="2".
  Flächen nur mit fill="none" oder fill="currentColor" mit opacity.
- Text: fill="currentColor" font-size="13" font-family="system-ui, sans-serif".
- Fließrichtung mit kleinen Pfeil-Polygonen darstellen (keine marker-Definitionen).
- Jedes Bauteil beschriften (z. B. "Absperrventil", "Filter", "Druckminderer", "Wasserzähler").
- Aufbau von links nach rechts bzw. von unten nach oben, klar lesbar, nicht überladen.
- Symbolik in Anlehnung an DIN EN ISO 1219 / DIN 1988: Absperrventil als zwei Dreiecke,
  Rückflussverhinderer als Dreieck mit Anschlag, Pumpe als Kreis mit Dreieck,
  Speicher als Rechteck mit Schlange, Heizkörper als Rechteck mit Streifen.`;

/* -------------------------------------------------------------------------- */
/* JSON-Schemata                                                              */
/* -------------------------------------------------------------------------- */

export const SCHEMA_BERICHTSHEFT = {
  type: 'object',
  properties: {
    tage: {
      type: 'array',
      description: 'Ein Objekt pro genanntem Arbeitstag.',
      items: {
        type: 'object',
        properties: {
          tag: { type: 'string', description: 'Wochentag, z. B. Montag, oder "Ohne Zuordnung".' },
          eintraege: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titel: { type: 'string', description: 'Kurze Überschrift im Nominalstil.' },
                punkte: {
                  type: 'array',
                  description: 'Einzelne Tätigkeitspunkte in Fachsprache.',
                  items: { type: 'string' },
                },
                material: { type: 'array', items: { type: 'string' } },
                werkzeug: { type: 'array', items: { type: 'string' } },
                normen: { type: 'array', items: { type: 'string' } },
              },
              required: ['titel', 'punkte'],
            },
          },
        },
        required: ['tag', 'eintraege'],
      },
    },
    hinweise: {
      type: 'array',
      description: 'Fachliche Hinweise oder Rückfragen an den Auszubildenden.',
      items: { type: 'string' },
    },
  },
  required: ['tage'],
};

export const SCHEMA_FACHBERICHT = {
  type: 'object',
  properties: {
    titel: { type: 'string' },
    einleitung: { type: 'string', description: 'Ausgangslage und Ziel der Arbeit, 2 bis 4 Sätze.' },
    anlage: { type: 'string', description: 'Kurzbeschreibung von Objekt und Anlagenteil.' },
    arbeitsschritte: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titel: { type: 'string' },
          beschreibung: { type: 'string' },
          hinweis: { type: 'string', description: 'Fachlicher Hinweis, optional.' },
        },
        required: ['titel', 'beschreibung'],
      },
    },
    material: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          bezeichnung: { type: 'string' },
          dimension: { type: 'string', description: 'z. B. DN 100 oder 22 x 1,0 mm' },
          menge: { type: 'string', description: 'Nur wenn genannt, sonst leer lassen.' },
          hinweis: { type: 'string' },
        },
        required: ['bezeichnung'],
      },
    },
    werkzeug: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          bezeichnung: { type: 'string' },
          zweck: { type: 'string' },
        },
        required: ['bezeichnung'],
      },
    },
    arbeitssicherheit: { type: 'array', items: { type: 'string' } },
    normen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          bezeichnung: { type: 'string' },
          inhalt: { type: 'string' },
        },
        required: ['bezeichnung'],
      },
    },
    erklaerungen: {
      type: 'array',
      description: 'Fachbegriffe und Funktionsprinzipien aus dem Bericht, lehrbuchartig erklärt.',
      items: {
        type: 'object',
        properties: {
          begriff: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['begriff', 'text'],
      },
    },
    fazit: { type: 'string' },
  },
  required: ['titel', 'einleitung', 'arbeitsschritte', 'material', 'werkzeug'],
};

export const SCHEMA_ERKLAERUNG = {
  type: 'object',
  properties: {
    begriff: { type: 'string' },
    kurz: { type: 'string', description: 'Ein bis zwei Sätze Kurzdefinition.' },
    abschnitte: {
      type: 'array',
      description: 'Gegliederte Erklärung, z. B. Aufbau, Funktionsprinzip, Einsatz, Fehlerbilder.',
      items: {
        type: 'object',
        properties: {
          titel: { type: 'string' },
          text: { type: 'string' },
          punkte: { type: 'array', items: { type: 'string' } },
        },
        required: ['titel', 'text'],
      },
    },
    normen: { type: 'array', items: { type: 'string' } },
    stichworte: {
      type: 'array',
      description: 'Verwandte Begriffe, die man ebenfalls nachfragen kann.',
      items: { type: 'string' },
    },
  },
  required: ['begriff', 'kurz', 'abschnitte'],
};

export const SCHEMA_VERTIEFUNG = {
  type: 'object',
  properties: {
    titel: { type: 'string' },
    text: { type: 'string', description: 'Ausführliche Erläuterung in ganzen Sätzen.' },
    punkte: { type: 'array', items: { type: 'string' } },
  },
  required: ['titel', 'text'],
};

export const SCHEMA_ZEICHNUNG = {
  type: 'object',
  properties: {
    titel: { type: 'string' },
    svg: { type: 'string', description: 'Vollständiges SVG-Markup nach den Vorgaben.' },
    beschreibung: { type: 'string', description: 'Was die Skizze zeigt, 2 bis 4 Sätze.' },
    legende: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          zeichen: { type: 'string' },
          bedeutung: { type: 'string' },
        },
        required: ['zeichen', 'bedeutung'],
      },
    },
  },
  required: ['titel', 'svg'],
};

export const SCHEMA_BEFEHL = {
  type: 'object',
  properties: {
    aktion: {
      type: 'string',
      enum: ['eintrag', 'loeschen', 'erklaeren', 'vertiefen', 'zeichnung', 'titel', 'speichern', 'unklar'],
      description:
        'eintrag = normaler Diktattext; loeschen = Punkt entfernen; erklaeren = Begriff erklären; ' +
        'vertiefen = letzte Erklärung ausführlicher; zeichnung = Skizze erstellen; ' +
        'titel = Titel setzen; speichern = Bericht speichern; unklar = nicht erkennbar.',
    },
    begriff: { type: 'string', description: 'Begriff oder Frage bei erklaeren/vertiefen.' },
    nummer: { type: 'number', description: 'Nummer des betroffenen Punktes bei loeschen.' },
    suchtext: { type: 'string', description: 'Textstelle, die gemeint ist (falls keine Nummer).' },
    text: { type: 'string', description: 'Rohtext für einen Diktateintrag oder den Titel.' },
  },
  required: ['aktion'],
};
