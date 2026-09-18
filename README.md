# SHK-Berichte

Sprachgesteuerte App für **Berichtshefte** und **Fachberichte** für Anlagenmechaniker SHK.
Einfach so erzählen, wie man auf der Baustelle spricht – die KI macht daraus einen
Fachtext mit korrekten Nennweiten, Werkzeug- und Materialbezeichnungen.

> „Montag hab ich 100er SML Rohr mit einer Flex geschnitten und anschließend anmontiert“
>
> wird zu
>
> **Montage von SML-Abflussrohr DN 100 (DIN EN 877)**
> – Rohrstücke mit dem Winkelschleifer (Trennscheibe für Guss) auf Maß abgelängt
> – Schnittkanten entgratet, Korrosionsschutz nachgearbeitet
> – Rohre mit CV-Verbindern gefügt und mit Rohrschellen befestigt
> Material: SML-Rohr DN 100, CV-Verbinder · Werkzeug: Winkelschleifer, Trennscheibe · DIN EN 12056

---

## Was die App kann

| Bereich | Funktion |
| --- | --- |
| **Berichtsheft** | Ganze Woche einsprechen. Die KI erkennt Wochentage, ordnet die Tätigkeiten zu und formuliert im Nominalstil. Material-, Werkzeug- und Normenliste pro Tätigkeit. |
| **Fachbericht** | Einleitung, Arbeitsschritte, **Materialliste**, **Werkzeugliste**, Arbeitssicherheit, Regelwerke, **Erklärungen** und Fazit – aus einem Diktat. |
| **Erklären lassen** | „Erkläre einen Druckminderer“ → Aufbau, Funktionsprinzip, Einsatz, Einstellwerte, Fehlerbilder, Normen. Auf Wunsch in drei Stufen ausführlicher. |
| **Nachschlagen** | Eingebaute **Fachdatenbank mit über 120 Einträgen** zu Sanitär, Heizung, Gas, Lüftung/Klima/Kälte, Versorgungstechnik und Grundlagen – durchsuchbar per Sprache, mit Kennwerten, Formeln, Regelwerken und Querverweisen. Funktioniert auch ohne KI. |
| **Rückfragen** | „Erläutere was genau passiert, wenn zu viel Druck kommt“ → gezielte Vertiefung genau zu dieser Frage, beliebig oft. |
| **Zeichnung** | Passende Prinzipskizze/Strangschema als SVG – per Sprache angefordert, mit Legende, druckbar. |
| **Bearbeiten** | Jeden Punkt antippen und ändern, mehrere auswählen und löschen, einzelne Punkte „Genauer“ machen, Begriffe markieren und erklären lassen. |
| **Bedienung** | Alles auch per Sprache: „lösche Punkt 3“, „erkläre einen Systemtrenner“, „ausführlicher“, „zeichne eine Hauswasserstation“, „der Titel ist …“, „speichern“. |
| **Konto** | Anmeldung mit E-Mail und Passwort, Berichte bleiben gesichert und sind auf jedem Gerät verfügbar. Export aller Berichte als JSON. |
| **Design** | Modern, deutsch, Hell-/Dunkelmodus (automatisch oder fest), mobil bedienbar, als App installierbar (PWA), Druck-/PDF-Ansicht. |

**Kein Schlüssel, kein Code für die KI in der App.** Der KI-Zugang liegt ausschließlich auf
dem Server – in der App wird nie etwas eingegeben oder konfiguriert.

---

## Schnellstart

Voraussetzung: **Node.js 20 oder neuer** (empfohlen 22+). Keine weiteren Abhängigkeiten,
kein `npm install`, kein Build.

```bash
git clone <dieses-repository>
cd SHK-Berichte

cp .env.example .env        # KI-Schlüssel eintragen (optional, siehe unten)
npm start                   # oder: node server/index.js
```

Danach im Browser öffnen: **http://localhost:3000**
Beim ersten Aufruf ein Konto anlegen – fertig.

### KI aktivieren

In der `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-…
SHK_AI_MODEL=claude-sonnet-5
```

Den Schlüssel gibt es unter <https://console.anthropic.com>. Nach dem Neustart des Servers
steht „KI aktiv“ im Start-Log.

### Fachmodus offline

Ohne Schlüssel läuft die App vollständig weiter – nur ohne KI-Feinschliff:

- Die eingebaute **Fachsprache-Engine** (ca. 100 Glossareinträge + Dimensionsregeln)
  schreibt Umgangssprache in Fachbegriffe um: „Flex“ → Winkelschleifer,
  „22er Kupfer“ → Kupferrohr 22 × 1,0 mm, „halbzoll“ → DN 15 (1/2 Zoll),
  „100er SML“ → SML-Abflussrohr DN 100.
- Erklärungen kommen aus der **eingebauten Fachdatenbank** mit über 120 Einträgen zum
  gesamten Berufsfeld (siehe unten) – inklusive Kennwerten, Formeln und Regelwerken.
- Zeichnungen werden aus den erkannten Bauteilen als Prinzipskizze aufgebaut.

Fällt die KI während des Betriebs aus, schaltet die App automatisch auf diesen Modus um
und weist im Bericht darauf hin.

---

## Die Fachdatenbank

Die App bringt ein strukturiertes Nachschlagewerk des Berufsfeldes mit (`server/ai/wissen/`).
Es ist die Grundlage für die Erklärungen ohne KI – und wird zugleich als Faktenblock an die
KI-Prompts angehängt, damit KI-Texte dieselben Werte, Formeln und Regelwerke verwenden.

| Bereich | Inhalte (Auszug) |
| --- | --- |
| **Grundlagen und Werkstoffe** | Kupfer, Edelstahl, C-Stahl, Gewinderohr, Verbundrohr, PE-X, Dichtstoffe · Pressen, Weich-/Hartlöten, Gewinde, Steckmuffe · Befestigung, Wärmedehnung, Korrosion · Dämmung nach GEG, Brand- und Schallschutz · Wärme-, Hydraulik- und Grundformeln · Elektrotechnik, Arbeitssicherheit, Gefahrstoffe, Berichtsheft und Gesellenprüfung |
| **Sanitär- und Trinkwassertechnik** | Trinkwasserhygiene, Legionellen, Hauswasserstation, Druckminderer, Rückflussverhinderer, Sicherungsarmaturen nach DIN EN 1717, Systemtrenner, Wasserzähler, Filter, Trinkwassererwärmer, Frischwasserstation, Durchlauferhitzer, Zirkulation, Rohrnetzberechnung, Armaturen, Enthärtung, Dichtheitsprüfung, Spülung · Entwässerung mit SML, HT, KG, Fallleitung und Lüftung, Geruchsverschluss, Rückstau, Hebeanlage, Regenentwässerung · Vorwandinstallation, Sanitärobjekte, Barrierefreiheit, Leckagesuche |
| **Heizungstechnik** | Anlagenaufbau, Heizlast, Brennwert, Wärmepumpe, Öl, Biomasse, Solarthermie · Sicherheitsventil, Ausdehnungsgefäß, Pumpe, Mischer, Pufferspeicher, hydraulische Weiche · Thermostat- und Strangregulierventile, hydraulischer Abgleich · Heizkörper, Fußbodenheizung, Verteiler, Funktionsheizen · Heizkurve, Heizungswasser nach VDI 2035, Entlüftung, Inbetriebnahme, Optimierung |
| **Gastechnik** | TRGI-Gasinstallation, Belastungs-, Dichtheits- und Gebrauchsfähigkeitsprüfung, Gerätearten A/B/C, Gasströmungswächter, TAE, Verbrennungsluft, Abgasanlage, Abgasmessung, Kondensat und Neutralisation, Flüssiggas, Verhalten bei Gasgeruch |
| **Lüftung, Klima und Kälte** | Wohnungslüftung nach DIN 1946-6, RLT-Anlagen, Wärmerückgewinnung, Kanalnetz, Filter nach ISO 16890, Hygiene nach VDI 6022, Schalldämpfer, Kühllast, Kältekreis und Kältemittel, Splitanlagen, h,x-Diagramm, Küchen- und Bad-Entlüftung |
| **Versorgungs- und Anlagentechnik** | Fernwärme und Übergabestation, Druckerhöhung, Regenwassernutzung, Druckluft, MSR- und Gebäudeautomation, Wärmemengenzähler, Fett- und Leichtflüssigkeitsabscheider, Schwimmbadtechnik, Löschwasseranlagen, Instandhaltung nach DIN 31051, Kundendienst, Dokumentation, GEG und Förderung, PV mit Wärmepumpe |

Jeder Eintrag enthält Kurzdefinition, Funktionsprinzip, Aufbau, Einsatz, Kennwerte,
Praxishinweise, typische Fehlerbilder, Regelwerke und Querverweise – viele zusätzlich
Berechnungsformeln und ausformulierte Antworten auf typische Rückfragen
(z. B. „Was passiert, wenn zu viel Druck kommt?“).

**Erweitern:** Neue Einträge werden einfach in die passende Datei unter `server/ai/wissen/`
eingetragen – gleiche Struktur, fertig. Die Tests prüfen Vollständigkeit, eindeutige
Schlüssel und dass alle Querverweise auf vorhandene Einträge zeigen.

---

## Bedienung

### Diktieren

Mikrofon antippen und frei erzählen. Der Text erscheint im Feld und kann jederzeit von Hand
korrigiert werden. Danach auf **„In Fachsprache umwandeln“** bzw. **„Fachbericht erstellen“**.

Die Spracherkennung nutzt die Browser-Funktion (Chrome, Edge, Safari) auf Deutsch.
Wo sie nicht verfügbar ist, funktioniert alles genauso über das Textfeld.

### Sprachbefehle

Während des Diktats werden Befehle automatisch erkannt und sofort ausgeführt:

| Gesprochen | Wirkung |
| --- | --- |
| „lösche Punkt 3“, „lösch den zweiten Punkt“, „entferne die Materialliste“ | Punkt entfernen |
| „erkläre einen Druckminderer“, „was ist ein Systemtrenner“ | Erklärung öffnen |
| „ausführlicher“, „genauer“, „mehr Details“ | Letzte Erklärung vertiefen |
| „zeichne eine Hauswasserstation“, „Skizze vom Strangschema“ | Zeichnung erstellen |
| „der Titel ist Hauswasserstation Keller“ | Titel setzen |
| „speichern“ | Bericht sichern |

Alles andere landet als Diktattext im Bericht.

### Punkte bearbeiten

- **Antippen** – Text direkt im Bericht ändern.
- **Häkchen setzen** – mehrere Punkte auswählen, dann gesammelt löschen, genauer machen
  oder Begriffe erklären lassen.
- **„Genauer“** – die KI erläutert genau diesen Punkt ausführlicher (als Zusatzblock,
  jederzeit wieder entfernbar).
- **Text markieren** – es erscheint „Begriff erklären“ direkt an der Markierung.

---

## Aufbau des Projekts

```
server/
  index.js            HTTP-Server, Routing, Sicherheitskopfzeilen
  config.js           .env-Auswertung, Sitzungsgeheimnis
  db.js               Speicher: node:sqlite, sonst JSON-Datei
  auth.js             Registrierung, Anmeldung, scrypt-Passwörter, Sitzungen
  http.js             JSON, Cookies, statische Dateien, Ratenbegrenzung
  routes/             /api/status, /api/auth/*, /api/berichte/*, /api/wissen/*, /api/ki/*
  ai/
    glossar.js        SHK-Fachglossar, Wandstärken, Zolltabelle, Wissensbasis
    fachsprache.js    Umschreibung Umgangssprache → Fachsprache
    prompts.js        Systemprompts und JSON-Schemata der KI-Aufgaben
    client.js         Claude-API über fetch (erzwungene JSON-Antwort)
    tasks.js          Fachaufgaben mit Rückfall auf den Fachmodus offline
    offline.js        Erzeugung ohne KI + lokale Befehlserkennung
    svg.js            SVG-Absicherung und Offline-Prinzipskizze
    wissen/           Fachdatenbank: index.js (Suche, Faktenblock) + je Bereich eine Datei
public/
  index.html          App-Hülle
  css/styles.css      Gestaltung inkl. Hell-/Dunkelmodus und Druckansicht
  js/                 Module: api, ui, speech, store, components
  js/views/           Anmeldung, Start, Berichtsheft, Fachbericht, Wissen, Nachschlagen, Konto
test/                 Tests (node --test)
data/                 Datenbank (wird angelegt, nicht im Repository)
```

Keine Fremdbibliotheken, kein Bundler: nur Node-Bordmittel und ES-Module im Browser.

---

## Tests

```bash
npm test
```

44 Tests: Fachsprache-Engine, Fachdatenbank (Datenqualität, Suche, Faktenblock),
Fachmodus offline, Sprachbefehle, SVG-Absicherung, Schnittstelle (Konto, Berichte,
Nachschlagen, Zugriffsschutz) und der KI-Pfad gegen einen nachgebildeten API-Server
(Anfrageaufbau, Auswertung, Rückfallebene).

---

## Datenhaltung und Sicherheit

- Passwörter werden mit **scrypt** samt Zufallssalz gespeichert, niemals im Klartext.
- Sitzungen laufen über ein **HttpOnly-Cookie** (SameSite=Lax, 60 Tage, serverseitig widerrufbar).
- Berichte sind strikt an das Konto gebunden – fremde IDs liefern 404.
- Schreibende Anfragen prüfen die Herkunft (CSRF-Schutz), Anmeldung und KI-Aufrufe sind
  ratenbegrenzt.
- Von der KI geliefertes SVG wird serverseitig gefiltert (nur erlaubte Elemente und
  Attribute, keine Skripte, keine externen Verweise).
- Content-Security-Policy ohne `unsafe-eval`/externe Quellen.
- Der KI-Schlüssel verlässt den Server nicht und erscheint nie im Klienten.

**Beim Betrieb im Netz:** hinter einen HTTPS-Reverse-Proxy stellen und `SECURE_COOKIES=1`
setzen. Die Spracherkennung der Browser funktioniert ohnehin nur über HTTPS
(Ausnahme: `localhost`). Mit `DISABLE_REGISTRATION=1` lässt sich die Registrierung nach
dem Anlegen der eigenen Konten sperren.

---

## Fachliche Hinweise

Die Texte sind eine **Arbeitshilfe**. Sie müssen vor der Abgabe fachlich geprüft werden –
Ausbildungsnachweise unterschreibt der Auszubildende und der Ausbilder. Angaben zu
Normen und Regelwerken sind Hinweise auf die einschlägigen Vorschriften und ersetzen nicht
deren Anwendung im Einzelfall (insbesondere bei Gasinstallationen nach DVGW-TRGI G 600,
Trinkwasser nach DIN EN 806 / DIN 1988 / DVGW W 551 und Entwässerung nach DIN 1986-100).

---

## Lizenz

MIT
