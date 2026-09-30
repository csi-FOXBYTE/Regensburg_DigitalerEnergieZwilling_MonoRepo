# Datenschutzhinweise für das öffentliche Sanierungstool

> **Status:** Entwurf, Stand 6. August 2026  
> **Geltungsbereich:** Öffentlicher/bürgerseitiger Teil des Digitalen Energie Zwillings (DEZ)  
> **Freigabe:** Vor Veröffentlichung durch Betreiber, zuständige Dienststelle und behördlichen Datenschutzbeauftragten zu prüfen. Eckige Klammern kennzeichnen noch zu ergänzende oder verbindlich festzulegende Angaben.

## 1. Verantwortlicher

Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

Stadt Regensburg  
Postfach 11 06 43  
93019 Regensburg  
Telefon: +49 941 507-0  
E-Mail: stadt_regensburg@regensburg.de

Zuständige Dienststelle für das Sanierungstool:

Stadt Regensburg  
Amt für Stadtentwicklung, Abteilung Entwicklungsplanung  
Neues Rathaus  
D.-Martin-Luther-Straße 1  
93047 Regensburg  
Postanschrift: Postfach 11 06 43, 93019 Regensburg  
Telefon: +49 941 507-1661  
E-Mail: [Funktionspostfach für das Sanierungstool ergänzen]

## 2. Behördlicher Datenschutzbeauftragter

Den behördlichen Datenschutzbeauftragten der Stadt Regensburg erreichen Sie unter:

Behördlicher Datenschutzbeauftragter der Stadt Regensburg  
Postfach 11 06 43  
93019 Regensburg  
Hausanschrift: Maximilianstraße 13, 93047 Regensburg  
Telefon: +49 941 507-2114  
E-Mail: datenschutz@regensburg.de

## 3. Überblick

Das Sanierungstool kann ohne Registrierung und ohne Benutzerkonto verwendet werden. Sie wählen ein Gebäude aus und können dessen energetische Eigenschaften anpassen, Sanierungsmaßnahmen vergleichen und einen Bericht erzeugen.

Die Berechnung erfolgt grundsätzlich in Ihrem Browser. Ihre Eingaben werden dabei zunächst nur auf Ihrem Endgerät gespeichert. Eine Übermittlung Ihrer Gebäude- und Berechnungsdaten an die Stadt Regensburg erfolgt nur, wenn Sie der freiwilligen Bereitstellung ausdrücklich zustimmen.

Unabhängig davon fallen beim Aufruf des Angebots technisch erforderliche Verbindungs- und Protokolldaten an. Die Kartenansicht lädt 3D-Gebäude- und Geländedaten aus der CIVITAS/CORE-Umgebung der Stadt Regensburg sowie die TopPlusOpen-Light-Terrain-Textur von `intergeo38.bayernwolke.de`. Einzelheiten finden Sie in den folgenden Abschnitten.

## 4. Aufruf der Webseite und technische Protokolldaten

### Welche Daten werden verarbeitet?

Beim Aufruf der Webseite sowie der zugehörigen Programmierschnittstellen können insbesondere folgende Daten verarbeitet werden:

- IP-Adresse des aufrufenden Geräts,
- Datum und Uhrzeit des Zugriffs,
- aufgerufene Adresse einschließlich Pfad und gegebenenfalls URL-Parameter,
- HTTP-Methode, Statuscode und übertragene Datenmenge,
- zuvor besuchte Seite beziehungsweise Referrer, soweit vom Browser übermittelt,
- Browsertyp, Betriebssystem und User-Agent,
- Hostname sowie technische Angaben zur Weiterleitung an interne Dienste,
- Informationen über Fehler, Antwortzeiten und sicherheitsrelevante Ereignisse.

Die Anfragen durchlaufen den Webserver des öffentlichen Clients und das Web/API-Gateway Apache APISIX. Das Backend basiert auf Node.js, Fastify und Pino. Die Anwendung wird containerisiert in der CIVITAS/CORE-Umgebung der Stadt Regensburg auf Kubernetes betrieben. Technischer Betreiber dieser Umgebung ist [zuständige Stelle der Stadt Regensburg oder beauftragter Betriebsdienstleister mit Kontaktdaten ergänzen]. Protokolle werden innerhalb der CIVITAS/CORE-Umgebung der Stadt Regensburg über [eingesetzte Log-Aggregation und Zielsystem ergänzen] zusammengeführt.

### Zwecke der technischen Verarbeitung

Die Daten werden verarbeitet, um

- die Webseite, 3D-Karte, Konfiguration und Programmierschnittstellen auszuliefern,
- einen stabilen und sicheren Betrieb zu gewährleisten,
- Angriffe, automatisierten Missbrauch und technische Störungen zu erkennen und abzuwehren,
- Fehler zu analysieren und die Verfügbarkeit des Dienstes zu überwachen.

### Rechtsgrundlage und Speicherdauer

Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. e DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG, soweit die Verarbeitung für die Bereitstellung und Absicherung des kommunalen Informationsangebots erforderlich ist.

Die Protokolldaten werden für [konkrete Frist ergänzen] innerhalb der CIVITAS/CORE-Umgebung der Stadt Regensburg gespeichert und anschließend gelöscht oder anonymisiert. Eine längere Speicherung erfolgt nur, wenn dies zur Aufklärung eines konkreten Sicherheitsvorfalls oder zur Erfüllung gesetzlicher Pflichten erforderlich ist.

## 5. Lokale Speicherung im Browser

Das Sanierungstool verwendet im öffentlichen Bereich keine Anmelde-Cookies. Die Berechnung, der Wechsel zwischen Gebäuden, der PDF-Export und die Wiederherstellung über einen Wiederherstellungslink funktionieren auch ohne optionale Speicherung. Ihr Fortschritt wird zunächst nur im Arbeitsspeicher der geöffneten Seite gehalten. Ohne Ihre Einwilligung zur lokalen Speicherung geht er beim Neuladen oder Schließen der Seite verloren.

Erst wenn Sie „Fortschritt & Einstellungen“ ausdrücklich erlauben, speichert die Anwendung zusätzlich Informationen im Local Storage Ihres Browsers. Diese Informationen verbleiben auf Ihrem Endgerät. Die Auswahl gilt unabhängig von einer freiwilligen Bereitstellung Ihrer Daten an die Stadt.

| Schlüssel                        | Inhalt und Zweck                                                                                                                            | Dauer                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `det_consent`                    | Technisch notwendige Speicherung Ihrer ausdrücklich bestätigten Datenschutzentscheidung (Zustimmung oder Ablehnung), Version und Zeitpunkte | 180 Tage ab Bestätigung; ein bloßer Besuch verlängert die Frist nicht                |
| `det_meta`                       | Optional: Kennung des zuletzt bearbeiteten Gebäudes und Bearbeitungsschritt                                                                 | Höchstens 90 Tage; ohne gültigen zugehörigen Gebäudestand wird der Verweis verworfen |
| `det_building_data_<Gebäude-ID>` | Optional: Gebäude mit Adresse, Koordinaten und Merkmalen, Kameraposition, Eingaben, Sanierungsmaßnahmen und Bearbeitungsstand               | 90 Tage ab letzter Fortschrittsspeicherung oder ausdrücklicher Wiederaufnahme        |
| `map-help-seen`                  | Optional: merkt, ob die Kartenhilfe bereits angezeigt wurde                                                                                 | 90 Tage ab Erfassung                                                                 |
| `det_methodology_notice_seen_v1` | Optional: merkt, ob der Methodikhinweis bereits angezeigt wurde                                                                             | 90 Tage ab Erfassung                                                                 |

Die optionalen Einträge enthalten Versions- und Ablaufzeitpunkte. Ein bloßes Auslesen oder Öffnen der Webseite verlängert ihre Frist nicht. Abgelaufene Einträge werden nicht wiederhergestellt und bei einem späteren zulässigen Speicherzugriff entfernt. Während die Webseite geschlossen ist, kann sie Daten nicht physisch löschen. Ohne optionale Speicherung merkt sich die geöffnete Seite bereits gesehene Hinweise nur im Arbeitsspeicher.

Sie können das erste Fenster ohne Entscheidung schließen und weiterrechnen. Dabei wird keine Entscheidung gespeichert; beim nächsten Laden der Berechnungsseite fragen wir erneut. Nach Ablauf einer bestätigten Entscheidung ist die optionale Speicherung wieder ausgeschaltet, bis Sie erneut zustimmen. Datenschutz und Impressum sind ohne automatisches Auswahlfenster erreichbar.

Über „Datenschutzeinstellungen“ im Fußbereich können Sie Ihre Auswahl jederzeit ändern. Nicht bestätigte Änderungen werden beim Schließen verworfen. Bei Zustimmung werden auch bereits auf der geöffneten Seite erarbeitete Stände gespeichert. Bei Ablehnung oder Widerruf wird die optionale Speicherung sofort abgeschaltet und die Anwendung entfernt ihre gespeicherten Gebäudestände und Einstellungen; die bestätigte Datenschutzentscheidung bleibt gespeichert. Ihre Arbeit auf der geöffneten Seite bleibt erhalten. Sperrt der Browser den Speicherzugriff oder die Löschung, weist die Anwendung darauf hin und arbeitet im Arbeitsspeicher weiter. Sie können Websitedaten zusätzlich über die Einstellungen Ihres Browsers löschen.

Werden Browserdaten gemeinsam auf einem Gerät genutzt, können andere Benutzer dieses Geräts gespeicherte Bearbeitungsstände möglicherweise aufrufen.

Die technisch notwendige Speicherung Ihrer ausdrücklich bestätigten Datenschutzentscheidung erfolgt auf Grundlage von § 25 Abs. 2 Nr. 2 TDDDG. Optionale lokale Speicherung und Zugriffe erfolgen nur mit Ihrer vorherigen Einwilligung gemäß § 25 Abs. 1 TDDDG und, soweit personenbezogene Daten betroffen sind, Art. 6 Abs. 1 Buchst. a DSGVO. Ein Widerruf wirkt für die Zukunft.

## 6. Gebäudeauswahl, Datenquellen, Adresssuche und 3D-Karte

### Adresssuche

Für die Adresssuche wird eine aus den LoD2-/CityJSON-Adressobjekten aufbereitete Adressdatenbank aus dem S3-kompatiblen Datendienst der Stadt Regensburg in den Browser geladen. Datenbankformat, interner Speicherort und öffentliche Bereitstellungsroute werden über die CIVITAS/CORE-Konfiguration festgelegt und in der nachfolgenden Datenquellenübersicht ausgewiesen.

Die anschließende Eingabe und Suche nach einer Adresse erfolgt lokal im Browser; die einzelnen Suchbegriffe werden nicht an einen Suchdienst übertragen. Beim Abruf der Adressdatenbank werden in der CIVITAS/CORE-Umgebung der Stadt Regensburg technisch bedingt insbesondere Ihre IP-Adresse, Zeitpunkt, angeforderte Datei sowie Browser- und Verbindungsinformationen verarbeitet.

### 3D-Gebäude, Gelände und Basiskarte

Die Kartenansicht basiert auf Cesium/Resium. 3D-Gebäude- und Geländedaten werden aus dem S3-kompatiblen Datendienst der Stadt Regensburg geladen und über die für den DEZ konfigurierte Backend-Route mit Redirect auf den externen Tiles-Dienst ausgeliefert. Die TopPlusOpen-Light-Textur für das Terrain wird derzeit direkt von einem externen Tile-Endpunkt geladen. Die jeweiligen Bezugs- und Bereitstellungsendpunkte sind in der nachfolgenden Übersicht zusammengeführt.

Bei jedem Abruf werden in der CIVITAS/CORE-Umgebung der Stadt Regensburg insbesondere IP-Adresse, Zeitpunkt, angeforderte Ressource, Referrer und User-Agent verarbeitet. Die Kartenansicht lädt abhängig von Ausschnitt und Zoomstufe mehrere einzelne Kacheln. Beim Abruf der TopPlusOpen-Light-Terrain-Textur erhält auch der Betreiber von `intergeo38.bayernwolke.de` diese technischen Verbindungsdaten.

Zweck ist die Anzeige des Stadtgebiets, die Gebäudeauswahl und die Vorbelegung von Gebäudemerkmalen. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. e DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG.

Die Verarbeitung erfolgt in der CIVITAS/CORE-Umgebung der Stadt Regensburg einschließlich des dort angebundenen S3-kompatiblen Datendienstes. Wird die Umgebung durch einen Auftragsverarbeiter betrieben, ist Empfänger [Betreiber, Anschrift, datenschutzrechtliche Rolle, Verarbeitungsort und Löschfrist ergänzen]. Für den externen TopPlusOpen-Light-Tile-Endpunkt sind zusätzlich [Betreiber von `intergeo38.bayernwolke.de`, Anschrift, datenschutzrechtliche Rolle, Verarbeitungsort, Rechtsgrundlage und Löschfrist ergänzen].

### Datenquellen, Metadaten und Bereitstellung

Die Übersicht schafft Transparenz über die für Kartenansicht, Offline-Anreicherung und Berechnung verwendeten beziehungsweise vorgesehenen Datenquellen. Die Angaben orientieren sich in einem begrenzten Mindestumfang an DCAT-AP.de. Die vollständige fachlich-technische Spezifikation einschließlich stabiler Piveau-Kennungen und offener Abnahmepunkte enthält der [Datenquellenkatalog](../architecture/16-data-sources-dcat-piveau.md). Bei Abweichungen ist dessen dokumentierter Quellenstand maßgeblich.

| Datenquelle (`dct:title`) und abgeleitete Bereitstellung                         | Beschreibung (`dct:description`) und Zweck                                                                                                                                                                      | Herausgeber (`dct:publisher`) und Lizenz (`dct:license`)                                                                                                                                                                                                                                                                                                                                                            | Aktualisierung (`dct:accrualPeriodicity`/`dct:modified`) und Status                                                                                                        | Bezug beziehungsweise `dcat:distribution`                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3D-Gebäudemodelle (LoD2) – Stadt Regensburg; daraus 3D Tiles und Adressdatenbank | Amtliche LoD2-Gebäude der Gemeinde Regensburg (`09362000`) mit Gebäude-IDs, 3D-Geometrie, Attributen und Adressen soweit vorhanden; intern nach CityJSON, 3D Tiles und in die Adressdatenbank überführt         | Landesamt für Digitalisierung, Breitband und Vermessung (LDBV; Bayerische Vermessungsverwaltung); [CC BY 4.0](http://dcat-ap.de/def/licenses/cc-by/4.0) mit vorgeschriebener Namensnennung                                                                                                                                                                                                                          | Quellturnus wöchentlich; tatsächlicher DEZ-Übernahmestand je bereitgestelltem Datenstand; Pflichtquelle, aktuell verwendet                                                 | Quelle: [Gemeinde-Metalink](https://geodaten.bayern.de/odd/a/lod2/citygml/meta/metalink/09362000.meta4); intern: [CityJSON-Objektpfad], 3D Tiles über [Backend-Route `/api/public/tiles/*`, externe Tiles-URL und S3-Objektpfad ergänzen] sowie [Datenbankformat und öffentliche Route der Adressdatenbank ergänzen] |
| Digitales Geländemodell 1 m (DGM1) – Auswahl Regensburg                          | Erdoberfläche ohne Vegetation und Bebauung als Raster mit 1 m Gitterweite für die Terrain-Darstellung; Polygonauswahl ist im Datenquellenkatalog dokumentiert                                                   | Landesamt für Digitalisierung, Breitband und Vermessung (LDBV; Bayerische Vermessungsverwaltung); [CC BY 4.0](http://dcat-ap.de/def/licenses/cc-by/4.0) mit vorgeschriebener Namensnennung                                                                                                                                                                                                                          | Quellaktualisierung losweise; referenzierte Polygonauswahl am 28.07.2026 geprüft; tatsächlichen fachlichen Datenstand ergänzen; produktive Terrain-Aufbereitung noch offen | [DGM1-Produktseite](https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=dgm1); ausgewählte GeoTIFF-Kacheln in EPSG:25832 über [öffentliche APISIX-/Terrain-Route und S3-Objektpfad ergänzen]                                                                                                               |
| TopPlusOpen Light – Terrain-Textur für Regensburg                                | Gekachelte topografische Hintergrundkarte in EPSG:3857 als Textur des DGM1-Terrains; fachlich vom Höhenmodell getrennt                                                                                          | Bundesamt für Kartographie und Geodäsie (BKG); [Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0); Quellenvermerk: „Kartendarstellung: © [BKG](https://www.bkg.bund.de) (`{JAHR_DES_LETZTEN_DATENBEZUGS}`) [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), [Datenquellen](https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_topplusopen.html)“ | Offizieller Quellturnus jährlich; tatsächlichen Datenbezugsstand des Proxy-Dienstes ergänzen; aktuell für die Terrain-Darstellung verwendet                                | Externer Tile-Endpunkt `https://intergeo38.bayernwolke.de/betty/g_topopluslight/{z}/{x}/{y}`; die Anwendung übermittelt dabei technisch bedingt Verbindungsdaten an den Betreiber von `intergeo38.bayernwolke.de`                                                                                                    |
| Baualtersklassen                                                                 | Polygonale Baualtersklassen im GeoPackage zur optionalen Ableitung eines Baujahrs                                                                                                                               | [Originalherausgeber und Nutzungsrecht ergänzen]                                                                                                                                                                                                                                                                                                                                                                    | [Turnus und Datenstand ergänzen]; optionale technische Integration vorhanden                                                                                               | Separat gelieferter Link beziehungsweise Archiv; dauerhafte Bezugs-URL und internen Objektpfad ergänzen                                                                                                                                                                                                              |
| Geothermiepotenzial                                                              | Vom Auftraggeber bereitgestellte Potenzialdaten; ausgewertet werden ausschließlich die tatsächlich gelieferten Merkmale, Kollektor und Sonde sind nicht enthalten; Schema und Einheiten sind noch zu bestätigen | [Originalherausgeber und Nutzungsrecht ergänzen]                                                                                                                                                                                                                                                                                                                                                                    | [Turnus und Datenstand ergänzen]; technische Integration vorhanden                                                                                                         | Separat gelieferter Link beziehungsweise Archiv; Format, dauerhafte Bezugs-URL und internen Objektpfad ergänzen                                                                                                                                                                                                      |
| Solarpotenzial (PV)                                                              | Vorgesehene Solarattribute und Textur für Dachflächen; Umfang und Detailgrad noch in Klärung                                                                                                                    | [Originalherausgeber und Nutzungsrecht ergänzen]                                                                                                                                                                                                                                                                                                                                                                    | [Turnus und Datenstand ergänzen]; noch nicht implementiert                                                                                                                 | Separat gelieferter Link beziehungsweise Archiv; Format, dauerhafte Bezugs-URL und internen Objektpfad ergänzen                                                                                                                                                                                                      |
| Kostendaten                                                                      | Vorgesehene Referenzwerte für Investitionskosten und Wirtschaftlichkeit                                                                                                                                         | [Konkreten Datensatz, Herausgeber und Lizenz ergänzen]                                                                                                                                                                                                                                                                                                                                                              | Turnus offen; noch nicht vorliegend                                                                                                                                        | Keine Distribution vorhanden                                                                                                                                                                                                                                                                                         |
| Postleitzahl-Referenz                                                            | Vorgesehene Referenz zur Prüfung oder Ergänzung von Postleitzahlen; von den bereits in LoD2/CityJSON enthaltenen Adressobjekten zu unterscheiden                                                                | [Konkreten Datensatz, Herausgeber und Lizenz ergänzen]                                                                                                                                                                                                                                                                                                                                                              | Turnus offen; noch nicht vorliegend                                                                                                                                        | Keine Distribution vorhanden                                                                                                                                                                                                                                                                                         |
| DEZ-Berechnungskonfiguration                                                     | Versionierte Kataloge, Grenzwerte, Faktoren und Regeln für die energetische Berechnung                                                                                                                          | Stadt Regensburg; [Lizenz beziehungsweise Nutzungsbedingungen ergänzen]                                                                                                                                                                                                                                                                                                                                             | Bei fachlicher Freigabe einer neuen Version                                                                                                                                | JSON über `GET /api/public/config/active`                                                                                                                                                                                                                                                                            |

Für das DCAT-AP.de-Mapping gilt: Titel wird als `dct:title`, Beschreibung als `dct:description`, Herausgeber als `dct:publisher` und Lizenz als `dct:license` geführt. `dct:accrualPeriodicity` beschreibt den Quellturnus, `dct:modified` den tatsächlich verwendeten Stand. Bereitstellungen werden als `dcat:Distribution` mit den erforderlichen Zugriffs-, Format- und Lizenzangaben modelliert. Der betriebliche Nutzungsstatus im DEZ ist kein Ersatz für `dcatap:availability`.

## 7. Energetische Berechnung

Die energetische Berechnung wird mit dem projektbezogenen Energie-Berechnungskern direkt im Browser durchgeführt. Dazu verarbeitet die Anwendung je nach Eingabetiefe insbesondere:

- Gebäude-ID, Gebäudeadresse und Koordinaten,
- Gebäudetyp, Baujahr beziehungsweise Baualtersklasse, Geschosszahl, Gebäudehöhe, Grund- und Wohnfläche,
- Merkmale von Dach, Dachfenstern, Außenwänden, Fenstern, oberster Geschossdecke und unterem Gebäudeabschluss,
- Heizsystem, Baualter des Heizsystems, Energieträger, Heizflächen, Gasanschluss und Speicher,
- Energieverbrauch, Strom- und Heizkosten sowie Grund- und Arbeitspreise,
- ausgewählte Sanierungsmaßnahmen,
- daraus berechnete Energiebedarfe, Kosten, CO₂-Werte und Effizienzklassen,
- verwendete Version der Berechnungskonfiguration.

Ohne Ihre freiwillige Einwilligung zur Bereitstellung der Daten werden diese Angaben nicht an das Backend der Stadt übermittelt. Sie verbleiben im Arbeitsspeicher Ihres Browsers und werden nur mit gesonderter Einwilligung zusätzlich im Local Storage gespeichert (Abschnitt 5).

Die Ergebnisse sind eine unverbindliche Orientierung und keine automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung im Sinne des Art. 22 DSGVO.

## 8. Freiwillige Bereitstellung von Gebäude- und Berechnungsdaten

### Umfang der Übermittlung

Wenn Sie die Auswahl „Daten freiwillig bereitstellen“ aktivieren und anschließend den PDF-Bericht erzeugen, übermittelt die Anwendung an das Backend:

- die Gebäude-ID,
- die vollständige Gebäudeadresse,
- Längen- und Breitengrad,
- sämtliche für die Berechnung verwendeten Eingaben,
- die Version der Berechnungskonfiguration.

Das Backend validiert die Eingaben, berechnet die Ergebnisse erneut und speichert zusätzlich:

- die berechneten Ergebnis- und Energiekennwerte im NGSI-LD-Format,
- Einreichungs-ID und geheimen Lösch-Token,
- Bearbeitungsstatus,
- Erstellungs- und Änderungszeitpunkt,
- bei interner Bearbeitung gegebenenfalls Zuordnung zu einem berechtigten Mitarbeiter und eine Änderungshistorie.

Es werden im Bürgerbereich kein Name, kein Benutzerkonto und keine E-Mail-Adresse verlangt. Wegen des Bezugs zu einem konkreten Gebäude, dessen Adresse und Koordinaten sind die übermittelten Daten jedoch nicht vollständig anonym. Sie können personenbezogen sein, insbesondere wenn sie einem Eigentümer, Vermieter, Bewohner oder Einreichenden zugeordnet werden können.

### Zwecke der freiwilligen Bereitstellung

**Nutzung von Gebäudedaten außerhalb des Sanierungstools**

Gebäudedaten sind wertvolle Daten – nicht für das einzelne Gebäude, sondern vor allem in aggregierter Form. Der größte Nutzen liegt im Aufbau eines immer genaueren Abbilds von Gebäudebestand und seiner Sanierungspotenziale.

| Anwendungsfall                             | Genutzte Daten                                                                                                       | Mehrwert                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Wärmebedarfsanalyse                        | Bauliche, energetische und versorgungstechnische Gebäudeparameter (z.B. Alter, Sanierungszustand, Versorgungsart, …) | Abschätzung des heutigen Wärmebedarfs – realistischere Annahmen ggü. Standardannahmen         |
| Potenzialanalyse                           | Bauliche, energetische und versorgungstechnische Gebäudeparameter                                                    | Ermittlung der technisch erreichbaren Energieeinsparung                                       |
| Wärmenetzplanung                           | Versorgungstechnische Gebäudeparameter                                                                               | Identifikation geeigneter Gebiete für Wärmenetze; Interesse an Netzanschluss ermitteln        |
| Transformationsplanung                     | Anlagenalter der wärmeerzeugenden Komponenten                                                                        | Abschätzung, wann viele Heizungen ohnehin ersetzt werden müssen; Aufbau eines Sanierungspfads |
| Planung von Förder- und Beratungsprogramme | Bauliche und energetische und versorgungstechnische Gebäudeparameter                                                 | Zielgerichtete Förder- und Beratungsangebote                                                  |
| Klimaschutzcontrolling                     | Bauliche und energetische und versorgungstechnische Gebäudeparameter                                                 | Abschätzung der CO₂-Minderung durch Maßnahmen                                                 |

**Verzeichnis möglicher Verarbeitungstätiger:**

- Stadt Regensburg
- Von der Stadt Regensburg beauftragte Dienstleister/ Projektpartner zur
  - Durchführung von Analysen und Planungen im Rahmen der kommunalen Wärmeplanung.
  - Erstellung integrierter Quartierskonzepte zur Entwicklung nachhaltiger Energie- und Wärmeversorgungssysteme.
  - Erarbeitung von Machbarkeitsstudien einschließlich technischer, wirtschaftlicher und ökologischer Bewertungen
- Wissenschaftliche Institutionen im Rahmen von (Forschungs-)Projekten
- Fördermittelgeber auf Kommunaler, Landes und Bundesebene (in aggregierter Form; zur Auslegung von Förderprogrammen)
- Prüfstellen auf Kommunaler, Landes und Bundesebene, die mit der Einhaltung von Klima- und Energiegesetzen betraut sind oder werden.

### Rechtsgrundlage, Freiwilligkeit und Widerruf

Rechtsgrundlage ist Ihre Einwilligung gemäß Art. 6 Abs. 1 Buchst. a und Art. 7 DSGVO. Die Einwilligung ist freiwillig. Wenn Sie nicht einwilligen, können Sie die Berechnung und den PDF-Export trotzdem verwenden.

Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen. Am einfachsten löschen Sie die Einreichung über den im PDF enthaltenen Löschlink. Alternativ wenden Sie sich unter Angabe der Einreichungs-ID oder des Löschlinks an [Kontaktstelle ergänzen]. Der Widerruf berührt nicht die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung.

### Speicherdauer

Die Speicherdauer wird nicht durch eine automatische Regellöschung begrenzt. Einreichungen werden bis zur Löschung über den individuellen Löschlink oder Löschung durch die Stadt Regensburg gespeichert. Danach werden sie gelöscht oder so anonymisiert, dass kein Personenbezug mehr hergestellt werden kann. Datenbanktechnologie, Betriebsmodell und Speicherort sind [von der Stadt Regensburg eingesetzte Datenbanktechnologie, verantwortlichen Betreiber und Hostingort ergänzen]. Abgeleitete Gebäudedaten und Sicherungskopien werden [Lösch- beziehungsweise Anonymisierungsverfahren sowie Aufbewahrungsfristen der Produktivdatenbank und ihrer Sicherungskopien ergänzen].

## 9. Löschung einer freiwilligen Einreichung

Für jede gespeicherte Einreichung erzeugt das Backend einen zufälligen Lösch-Token. Der PDF-Bericht enthält den daraus erzeugten Link zur Löschseite. Die Löschung erfolgt zweistufig: Zuerst wird der zufällige Löschlink aufgerufen, anschließend muss die Löschung in einem Bestätigungsdialog ausdrücklich bestätigt werden.

Die Löschseite wird vom Public-Frontend angezeigt. Sie prüft beim Backend ausschließlich, ob die Einreichung noch verfügbar ist, und zeigt erst dann den Bestätigungsdialog. Erst die ausdrückliche Bestätigung sendet eine Löschanfrage per HTTP `DELETE`; der vorherige Seiten- und Statusabruf verändert keine Daten. Fehlende, ungültige und bereits verwendete Tokens werden gleich behandelt. Ein zusätzlicher Adressabgleich findet nicht statt.

Nach erfolgreicher Prüfung werden der Einreichungsdatensatz und daraus abgeleitete personenbezogene Gebäudedaten aus der Produktivdatenbank gelöscht. Zugehörige Sicherungskopien werden nach Ablauf des regulären Backupzyklus von [Frist ergänzen] überschrieben beziehungsweise gelöscht.

Nach der Löschung stellt die Anwendung einen Löschbeleg zum Download bereit. Der Beleg enthält eine zufällige Ereignis-ID, die Einreichungs-ID und ein zufälliges Prüfgeheimnis. Bewahren Sie ihn geschützt auf; nur mit dem vollständigen Beleg kann später nachgewiesen werden, dass diese konkrete Einreichung gelöscht wurde. Das Backend speichert die Einreichungs-ID und das Prüfgeheimnis nicht im Audit-Protokoll. Dort verbleiben nur Zeitpunkt, Aktionsart, Akteurstyp, Löschanzahl und ein nicht ohne den Beleg zuordenbarer kryptografischer Prüfwert. Die Aufbewahrungsfrist dieser Audit-Ereignisse beträgt [fachlich, rechtlich und betrieblich freizugebende Frist ergänzen].

Bewahren Sie den Löschlink geschützt auf. Der Lösch-Token ist nicht mit einem Benutzerkonto verknüpft und kann bei Verlust nicht ohne Weiteres ersetzt werden.

## 10. PDF- und JSON-Export sowie Wiederherstellungslinks

Der PDF-Bericht wird mit `@react-pdf/renderer` in Ihrem Browser erzeugt und als Datei auf Ihr Endgerät heruntergeladen. Ohne freiwillige Datenbereitstellung ist hierfür keine Übermittlung Ihrer Eingaben an das Backend erforderlich. Nach einer freiwilligen Einreichung erzeugt das Backend den zugehörigen JSON-Export auf Anforderung aus den gespeicherten Eingabe-, Ergebnis- und Einreichungsdaten und liefert ihn als nicht cachebare Datei aus.

Der PDF-Bericht kann folgende vertrauliche Verknüpfungen enthalten:

- einen Wiederherstellungslink zu dem ausdrücklich gespeicherten Bearbeitungsstand,
- bei freiwilliger Einreichung einen Löschlink,
- bei freiwilliger Einreichung einen Link zum JSON-Export.

Lösch- und JSON-Download-Link enthalten denselben zufälligen, nicht erratbaren Capability-Token. Wer einen solchen Link erhält, kann die gespeicherten öffentlichen Einreichungsdaten herunterladen beziehungsweise nach ausdrücklicher Bestätigung löschen. Der JSON-Export enthält deshalb zusätzlich einen neutralen Löschlink ohne Sprachparameter.

Portable Wiederherstellungslinks arbeiten davon unabhängig: Sie enthalten den serialisierten Bearbeitungsstand im URL-Fragment. Dieses Fragment wird ausschließlich im Browser ausgewertet und bei einem normalen HTTP-Aufruf nicht an das Backend übertragen. Für die Wiederherstellung wird kein serverseitiger Sitzungsdatensatz und kein Backend-Token angelegt.

Speichern Sie Bericht und Links daher geschützt und geben Sie sie nur an vertrauenswürdige Personen weiter.

## 11. Schutz vor automatisierten Zugriffen

Öffentliche Schreibzugriffe werden durch Rate Limiting und eine selbst gehostete Altcha-Challenge am APISIX-Gateway vor Missbrauch geschützt. Die dafür eingesetzte globale Gateway-Policy wird durch die externe Deployment-Plattform bereitgestellt und betrieben; sie ist nicht Bestandteil der DEZ-Repositories. Altcha lässt den Browser eine kleine Rechenaufgabe lösen; hierfür ist kein Konto erforderlich.

Dabei werden insbesondere IP-Adresse, Zeitpunkt, Challenge-Daten, Prüfergebnis und technische Anfragedaten verarbeitet. Zweck ist der Schutz der Anwendung und der gespeicherten Daten vor automatisierten Massenanfragen. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. e DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG. Die Challenge- und Rate-Limit-Daten werden für [konkrete Frist ergänzen] innerhalb der CIVITAS/CORE-Umgebung der Stadt Regensburg gespeichert.

## 12. Webanalyse mit Matomo

> **Noch nicht implementiert:** Die Webanalyse mit Matomo ist derzeit nicht aktiv. Es werden deshalb keine Matomo-Skripte geladen und keine Analyseereignisse an Matomo übermittelt. Vor einer künftigen Aktivierung müssen eine eigene Instanz bereitgestellt und Betrieb, Zuständigkeit sowie Datenschutzparameter festgelegt werden.

Falls Matomo künftig gesondert aktiviert wird, verwenden wir es zur statistischen Auswertung der Nutzung des Sanierungstools. Die dafür noch bereitzustellende Matomo-Instanz wird unter [interne Matomo-URL ergänzen] in der CIVITAS/CORE-Umgebung der Stadt Regensburg betrieben. Zuständig ist [zuständige Stelle der Stadt Regensburg oder beauftragter Betreiber ergänzen]. Eine Übermittlung der Analysedaten an Matomo Cloud findet nicht statt.

Matomo wird erst nach Ihrer vorherigen Einwilligung aktiviert. Ohne Einwilligung werden keine Matomo-Tracking-Skripte geladen und keine Analyseereignisse übermittelt. Sie können Ihre Entscheidung jederzeit über „Datenschutzeinstellungen“ ändern.

Nach Ihrer Einwilligung werden [eingesetzte Cookies oder andere Speichertechniken mit Namen und Laufzeiten ergänzen] sowie folgende Daten verarbeitet:

- eine zufällig erzeugte Session-ID zur statistischen Zuordnung zusammengehöriger Nutzungsvorgänge,
- aufgerufene Seiten und Funktionen sowie vollständig bearbeitete Abschnitte des Sanierungschecks,
- Beginn und Abschluss des Sanierungschecks,
- PDF-Export, Aufruf des Beratungskontakts sowie Beginn und Abschluss der freiwilligen Datenbereitstellung,
- bestätigter Gebäudetyp und ausgewählte Sanierungsmaßnahmen als fachlich vorgegebene Kategorieschlüssel,
- Zeitpunkte, Verweildauer und technische Fehler,
- Browser-, Geräte- und Betriebssystemmerkmale in gekürzter Form.

An Matomo werden insbesondere keine Gebäude-ID, Adresse, Hausnummer, Koordinaten, Einreichungs- oder Löschkennung, Kontaktdaten, Freitexte, exakten Verbrauchs- oder Kostenwerte sowie keine vollständigen Eingabe-, Ergebnis- oder Einreichungsdaten übermittelt. Die eigentlichen Daten einer freiwilligen Gebäudedatenspende werden über einen von Matomo getrennten technischen Weg verarbeitet.

Gebäudetypen und Sanierungsmaßnahmen werden nur anhand festgelegter Kategorien ausgewertet. Berichte werden aggregiert erstellt. Die zugrunde liegenden Ereignisse können innerhalb einer eingewilligten Sitzung über die zufällige Session-ID zusammengeführt werden und werden deshalb nicht allein aufgrund der aggregierten Berichte als anonym behandelt.

Die IP-Adresse wird in Matomo nicht als Analysemerkmal oder Besucherkennung verwendet und nicht in die Analysedaten übernommen. Technisch erforderliche IP-Verarbeitungen auf Ebene von Webserver und APISIX richten sich ausschließlich nach Abschnitt 4.

Die Analysedaten werden für [Aufbewahrungsfrist ergänzen] gespeichert. Zugriff erhalten [berechtigte Rollen und Berichtsempfänger ergänzen].

Rechtsgrundlagen sind Art. 6 Abs. 1 Buchst. a DSGVO sowie, soweit Informationen auf dem Endgerät gespeichert oder ausgelesen werden, § 25 Abs. 1 TDDDG.

## 13. Schriftarten

Die für das Sanierungstool benötigten Schriftarten werden innerhalb der CIVITAS/CORE-Umgebung der Stadt Regensburg bereitgestellt. Beim Seitenaufruf wird deshalb keine Verbindung zu Google Fonts oder einem anderen externen Schriftanbieter hergestellt.

## 14. Feedback

> **Noch nicht vollständig implementiert:** Die Übermittlung von Feedback an das Zielsystem ist derzeit nicht aktiv. Vor der Aktivierung müssen Zielsystem, Empfänger, Übertragungsweg, Betriebsverantwortung und Löschfrist festgelegt werden.

Sobald die Feedback-Funktion vollständig verfügbar ist und Sie sie nutzen, verarbeiten wir die von Ihnen ausgewählte Kategorie, Ihre Nachricht und – nur wenn Sie eine Rückmeldung wünschen – Ihre freiwillig angegebene E-Mail-Adresse. Hinzu kommen Zeitpunkt und technisch erforderliche Verbindungsdaten.

Die Daten werden ausschließlich zur Bearbeitung des Feedbacks und zur Verbesserung des Sanierungstools verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. e DSGVO in Verbindung mit Art. 4 Abs. 1 BayDSG; soweit die Bearbeitung ausschließlich auf Ihrer freiwilligen Kontaktaufnahme beruht, Art. 6 Abs. 1 Buchst. a DSGVO.

Nach der Aktivierung ist Empfänger [zuständige Stelle beziehungsweise Ticketsystem in CIVITAS/CORE ergänzen]. Feedbackdaten werden nach Abschluss der Bearbeitung, spätestens nach [Löschfrist ergänzen], gelöscht. Die optionale E-Mail-Adresse wird nur für die gewünschte Rückmeldung verwendet.

## 15. Empfänger und Auftragsverarbeiter

Innerhalb der Stadt Regensburg erhalten nur Stellen und Beschäftigte Zugriff, die diesen zur Erfüllung ihrer Aufgaben benötigen. Dies betrifft insbesondere die zuständige Dienststelle, berechtigte Fachadministratoren sowie den technischen Betrieb.

Als externe Empfänger beziehungsweise Auftragsverarbeiter kommen nach der aktuellen Architektur in Betracht:

- [zuständige Stelle der Stadt Regensburg oder vollständiger Name und Anschrift des beauftragten CIVITAS/CORE-Betreibers einschließlich datenschutzrechtlicher Rolle],
- [vollständiger Name und Anschrift des Entwicklungs- beziehungsweise Betriebsdienstleisters einschließlich vertraglicher Rolle],
- [Betreiber des S3-kompatiblen Datendienstes der Stadt Regensburg einschließlich Hostingort],
- [Betreiber und Technologie der Produktivdatenbank der Stadt Regensburg],
- [Anbieter beziehungsweise Betreiber der Kubernetes-, Backup- und Log-Plattform der Stadt Regensburg],
- [vollständiger Name, Anschrift und datenschutzrechtliche Rolle des Betreibers von `intergeo38.bayernwolke.de` als Bereitsteller der TopPlusOpen-Light-Terrain-Textur],
- [Betreiber der Matomo-Instanz innerhalb der CIVITAS/CORE-Umgebung der Stadt Regensburg].

Eine Offenlegung kann außerdem erfolgen, wenn die Stadt Regensburg hierzu gesetzlich verpflichtet ist. Eine Übermittlung freiwilliger Einreichungen an Stellio findet nicht statt.

## 16. Datenübermittlungen in Drittländer

Die DEZ-Kernkomponenten, die Produktivdatenbank, der S3-kompatible Datendienst, Sicherungskopien und die zentralen Protokolle werden in der CIVITAS/CORE-Umgebung der Stadt Regensburg verarbeitet. [Produktive Hostingregionen und Backupstandorte bestätigen.]

Eine Übermittlung personenbezogener Daten in Staaten außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums findet für die DEZ-Kernfunktionen nicht statt. Für den externen Tile-Endpunkt auf `intergeo38.bayernwolke.de` und andere Zusatzdienste ist ein möglicher Drittlandbezug noch zu bestätigen; gegebenenfalls werden [Empfänger, Staat, Rechtsgrundlage nach Art. 44 ff. DSGVO und geeignete Garantien ergänzen].

## 17. Pflicht zur Bereitstellung

Sie sind nicht verpflichtet, personenbezogene Daten bereitzustellen. Für die Nutzung der Webseite müssen lediglich die technisch erforderlichen Verbindungsdaten verarbeitet werden. Die freiwillige Einreichung von Gebäude- und Berechnungsdaten ist keine Voraussetzung für die Berechnung oder den PDF-Export.

## 18. Ihre Rechte

Soweit die gesetzlichen Voraussetzungen vorliegen, haben Sie insbesondere folgende Rechte:

- Auskunft über Ihre verarbeiteten personenbezogenen Daten nach Art. 15 DSGVO,
- Berichtigung unrichtiger Daten nach Art. 16 DSGVO,
- Löschung nach Art. 17 DSGVO,
- Einschränkung der Verarbeitung nach Art. 18 DSGVO,
- Datenübertragbarkeit nach Art. 20 DSGVO, soweit anwendbar,
- Widerspruch gegen eine Verarbeitung nach Art. 21 DSGVO, die auf Art. 6 Abs. 1 Buchst. e DSGVO beruht,
- Widerruf einer Einwilligung mit Wirkung für die Zukunft nach Art. 7 Abs. 3 DSGVO.

Da das Sanierungstool ohne Benutzerkonto genutzt wird, benötigen wir zur Zuordnung einer freiwilligen Einreichung in der Regel die Einreichungs-ID oder den Löschlink. Wir erheben nicht allein zur Identifikation zusätzliche personenbezogene Daten.

Zur Ausübung Ihrer Rechte wenden Sie sich an die unter Abschnitt 1 genannte zuständige Stelle oder an den behördlichen Datenschutzbeauftragten.

## 19. Beschwerderecht

Sie können sich gemäß Art. 77 DSGVO bei einer Datenschutzaufsichtsbehörde beschweren. Für die Stadt Regensburg als bayerische öffentliche Stelle ist zuständig:

Der Bayerische Landesbeauftragte für den Datenschutz  
Postfach 22 12 19  
80502 München  
Hausanschrift: Wagmüllerstraße 18, 80538 München  
Telefon: +49 89 212672-0  
E-Mail: poststelle@datenschutz-bayern.de  
Internet: https://www.datenschutz-bayern.de/

## 20. Sicherheit

Externe Zugriffe werden verschlüsselt über HTTPS bereitgestellt. Der öffentliche Bereich und der Verwaltungsbereich sind technisch getrennt. Administrative Zugriffe werden über Keycloak und APISIX geschützt; im öffentlichen Bereich ist keine Anmeldung erforderlich. Die Datenbank ist nicht direkt aus dem Internet erreichbar.

Trotz technischer und organisatorischer Schutzmaßnahmen kann eine Datenübertragung über das Internet nie vollständig risikofrei sein.

## 21. Aktualität dieser Datenschutzhinweise

Diese Datenschutzhinweise werden angepasst, wenn sich Funktionen, Datenflüsse, Empfänger oder Rechtsgrundlagen ändern.

Stand: 6. August 2026
