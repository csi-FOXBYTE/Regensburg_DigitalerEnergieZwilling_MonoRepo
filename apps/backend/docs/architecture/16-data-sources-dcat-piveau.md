# Architektur – Datenquellenkatalog und Piveau-Anbindung

Stand: 25. September 2026

## Inhaltsverzeichnis

1. [Ziel und Geltungsbereich](#ziel-und-geltungsbereich)
2. [Mapping der geforderten Metadaten](#mapping-der-geforderten-metadaten)
3. [Übersicht der Datenquellen](#uebersicht-der-datenquellen)
4. [LoD2-Herkunft und Distributionen](#lod2-herkunft-und-distributionen)
5. [DGM1-Herkunft und räumliche Auswahl](#dgm1-herkunft-und-raeumliche-auswahl)
6. [Terrain-Textur TopPlusOpen Light](#terrain-textur-topplusopen-light)
7. [Verknüpfung mit Piveau in CIVITAS/CORE](#verknuepfung-mit-piveau-in-civitascore)
8. [Pflege- und Freigaberegeln](#pflege-und-freigaberegeln)
9. [Referenzen](#referenzen)

<a id="ziel-und-geltungsbereich"></a>

## Ziel und Geltungsbereich

Dieses Kapitel ist die zentrale Übersicht der externen Basis- und Fachdaten für die
Offline-Anreicherung und die energetische Berechnung des DEZ-Sanierungstools.
Es trennt:

- den nachgewiesenen Ursprung einer Datenquelle,
- die konkrete, technisch verarbeitete Distribution,
- den Nutzungsstatus im DEZ und
- den Metadatensatz im Piveau-Katalog der CIVITAS/CORE-Umgebung.

Die Metadaten sind auf **DCAT-AP.de 3.0** ausgerichtet. Die unten aufgeführten
Felder allein ergeben noch keinen vollständig validierten DCAT-AP.de-Datensatz.
Vor der Veröffentlichung in Piveau sind insbesondere Identifier, Kontaktstelle,
räumliche Abdeckung, Themenzuordnung, Zugriffsrechte und die
distributionsspezifischen Pflichtangaben zu ergänzen und gegen das eingesetzte
Piveau-Profil zu validieren.

Die Daten selbst verbleiben an ihrem Quellort beziehungsweise im S3-kompatiblen
Datendienst der Stadt Regensburg. Piveau verwaltet den Katalogeintrag und verweist
über die Distributionen auf die Daten; Stellio bleibt davon getrennt der
NGSI-LD-Zieldienst für freigegebene Gebäude- und Potenzialattribute.

<a id="mapping-der-geforderten-metadaten"></a>

## Mapping der geforderten Metadaten

| Fachliche Spalte | DCAT-AP.de-Abbildung | Festlegung für DEZ |
| --- | --- | --- |
| Projekt | `dcat:Catalog` mit `dcat:dataset` | „DEZ-Sanierungstool“ wird als Piveau-Katalog `regensburg-dez-sanierungstool` modelliert. Es ist kein zweiter `dct:title` am Datensatz. |
| Titel | `dct:title` | Fachlicher Titel des Datensatzes, deutschsprachig (`@de`). |
| Beschreibung | `dct:description` | Beschreibung des Inhalts und Verwendungszwecks. Die Zuordnung zu `dct:title` im ursprünglichen Tabellenentwurf war fehlerhaft. |
| Data Owner | `dct:publisher` auf einen `foaf:Agent` | Rechtlich veröffentlichende Organisation, nicht lediglich technischer Betreiber oder Dateilieferant. |
| Datenlizenz | `dct:license` | Auf Datensatzebene möglich; für jede veröffentlichte `dcat:Distribution` verpflichtend. Eine unbekannte Lizenz darf nicht geraten werden. |
| Datenaktualität | `dct:accrualPeriodicity` und `dct:modified` | `dct:accrualPeriodicity` beschreibt den Turnus, `dct:modified` den tatsächlichen Stand der bezogenen Version. |
| Bereitstellung | `dcat:distribution` | Eigenständige Ressource mit mindestens `dcat:accessURL` und `dct:license`; je nach Bereitstellung zusätzlich `dcat:downloadURL`, `dct:format`, `dcat:mediaType`, `dcat:packageFormat` und `dcatap:availability`. |
| Status | `dcatap:availability` beziehungsweise `adms:status`; zusätzlich DEZ-Nutzungsstatus | DCAT-Statuswerte beschreiben Verfügbarkeit beziehungsweise Lebenszyklus der Ressource. „Aktuell im DEZ verwendet“ ist ein betrieblicher Projektstatus und wird getrennt im Release-Manifest geführt. |

Für kontrollierte Werte sind die von DCAT-AP.de vorgegebenen Vokabulare zu
verwenden. Freitextwerte wie „wöchentlich“ oder „CC BY 4.0“ werden in RDF daher
durch die zugehörigen URIs repräsentiert.

<a id="uebersicht-der-datenquellen"></a>

## Übersicht der Datenquellen

Die Piveau-`originalId` bleibt über Aktualisierungen stabil. Eine neue Datei oder
ein neuer Datenstand erzeugt keine neue Datensatz-ID, sondern aktualisiert
`dct:modified` sowie die betreffende Distribution.

| Piveau-`originalId` | `dct:title` | `dct:description` | `dct:publisher` | `dct:license` | `dct:accrualPeriodicity` | `dcat:distribution` | DEZ-Nutzungsstatus |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regensburg-dez-lod2-gebaeude` | 3D-Gebäudemodelle (LoD2) – Stadt Regensburg | LoD2-Gebäude der Gemeinde Regensburg (`09362000`) mit 3D-Geometrie, Flächensemantik, Gebäudeattributen und, soweit im Quelldatensatz vorhanden, Adressen. | Landesamt für Digitalisierung, Breitband und Vermessung (LDBV; Bayerische Vermessungsverwaltung) | [CC BY 4.0](http://dcat-ap.de/def/licenses/cc-by/4.0); Namensnennung: „Bayerische Vermessungsverwaltung – www.geodaten.bayern.de“ | [wöchentlich](http://publications.europa.eu/resource/authority/frequency/WEEKLY); tatsächlicher Bezugsstand aus `published` der Metalink-Datei | CityGML über Gemeinde-Metalink; daraus intern erzeugtes CityJSON 2.0.1 darf nach Bereitstellung einer stabilen Release-URL als weitere Distribution katalogisiert werden | **Pflicht**, aktuell verwendet |
| `regensburg-dez-dgm1-gelaendemodell` | Digitales Geländemodell 1 m (DGM1) – Auswahl Regensburg | Erdoberfläche ohne Vegetation und Bebauung als Raster mit 1 m Gitterweite. Die dokumentierte Polygonauswahl umfasst das für das Sanierungstool vorgesehene Gebiet um Regensburg. | Landesamt für Digitalisierung, Breitband und Vermessung (LDBV; Bayerische Vermessungsverwaltung) | [CC BY 4.0](http://dcat-ap.de/def/licenses/cc-by/4.0); Namensnennung: „Bayerische Vermessungsverwaltung – www.geodaten.bayern.de“ | [unregelmäßig/losweise](http://publications.europa.eu/resource/authority/frequency/IRREG); tatsächlicher fachlicher Datenstand noch zu bestätigen | GeoTIFF, EPSG:25832, Kachelung 1 km × 1 km; Produktseite als `dcat:accessURL`; die Kachelauswahl wird dort mit dem dokumentierten SRID/EWKT-Polygon erzeugt | Auswahl und Quelldistribution dokumentiert; produktive Terrain-Aufbereitung und Bereitstellungsroute noch offen |
| `regensburg-dez-terrain-textur-topplusopen-light` | TopPlusOpen Light – Terrain-Textur für Regensburg | Reduzierte topografische Hintergrundkarte in Web Mercator (EPSG:3857), die als Rastertextur auf dem Terrain dargestellt wird. Sie ist fachlich vom DGM1-Höhenmodell getrennt. | Bundesamt für Kartographie und Geodäsie (BKG); Betreiber und Weitergabeberechtigung des technischen Tile-Proxys noch bestätigen | [Datenlizenz Deutschland – Namensnennung – Version 2.0](https://www.govdata.de/dl-de/by-2-0); Quellenvermerk: „Kartendarstellung: © BKG (`{JAHR_DES_LETZTEN_DATENBEZUGS}`) dl-de/by-2-0, Datenquellen“ mit den vorgeschriebenen Verlinkungen | [jährlich](http://publications.europa.eu/resource/authority/frequency/ANNUAL); tatsächlichen Datenbezugsstand des Proxy-Dienstes ergänzen | Gekachelter Darstellungsdienst über die URL-Vorlage `https://intergeo38.bayernwolke.de/betty/g_topopluslight/{z}/{x}/{y}`; als `dcat:DataService` modellieren und über `dcat:accessService` anbinden | **Aktuell für die Terrain-Textur verwendet**; Proxy-Betreiber, Nutzungsfreigabe und Jahr des letzten Datenbezugs vor Produktivfreigabe bestätigen |
| `regensburg-dez-baualtersklassen` | Baualtersklassen – Stadt Regensburg | Polygonale Baualtersklassen zur räumlichen Ableitung von `constructionYear`. Die aktuelle Implementierung erwartet GeoPackage, EPSG:25832, Tabelle `gebiete__baualtersklasse` und Feld `Dominant_Baualtersklasse`. | **Offen:** Originalherausgeber der bereitgestellten Datei bestätigen | **Offen:** Nutzungs- und Weitergaberecht bestätigen | **Offen:** Turnus und Datenstand bestätigen | Separat bereitgestellter Link beziehungsweise Archiv; dauerhafte Quell-URL, Dateiname, Prüfsumme und interner Objektpfad fehlen noch | **Optional**, Integration implementiert und bei konfiguriertem `--age-zones` verwendet |
| `regensburg-dez-geothermiepotenzial` | Geothermiepotenzial – Stadt Regensburg | Vom Auftraggeber bereitgestellte Potenzialdaten; ausgewertet werden ausschließlich die tatsächlich gelieferten Merkmale. Kollektor und Sonde sind nicht enthalten. Granularität, Zielschema und Einheiten sind noch fachlich zu bestätigen. | **Offen:** Originalherausgeber bestätigen | **Offen:** Nutzungs- und Weitergaberecht bestätigen | **Offen:** Turnus und Datenstand bestätigen | Separat bereitgestellter Link beziehungsweise Archiv; dauerhafte Quell-URL, Format, Prüfsumme und interner Objektpfad fehlen noch | **Technische Integration nach Datenfreigabe in Sprint 17 umgesetzt**; Metadaten noch offen |
| `regensburg-dez-solarpotenzial` | Solarpotenzial (PV) – Stadt Regensburg | Vorgesehene Solarattribute und Textur für Dachflächen, unter anderem Einstrahlung, Dachneigung und Dachorientierung; Umfang und Detailgrad sind noch zu klären. | **Offen:** Originalherausgeber bestätigen | **Offen:** Nutzungs- und Weitergaberecht bestätigen | **Offen:** Turnus und Datenstand bestätigen | Separat bereitgestellter Link beziehungsweise Archiv; dauerhafte Quell-URL, Format, Prüfsumme und interner Objektpfad fehlen noch | **Aktuell nicht integriert**; Umsetzung in Sprint 18/19 fraglich |
| `regensburg-dez-kostendaten` | Kostendaten für Sanierungsmaßnahmen – Stadt Regensburg (vorgesehen: BKI-Kostenplaner) | Vorgesehene Referenzwerte für Investitionskosten und Wirtschaftlichkeitsberechnungen; die konkrete Quelle, Granularität, der Preisstand und die Regionalisierung sind noch offen. | Nicht bestimmt | Nicht bestimmt | Nicht bestimmt | **Keine Distribution vorhanden** | **Noch nicht vorliegend** |

### Links auf Quell-Metadatensätze und Kataloge

Die folgenden Links führen auf den Metadatensatz im öffentlichen Quellkatalog.
Eine Produkt- oder Downloadseite wird nur dann als Ersatz angegeben, wenn kein
separater Metadatensatz bekannt ist.

| Piveau-`originalId` | Quell-Metadatensatz beziehungsweise Quellkatalog |
| --- | --- |
| `regensburg-dez-lod2-gebaeude` | [GovData – 3D Gebäudemodell LoD2](https://www.govdata.de/suche/daten/3d-gebaudemodell-lod2b6652) |
| `regensburg-dez-dgm1-gelaendemodell` | [GovData – Digitales Geländemodell (einschließlich DGM1)](https://www.govdata.de/suche/daten/digitales-gelandemodell099d4) |
| `regensburg-dez-terrain-textur-topplusopen-light` | [BKG-MIS – TopPlusOpen-Light PM](https://mis.bkg.bund.de/trefferanzeige?docuuid=BD4D5B0F-2809-44D4-B2CE-D22ACC4CE0CC) |
| `regensburg-dez-baualtersklassen` | Noch kein öffentlicher Quell-Metadatensatz benannt; Herkunft und dauerhafte Quell-URL sind offen. |
| `regensburg-dez-geothermiepotenzial` | Noch kein öffentlicher Quell-Metadatensatz benannt; Originalherausgeber und dauerhafte Quell-URL sind offen. |
| `regensburg-dez-solarpotenzial` | Noch kein öffentlicher Quell-Metadatensatz benannt; Originalherausgeber und dauerhafte Quell-URL sind offen. |
| `regensburg-dez-kostendaten` | Noch keine konkrete Quelle und damit kein Quell-Metadatensatz bestimmt. |

Nach der Veröffentlichung in Piveau muss zusätzlich jede `originalId` in dieser
Tabelle auf ihre öffentliche Dataset-URI
`{DEZ_PUBLIC_BASE_URL}/id/dataset/{originalId}` verlinkt werden. Ist in der
eingesetzten Piveau-Oberfläche kein direkter Datensatzlink verfügbar, wird
ersatzweise der öffentliche Katalog `regensburg-dez-sanierungstool` verlinkt.

Ein Piveau-Eintrag darf für die drei lose bereitgestellten Fachdaten erst
veröffentlicht werden, wenn Originalherausgeber, Lizenz, Datenstand und eine
dauerhaft adressierbare Distribution geklärt sind. Für Kostendaten bleibt die ID
reserviert; ohne bezogene Datenquelle wird noch kein `dcat:Distribution`-Objekt
erzeugt.

<a id="lod2-herkunft-und-distributionen"></a>

## LoD2-Herkunft und Distributionen

Für Regensburg ist der amtliche Gemeindeschlüssel `09362000` maßgeblich.

- Auswahl-/Übersichtsdatei:
  <https://geodaten.bayern.de/odd/a/lod2/citygml/meta/kml/gemeinde.kml>
- Direkte Metalink-Distribution für Regensburg:
  <https://geodaten.bayern.de/odd/a/lod2/citygml/meta/metalink/09362000.meta4>
- Produkt- und Metadatenseite:
  <https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=lod2>

Die am 27. Juli 2026 geprüfte Metalink-Datei wurde am
`2026-07-21T21:07:37Z` veröffentlicht und referenziert 33 CityGML-Dateien mit
insgesamt 1.212.481.646 Byte. Diese Werte sind nur ein Prüfstand und werden bei
jedem Bezug erneut aus der Metalink-Datei ermittelt. Für den Piveau-Eintrag gilt:

- `dct:accrualPeriodicity` bleibt `WEEKLY`,
- `dct:modified` wird aus `metalink/published` übernommen,
- die Metalink-URL wird `dcat:downloadURL`,
- die Produktseite wird `dcat:accessURL`,
- Dateinamen, Byte-Größen und SHA-256-Werte werden im Pipeline-Manifest
  protokolliert und
- die interne CityJSON-Fassung wird als abgeleitete Distribution desselben
  Datensatzes nur dann ergänzt, wenn eine stabile, zugriffsgeregelte Release-URL
  unabhängig vom lokalen, flüchtigen Job-Arbeitsbereich existiert.

Die Quellaktualisierung ist nicht mit dem DEZ-Importzyklus gleichzusetzen. Wie oft
die Stadt Regensburg einen neuen Stand übernimmt, wird im Betriebsplan separat
festgelegt.

<a id="dgm1-herkunft-und-raeumliche-auswahl"></a>

## DGM1-Herkunft und räumliche Auswahl

Amtliche Produktseite:
<https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=dgm1>

Die DGM1-Quelldaten werden als GeoTIFF in EPSG:25832 und in Kacheln von
1 km × 1 km bereitgestellt. Die Aktualisierung erfolgt losweise. Für den Bezug
des Regensburger Ausschnitts wurde auf der Produktseite folgende Polygonauswahl
im EWKT-Format und in WGS 84 verwendet:

```text
SRID=4326;POLYGON Z((11.97759446 48.94846059 0,11.98726795 49.11016127 0,12.23352702 49.10351988 0,12.22305933 48.94185670 0,11.97759446 48.94846059 0))
```

Das EWKT bleibt unverändert im Release-Manifest erhalten. Im Piveau-RDF wird die
Geometrie über `dct:spatial` und `locn:geometry` als GeoSPARQL-WKT-Literal
abgebildet:

```turtle
@prefix dct: <http://purl.org/dc/terms/> .
@prefix geo: <http://www.opengis.net/ont/geosparql#> .
@prefix locn: <http://www.w3.org/ns/locn#> .

<{DEZ_PUBLIC_BASE_URL}/id/dataset/regensburg-dez-dgm1-gelaendemodell>
    dct:spatial [
        a dct:Location ;
        locn:geometry "<http://www.opengis.net/def/crs/EPSG/0/4326> POLYGON Z((11.97759446 48.94846059 0,11.98726795 49.11016127 0,12.23352702 49.10351988 0,12.22305933 48.94185670 0,11.97759446 48.94846059 0))"^^geo:wktLiteral
    ] .
```

Die Produktseite erzeugt aus dieser SRID/EWKT-Auswahl ein Metalink-Manifest mit
den Download-URLs der betroffenen GeoTIFF-Kacheln. Dieses Auswahlmanifest dient
inhaltlich als Bezugsnachweis für den dokumentierten Stand, besitzt aber keine
dauerhafte, aus der Auswahl ableitbare öffentliche URL und ist daher noch keine
Piveau-Distribution.

Inhaltlicher Prüfstand der so erzeugten Auswahl vom 28. Juli 2026:

- Generator: `poly2metalink`
- Erzeugungszeit (`metalink/published`): `2026-07-28T08:59:30Z`
- 368 eindeutige GeoTIFF-Dateien und 736 Download-URLs auf zwei Spiegelservern
- keine im Manifest enthaltenen Dateigrößen oder Datei-Prüfsummen

`metalink/published` beschreibt die Erzeugung der Auswahl, nicht den fachlichen
Aktualitätsstand der DGM1-Kacheln. Für DCAT-AP.de wird dieser Zeitstempel deshalb
als Erzeugungszeit des Bezugsnachweises protokolliert, aber nicht als
`dct:modified` des Datensatzes verwendet. Der tatsächliche Datenstand ist separat
zu ermitteln und als `dct:modified` zu pflegen.

Im Piveau-Eintrag wird die amtliche Produktseite als `dcat:accessURL` verwendet.
Das SRID/EWKT-Polygon dokumentiert die dort reproduzierbare Auswahl. Eine
`dcat:downloadURL` wird erst ergänzt, wenn die ausgewählten GeoTIFF-Kacheln als
produktive, stabile Distribution über APISIX beziehungsweise einen Datendienst
bereitgestellt werden.

<a id="terrain-textur-topplusopen-light"></a>

## Terrain-Textur TopPlusOpen Light

Das DGM1 liefert ausschließlich die Höhenwerte des Geländes. Die darauf
dargestellte Rastertextur stammt aus einem davon unabhängigen gekachelten
Darstellungsdienst:

```text
https://intergeo38.bayernwolke.de/betty/g_topopluslight/{z}/{x}/{y}
```

Die Platzhalter `{z}`, `{x}` und `{y}` bezeichnen Zoomstufe und Kachelkoordinaten.
Der Layername weist auf **TopPlusOpen Light** hin. Das offizielle BKG-Produkt ist
eine Hintergrundkarte in EPSG:3857, wird jährlich fortgeführt und steht unter der
Datenlizenz Deutschland – Namensnennung – Version 2.0. In der Kartenansicht ist
folgender BKG-konformer Quellenvermerk sichtbar anzuzeigen:

> Kartendarstellung: © [BKG](https://www.bkg.bund.de)
> (`{JAHR_DES_LETZTEN_DATENBEZUGS}`)
> [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0),
> [Datenquellen](https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_topplusopen.html)

Für eine HTML-fähige `credit`-Konfiguration kann der Quellenvermerk unmittelbar
so hinterlegt werden:

```javascript
credit:
  'Kartendarstellung: © <a href="https://www.bkg.bund.de">BKG</a> ' +
  '({JAHR_DES_LETZTEN_DATENBEZUGS}) ' +
  '<a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>, ' +
  '<a href="https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_topplusopen.html">Datenquellen</a>'
```

Das Jahr muss aus dem tatsächlich über den Proxy ausgelieferten Datenstand
ermittelt, im Release-Manifest festgehalten und vor der Auslieferung in den
Credit eingesetzt werden. Ein CartoDB-/OpenStreetMap-Credit ist für diesen
TopPlusOpen-Light-Layer nicht zu verwenden. Unabhängig davon müssen vor der
Produktivfreigabe der Betreiber des Hosts `intergeo38.bayernwolke.de` und dessen
Berechtigung zur Bereitstellung bestätigt werden.

Da Texturkarte und DGM1 unterschiedliche Inhalte, Herausgeber und Lizenzen haben,
werden sie als zwei `dcat:Dataset`-Ressourcen geführt. Der Tile-Dienst wird als
`dcat:DataService` beschrieben; dessen stabile Basis- beziehungsweise
Dokumentations-URL wird als `dcat:endpointURL` veröffentlicht und über
`dcat:accessService` mit einer Distribution der Terrain-Textur verknüpft. Die
URL-Vorlage mit Platzhaltern bleibt zusätzlich in der technischen Beschreibung
und im Release-Manifest erhalten.

<a id="verknuepfung-mit-piveau-in-civitascore"></a>

## Verknüpfung mit Piveau in CIVITAS/CORE

### Stabile Kennungen

Alle Piveau-Kennungen folgen dem Schema
`{kommune}-dez-{ressource}`. Für dieses Deployment ist das Präfix daher
durchgängig `regensburg-dez-`.

| Ressource | Kennung |
| --- | --- |
| Piveau-Katalog | `regensburg-dez-sanierungstool` |
| Datensätze | jeweilige `originalId` aus der Übersicht |
| Öffentliche Dataset-URI | `{DEZ_PUBLIC_BASE_URL}/id/dataset/{originalId}` |
| Piveau Hub Repo | `{PIVEAU_HUB_REPO_BASE_URL}` |

`DEZ_PUBLIC_BASE_URL` und `PIVEAU_HUB_REPO_BASE_URL` sind
deployment-spezifische Betreiberwerte und dürfen nicht mit Beispiel- oder
Entwicklungsdomains in produktive Metadaten übernommen werden.

### Registrierung

Piveau muss im CIVITAS/CORE-Inventar unter `inv_datacatalog.piveau` aktiviert sein.
Die API-Zugangsdaten werden über das Secrets-Management bereitgestellt. Sie dürfen
weder im RDF noch im Airflow-Manifest stehen.

Der Katalog wird einmalig angelegt:

```http
PUT {PIVEAU_HUB_REPO_BASE_URL}/catalogues/regensburg-dez-sanierungstool
Content-Type: text/turtle
X-API-Key: {SECRET}

@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dct: <http://purl.org/dc/terms/> .

<{DEZ_PUBLIC_BASE_URL}/id/catalogue/regensburg-dez-sanierungstool>
    a dcat:Catalog ;
    dct:type "dcat-ap" ;
    dct:title "DEZ-Sanierungstool – Datenkatalog Regensburg"@de ;
    dct:description "Externe Basis- und Fachdaten des DEZ-Sanierungstools."@de .
```

Ein Datensatz wird mit seiner stabilen `originalId` vollständig angelegt oder
aktualisiert:

```http
PUT {PIVEAU_HUB_REPO_BASE_URL}/catalogues/regensburg-dez-sanierungstool/datasets/origin?originalId=regensburg-dez-lod2-gebaeude
Content-Type: text/turtle
X-API-Key: {SECRET}
```

Piveau behandelt Aktualisierungen als vollständige RDF-Ersetzung; ein partielles
Patchen einzelner Felder ist nicht vorgesehen. Nach jedem Schreibvorgang werden
Hub-Repo- und Hub-Search-Darstellung gelesen und mit der erwarteten `originalId`
sowie dem Release-Manifest abgeglichen.

### Beispiel für LoD2

```turtle
@prefix dcat: <http://www.w3.org/ns/dcat#> .
@prefix dcatap: <http://data.europa.eu/r5r/> .
@prefix dcatde: <http://dcat-ap.de/def/dcatde/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<{DEZ_PUBLIC_BASE_URL}/id/dataset/regensburg-dez-lod2-gebaeude>
    a dcat:Dataset ;
    dct:identifier "regensburg-dez-lod2-gebaeude" ;
    dct:title "3D-Gebäudemodelle (LoD2) – Stadt Regensburg"@de ;
    dct:description "LoD2-Gebäude der Gemeinde Regensburg (09362000) mit 3D-Geometrie, Gebäudeattributen und, soweit vorhanden, Adressen."@de ;
    dct:publisher <https://www.ldbv.bayern.de/> ;
    dct:license <http://dcat-ap.de/def/licenses/cc-by/4.0> ;
    dct:accrualPeriodicity <http://publications.europa.eu/resource/authority/frequency/WEEKLY> ;
    dct:modified "{PUBLISHED_AUS_METALINK}"^^xsd:dateTime ;
    dcat:distribution <{DEZ_PUBLIC_BASE_URL}/id/distribution/regensburg-dez-lod2-citygml> .

<https://www.ldbv.bayern.de/>
    a foaf:Agent ;
    foaf:name "Landesamt für Digitalisierung, Breitband und Vermessung"@de .

<{DEZ_PUBLIC_BASE_URL}/id/distribution/regensburg-dez-lod2-citygml>
    a dcat:Distribution ;
    dct:title "LoD2 CityGML – Gemeinde Regensburg"@de ;
    dct:license <http://dcat-ap.de/def/licenses/cc-by/4.0> ;
    dcatde:licenseAttributionByText "Bayerische Vermessungsverwaltung – www.geodaten.bayern.de"@de ;
    dcat:accessURL <https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=lod2> ;
    dcat:downloadURL <https://geodaten.bayern.de/odd/a/lod2/citygml/meta/metalink/09362000.meta4> ;
    dcatap:availability <http://publications.europa.eu/resource/authority/planned-availability/STABLE> .
```

### Rückverknüpfung aus dem Release-Manifest

Jede tatsächlich verwendete Quelle wird im Release-Manifest mindestens mit
folgenden Angaben referenziert:

```json
{
  "piveau_catalogue_id": "regensburg-dez-sanierungstool",
  "piveau_original_id": "regensburg-dez-lod2-gebaeude",
  "source_version": "2026-07-21T21:07:37Z",
  "distribution_url": "https://geodaten.bayern.de/odd/a/lod2/citygml/meta/metalink/09362000.meta4",
  "mapping_profile_version": "regensburg-v1"
}
```

Für das DGM1 werden zusätzlich die Auswahlgeometrie und deren Erzeugungszeit
protokolliert. Solange der fachliche Kachelstand nicht bestätigt ist, bleibt
`source_version` leer:

```json
{
  "piveau_catalogue_id": "regensburg-dez-sanierungstool",
  "piveau_original_id": "regensburg-dez-dgm1-gelaendemodell",
  "source_version": null,
  "selection_generated_at": "2026-07-28T08:59:30Z",
  "selection_ewkt": "SRID=4326;POLYGON Z((11.97759446 48.94846059 0,11.98726795 49.11016127 0,12.23352702 49.10351988 0,12.22305933 48.94185670 0,11.97759446 48.94846059 0))",
  "distribution_access_url": "https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=dgm1",
  "mapping_profile_version": "regensburg-v1"
}
```

Bei dateibasierten Eingaben werden zusätzlich Dateiname, Byte-Größe und
SHA-256-Prüfsumme gespeichert. Dadurch ist vom aktiven DEZ-Release zum
Piveau-Datensatz und von dort zur konkreten Quelldistribution navigierbar.

<a id="pflege-und-freigaberegeln"></a>

## Pflege- und Freigaberegeln

1. Der jeweilige Betreiber der DEZ-Plattform pflegt Katalog- und
   Distributionsmetadaten gemäß TA-139 bis TA-141.
2. Lose Links und Archive werden vor der Aufnahme in den Produktivbetrieb in eine
   versionierte, zugriffsgeregelte Quellablage übernommen. Herkunfts-URL,
   Lieferdatum und Prüfsumme bleiben erhalten.
3. Ein Datensatz wird nicht als offen oder öffentlich gekennzeichnet, solange
   Lizenz und Weitergaberecht ungeklärt sind.
4. `dct:publisher` wird nur nach Bestätigung des rechtlich veröffentlichenden
   Datengebers gesetzt. Die Stadt Regensburg ist nicht automatisch Herausgeber
   jeder von ihr technisch gespeicherten Quelle.
5. `dct:accrualPeriodicity` beschreibt den bestätigten Quellturnus. Ein einzelnes
   Lieferdatum wird stattdessen als `dct:modified` beziehungsweise im
   Release-Manifest geführt.
6. Der betriebliche DEZ-Nutzungsstatus wird nicht mit
   `dcatap:availability` vermischt.
7. Vor Veröffentlichung werden RDF-Syntax, Pflichtfelder, kontrollierte
   Vokabulare, URLs und Piveau-Indexierung geprüft.

Offene Abnahmepunkte:

- Originalmetadaten und dauerhafte Bezugs-URLs für Baualtersklassen,
  Geothermie und Solarpotenzial,
- Nutzungs- und Weitergaberechte dieser drei Lieferungen,
- konkrete Kostenquelle einschließlich Lizenz, Preisstand und Regionalisierung,
- tatsächlicher fachlicher DGM1-Kachelstand und produktive Bereitstellungsroute
  der ausgewählten GeoTIFF-Kacheln,
- Betreiber, Nutzungsfreigabe und Jahr des letzten Datenbezugs für den
  BKG-konformen Quellenvermerk des über `intergeo38.bayernwolke.de`
  bereitgestellten TopPlusOpen-Light-Layers,
- produktive Piveau-, APISIX- und S3-Endpunkte der Stadt Regensburg sowie
- fachlicher und technischer Metadatenverantwortlicher.

<a id="referenzen"></a>

## Referenzen

- [DCAT-AP.de 3.0 – Spezifikation](https://www.dcat-ap.de/def/dcatde/3.0/spec/)
- [DCAT-AP.de – Lizenzliste](https://www.dcat-ap.de/def/licenses/)
- [Piveau – Hub APIs](https://doc.piveau.eu/guides/use-the-hub-apis/)
- [Piveau – Serviceübersicht](https://doc.piveau.eu/hub/services/)
- [Bayerische Vermessungsverwaltung – OpenData LoD2](https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=lod2)
- [Bayerische Vermessungsverwaltung – OpenData DGM1](https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=dgm1)
- [Bayerische Vermessungsverwaltung – Nutzungsbedingungen](https://www.geodaten.bayern.de/odd/m/3/html/nutzungsbedingungen.html)
- [BKG – Metadatensatz TopPlusOpen Light](https://mis.bkg.bund.de/trefferanzeige?docuuid=BD4D5B0F-2809-44D4-B2CE-D22ACC4CE0CC)
- [BKG – Webdienste, Nutzungsbedingungen und Quellenvermerk für TopPlusOpen](https://gdz.bkg.bund.de/index.php/default/wms-topplusopen-wms-topplus-open.html)
