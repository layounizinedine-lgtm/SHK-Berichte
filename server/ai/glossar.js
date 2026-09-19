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
  {
    aliases: ['gussheizkörper', 'guss heizkörper', 'gußheizkörper', 'guß heizkörper', 'heizkörper aus guss', 'heizkörper aus guß', 'gusseiserner heizkörper', 'gußeiserner heizkörper', 'gusseisenheizkörper'],
    fach: 'Gussheizkörper', kategorie: 'bauteil',
    werkzeug: ['Rohrzange', 'Wasserpumpenzange', 'Auffangwanne bzw. Restwasserbehälter'],
    material: ['Dichtungssatz für Heizkörperanschluss', 'Entlüftungsventil'],
    normen: ['DIN EN 12828'],
    hinweis: 'Gussheizkörper sind schwer und spröde – beim Aus- und Einbau Tragehilfe bzw. zweite Person einsetzen und Anschlussgewinde nicht überdrehen; fachgerechte Entsorgung als Alt-/Schrottmetall.',
  },
  {
    aliases: ['röhrenheizkörper', 'röhren heizkörper', 'röhrenradiator', 'röhren radiator'],
    fach: 'Röhrenheizkörper (Röhrenradiator)', kategorie: 'bauteil',
    werkzeug: ['Rohrzange', 'Wasserpumpenzange'],
    material: ['Dichtungssatz für Heizkörperanschluss'],
    normen: ['DIN EN 442'],
  },
  {
    aliases: ['plattenheizkörper', 'platten heizkörper'],
    fach: 'Plattenheizkörper', kategorie: 'bauteil',
    werkzeug: ['Rohrzange', 'Wasserpumpenzange'],
    material: ['Dichtungssatz für Heizkörperanschluss'],
    normen: ['DIN EN 442', 'DIN EN 12828'],
  },
  {
    aliases: ['kompaktheizkörper', 'kompakt heizkörper'],
    fach: 'Kompaktheizkörper', kategorie: 'bauteil',
    werkzeug: ['Rohrzange', 'Wasserpumpenzange'],
    material: ['Dichtungssatz für Heizkörperanschluss'],
    normen: ['DIN EN 442', 'DIN EN 12828'],
  },
  {
    aliases: ['designheizkörper', 'design heizkörper', 'badheizkörper', 'bad heizkörper', 'handtuchheizkörper', 'handtuchtrockner'],
    fach: 'Design-/Badheizkörper (Handtuchheizkörper)', kategorie: 'bauteil',
    werkzeug: ['Rohrzange', 'Wasserpumpenzange'],
    material: ['Dichtungssatz für Heizkörperanschluss'],
    normen: ['DIN EN 442'],
  },
  {
    aliases: ['heizkörper', 'radiator', 'rippe'], fach: 'Heizkörper', kategorie: 'bauteil',
    hinweis: 'Heizkörpertyp nicht genannt – bitte ergänzen (Guss-, Röhren-, Platten-, Kompakt- oder Designheizkörper) für einen präziseren Eintrag.',
  },
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

/** Standard-Werkzeug, das in fast jedem Einsatz dabei ist. */
export const GRUNDWERKZEUG = [
  'Zollstock und Anreißstift',
  'Wasserwaage',
  'Akkuschrauber',
  'Wasserpumpenzange',
  'Persönliche Schutzausrüstung (Handschuhe, Schutzbrille, Sicherheitsschuhe)',
];
