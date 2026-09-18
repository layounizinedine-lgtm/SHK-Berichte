/**
 * SHK-Fachglossar
 * ---------------------------------------------------------------------------
 * Grundlage für die Umschreibung von Umgangssprache in Fachsprache.
 * Wird zweifach genutzt:
 *   1. lokal von der Fachsprache-Engine (auch ohne KI-Schlüssel)
 *   2. als Referenz im Systemprompt, damit die KI die Betriebsbegriffe
 *      des Anlagenmechanikers SHK zuverlässig trifft.
 */

/** Wandstärken-Tabellen für die gängigen Rohrwerkstoffe (Außendurchmesser → Wandstärke). */
export const WANDSTAERKEN = {
  kupfer: { 12: '1,0', 15: '1,0', 18: '1,0', 22: '1,0', 28: '1,5', 35: '1,5', 42: '1,5', 54: '2,0', 64: '2,0', 76: '2,0' },
  edelstahl: { 15: '1,0', 18: '1,0', 22: '1,2', 28: '1,2', 35: '1,5', 42: '1,5', 54: '1,5', 76: '2,0' },
  cstahl: { 12: '1,2', 15: '1,2', 18: '1,2', 22: '1,5', 28: '1,5', 35: '1,5', 42: '1,5', 54: '1,5' },
  praezisionsstahl: { 12: '1,2', 15: '1,2', 18: '1,2', 22: '1,5', 28: '1,5', 35: '1,5', 42: '1,5', 54: '1,5' },
  verbundrohr: { 14: '2,0', 16: '2,0', 20: '2,0', 25: '2,5', 26: '3,0', 32: '3,0', 40: '3,5', 50: '4,0', 63: '4,5' },
};

/** Zoll → DN (Gewinderohr / Armaturen). */
export const ZOLL_DN = {
  '3/8': 10,
  '1/2': 15,
  '3/4': 20,
  '1': 25,
  '1 1/4': 32,
  '1 1/2': 40,
  '2': 50,
  '2 1/2': 65,
  '3': 80,
};

/** Gesprochene Zoll-Angaben, wie die Spracherkennung sie liefert. */
export const ZOLL_SPRACHE = [
  [/\b(?:drei\s?viertel|3\s?\/\s?4)\s*(?:zoll|")/gi, '3/4'],
  [/\b(?:ein\s?halb|einhalb|1\s?\/\s?2|halb)\s*(?:zoll|")/gi, '1/2'],
  [/\b(?:drei\s?achtel|3\s?\/\s?8)\s*(?:zoll|")/gi, '3/8'],
  [/\b(?:ein\s?(?:und\s?ein)?\s?viertel|1\s?1\s?\/\s?4|eineinviertel)\s*(?:zoll|")/gi, '1 1/4'],
  [/\b(?:ein\s?(?:und\s?ein)?\s?halb|1\s?1\s?\/\s?2|eineinhalb|anderthalb)\s*(?:zoll|")/gi, '1 1/2'],
  [/\b(?:zwei|2)\s*(?:zoll|")/gi, '2'],
  [/\b(?:ein|eins|1)\s*(?:zoll|")/gi, '1'],
];

/**
 * Begriffsglossar.
 * aliases: Umgangssprache/Dialekt/Spracherkennungsvarianten
 * fach:    Fachbegriff, der eingesetzt wird
 * kategorie: rohr | verbindung | werkzeug | bauteil | taetigkeit | pruefung | material
 * werkzeug/material: Vorschläge für Werkzeug- und Materiallisten
 */
export const GLOSSAR = [
  // ---------------------------------------------------------- Werkzeuge
  {
    aliases: ['flex', 'flexe', 'winkelflex', 'trennschleifer', 'flexer'],
    fach: 'Winkelschleifer',
    kategorie: 'werkzeug',
    werkzeug: ['Winkelschleifer 125 mm', 'Trennscheibe für Guss/Stahl', 'Schutzbrille und Gehörschutz'],
    hinweis: 'Trennarbeiten mit dem Winkelschleifer: PSA (Schutzbrille, Gehörschutz, Handschuhe) und Funkenflug beachten.',
  },
  { aliases: ['presse', 'pressgerät', 'pressmaschine', 'presszange', 'pressen gerät', 'akkupresse', 'akku presse'], fach: 'Akku-Pressmaschine mit Pressbacke', kategorie: 'werkzeug', werkzeug: ['Akku-Pressmaschine', 'Pressbacken (Kontur M bzw. V) in passender Nennweite'] },
  { aliases: ['rohrschneider', 'rohrabschneider', 'rollenschneider'], fach: 'Rohrabschneider', kategorie: 'werkzeug', werkzeug: ['Rohrabschneider'] },
  { aliases: ['entgrater', 'entgraten gerät', 'reibahle'], fach: 'Innen-/Außenentgrater', kategorie: 'werkzeug', werkzeug: ['Innen-/Außenentgrater'] },
  { aliases: ['kluppe', 'gewindeschneider', 'gewindeschneidmaschine', 'rems'], fach: 'Gewindeschneidkluppe', kategorie: 'werkzeug', werkzeug: ['Gewindeschneidkluppe mit Schneidbacken', 'Gewindeschneidöl'] },
  { aliases: ['lötbrenner', 'brenner', 'lötlampe', 'gasbrenner'], fach: 'Weichlötbrenner (Propan-/Acetylenbrenner)', kategorie: 'werkzeug', werkzeug: ['Lötbrenner mit Propangas', 'Lötschutzmatte', 'Feuerlöscher (Erlaubnisschein für Heißarbeiten)'] },
  { aliases: ['bohrhammer', 'schlagbohrer', 'schlagbohrmaschine', 'hilti'], fach: 'Bohrhammer', kategorie: 'werkzeug', werkzeug: ['Bohrhammer mit SDS-Bohrer'] },
  { aliases: ['kernbohrer', 'kernbohrmaschine', 'diamantbohrer', 'dosenbohrer'], fach: 'Kernbohrmaschine mit Diamantbohrkrone', kategorie: 'werkzeug', werkzeug: ['Kernbohrmaschine', 'Diamantbohrkrone', 'Wasserabsaugung'] },
  { aliases: ['rohrzange', 'wasserpumpenzange', 'knipex', 'gripzange'], fach: 'Wasserpumpenzange', kategorie: 'werkzeug', werkzeug: ['Wasserpumpenzange', 'Rohrzange'] },
  { aliases: ['säbelsäge', 'fuchsschwanz', 'stichsäge', 'metallsäge', 'bügelsäge'], fach: 'Metallhandsäge bzw. Säbelsäge', kategorie: 'werkzeug', werkzeug: ['Säbelsäge mit Metallsägeblatt'] },
  { aliases: ['kalibrierer', 'kalibrierwerkzeug', 'aufweiter'], fach: 'Kalibrierwerkzeug', kategorie: 'werkzeug', werkzeug: ['Kalibrierwerkzeug für Mehrschichtverbundrohr'] },
  { aliases: ['druckprüfpumpe', 'prüfpumpe', 'abdrückpumpe', 'druckpumpe'], fach: 'Druckprüfpumpe', kategorie: 'werkzeug', werkzeug: ['Druckprüfpumpe mit Manometer', 'Prüfprotokoll'] },
  { aliases: ['wasserwaage', 'laser', 'nivellier'], fach: 'Wasserwaage bzw. Laser-Nivelliergerät', kategorie: 'werkzeug', werkzeug: ['Wasserwaage 60 cm', 'Laser-Nivelliergerät'] },
  { aliases: ['biegezange', 'rohrbieger', 'biegegerät'], fach: 'Rohrbiegezange', kategorie: 'werkzeug', werkzeug: ['Rohrbiegezange bzw. Biegegerät'] },
  { aliases: ['stemmeisen', 'meißel', 'spitzmeißel'], fach: 'Stemmeisen / Spitzmeißel', kategorie: 'werkzeug', werkzeug: ['Stemmeisen', 'Spitzmeißel'] },
  { aliases: ['schweißgerät', 'wig', 'mag schweißen', 'autogen'], fach: 'Schweißgerät (WIG/MAG bzw. Autogenanlage)', kategorie: 'werkzeug', werkzeug: ['Schweißgerät', 'Schweißerschutzschild', 'Schweißerlaubnis für Heißarbeiten'] },
  { aliases: ['spülkompressor', 'spülgerät'], fach: 'Spülkompressor', kategorie: 'werkzeug', werkzeug: ['Spülkompressor für Trinkwasserleitungen'] },

  // ---------------------------------------------------------- Rohre / Werkstoffe
  { aliases: ['sml', 'sml rohr', 'gussrohr', 'guss abflussrohr', 'es em el'], fach: 'SML-Abflussrohr (gusseisernes Abflussrohr nach DIN EN 877)', kategorie: 'rohr', material: ['SML-Rohr in benötigter Nennweite', 'CV-/Rapid-Verbinder mit Edelstahlmantel'], normen: ['DIN EN 877', 'DIN EN 12056', 'DIN 1986-100'] },
  { aliases: ['ht rohr', 'ht', 'hoch temperatur rohr'], fach: 'HT-Rohr (PP-Abflussrohr für Innenentwässerung)', kategorie: 'rohr', material: ['HT-Rohre und HT-Formteile'], normen: ['DIN EN 1451', 'DIN EN 12056'] },
  { aliases: ['kg rohr', 'kg', 'kanalgrundrohr'], fach: 'KG-Rohr (PVC-Grundleitung für erdverlegte Entwässerung)', kategorie: 'rohr', material: ['KG-Rohre und KG-Formteile', 'Gleitmittel'], normen: ['DIN EN 1401', 'DIN 1986-100'] },
  { aliases: ['kupfer', 'kupferrohr', 'cu rohr', 'cu'], fach: 'Kupferrohr nach DIN EN 1057', kategorie: 'rohr', material: ['Kupferrohr', 'Kupfer-Pressfittings bzw. Lötfittings'], normen: ['DIN EN 1057', 'DIN EN 806', 'DIN 1988-200'] },
  { aliases: ['edelstahl', 'edelstahlrohr', 'niro', 'inox', 'vier null eins'], fach: 'Edelstahlrohr 1.4401/1.4521 (Pressfittingsystem)', kategorie: 'rohr', material: ['Edelstahlrohr', 'Edelstahl-Pressfittings mit O-Ring (EPDM)'], normen: ['DIN EN 10312', 'DIN 1988-200'] },
  { aliases: ['c-stahl', 'c stahl', 'verzinktes rohr', 'stahlrohr verzinkt'], fach: 'C-Stahlrohr, außen verzinkt (Heizungsinstallation)', kategorie: 'rohr', material: ['C-Stahlrohr verzinkt', 'C-Stahl-Pressfittings'], hinweis: 'Nur für geschlossene Heizungskreise – nicht für Trinkwasser zulässig.' },
  { aliases: ['verbundrohr', 'mehrschichtverbundrohr', 'alpex', 'mlv rohr', 'mehrschicht'], fach: 'Mehrschichtverbundrohr (PE-RT/Al/PE-RT)', kategorie: 'rohr', material: ['Mehrschichtverbundrohr', 'Press- oder Schiebehülsenfittings'], normen: ['DIN 16836'] },
  { aliases: ['gewinderohr', 'schwarzes rohr', 'stahlrohr'], fach: 'Gewinderohr nach DIN EN 10255 (Stahlrohr)', kategorie: 'rohr', material: ['Gewinderohr', 'Fittings (Temperguss)', 'Hanf und Dichtmittel'] },
  { aliases: ['pe rohr', 'pe hd', 'polyethylen'], fach: 'PE-HD-Rohr', kategorie: 'rohr', material: ['PE-HD-Rohr', 'Elektroschweißmuffen'] },
  { aliases: ['pex', 'pe-x', 'vernetztes polyethylen'], fach: 'PE-X-Rohr (vernetztes Polyethylen)', kategorie: 'rohr', material: ['PE-X-Rohr', 'Pressfittings'] },

  // ---------------------------------------------------------- Verbindungstechnik
  { aliases: ['zusammengesteckt', 'reingesteckt', 'gesteckt', 'zusammenstecken'], fach: 'mit Steckmuffenverbindung (Lippendichtring) gefügt', kategorie: 'verbindung' },
  { aliases: ['verpresst', 'gepresst', 'gepresste', 'pressen'], fach: 'mit Pressfittings unlösbar verpresst', kategorie: 'verbindung', hinweis: 'Presskontur und Einstecktiefe prüfen, Pressvorgang bis zum Endanschlag.' },
  { aliases: ['gelötet', 'weichgelötet', 'löten'], fach: 'weichgelötet (Lot S-Sn97Cu3)', kategorie: 'verbindung', material: ['Weichlot S-Sn97Cu3', 'Flussmittel für Trinkwasser'], hinweis: 'Weichlöten im Trinkwasserbereich bis einschließlich 28 mm zulässig; darüber hartlöten.' },
  { aliases: ['hartgelötet', 'hartlöten', 'silberlot'], fach: 'hartgelötet (Hartlot CP 203)', kategorie: 'verbindung', material: ['Hartlot CP 203'] },
  { aliases: ['geschraubt', 'verschraubt', 'zugeschraubt'], fach: 'mit Verschraubung lösbar verbunden', kategorie: 'verbindung' },
  { aliases: ['gehanft', 'gehänft', 'hanf', 'abgedichtet mit hanf'], fach: 'Gewindeverbindung mit Hanf und Dichtpaste abgedichtet', kategorie: 'verbindung', material: ['Hanf', 'Dichtpaste (z. B. Fermit)'] },
  { aliases: ['teflon', 'teflonband', 'ptfe'], fach: 'mit PTFE-Dichtband abgedichtet', kategorie: 'verbindung', material: ['PTFE-Dichtband'] },
  { aliases: ['geklebt', 'kleben'], fach: 'mit Kaltschweißverbindung (Klebeverbindung) gefügt', kategorie: 'verbindung' },
  { aliases: ['geschweißt', 'schweißen'], fach: 'geschweißt', kategorie: 'verbindung' },
  { aliases: ['geflanscht', 'flanschverbindung'], fach: 'mit Flanschverbindung gefügt', kategorie: 'verbindung', material: ['Flanschdichtung', 'Sechskantschrauben mit Muttern'] },

  // ---------------------------------------------------------- Tätigkeiten
  { aliases: ['abgeschnitten', 'abschneiden', 'geschnitten', 'abgelängt'], fach: 'auf Maß abgelängt', kategorie: 'taetigkeit' },
  { aliases: ['anmontiert', 'angebaut', 'dran gemacht', 'ran gemacht', 'montiert'], fach: 'montiert und fachgerecht befestigt', kategorie: 'taetigkeit' },
  { aliases: ['aufgehängt', 'aufgehangen'], fach: 'mit Rohrschellen an der Tragkonstruktion befestigt', kategorie: 'taetigkeit', material: ['Rohrschellen mit Gummieinlage', 'Gewindestangen M8/M10', 'Dübel'] },
  { aliases: ['abgedrückt', 'abdrücken', 'druck geprüft', 'druckprobe gemacht'], fach: 'Dichtheits- und Belastungsprüfung (Druckprobe) durchgeführt', kategorie: 'pruefung', normen: ['DIN EN 806-4', 'ZVSHK-Merkblatt Dichtheitsprüfung'], werkzeug: ['Druckprüfpumpe mit Manometer'] },
  { aliases: ['gespült', 'spülen', 'durchgespült'], fach: 'Leitungsnetz nach ZVSHK-Merkblatt gespült', kategorie: 'pruefung', normen: ['DIN EN 806-4'] },
  { aliases: ['entlüftet', 'entlüften', 'luft rausgelassen'], fach: 'Anlage entlüftet', kategorie: 'taetigkeit' },
  { aliases: ['isoliert', 'gedämmt', 'isolieren', 'eingepackt'], fach: 'Rohrleitung nach GEG gedämmt', kategorie: 'taetigkeit', material: ['Rohrdämmung nach GEG (Dämmschichtdicke = Innendurchmesser)'], normen: ['GEG Anlage 8'] },
  { aliases: ['gebohrt', 'löcher gebohrt', 'bohren'], fach: 'Befestigungspunkte gebohrt', kategorie: 'taetigkeit' },
  { aliases: ['gestemmt', 'aufgestemmt', 'stemmen'], fach: 'Wandschlitze/Durchbrüche gestemmt', kategorie: 'taetigkeit' },
  { aliases: ['demontiert', 'ausgebaut', 'rausgerissen', 'abgerissen', 'raus gemacht'], fach: 'demontiert und fachgerecht entsorgt', kategorie: 'taetigkeit' },
  { aliases: ['in betrieb genommen', 'inbetriebnahme', 'angefahren', 'eingeschaltet'], fach: 'Anlage in Betrieb genommen und eingeregelt', kategorie: 'taetigkeit' },
  { aliases: ['eingestellt', 'einregulieren', 'einreguliert', 'abgeglichen'], fach: 'hydraulisch abgeglichen und eingeregelt', kategorie: 'taetigkeit' },
  { aliases: ['aufgeräumt', 'saubergemacht', 'baustelle gereinigt'], fach: 'Arbeitsbereich gereinigt und Material entsorgt', kategorie: 'taetigkeit' },
  { aliases: ['unterwiesen', 'eingewiesen', 'gezeigt bekommen'], fach: 'Unterweisung durch den Ausbilder erhalten', kategorie: 'taetigkeit' },
  { aliases: ['berufsschule', 'schule'], fach: 'Berufsschule', kategorie: 'taetigkeit' },
  { aliases: ['unterricht', 'theorieunterricht'], fach: 'Berufsschulunterricht', kategorie: 'taetigkeit' },

  // ---------------------------------------------------------- Bauteile
  { aliases: ['druckminderer', 'druck minderer', 'druckreduzierer'], fach: 'Druckminderer', kategorie: 'bauteil', normen: ['DIN EN 1567'] },
  { aliases: ['rückschlagventil', 'rückflussverhinderer', 'rückschlagklappe'], fach: 'Rückflussverhinderer', kategorie: 'bauteil', normen: ['DIN EN 1717'] },
  { aliases: ['systemtrenner', 'ba ventil', 'rohrtrenner'], fach: 'Systemtrenner BA nach DIN EN 1717', kategorie: 'bauteil', normen: ['DIN EN 1717'] },
  { aliases: ['schmutzfänger', 'schlammfänger', 'filter', 'feinfilter'], fach: 'Feinfilter bzw. Schmutzfänger', kategorie: 'bauteil' },
  { aliases: ['wasserzähler', 'wasseruhr', 'zähler'], fach: 'Wasserzähler', kategorie: 'bauteil' },
  { aliases: ['eckventil', 'eckventile'], fach: 'Eckventil (Geräteanschlussventil)', kategorie: 'bauteil', material: ['Eckventil DN 15 mit Rosette'] },
  { aliases: ['kugelhahn', 'kugelventil', 'absperrhahn', 'absperrung'], fach: 'Kugelabsperrventil', kategorie: 'bauteil' },
  { aliases: ['freistromventil', 'schrägsitzventil'], fach: 'Schrägsitz-Freistromventil', kategorie: 'bauteil' },
  { aliases: ['thermostatventil', 'thermostat', 'heizkörperventil'], fach: 'Thermostatventil mit voreinstellbarer Ventileinsatz', kategorie: 'bauteil' },
  { aliases: ['rücklaufverschraubung', 'rücklauf'], fach: 'Rücklaufverschraubung', kategorie: 'bauteil' },
  { aliases: ['ausdehnungsgefäß', 'mag', 'ausgleichsgefäß', 'membranausdehnungsgefäß'], fach: 'Membran-Ausdehnungsgefäß (MAG)', kategorie: 'bauteil', normen: ['DIN EN 12828'] },
  { aliases: ['sicherheitsventil', 'sv', 'überdruckventil'], fach: 'Sicherheitsventil', kategorie: 'bauteil', normen: ['DIN EN 1489', 'DIN EN 12828'] },
  { aliases: ['umwälzpumpe', 'heizungspumpe', 'pumpe'], fach: 'Umwälzpumpe (Hocheffizienzpumpe)', kategorie: 'bauteil' },
  { aliases: ['zirkulationspumpe', 'zirku'], fach: 'Zirkulationspumpe', kategorie: 'bauteil', normen: ['DVGW W 551'] },
  { aliases: ['schwerkraftbremse', 'rückflussbremse'], fach: 'Schwerkraftbremse', kategorie: 'bauteil' },
  { aliases: ['mischer', 'dreiwegemischer', 'mischventil'], fach: 'Dreiwege-Mischventil', kategorie: 'bauteil' },
  { aliases: ['brennwertkessel', 'brennwertgerät', 'therme', 'gastherme', 'heizkessel', 'kessel'], fach: 'Gas-Brennwertgerät', kategorie: 'bauteil', normen: ['TRGI 2018 (DVGW-TRGI G 600)'] },
  { aliases: ['wärmepumpe', 'luftwärmepumpe', 'wp'], fach: 'Wärmepumpe (Luft/Wasser)', kategorie: 'bauteil' },
  { aliases: ['speicher', 'warmwasserspeicher', 'boiler', 'trinkwasserspeicher'], fach: 'Trinkwassererwärmer (Speicher)', kategorie: 'bauteil', normen: ['DVGW W 551'] },
  { aliases: ['frischwasserstation', 'fwst', 'wohnungsstation'], fach: 'Frischwasserstation', kategorie: 'bauteil' },
  { aliases: ['heizkreisverteiler', 'verteiler', 'fußbodenheizungsverteiler'], fach: 'Heizkreisverteiler', kategorie: 'bauteil', normen: ['DIN EN 1264'] },
  { aliases: ['fußbodenheizung', 'fbh', 'flächenheizung'], fach: 'Fußbodenheizung (Flächenheizung)', kategorie: 'bauteil', normen: ['DIN EN 1264'] },
  { aliases: ['heizkörper', 'radiator', 'rippe'], fach: 'Heizkörper', kategorie: 'bauteil' },
  { aliases: ['hebeanlage', 'abwasserhebeanlage', 'pumpstation'], fach: 'Abwasserhebeanlage', kategorie: 'bauteil', normen: ['DIN EN 12050'] },
  { aliases: ['rückstauverschluss', 'rückstauklappe'], fach: 'Rückstauverschluss', kategorie: 'bauteil', normen: ['DIN EN 13564'] },
  { aliases: ['siphon', 'geruchsverschluss', 'geruchverschluss'], fach: 'Geruchsverschluss (Siphon)', kategorie: 'bauteil' },
  { aliases: ['rohrbelüfter', 'belüftungsventil', 'lüftungsventil'], fach: 'Rohrbelüfter (Belüftungsventil)', kategorie: 'bauteil', normen: ['DIN EN 12056-2'] },
  { aliases: ['reinigungsöffnung', 'putzstück', 'reinigungsrohr'], fach: 'Reinigungsöffnung (Putzstück)', kategorie: 'bauteil' },
  { aliases: ['vorwandinstallation', 'vorwand', 'sanitärmodul', 'spülkasten unterputz'], fach: 'Vorwandinstallation mit Sanitärmodul', kategorie: 'bauteil' },
  { aliases: ['wc', 'toilette', 'klo', 'wandhängendes wc'], fach: 'Wand-WC', kategorie: 'bauteil' },
  { aliases: ['waschtisch', 'waschbecken'], fach: 'Waschtisch', kategorie: 'bauteil' },
  { aliases: ['dusche', 'duschwanne', 'duschtasse'], fach: 'Duschwanne bzw. bodengleiche Dusche', kategorie: 'bauteil' },
  { aliases: ['strangregulierventil', 'srv', 'regulierventil'], fach: 'Strangregulierventil', kategorie: 'bauteil' },
  { aliases: ['gasströmungswächter', 'gsw'], fach: 'Gasströmungswächter', kategorie: 'bauteil', normen: ['TRGI 2018'] },
  { aliases: ['tae', 'thermische absperreinrichtung'], fach: 'Thermisch auslösende Absperreinrichtung (TAE)', kategorie: 'bauteil', normen: ['TRGI 2018'] },
  { aliases: ['neutralisation', 'neutralisationsbox'], fach: 'Neutralisationseinrichtung für Kondensat', kategorie: 'bauteil' },
  { aliases: ['abgasleitung', 'abgasrohr', 'lasleitung', 'las'], fach: 'Abgasleitung (LAS-System)', kategorie: 'bauteil', normen: ['TRGI 2018'] },

  // ---------------------------------------------------------- Material / Kleinteile
  { aliases: ['schelle', 'schellen', 'rohrschelle'], fach: 'Rohrschelle mit Gummieinlage', kategorie: 'material', material: ['Rohrschellen mit Gummieinlage'] },
  { aliases: ['gewindestange', 'stange m8', 'stange m10'], fach: 'Gewindestange M8/M10', kategorie: 'material', material: ['Gewindestange M8/M10'] },
  { aliases: ['dübel', 'dübeln'], fach: 'Dübel mit passender Schraube', kategorie: 'material', material: ['Dübel und Schrauben'] },
  { aliases: ['montageschiene', 'schiene', 'c-profil'], fach: 'Montageschiene (C-Profil)', kategorie: 'material', material: ['Montageschiene C-Profil'] },
  { aliases: ['brandschutzmanschette', 'manschette'], fach: 'Brandschutzmanschette', kategorie: 'material', material: ['Brandschutzmanschette R90'], normen: ['MLAR'] },
  { aliases: ['dämmung', 'isolierung', 'armaflex'], fach: 'Rohrdämmung', kategorie: 'material', material: ['Rohrdämmung nach GEG'] },
  { aliases: ['kernbohrung', 'wanddurchbruch', 'durchbruch'], fach: 'Kernbohrung / Wanddurchbruch', kategorie: 'taetigkeit' },
];

/**
 * Kompakte Wissensbasis für Erklärungen ohne KI-Schlüssel ("Fachmodus offline").
 * Mit KI-Schlüssel liefert die KI ausführlichere, kontextbezogene Texte.
 */
export const WISSEN = {
  druckminderer: {
    begriff: 'Druckminderer',
    kurz: 'Ein Druckminderer reduziert einen schwankenden, hohen Vordruck aus dem Versorgungsnetz auf einen konstant einstellbaren, niedrigeren Hinterdruck.',
    funktion:
      'Der Druckminderer arbeitet als federbelastetes Membranventil. Der Hinterdruck wirkt auf eine Membran, die gegen eine einstellbare Feder drückt. Steigt der Hinterdruck über den Sollwert, wird die Membran gegen die Feder bewegt und schließt den Ventilkegel weiter – der Durchfluss und damit der Druck sinken. Fällt der Hinterdruck (z. B. bei Zapfung), öffnet die Feder das Ventil wieder. So stellt sich unabhängig vom Vordruck ein annähernd konstanter Hinterdruck ein (Proportionalregelung ohne Fremdenergie).',
    aufbau: [
      'Gehäuse aus Messing/Rotguss mit Eingang (Vordruck) und Ausgang (Hinterdruck)',
      'Ventilsitz und Ventilkegel mit Dichtung',
      'Steuermembran, die den Hinterdruck abtastet',
      'Einstellfeder mit Sollwertverstellung (Handrad/Schraube)',
      'meist integriertes Sieb und Manometeranschluss (G 1/4)',
    ],
    einsatz: [
      'Trinkwasserinstallation hinter Wasserzähler und Filter (Hauswasserstation)',
      'Absenkung des Ruhedrucks auf 3 bis 4 bar zum Schutz von Armaturen und Geräten',
      'Vorgeschrieben, wenn der Ruhedruck über 5 bar liegt (DIN 1988-200)',
      'Reduzierung von Fließgeräuschen und Wasserverbrauch',
    ],
    hinweise: [
      'Einbau in Fließrichtung, waagerecht mit Sollwertfeder nach oben',
      'Vordruck sollte mindestens 1 bar über dem Hinterdruck liegen, sonst keine stabile Regelung',
      'Wartung: Sieb und Ventileinsatz nach Herstellerangabe prüfen, Einstellwert am Manometer kontrollieren',
    ],
    stoerungen: [
      'Hinterdruck steigt langsam an (Nachlaufen): Ventilsitz oder Dichtung verschmutzt/verschlissen',
      'Druckschwankungen und Pfeifen: Membran defekt oder Feder falsch eingestellt',
      'Kein Durchfluss: Sieb zugesetzt',
    ],
    ueberdruck:
      'Bleibt der Druckminderer defekt offen (z. B. durch einen Fremdkörper auf dem Ventilsitz), steigt der Hinterdruck auf Vordruckniveau. Bei zusätzlich erwärmtem Wasser entsteht durch die Wärmeausdehnung ein weiterer Druckanstieg. Dann übernimmt das Sicherheitsventil des Trinkwassererwärmers: Es öffnet ab dem eingestellten Ansprechdruck (üblich 6 bzw. 10 bar), bläst über die Ablaufleitung offen und sichtbar in den Trichtersiphon ab und schützt Speicher und Leitungsnetz. Bleibt auch das aus, drohen Armaturenschäden, undichte Verschraubungen, Geräusche und im Extremfall Rohrbruch durch Überschreiten des zulässigen Betriebsdrucks (PN 10/PN 16).',
    normen: ['DIN EN 1567 (Druckminderer)', 'DIN 1988-200', 'DIN EN 806'],
  },
  sicherheitsventil: {
    begriff: 'Sicherheitsventil',
    kurz: 'Das Sicherheitsventil ist die letzte Schutzeinrichtung gegen unzulässigen Überdruck in Trinkwassererwärmern und geschlossenen Heizungsanlagen.',
    funktion:
      'Ein federbelasteter Ventilkegel wird durch den Anlagendruck gegen die Feder gedrückt. Erreicht der Druck den Ansprechdruck, hebt der Kegel vom Sitz ab und lässt so viel Medium ab, dass der Druck nicht weiter steigt (Abblaseleistung). Nach dem Druckabfall schließt die Feder das Ventil wieder.',
    aufbau: ['Gehäuse mit Ein- und Austritt', 'Ventilsitz und Ventilkegel mit Dichtung', 'Einstellfeder mit festem Ansprechdruck', 'Anlüftvorrichtung (Drehknopf) zur Funktionsprüfung'],
    einsatz: [
      'Trinkwassererwärmer: 6 bar oder 10 bar, passend zum zulässigen Speicherdruck',
      'Geschlossene Heizungsanlage: meist 2,5 oder 3 bar in der Sicherheitsgruppe',
      'Immer in der Zuleitung ohne Absperrung zwischen Ventil und Speicher',
    ],
    hinweise: [
      'Abblaseleitung offen und beobachtbar über Trichtersiphon führen',
      'Schild „Während der Beheizung kann Wasser austreten" anbringen',
      'Regelmäßige Funktionsprüfung durch Anlüften',
    ],
    stoerungen: ['Ständiges Tropfen: Vordruck zu hoch, Ausdehnungsgefäß defekt oder Sitz verschmutzt', 'Kein Abblasen: Ventil verkalkt/festsitzend'],
    normen: ['DIN EN 1489', 'DIN EN 12828', 'DIN 4753'],
  },
  ausdehnungsgefaess: {
    begriff: 'Membran-Ausdehnungsgefäß (MAG)',
    kurz: 'Das MAG nimmt die Volumenänderung des Heiz- oder Trinkwassers durch Erwärmung auf und hält den Anlagendruck in engen Grenzen.',
    funktion:
      'Im Gefäß trennt eine Membran das Wasser von einem mit Stickstoff oder Luft vorgespannten Gasraum. Erwärmt sich das Anlagenwasser, dehnt es sich aus, strömt in das Gefäß und komprimiert das Gaspolster. Beim Abkühlen drückt das Gaspolster das Wasser zurück in die Anlage. So bleibt der Druck zwischen Mindest- und Enddruck.',
    aufbau: ['Stahlblechbehälter', 'Butyl-Membran', 'Gasraum mit Ventil zum Einstellen des Vordrucks', 'Wasseranschluss mit Kappenventil (KFE)'],
    einsatz: ['Geschlossene Heizungsanlagen nach DIN EN 12828', 'Trinkwassererwärmer (durchströmtes, trinkwassergeeignetes MAG)'],
    hinweise: [
      'Vordruck = statische Höhe/10 + 0,3 bar (Heizung), drucklos prüfen',
      'Größe abhängig von Wasserinhalt, Vorlauftemperatur und statischer Höhe',
      'Prüfung: Wasserseite entlasten, Gasvordruck am Ventil messen',
    ],
    stoerungen: ['Sicherheitsventil bläst bei Erwärmung ab: MAG zu klein, Vordruck falsch oder Membran defekt', 'Druckabfall beim Abkühlen bis unter Mindestdruck: zu wenig Anlagenwasser'],
    normen: ['DIN EN 12828', 'DIN 4807'],
  },
  systemtrenner: {
    begriff: 'Systemtrenner BA',
    kurz: 'Ein Systemtrenner verhindert, dass Nichttrinkwasser in die Trinkwasserinstallation zurückfließen kann.',
    funktion:
      'Der Systemtrenner BA arbeitet mit drei Druckzonen: Eingangszone, Mittelzone und Ausgangszone, getrennt durch zwei Rückflussverhinderer. Ein Ablassventil an der Mittelzone öffnet, sobald der Differenzdruck zu klein wird (Rückdrücken, Rückfließen oder Rücksaugen). Die Mittelzone wird dann zur Atmosphäre entleert – eine durchgehende Verbindung zum Trinkwasser ist damit ausgeschlossen.',
    aufbau: ['Eingangs- und Ausgangs-Rückflussverhinderer', 'Mittelzone mit membrangesteuertem Ablassventil', 'Prüfstutzen für die Funktionsprüfung', 'vorgeschalteter Filter'],
    einsatz: ['Anschluss von Heizungsfüllstationen, Gartenbewässerung, gewerblichen Anlagen', 'Sicherungsarmatur für Flüssigkeitskategorie 4 nach DIN EN 1717'],
    hinweise: ['Ablauf frei und mit Trichtersiphon ausführen', 'Jährliche Wartung/Prüfung mit Prüfset', 'Vor dem Systemtrenner absperren und Filter reinigen'],
    normen: ['DIN EN 1717', 'DIN EN 12729', 'DIN 1988-100'],
  },
  rueckflussverhinderer: {
    begriff: 'Rückflussverhinderer',
    kurz: 'Ein Rückflussverhinderer lässt das Medium nur in eine Richtung strömen und sichert gegen Rückfließen.',
    funktion:
      'Ein federbelasteter Ventilteller oder eine Klappe wird durch die Strömung geöffnet. Lässt die Strömung nach oder kehrt sie sich um, schließt die Feder bzw. der Rückdruck das Ventil selbsttätig auf dem Sitz.',
    aufbau: ['Gehäuse (Messing/Rotguss)', 'Ventilteller oder Klappe mit Dichtung', 'Schließfeder', 'teilweise Prüfstopfen'],
    einsatz: ['Hinter dem Wasserzähler in der Hauswasserstation', 'Vor Trinkwassererwärmern', 'An Zirkulationsleitungen und Pumpengruppen'],
    hinweise: ['Einbaurichtung (Pfeil) beachten', 'Nur Sicherung gegen Rückfließen – kein vollwertiger Systemtrenner', 'Prüfbar ausführen, wo gefordert'],
    normen: ['DIN EN 1717', 'DIN EN 13959'],
  },
  thermostatventil: {
    begriff: 'Thermostatventil',
    kurz: 'Das Thermostatventil regelt den Heizwasserdurchfluss eines Heizkörpers abhängig von der Raumtemperatur.',
    funktion:
      'Im Thermostatkopf sitzt ein Fühlerelement mit Flüssigkeit, Gas oder Wachs. Steigt die Raumtemperatur, dehnt sich der Stoff aus und schiebt über den Ventilstift den Ventilkegel in Richtung Sitz – der Durchfluss sinkt. Kühlt der Raum ab, zieht sich das Element zusammen und das Ventil öffnet. Es ist ein Proportionalregler ohne Fremdenergie.',
    aufbau: ['Ventilgehäuse mit Sitz und Kegel', 'voreinstellbarer Ventileinsatz (Durchflussbegrenzung für den hydraulischen Abgleich)', 'Thermostatkopf mit Fühlerelement und Sollwertskala'],
    einsatz: ['Heizkörper in Ein- und Zweirohranlagen', 'Grundlage des hydraulischen Abgleichs über die Voreinstellung'],
    hinweise: ['Kopf frei anströmbar montieren (nicht verdeckt/hinter Vorhang)', 'Voreinstellwert aus der Heizlast- und Massenstromberechnung', 'Im Sommer Ventil gelegentlich öffnen, damit der Kegel nicht festsitzt'],
    stoerungen: ['Heizkörper wird nicht warm: Ventilstift festsitzend oder Voreinstellung zu klein', 'Heizkörper immer heiß: Fühlerelement defekt'],
    normen: ['DIN EN 215'],
  },
  hydraulischer_abgleich: {
    begriff: 'Hydraulischer Abgleich',
    kurz: 'Beim hydraulischen Abgleich wird jedem Heizkreis genau der Wassermassenstrom zugeteilt, den er für seine Heizlast braucht.',
    funktion:
      'Wasser nimmt immer den Weg des geringsten Widerstands. Ohne Abgleich werden pumpennahe Heizflächen überversorgt und entfernte unterversorgt. Über voreinstellbare Ventileinsätze, Strangregulierventile oder Durchflussanzeiger am Verteiler wird jedem Kreis ein definierter Druckverlust aufgeprägt, sodass der berechnete Massenstrom fließt.',
    aufbau: ['Heizlastberechnung je Raum (DIN EN 12831)', 'Massenstromberechnung aus Heizlast und Temperaturdifferenz', 'Voreinstellwerte aus dem Ventildiagramm', 'Einstellung von Pumpenförderhöhe und Regelart'],
    einsatz: ['Neuanlagen und Bestandsanlagen (Pflicht bei Heizungsoptimierung)', 'Voraussetzung für niedrige Rücklauftemperaturen und effizienten Wärmepumpenbetrieb'],
    hinweise: ['Ohne Abgleich: Geräusche, Über-/Unterversorgung, hoher Stromverbrauch der Pumpe', 'Nach dem Abgleich Protokoll erstellen'],
    normen: ['DIN EN 12831', 'VOB/C DIN 18380', 'VdZ-Formular'],
  },
  legionellen: {
    begriff: 'Legionellenschutz in der Trinkwasserinstallation',
    kurz: 'Legionellen vermehren sich in lauwarmem, stagnierendem Trinkwasser; Temperaturhaltung und regelmäßiger Wasseraustausch verhindern das.',
    funktion:
      'Legionellen wachsen bevorzeugt zwischen 25 °C und 45 °C. Deshalb gilt: kaltes Trinkwasser dauerhaft unter 25 °C halten, warmes Trinkwasser am Speicherausgang mit mindestens 60 °C und am Zirkulationsrücklauf mit mindestens 55 °C betreiben (DVGW W 551). Der bestimmungsgemäße Betrieb – Nutzung oder automatische Spülung alle 72 Stunden – verhindert Stagnation.',
    aufbau: ['Trinkwassererwärmer mit 60 °C Austrittstemperatur', 'Zirkulationssystem mit Strangregulierventilen', 'Spülstationen für selten genutzte Entnahmestellen', 'räumliche Trennung und Dämmung von kalt und warm'],
    einsatz: ['Großanlagen (> 400 l Speicher oder > 3 l Leitungsinhalt) mit Untersuchungspflicht', 'Wohngebäude mit zentraler Trinkwassererwärmung'],
    hinweise: ['Tote Leitungsstränge zurückbauen, nicht nur absperren', 'Probenahmestellen vorsehen', 'Kaltwasserleitungen nicht neben Warmwasser oder Heizung dämmen'],
    normen: ['DVGW W 551', 'DIN EN 806', 'Trinkwasserverordnung'],
  },
  sml: {
    begriff: 'SML-Abflussrohr',
    kurz: 'SML ist ein gusseisernes Abflussrohr ohne Muffe, das mit Verbindungsschellen gefügt wird – schwer, schalldämmend und sehr robust.',
    funktion:
      'Die Rohre werden stumpf gestoßen und mit einer Verbindungsschelle (CV-/Rapid-Verbinder) aus Edelstahlmantel und Elastomerdichtung kraft- und formschlüssig verbunden. Die hohe Masse des Gusses dämpft Körper- und Luftschall, was SML für Fallleitungen in Wohngebäuden interessant macht.',
    aufbau: ['Gussrohr mit Innen- und Außenbeschichtung', 'Verbindungsschelle mit Dichtmanschette', 'Formteile: Bogen, Abzweig, Reduzierung, Reinigungsstück'],
    einsatz: ['Schmutzwasser-Fall- und Sammelleitungen in Gebäuden', 'Nennweiten DN 50 bis DN 300, üblich DN 70/DN 100/DN 125'],
    hinweise: [
      'Trennen mit Winkelschleifer und Trennscheibe oder Trennkette; Schnittkanten entgraten und Korrosionsschutz nachbessern',
      'Fallleitung mit Festpunkten und Führungsschellen befestigen (Schallschutz nach DIN 4109)',
      'Mindestgefälle bei Sammelleitungen beachten (DIN 1986-100)',
    ],
    normen: ['DIN EN 877', 'DIN EN 12056', 'DIN 1986-100', 'DIN 4109'],
  },
  pressfitting: {
    begriff: 'Pressfitting',
    kurz: 'Pressfittings erzeugen eine unlösbare, dichte Rohrverbindung durch plastische Umformung mit einer Pressmaschine.',
    funktion:
      'Das abgelängte und entgratete Rohr wird bis zum Endanschlag in den Fitting gesteckt. Die Pressbacke verformt Fittingschulter und Rohr, wobei der eingelegte O-Ring in die Dichtzone gepresst wird. Die Verpressung ist form- und kraftschlüssig und damit unlösbar.',
    aufbau: ['Fittingkörper (Kupfer, Edelstahl, C-Stahl, Rotguss)', 'O-Ring aus EPDM (Trinkwasser/Heizung) oder FKM (Solar)', 'Presskontur M, V, TH oder U je nach System', 'teilweise Leckageanzeige (unverpresst sichtbar undicht)'],
    einsatz: ['Trinkwasser-, Heizungs- und Gasinstallation (systemabhängig zugelassen)', 'Nennweiten 12 bis 108 mm'],
    hinweise: [
      'Nur Rohre, Fittings und Backen eines zugelassenen Systems kombinieren',
      'Einstecktiefe markieren und nach dem Pressen prüfen',
      'Presskontur und Backenpflege beachten, Pressvorgang nicht unterbrechen',
    ],
    normen: ['DIN EN 1057', 'DIN 1988-200', 'DVGW-Arbeitsblätter'],
  },
  druckprobe: {
    begriff: 'Dichtheitsprüfung / Druckprobe',
    kurz: 'Vor dem Verschließen der Installation wird das Leitungsnetz auf Dichtheit und Festigkeit geprüft und protokolliert.',
    funktion:
      'Trinkwasserleitungen werden nach ZVSHK-Merkblatt bevorzugt mit ölfreier Druckluft oder Inertgas geprüft (Dichtheitsprüfung 150 mbar, Belastungsprüfung 3 bar bis DN 50), weil stehendes Wasser in unbenutzten Leitungen hygienisch kritisch ist. Alternativ erfolgt die Prüfung mit gefiltertem Trinkwasser, wenn die Anlage direkt in Betrieb geht. Heizungsanlagen werden hydraulisch mit dem 1,3-fachen Betriebsdruck geprüft. Während der Prüfzeit darf der Druck nicht abfallen.',
    aufbau: ['Druckprüfpumpe oder Prüfgerät mit geeichtem Manometer', 'Prüfprotokoll mit Datum, Medium, Prüfdruck und Prüfzeit', 'Absperrungen und Endstopfen'],
    einsatz: ['Neuinstallation vor dem Verschließen von Schächten und Wänden', 'Nach Reparaturen und Erweiterungen'],
    hinweise: ['Temperaturausgleich abwarten, sonst falsche Druckwerte', 'Bauteile mit geringerem zulässigen Druck abtrennen', 'Protokoll vom Kunden gegenzeichnen lassen'],
    normen: ['DIN EN 806-4', 'ZVSHK-Merkblatt „Dichtheitsprüfung"', 'DIN 18380 (VOB/C)'],
  },
  geruchsverschluss: {
    begriff: 'Geruchsverschluss (Siphon)',
    kurz: 'Der Geruchsverschluss hält mit einer Wassersperre die Kanalgase aus dem Raum.',
    funktion:
      'Das ablaufende Wasser füllt eine U-förmige Kammer. Die stehende Wassersäule (Sperrwasserhöhe mindestens 50 mm) verschließt die Leitung gasdicht. Beim nächsten Ablauf wird das Sperrwasser ausgetauscht.',
    aufbau: ['Tauchrohr und Ablaufbogen', 'abnehmbare Reinigungsöffnung oder Tasse', 'teilweise Geräteanschluss für Waschmaschine'],
    einsatz: ['Alle Entwässerungsgegenstände: Waschtisch, Dusche, Spüle, Bodenablauf'],
    hinweise: [
      'Sperrwasserverlust durch Verdunstung bei selten genutzten Abläufen – Nachfüllen oder Trockensiphon einsetzen',
      'Unterdruck in der Fallleitung kann das Sperrwasser aussaugen: ausreichende Lüftung nach DIN EN 12056-2',
    ],
    normen: ['DIN EN 12056-2', 'DIN 1986-100'],
  },
  waermepumpe: {
    begriff: 'Wärmepumpe',
    kurz: 'Die Wärmepumpe hebt Umweltwärme mit elektrischer Antriebsenergie auf ein nutzbares Temperaturniveau.',
    funktion:
      'Im linksdrehenden Kältekreis verdampft ein Kältemittel bei niedrigem Druck und nimmt dabei Wärme aus Luft, Erde oder Wasser auf (Verdampfer). Der Verdichter hebt Druck und Temperatur an. Im Kondensator gibt das Kältemittel die Wärme an das Heizwasser ab und verflüssigt sich. Das Expansionsventil entspannt es wieder auf den Verdampfungsdruck. Die Leistungszahl COP ist das Verhältnis von Heizleistung zu elektrischer Leistungsaufnahme.',
    aufbau: ['Verdampfer', 'Verdichter (meist invertergeregelt)', 'Kondensator/Wärmeübertrager', 'Expansionsventil', 'Regelung mit Heizkurve, Pufferspeicher, Heizstab'],
    einsatz: ['Neubau und Bestand mit niedrigen Systemtemperaturen', 'Flächenheizung bevorzugt (Vorlauf 30–40 °C)'],
    hinweise: [
      'Jede Grad geringere Vorlauftemperatur verbessert die Jahresarbeitszahl deutlich',
      'Mindestwasserinhalt und Volumenstrom sicherstellen (Pufferspeicher/Überstromventil)',
      'Schallschutz und Kondensatabführung bei Außeneinheiten beachten',
    ],
    normen: ['DIN EN 14511', 'VDI 4645', 'GEG'],
  },
  brennwert: {
    begriff: 'Gas-Brennwertgerät',
    kurz: 'Das Brennwertgerät nutzt zusätzlich die Kondensationswärme des im Abgas enthaltenen Wasserdampfs.',
    funktion:
      'Bei der Verbrennung von Erdgas entsteht Wasserdampf. Wird das Abgas im Wärmeübertrager unter den Wasserdampftaupunkt (Erdgas ca. 57 °C) abgekühlt, kondensiert der Dampf und gibt seine latente Wärme an das Heizwasser ab. Voraussetzung sind niedrige Rücklauftemperaturen – deshalb ist der Brennwertnutzen bei Flächenheizung am größten.',
    aufbau: ['Modulierender Gasbrenner mit Gebläse', 'Brennwert-Wärmeübertrager (Edelstahl/Alu-Silizium)', 'Kondensatablauf mit Siphon', 'Abgasleitung LAS/konzentrisch', 'Regelung mit witterungsgeführter Heizkurve'],
    einsatz: ['Ein- und Mehrfamilienhäuser', 'Modernisierung von Heizwertkesseln'],
    hinweise: [
      'Kondensat über Siphon und ggf. Neutralisation ableiten',
      'Abgasführung nur mit zugelassenen, feuchteunempfindlichen Systemen',
      'Inbetriebnahme mit Messung von CO, CO2/O2 und Abgastemperatur dokumentieren',
    ],
    normen: ['TRGI 2018 (DVGW-TRGI G 600)', 'DIN EN 15502', '1. BImSchV'],
  },
  fussbodenheizung: {
    begriff: 'Fußbodenheizung',
    kurz: 'Die Fußbodenheizung ist eine Flächenheizung mit niedriger Systemtemperatur und hohem Strahlungsanteil.',
    funktion:
      'Im Estrich verlegte Rohrschlangen geben die Wärme über die Bodenfläche überwiegend als Strahlung ab. Wegen der großen Fläche genügen Vorlauftemperaturen von 30–40 °C. Die Auslegung erfolgt über Heizlast, Verlegeabstand, Estrichüberdeckung und Bodenbelagswiderstand.',
    aufbau: ['Dämmung mit Randdämmstreifen', 'Systemplatte/Tackerplatte', 'PE-RT- oder Mehrschichtverbundrohr 16×2 oder 17×2', 'Heizkreisverteiler mit Durchflussanzeigern', 'Regelung über Raumthermostate und Stellantriebe'],
    einsatz: ['Neubau und Sanierung, ideal für Wärmepumpen'],
    hinweise: [
      'Mindestüberdeckung nach DIN EN 1264 beachten, Heizkreislänge begrenzen (Druckverlust)',
      'Funktionsheizen und Belegreifheizen protokollieren',
      'Vor dem Estricheinbau Druckprobe unter Druck halten',
    ],
    normen: ['DIN EN 1264', 'DIN 18560', 'VOB/C DIN 18380'],
  },
  hebeanlage: {
    begriff: 'Abwasserhebeanlage',
    kurz: 'Eine Hebeanlage fördert Abwasser aus Räumen unterhalb der Rückstauebene über eine Schleife oberhalb dieser Ebene in den Kanal.',
    funktion:
      'Das Abwasser läuft in einen geschlossenen Sammelbehälter. Ein Niveauschalter startet die Pumpe, die das Wasser über eine Druckleitung fördert. Die Druckleitung wird über die Rückstauebene geführt (Rückstauschleife) und erst danach in die Grundleitung eingebunden, sodass Rückstau aus dem Kanal nicht in die Räume gelangt.',
    aufbau: ['Sammelbehälter (geruchs- und wasserdicht)', 'Pumpe mit Schneidwerk oder Freistromrad', 'Rückflussverhinderer in der Druckleitung', 'Niveausteuerung mit Alarm', 'Entlüftung über Dach'],
    einsatz: ['Kellerbäder, Waschküchen, Tiefgaragenentwässerung'],
    hinweise: ['Rückstauschleife zwingend erforderlich', 'Wartung nach DIN EN 12056-4 (Gewerbe: halbjährlich)', 'Notüberlauf und Alarmmelder vorsehen'],
    normen: ['DIN EN 12050', 'DIN EN 12056-4', 'DIN 1986-100'],
  },
  zirkulation: {
    begriff: 'Zirkulationsleitung',
    kurz: 'Die Zirkulation hält warmes Trinkwasser in Bewegung, damit an jeder Entnahmestelle schnell warmes Wasser ansteht und die Temperatur hygienisch bleibt.',
    funktion:
      'Eine Zirkulationspumpe fördert Warmwasser im Kreis vom Speicher über die Steigleitungen zurück zum Speicher. Strangregulierventile mit Thermostatfunktion gleichen die Stränge ab, sodass der Rücklauf überall mindestens 55 °C hält (DVGW W 551).',
    aufbau: ['Zirkulationspumpe mit Zeit-/Temperatursteuerung', 'Rückflussverhinderer', 'Strangregulierventile', 'Dämmung nach GEG'],
    einsatz: ['Erforderlich, wenn das Leitungsvolumen zwischen Erwärmer und Entnahmestelle 3 l übersteigt'],
    hinweise: ['Abschaltung max. 8 Stunden pro Tag zulässig', 'Zirkulation nicht in die Kaltwasserleitung einbinden', 'Kalt- und Warmleitungen getrennt dämmen'],
    normen: ['DVGW W 551', 'DIN 1988-200', 'GEG'],
  },
  trgi: {
    begriff: 'TRGI – Technische Regel für Gasinstallationen',
    kurz: 'Die DVGW-TRGI G 600 regelt Planung, Errichtung, Änderung und Instandhaltung von Gasleitungsanlagen in Gebäuden.',
    funktion:
      'Die TRGI legt unter anderem Rohrwerkstoffe und Verbindungstechniken, die Leitungsdimensionierung nach Spitzenvolumenstrom, Anforderungen an Absperrarmaturen, Gasströmungswächter und thermisch auslösende Absperreinrichtungen, die Verbrennungsluftversorgung sowie die Dichtheits- und Belastungsprüfung fest.',
    aufbau: ['Belastungsprüfung mit 1 bar Luft', 'Dichtheitsprüfung mit 150 mbar', 'Gebrauchsfähigkeitsprüfung im Bestand über Leckmengenmessung'],
    einsatz: ['Alle Gasinstallationen hinter der Hauptabsperreinrichtung'],
    hinweise: ['Arbeiten an Gasanlagen nur durch ein beim Netzbetreiber eingetragenes Installationsunternehmen', 'Bei Gasgeruch: nicht schalten, Hauptabsperreinrichtung schließen, lüften, Netzbetreiber informieren'],
    normen: ['DVGW-TRGI G 600 (2018)', 'DIN EN 1775'],
  },
};

/** Standard-Werkzeug, das in fast jedem Einsatz dabei ist. */
export const GRUNDWERKZEUG = [
  'Zollstock und Anreißstift',
  'Wasserwaage',
  'Akkuschrauber',
  'Wasserpumpenzange',
  'Persönliche Schutzausrüstung (Handschuhe, Schutzbrille, Sicherheitsschuhe)',
];
