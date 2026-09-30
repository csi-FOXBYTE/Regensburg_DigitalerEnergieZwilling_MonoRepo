> ⚠️ **Hinweis zum Dokumentstatus**
>  
> Dieses Dokument stammt aus einer frühen Konzeptions- und Planungsphase.
>  
> Es enthält:
> - initiale Annahmen
> - Variantenvergleiche
> - verworfene Architektur- und UX-Optionen

[[_TOC_]]
# 1. Technische Anforderungsanalyse & Planung

## Inhaltsverzeichnis

1. [Systemüberblick und Zielsetzung](#systemueberblick-und-zielsetzung)
2. [Funktionale Anforderungen](#funktionale-anforderungen)
3. [Nicht-Funktionale Anforderungen](#nicht-funktionale-anforderungen)
4. [Architektur-Entwurf](#architektur-entwurf)
5. [Anbindung an CIVITAS/CORE](#anbindung-an-civitas-core)
6. [Tests & Qualitätssicherung](#tests-qualitaetssicherung)
7. [Fazit und Entscheidungsempfehlung](#fazit-und-entscheidungsempfehlung)

<a id="systemueberblick-und-zielsetzung"></a>
## Systemüberblick und Zielsetzung
Ziel ist die Entwicklung einer webbasierten 3D-Anwendung, die das digitale Stadtmodell (LOD2) von Regensburg mit Energiepotenzialen verknüpft. Das System fungiert als Entscheidungsunterstützungssystem (DSS) für Bürger (Eigentümer/Vermieter), um energetische Sanierungsmaßnahmen zu berechnen.
### Datenanforderungen
- **3D-Gebäudemodell**: Quelle CityGML (LOD2) -> muss gewandelt werden in 3D Tiles zur performanten Darstellung in Cesium (@csi-foxbyte/cityjson-to-3d-tiles)
- **Geothermie**: Quelle Raster/Vektordaten -> Gebäude müssen mit Potentialen verknüpft werden (GDAL)
- **Solarthermie**: Quelle Raster/Vektordaten -> Dachflächengeometrie muss mit Solardaten "verschnitten" werden (GDAL)
- **Sanierungslogik**: Quelle tbd -> Welche Maßnahmen werden empfohlen?

<a id="funktionale-anforderungen"></a>
## Funktionale Anforderungen
### Visualisierung (Frontend / Cesium)
- **Rendering**: Flüssige Darstellung (min. 30 Fps) des gesamten Stadtgebiets Regensburg im Browser (auf technisch relevanten Geräten, d.h. Gerät hat GPU und ist in der Lage Cesium.Js sinnvoll darzustellen)
### Interaktion & Berechnung
- **Objektauswahl**: Klick auf Haus öffnet Detail-Panel.
- **Status-Quo-Anzeige**: Anzeige der geschätzten Werte aus den Katasterdaten
- **Interaktiver Rechner**: Eingabemaske für den Nutzer
	- Fenster
	- Dämmung
	- Heizungsart
- **Feedback**: wenn möglich sofort, lange Wartezeiten vermeiden

<a id="nicht-funktionale-anforderungen"></a>
## Nicht-Funktionale Anforderungen
- **Datenschutz**
  - Authentifizierung: nur durch Stadtverwaltung / Fachpersonal, Bürger (Eigentümer/Vermieter) kommen ohne Authentifizierung auf den Sanierungsrechner

- **Performance**
  - Antwortzeit der Berechnung möglichst "Realtime"
  - Initiales Laden des 3D-Modells / der Seite < 5 Sekunden
- **Skalierbarkeit**:
  - Maximale Anzahl gleichzeitiger Nutzer < 1.000
  - Spike basierte Nutzung (nicht kontinuierlich hoher Traffic)
- **Betrieb**:
  - Im Städtischen Rechenzentrum angeschlossen an CIVITAS/CORE
  - OpenTelemetry Monitoring + Logging

<a id="architektur-entwurf"></a>
## Architektur-Entwurf
### Datenaufbereitung (Offline)
- **3D Tiles**: Erstellung durch @csi-foxbyte/cityjson-to-3d-tiles (unterstützt auch Texturdaten)
1. Wandlung von CityGML zu CityJSON ([citygml-tools](https://github.com/citygml4j/citygml-tools))
2. Wandlung CityJSON zu 3D Tiles ([@csi-foxbyte/cityjson-to-3d-tiles](https://www.npmjs.com/package/@csi-foxbyte/cityjson-to-3d-tiles))
- **Geothermie**: Einlesen via GDAL + Verknüpfung von Gebäuden mit "Zonen" / Werten -> (wird als Attribut im 3D Tile abgelegt, da statisch)
- **Solarthermie**: Einlesen via GDAL + Verknüpfung von Dachflächen -> wird als Attribut abgelegt, auch statisch
- **User-Daten**: Werden in der PostgresQL Datenbank abgelegt und pro Gebäude verknüpft
### Backend (Server)
- **Framework**: Node.js mit [@csi-foxbyte/fastify-toab](https://www.npmjs.com/package/@csi-foxbyte/fastify-toab)
- **Datenbank**: SQLite mit SpatiaLite für schnelle räumliche Abfragen
- **API**: OpenAPI via [@csi-foxbyte/fastify-toab](https://www.npmjs.com/package/@csi-foxbyte/fastify-toab)
### Frontend
Für das Frontend bieten sich zwei Optionen an, welche nachfolgend grob umrissen werden.
#### Frontend Option A: MasterPortal Addon
- **Framework**: Vue.js bindet React.js als PWA/SPA ein (via [Vite](https://vite.dev/guide/))
- **Rendering**: übernimmt MasterPortal komplett
- **Nachteil**: UI/UX sehr eingeschränkt, kaum eigene Interaktionsmöglichkeiten (Interaktionen muss es im MasterPortal schon geben)
- **Vorteil**: Viele Interaktionen sind schon vorgegeben und fühlen sich nach dem MasterPortal an.
#### Frontend Option B: Micro Frontend (Client)
- **Framework**: React.js als PWA/SPA (via [Vite](https://vite.dev/guide/))
- **3D-Engine**: CesiumJs
- **(2D-Engine?)**: Fallback zu 2D falls Endgerät zu schwach?
- **State-Management**: Speicherung der User-Eingaben nur anonym / Sitzungsbasiert
- **Nachteil**: Jegliche gewünschten Interaktionen müssen nachimplementiert werden, nicht das gleiche Look and Feel wie das MasterPortal
- **Vorteil**: UI/UX kann frei gewählt werden (z.B. einfärben von Quartieren / Häusern, Visualisierung von Solarpotentialen, etc).

#### Vergleich beider Optionen
|Kriterium|Option A: MasterPortal Addon|Option B: Standalone App (React)|
|--|--|--|
|Hauptfokus|Integration in bestehende Infrastruktur|Bestmögliche User Experience|
|Technologie|Vue.js (Host) + React (Gast) = Hybrid|React (Vite) + Cesium (Resium) = Nativ|
|3D-Kontrolle|Indirekt (nur über MasterPortal API)|Direkt (Voller Zugriff und Customizability)|
|Performance|Mittel (Komplettes Portal Framework muss mitgeladen werden)|Hoch (lädt nur notwendigen Code / stark reduziert im Funktionsumfang im Vergleich zum MasterPortal)|
|Entwicklungsaufwand|Hoch (etwaige Integrationsprobleme, Hacks)|Mittel (Basisfunktionen müssen gebaut werden)|
|Komplexität|Durch notwendige Brücke zwischen MasterPortal und React / Backend Welt relativ hoch|Niedriger weil nur mit React gearbeitet wird|
|Wartbarkeit|Schwierig (komplette Abhängigkeit vom MasterPortal / der Version des Kunden)|Einfach (eigener Release Zyklus)|
|UX-Freiheit|Eingeschränkt (Seiten panel Zwang)|Unbegrenzt (Full-Screen / Overlays)|

#### Beispielhafter UX-Vergleich: Szenario "Sanierung berechnen"

Um den Unterschied in der Nutzererfahrung (User Experience) zu verdeutlichen, wird hier der Ablauf einer energetischen Berechnung gegenübergestellt:
**Option A: MasterPortal (Integration)**
*   **Einstieg**: Nutzer öffnet das allgemeine Stadtportal, sucht im komplexen Menübaum nach "Werkzeuge" -> "Energiezwillng".
    
*   **Interaktion**: Eine klassische Sidebar öffnet sich am linken Rand und schiebt den Kartenausschnitt beiseite.
    
*   **Auswahl**: Nutzer klickt auf ein Gebäude. Die Selektion wird durch eine einfache Umrandung (Highlight) angezeigt.
    
*   **Berechnung**: Alle Eingaben (Dämmung, Fenster, Heizung) erfolgen in statischen Textfeldern und Dropdowns in der Sidebar.
    
*   **Feedback**: Ergebnisse werden als Zahlenwerte in der Tabelle der Sidebar aktualisiert. Der Bezug zum 3D-Objekt ist rein kognitiv.
    
*   **Gefühl**: Eher bürokratisch, "Formular ausfüllen", GIS-Experten-Look.
    
**Option B: Standalone App (React & Cesium)**
*   **Einstieg**: Nutzer landet auf einer dedizierten, atmosphärischen Startseite ("Regensburg Digitaler Energie Zwilling") mit automatischem Kameraflug über die Stadt.
    
*   **Interaktion**: Mouseover über Gebäude zeigt sofort Energieklassen als farbige Tooltips (kein Klick nötig).
    
*   **Auswahl**: Klick auf Gebäude zoomt die Kamera dynamisch heran (Fokus-Ansicht). Der Hintergrund wird optional unscharf (Depth of Field), um den Fokus auf das Haus zu lenken.
    
*   **Berechnung**: Schwebende UI-Elemente (Overlays) oder direkte Slider am unteren Bildrand erlauben Anpassungen.
    
*   **Feedback**: Das Gebäude ändert in Echtzeit seine Einfärbung (z.B. von Rot zu Grün oder eine Wärmebild-Berechnung), während sich animierte Balkendiagramme verändern.
    
*   **Gefühl**: Modern, spielerisch ("Gamification"), immersiv, motivierend für Bürger (Eigentümer/Vermieter).
    

> **Empfehlung:** > Um alle UX Vorgaben einhalten zu können und die Erweiterung der Interaktion so groß wie möglich zu halten, wird empfohlen eine **eigenständige Lösung** abgekapselt vom MasterPortal zu entwickeln. Um die Sichtbarkeit möglichst groß zu halten wird aber empfohlen im MasterPortal einen Link zur Anwendung zu hinterlegen, sodass Benutzer des MasterPortals zum Digitaler Energie Zwilling finden.

### Anhang: Frontend Admin-Dashboard (Stadtverwaltung / Fachpersonal)
Beide Frontend Varianten benötigen eine Adminoberfläche (Stadtverwaltung / Fachpersonal) die separat (außerhalb des öffentlich zugänglichen Systems aufgerufen werden können, dies wird in der ersten Planung vernachlässigt weil es nur eine Lösungsmöglichkeit dafür gibt.
- Muss authentifiziert sein über IDP (z.B. Keycloak)
- **Framework**: React (Vite)

### Berechnungskern
#### Berechnungskern Option A
- Selbstentwicklung eines sehr abgespeckten Kerns nach Vorgaben aus beliebiger DIN aber mit stark reduzierter Komplexität
- **Risiko hoch**
#### ~~Berechnungskern Option B~~ (Wird verworfen weil nicht zielführend für Projekt)
- Einbindung von "Fremdkern" Bereitstellung über API / separates Modul. Wichtig hierbei es muss austauschbar sein.
- **Risiko niedrig**
#### Berechnungskerne Vergleich
|Kriterium|Option A: Selbstbau (vereinfacht)|Option B: Fremdkern (API)|
|--|--|--|
|Entwicklungsaufwand|Hoch (je nach gewähltem Modell, z.B. TABULA mittel, DIN 18599 extrem)|Niedrig (Schnittstelle anbinde)|
|Wartungsaufwand|Sehr hoch (um aktuell zu bleiben muss der Rechenkern selbständig gewartet / aktualisiert werden)|Niedrig (Anbieter kümmert sich um Updates)|
|Performance (UX)|Sehr gut (je nach gewähltem Modell)|Mittel (höhere Latenz durch Antwortzeiten des Servers)|
|Genauigkeit|Fragwürdig (nicht förderfähig, sondern indikativ)|Hoch (Potentiell zertifizierte Algorithmen)|
|Haftungsrisiko|Liegt bei der Stadt|Liegt beim Anbieter|
|Datenbedarf|Je nach Datenmodell gering - hoch|Potentiell hoch|

> Empfehlung: Tendenziell Richtung TABULA/EPISCOPE gehen mit vorgerechneten Datensätzen, d.h. Option A mit stark vereinfachten Modellen (indikativ anstatt förderfähig). Eher Richtung Lookup anstatt Live-Physik, wenn individuelle Energieberatung stattfinden soll Option B, für Potenziale und nicht förderfähige Angebote Option A.

### Systembild
#### Systembild Option A
:::mermaid
flowchart TB
    subgraph DataPrep["Datenaufbereitung (Offline)"]
    Source1[("CityGML (LOD2)")]
    Source2[("Raster/Vektordaten (Solar & Geothermie)")]
    
    Tool1["citygml-tools (CityGML -> CityJSON)"]:::process
    Tool2["@csi-foxbyte/cityjson-to-3d-tiles (CityJSON -> 3D Tiles)"]:::process
    Tool3["GDAL (Verschneidung Geodaten)"]:::process
    
    Source1 --> Tool1 --> Tool2
    Source2 --> Tool3
    Tool3 -.->|Attribute| Tool2
end

subgraph Backend [Backend & Hosting]
    direction TB
    StaticStore[("Static Storage (3D Tiles)")]:::storage
    DB[("SQLite + SpatiaLite (User-Daten & Raumbezug)")]:::storage
    APIServer["Node.js Server (@csi-foxbyte/fastify-toab)"]:::server
    
    Tool2 --> StaticStore
    APIServer <-->|OpenAPI| DB
end

subgraph Client [Frontend: MasterPortal]
    direction TB
    MasterPortal["MasterPortal (Vue.js) Karten-Rendering"]:::client
    ReactAddon["Sanierungs-Rechner Addon(React.js via Vite)"]:::client
    
    MasterPortal -- bindet ein --> ReactAddon
end

%% Connections
StaticStore -- "lädt (Tiles)" --> MasterPortal
ReactAddon -- "Interaktion/Berechnung" --> APIServer
:::

#### Systembild Option B
:::mermaid
flowchart TB
subgraph DataPrep ["Datenaufbereitung (Offline)"]
    direction TB
    Source1[("CityGML (LOD2)")]
    Source2[("Raster/Vektordaten (Solar & Geothermie)")]
    
    Tool1["citygml-tools (CityGML -> CityJSON)"]:::process
    Tool2["@csi-foxbyte/cityjson-to-3d-tiles (CityJSON -> 3D Tiles)"]:::process
    Tool3["GDAL (Verschneidung Geodaten)"]:::process
    
    Source1 --> Tool1 --> Tool2
    Source2 --> Tool3
    Tool3 -.->|Attribute| Tool2
end

subgraph Backend [Backend & Hosting]
    direction TB
    StaticStore[("Static Storage (3D Tiles)")]:::storage
    DB[("SQLite + SpatiaLite (User-Daten & Raumbezug)")]:::storage
    APIServer["Node.js Server (@csi-foxbyte/fastify-toab)"]:::server
    
    Tool2 --> StaticStore
    APIServer <--> DB
end

subgraph Client [Frontend: Standalone]
    direction TB
    ReactApp["React.js App (PWA/SPA via Vite)"]:::client
    Engine3D["CesiumJS (3D Engine)"]:::client
    Engine2D["2D Fallback (falls Gerät schwach)"]:::client
    
    ReactApp -- steuert --> Engine3D
    ReactApp -.->|Fallback| Engine2D
end

%% Connections
StaticStore -- "lädt (Tiles)" --> Engine3D
ReactApp -- "Interaktion/Berechnung (via OpenAPI)" --> APIServer
:::

<a id="anbindung-an-civitas-core"></a>
## Anbindung an CIVITAS/CORE

Die Integration der Anwendung in die bestehende Infrastruktur von CIVITAS/CORE erfolgt nach dem Prinzip der losen Kopplung (Loose Coupling), um Wartbarkeit und Sicherheit zu gewährleisten. Die Anwendung wird als Container-Lösung (Docker) bereitgestellt und orchestriert.

### Deployment & Betrieb

- **Container-Registry**: Die Build-Artefakte (Frontend Bundle & Backend Service) werden als Docker Images in einer zentralen Registry abgelegt.

### Authentifizierung & Sicherheit (IAM)
- **Identity Provider (IdP)**: Für den geschützten Admin-Bereich (Stadtverwaltung / Fachpersonal) erfolgt die Authentifizierung über OpenID Connect (OIDC) gegen den zentralen Keycloak in CIVITAS/CORE.
- **Rollenkonzept**: Mapping von CIVITAS-Rollen auf Anwendungsrechte (z.B. `civitas_admin` -> `app_admin`).
- **Public Access**: Der Bürger-Client (Eigentümer/Vermieter) (Sanierungsrechner) agiert ohne Authentifizierung, ist jedoch durch Rate-Limiting (via APISIX) gegen DDoS-Attacken geschützt.

### Datenintegration
- **Basiskarten**: Die 3D-Anwendung bindet städtische 2D-Grundkarten (WMS/WMTS) direkt über die Geo-Dienste der Stadt Regensburg ein, um Redundanzen zu vermeiden.
- **Rückkanal (Optional)**: Daten aus der Datenaufbereitung werden zurückgespeist und allgemein verfügbar gemacht.

<a id="tests-qualitaetssicherung"></a>
## Tests & Qualitätssicherung

- **Berechnungskern**: Falls Eigenentwicklung Unit Tests
- **Datenaufbereitung**: Integrationstests / Validierung
- **User-Tests**: Nur durch Stadtverwaltung / Fachpersonal (Kunde), dafür muss Anwendung "testbar" sein.
- **End2End Tests**: tbd
------

<a id="fazit-und-entscheidungsempfehlung"></a>
## Fazit und Entscheidungsempfehlung
Zusammenfassend wird für die Realisierung des digitalen Energiezwillings die **Option B (Standalone-Lösung)** empfohlen. Diese Architektur bietet die notwendige technologische Freiheit, um mittels **CesiumJS** und **React** eine performante und intuitiv bedienbare 3D-Anwendung bereitzustellen, die modernen UX-Standards entspricht.
Für die energetische Bewertung wird initial auf einen **vereinfachten Berechnungskern (Option A)** gesetzt, der auf Typvertretern (ähnlich TABULA/EPISCOPE) basiert. Dies ermöglicht eine schnelle, indikative Potentialanalyse für Bürger (Eigentümer/Vermieter), minimiert externe Abhängigkeiten und reduziert die anfängliche Komplexität. Die modulare Systemarchitektur gewährleistet dabei, dass Komponenten wie der Rechenkern bei Bedarf in zukünftigen Ausbaustufen gegen zertifizierte Module ausgetauscht werden können.

------

# 2. Datenanalyse

Weitere Schritte folgen sobald Phase 1 abgeschlossen ist

