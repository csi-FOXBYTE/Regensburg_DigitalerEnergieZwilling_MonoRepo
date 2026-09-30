# Datenmodell und API-Sicht

## Inhaltsverzeichnis

1. [Ziel dieser Sicht](#ziel-dieser-sicht)
2. [Datenmodell (abgeleitet)](#datenmodell-abgeleitet)
3. [API-Sicht (erste Ableitung)](#api-sicht-erste-ableitung)
4. [Security by Design im Daten- und API-Vertrag](#security-by-design-im-daten-und-api-vertrag)
5. [Abgleich und Entscheidungen](#abgleich-und-entscheidungen)

<a id="ziel-dieser-sicht"></a>
## Ziel dieser Sicht

Dieses Kapitel beschreibt das fachliche Datenmodell und die API-Schnittstellen des
Digitaler Energie Zwilling (DEZ). Es ergänzt die Container- und Komponenten-Sichten um die
strukturelle Daten- und Vertrags-Ebene.

---

<a id="datenmodell-abgeleitet"></a>
## Datenmodell (abgeleitet)

Das Datenmodell wurde aus den fachlichen Anforderungen und den Nutzerzielen
abgeleitet. Es trennt **statische Potenzialdaten** (3D Tiles und NGSI-LD, offline) von
**dynamischen Nutzereingaben** und **administrativen Daten** (Datenbank).

### Kernobjekte

- **Gebäude** (Referenz auf LOD2/3D Tiles) und **Quartiere** (Aggregationen)
- **Eingabesets** (Eingabetiefe/Detailgrad, Quelle, Zeitstempel)
- **Bauteil- und Systemeingaben** (Hülle, Lüftung, Warmwasser, Anlagentechnik)
- **Maßnahmenkatalog** und **Maßnahmenselektion** (inkl. Förderprogramme)
- **Berechnungskonfiguration (versioniert)** und **Konfigurationsoptionen**
- **Berechnungen & Ergebnisse** (Heizwärmebedarf, Endenergie, Primärenergie, CO₂, Brennstoffverbrauch/-kosten, Effizienzklassen)
- **Triage/Status** für administrative Prüfung und Veröffentlichung
- **Audit-Log** (Änderungen, Freigaben, Zeitstempel, Benutzerkennung, Prüfkommentar und auslösende Einreichung)
- **Reports** (Anzeige in der Anwendung) und **optionale bürgerseitige Exporte** (z.B. PDF/JSON für Bürger)

### Beziehungen (vereinfacht)

- Ein **Gebäude** hat mehrere **Eingabesets** (Szenarien, Eingabetiefe/Detailgrad).
- Ein **Eingabeset** hat **Bauteil- und Systemeingaben** sowie **Maßnahmen**.
- Jede **Berechnung** referenziert eine **Konfigurationsversion** und erzeugt **Ergebnisse**.
- **Triage** ist pro Eingabeset geführt; übermittelte Daten sind nach interner Freigabe für interne Auswertungen nutzbar.
- **Quartiere** erlauben Aggregationen und Reporting auf Planungsebene.

### Eingabekategorien (Auszug)

- **Grunddaten**: Baujahr/Baualtersklasse, Gebäudetyp, Wohnfläche, Wohneinheiten, Personenanzahl.
- **Gebäudehülle**: Dach, Außenwand, Fenster, Kellerdecke inkl. Zustand/Sanierungsjahr und Dämmung.
- **Lüftung**: globaler Lüftungsfaktor im abgestimmten Berechnungskern; keine direkte Nutzereingabe und keine zusätzliche Ableitung einer Luftdichtheitsklasse aus dem Baualter.
- **Warmwasser & Nutzung**: pauschal, personenbasiert oder verbrauchsbezogen.
- **Anlagentechnik**: Energieträger, Erzeugerart, Heizflächenart, Anlagenalter, Heizkreistemperatur, Regelung, Zusatzheizung und Sanierungsrandbedingungen.
- **Kosten/Preise & Faktoren**: Jahresverbrauch, Arbeitspreis, Grundpreis, Heizwert, Primärenergiefaktor und CO₂-Faktor.
- **Erneuerbare**: PV, Geothermie, Energiespeicher (optional). Die PV-Datenfreigabe liegt vor; die ursprünglich vorgesehenen zwei PV-Darstellungen wurden von AG und AN als deutlich zu detailliert eingestuft, und der reduzierte AN-Vorschlag wurde vom AG nicht angenommen. Der verbindliche Ersatzumfang ist noch festzulegen. Solarthermie ist als spätere Erweiterung denkbar, derzeit aber nicht im Berechnungskern vorgesehen.

### Eingabespektrum-Enden (Grobkonzept-Arbeitsmappe)

Quelle: `20260320_RDEZ_Uebersicht_Berechnung_Grobkonzept.xlsx`

Die aktualisierte Arbeitsmappe bestätigt die Modellierung als kontinuierliches Eingabespektrum.

- **Datenstufe 1** entspricht im Datenmodell dem Fall ohne Nutzereingabe.
- **Datenstufe 2** entspricht dem Fall vollständiger Überschreibung aller fachlich freigegebenen Eingabewerte.
- Beide Referenz-Enden verwenden dieselben fachlichen Entitäten; sie unterscheiden sich nicht durch getrennte Datenmodelle, sondern durch Herkunft, Überschreibung und Verwendungsstatus einzelner Werte.

Für überschreibbare Eingabewerte sind fachlich mindestens folgende Sichten relevant:

- **Basiswert**: automatisch abgeleiteter oder katalogbasierter Ausgangswert
- **Nutzerwert**: optionaler, manuell gesetzter Wert
- **Berechnungswert**: der tatsächlich in der Berechnung verwendete Wert
- **Herkunft**: z. B. `basisdaten`, `katalog/default`, `manuell`
- **Überschreibbarkeit**: Kennzeichnung, ob ein Wert fachlich zur Bearbeitung freigegeben ist

Daraus folgt:
Nicht jede interne Rechengröße ist Teil des Eingabemodells, und nicht jeder Berechnungswert ist direkt vom Nutzer editierbar.

| Domäne | Typische Felder im unteren Spektrum-Ende | Typische Felder im oberen Spektrum-Ende |
| ----- | ----- | ----- |
| Dach/Dachfenster | Dachfläche, Dachfensterfläche, U-Werte aus Baualter/Kat. 1 | Manuelle Flächen, U-Werte, Konstruktion/Schichtbezug |
| OGD/AW/UGD | Flächen und U-Werte aus LOD2 + Baualtersklasse | Überschriebene Flächen/U-Werte, Konstruktionsdetails |
| Fenster/Türen | Standardanteile und Katalog-U-Werte | Rahmen-/Verglasungsdetails und manuelle U-Werte |
| Heizung | Katalogbasierte Vorbelegung aus Baujahr/Erzeugertyp | System-, Regelungs- und Zusatzparameter inkl. Heizkreistemperatur, Zusatzheizung, Brennstofflager- und Flächenheizungs-Kontext |

Die aktualisierte Arbeitsmappe präzisiert außerdem, dass Ergebnisobjekte nicht nur aggregierte Kennzahlen, sondern getrennte Felder für Heizwärmebedarf, Warmwasser, Endenergie, Primärenergie, CO₂, Brennstoffverbrauch und Brennstoffkosten tragen müssen.

### Datenhaltung

- **3D Tiles**: Geometrie und statische Potenziale (keine DB-Persistenz).
- **Stellio (NGSI-LD)**: freigegebene statische Gebäude- und Potenzialattribute für die Nachnutzung innerhalb von CIVITAS/CORE.
- **Datenbank**: Eingaben, Konfigurationen, Ergebnisse, Triage, Kataloge, bürgerseitige Report-Exporte (nur bei explizitem Export).
- **Client-Zustand**: Bearbeitungszustand wird über Local Storage persistiert; serverseitige Wiederherstellung erfolgt nur bei expliziter Speicherung.
- **Konfigurations-Snapshot**: JSON wird aus der DB-Version erzeugt und als Datei exportiert.

### Kommunenprofile und kanonisches Mapping

- **SoT-Hinweis (Basisdaten)**: Die fachlich eindeutige Referenz besteht aus Quell-Datensatzversion + Mapping-Profil-Version + veröffentlichtem Release-Manifest.
- Das Kommunenprofil ist pro Deployment eindeutig; innerhalb einer Instanz wird kein paralleler Mehrkommunen-Kontext geführt.
- Für die Nachnutzung wird ein **kanonisches Datenmodell** als Zielschema geführt (Gebäude, Adresse, Potenziale, Kennwerte).
- Kommunenspezifische Quellformate werden über ein **versioniertes Mapping-Profil** in das Zielschema überführt.
- Ein Mapping-Profil enthält mindestens:
  - Feldzuordnungen (Quelle -> Zielattribut)
  - Einheiten- und Wertebereichstransformationen
  - Fallback-Regeln bei fehlenden Quellfeldern
  - Herkunftsinformationen (Quelle, Mapping-Version, Transformationsregel)
- Quellen-Metadaten (`dct:title`, `dct:description`, `dct:publisher`, `dct:license`, `dct:accrualPeriodicity`, `dcat:distribution`) werden durch den Betreiber der DEZ-Plattform gepflegt und in den Datenschutzhinweisen der DEZ-Webseite veröffentlicht.
- Die Auswahl ist auf DCAT-AP.de gemappt, bildet den Standard für DEZ jedoch nur in einem bewusst begrenzten Mindestumfang ab.
- Regensburg-spezifische Felder, Texte oder Klassifikationen sind als Profilinhalt zu behandeln und nicht als implizite Kernannahme.

<a id="aktueller-stand-citygml-energy-ade"></a>

### Aktueller Stand CityGML Energy ADE

- CityGML LOD2 bleibt die Basiseingabe für Geometrie und Adressbezug.
- **CityGML Energy ADE 1.0** ist aktuell nicht mit **CityGML 3.0**-Dateien kompatibel und daher für die Umsetzung im DEZ derzeit nicht geeignet.
- Für DEZ bleiben deshalb LOD2-Basisattribute, externe Potenzialdaten und Konfigurationswerte der maßgebliche Eingangspfad.
- Eine spätere Neubewertung ist nur sinnvoll, wenn ein kompatibler Standard- oder Werkzeugstand vorliegt.

### Status-Lifecycle (Triage)

- `neu` → `in_pruefung`
- `in_pruefung` → `freigegeben` oder `abgelehnt`
- `freigegeben` → `ersetzt`, wenn eine spätere Einreichung desselben Gebäudes freigegeben wird
- Statuswechsel werden im Audit-Log mit Zeitstempel, Benutzerkennung, Prüfkommentar und gegebenenfalls der auslösenden Einreichung protokolliert.
- Bei der Freigabe setzt das Backend die neue Einreichung, eine bisherige Freigabe und weitere offene Geschwistereinreichungen in einer gemeinsamen Transaktion auf ihre Zielstatus. Eine Datenbankinvariante lässt pro Gebäude höchstens eine freigegebene Einreichung zu.
- Die Admin-Aktion „Datensatz abgelehnt“ setzt `abgelehnt` (im Code `DECLINED`) als fachlichen Endstatus. Abgelehnte Datensätze dürfen nicht indexiert oder exportiert werden.
- `ersetzt` (im Code `SUPERSEDED`) ist ein lesbarer fachlicher Endstatus und verweist über das Audit-Log auf die auslösende neuere Einreichung.
- Eine tatsächliche Löschung entfernt den Datensatz und wird nicht als Triage- oder Tombstone-Status modelliert. In der Admin-Triage können einzelne Einreichungen gezielt gelöscht werden; die gebündelte Löschung einer Gebäudegruppe ist nur zulässig, wenn alle Einreichungen zu ihrer Gebäude-ID den Status `abgelehnt` besitzen.
- Erfolgreiche Löschungen erzeugen atomar ein unabhängiges `DeletionAuditEvent`. Dieses enthält keinen Fremdschlüssel und keine fachliche Referenz zu `Submission` oder `Building`. Gespeichert werden ausschließlich Ereignis-ID, Zeitpunkt, Aktion, Akteurstyp, bei administrativen Aktionen interne Benutzerkennung und Rolle, Löschanzahl sowie der SHA-256-Commitmentwert des Löschbelegs.
- Der Löschbeleg enthält die konkrete Zielreferenz und ein zufälliges Prüfgeheimnis und wird nur an den Aufrufer ausgegeben. Ohne diesen Beleg lässt sich der gespeicherte Commitmentwert keiner Einreichung oder Gebäudegruppe zuordnen. Die öffentliche Verifikationsroute nimmt den vollständigen Beleg per `POST` entgegen und liefert ausschließlich dessen Gültigkeit zurück.

### Statische Tile-Attribute (Auszug)

- **Adressen** stammen aus LOD2 und werden direkt im Tile geführt (`address_full`, `street`, `house_number`, `city`).
- **Solarpotenziale** liegen erst bei verfügbarer, durch den Auftraggeber freigegebener Datenbereitstellung als Attribute in 3D Tiles vor. Aktuell ist die Solar-Anreicherung fachlich blockiert. Relevante Felder u.a.:
  `solarArea`, `Fläche`, `Dachneigung`, `Dachorientierung`, `SVF_min`, `SVF_avg`, `SVF_med`, `SVF_max`,
  `Z_MIN`, `Z_MAX`, `Z_MIN_ASL`, `Z_MAX_ASL`, `creationDate`,
  `globalRadMonths_1..12`, `directRadMonths_1..12`, `diffuseRadMonths_1..12`.
- **Einheiten** werden aus der Datenquelle übernommen; es erfolgt keine DB-Normalisierung.
- **Geothermiepotenziale** werden aus den tatsächlich vom Auftraggeber bereitgestellten Datensatzmerkmalen ermittelt und als statische Attribute ergänzt; nicht geführte Varianten wie Kollektor und Sonde werden nicht hergeleitet.
- **Datenstand Solar/Geothermie**: Umfang und Detailgrad der Solarpotenzial-/PV-/Speicher-Verarbeitung sind noch in Klärung; eine Umsetzung in Sprint 18/19 ist fraglich. Die Geothermie-Daten wurden nach der Datenfreigabe in Sprint 17 technisch integriert; Herkunfts-, Lizenz-, Turnus- und Schemametadaten sind noch zu klären. Ein zusätzlicher Fallback nach dem Vorbild der LfU-/TUM-Studie wird nicht benötigt.
- **Vegetation (Bäume)** wird als eigener 3D Tiles Layer für die Visualisierung ausgeliefert.

### NGSI-LD-Export nach Stellio

> **Umsetzungsstand:** Mapping und Exportpfad sind vorbereitet. Die konkrete Schnittstelle und Übergabekonfiguration in der Kundeninstanz sind noch nicht geklärt; die folgenden Festlegungen beschreiben den Sollzustand.

- Der NGSI-LD-Export wird aus dem kanonischen Mapping-Profil abgeleitet und ist fachlich an dieselben freigegebenen statischen Attribute gebunden wie die 3D-Tiles-Ausgabe.
- Smart Data Models werden verwendet, soweit passende Entity-Typen und Attribute vorhanden sind.
- Projekt- oder kommunenspezifische Attribute müssen dokumentiert, versioniert und mit Einheit sowie Herkunft versehen sein.
- Personenbezogene Nutzereingaben, Triage-Status und bürgerseitige Berechnungsergebnisse werden nicht nach Stellio exportiert.

### Abgeleitete Gebäudeparameter (LOD2)

Aus der LOD2-Geometrie werden im implementierten Datenfluss insbesondere
Grundfläche, Fläche der obersten Geschossdecke, Außenwandfläche, Dachfläche,
Gebäudehöhe und angrenzende Wandflächen abgeleitet. Daraus bestimmt der
Berechnungskern weitere Vorbelegungen wie Geschosszahl, Wohnfläche sowie
Fensterflächen.

Die vollständige Feldzuordnung einschließlich UI-Sichtbarkeit, Fallbacks und
der derzeit nicht gemappten Werte (u.a. LOD2-Volumen, Hüllfläche und Dachform)
ist zentral im
[LOD2-zu-Frontend-Eingabefeld-Mapping](17-lod2-frontend-input-mapping.md)
dokumentiert.

### Konfigurations-Publishing

- **Source of Truth**: Konfigurationen werden in der Datenbank gepflegt und versioniert.
- **Snapshot**: Beim Veröffentlichen wird ein JSON-Snapshot erzeugt, gespeichert und exportiert.
- **Konsistenz**: Berechnungen referenzieren eine Config-Version und deren Checksumme.

### Ergebnis-Publishing und Indexierung

- **Public Write**: Der öffentliche Bereich darf Berechnungsergebnisse schreiben (inkl. Eingaben und Config-Version).
- **Server-Recompute**: Beim Speichern werden die Ergebnisse serverseitig mit dem gleichen Berechnungskern
  neu berechnet.
- **Input-Validation**: Eingangsgrößen werden gegen konfigurierte Grenzen geprüft
  (z.B. Wertebereiche wie 100–2000).
- **Public Capability API**: Nach dem Speichern erhält der Client ausschließlich einen zufälligen Lösch-Token. Derselbe Token schützt die nicht verändernde Verfügbarkeitsprüfung, den vom Backend erzeugten JSON-Download und die physische Löschung per HTTP `DELETE`. Fehlende, ungültige und bereits verwendete Tokens sind als `404` nicht unterscheidbar; die frühere mutierende `GET`-Route entfällt. Nach erfolgreicher Löschung erhält der Client einen Löschbeleg, den er lokal herunterladen und später über `POST /api/public/submissions/deletion-receipts/verify` prüfen lassen kann.
- **Triage**: Stadtverwaltung / Fachpersonal prüft Datensätze auf Plausibilität, gibt sie intern frei oder lehnt sie ab. Eine tatsächliche Löschung erfolgt separat über die dafür vorgesehenen Delete-Endpunkte. Der Endpunkt für eine einzelne Einreichung löscht nur diese Einreichung; der Endpunkt für eine Gebäudegruppe prüft atomar, dass alle zugehörigen Einreichungen abgelehnt sind.
- **Indexierung**: Aus verifizierten und triagierten Ergebnissen werden abgeleitete Basisdaten pro Gebäude erzeugt
  (z.B. für Vergleiche, Quartiersanalysen und Reports).

### Offene Datenmodell-Punkte aus dem Grobkonzept

- Kostenfelder für Hülle-Maßnahmen sind aktuell als Platzhalter markiert und noch nicht als belastbares Schema beschrieben. Wirtschaftlichkeit und Amortisation sollen wieder auf BKI-Kostendaten ausgerichtet werden. Stand 24.07.2026 fehlen Datenzugang und abgesicherter Verfügbarkeitszeitplan; Schema, Lizenz, Granularität, Preisstand, Regionalisierung und Pflegeprozess sind daher noch offen.
- Teilweise enthalten Tabellenwerte reine Template-Inhalte (`0`, `#`) und dürfen nicht als produktive Defaultwerte in API/DB übernommen werden.
- Korrekturfaktoren je Bauteil sind nicht vollständig als konfigurierbare Regelstruktur ausdefiniert.
- Für Teile der Heizungslogik liegt noch keine ausreichend formalisierte Regelbasis für maschinenlesbare Empfehlungen vor.

### Diagramm

![data-model.png](./attachments/data-model.png)

Quelle: `raw/data-model.puml`

### Public Write Flow (APISIX-Altcha + Verifikation)

![public-write-flow.png](./attachments/public-write-flow.png)

Quelle: `raw/public-write-flow.puml`

---

<a id="api-sicht-erste-ableitung"></a>
## API-Sicht (erste Ableitung)

- **API-Grenzen**: Bürgerbereich vs. Admin-Bereich (Stadtverwaltung / Fachpersonal)
- **Ressourcen**: Gebäude, Eingaben, Berechnungen, Konfigurationen, Kataloge, Triage, Reports
- **Auth/Session**: OIDC für Admin; öffentlicher Bereich ohne Auth mit Local Storage für Zustandswiederherstellung und optionalem Schreibzugriff für Berechnungsergebnisse
- **Validation**: Public Write prüft Eingaben (Range/Schema)
- **Abuse-Schutz**: Öffentliche Schreibzugriffe sind durch die globale, von der externen Deployment-Plattform betriebene APISIX-Policy für Altcha-Challenges und Rate Limiting geschützt
- **State-Restore**: Local Storage und portable, ausschließlich im Browser ausgewertete URL-Fragmente stellen Bearbeitungsstände wieder her; das Backend persistiert keine Frontend-Sitzung und bietet keinen Wiederherstellungsendpunkt
- **Altcha kurz erklärt**: Altcha ist eine selbsthostbare, datenschutzfreundliche Challenge; der Client löst eine kleine Rechenaufgabe und sendet ein Token, das von der globalen APISIX-Policy der externen Deployment-Plattform geprüft wird.
- **Enforcement**: Bereitstellung, Betrieb und Nachweis der Altcha- und Rate-Limit-Policy sind externe Plattformverantwortung und nicht Bestandteil der DEZ-Repositories. Das Backend übernimmt danach Schema-/Fachvalidierung und Recompute-Verifikation.
- **Publish-Flow**: Admin veröffentlicht Konfiguration → JSON-Snapshot wird erzeugt → Public Client liest JSON
- **Versionierung**: Konfigurations- und API-Versionen klar trennen
- **Fehlerformate**: Standardisierte Fehlercodes und Validierungsdetails

### Client-Generierung aus OpenAPI

- **Source of Truth**: OpenAPI 3.0 oder höher aus dem Backend (Fastify-toab/Fastify-Swagger; aktuell OpenAPI 3.1.0).
- **Generator**: Orval im Frontend.
- **Frontend-Integration**: Orval generiert den API-Client aus der vom Backend abgefragten OpenAPI-Spezifikation.
- **Versionierung**: Ein separat versioniertes Artefakt `openapi/openapi.json` wird bewusst nicht gepflegt, da die Anzahl angebundener Clients gering bleibt.

---

<a id="security-by-design-im-daten-und-api-vertrag"></a>
## Security by Design im Daten- und API-Vertrag

Security by Design wird in Datenmodell und API-Vertrag explizit verankert:

- **Minimale Datenerhebung**: Pflicht zur Berechnung ohne obligatorische personenbezogene Übermittlung; Persistenz bleibt optional und explizit.
- **Vertragsbasierte Eingabehärtung**: Public-Write-Requests werden über Schema und Wertebereiche geprüft; ungültige Payloads werden verworfen.
- **Verifikation vor Weiterverwendung**: Serverseitige Neu-Berechnung und Triage sind Voraussetzungen für interne Indexierung.
- **Lebenszyklus-Kontrolle**: Statuswechsel folgen einem definierten Triage-Lifecycle, werden auditierbar protokolliert und lassen pro Gebäude höchstens eine aktive Freigabe zu.
- **Löschsicherheit**: Die gebündelte administrative Löschung wird vollständig zurückgewiesen, sobald mindestens eine Einreichung der Gebäude-ID nicht den Status `abgelehnt` besitzt; eine Teillöschung findet nicht statt.
- **Konfigurationsintegrität**: Versionierte Snapshots und Checksummen sichern Reproduzierbarkeit und Änderungsnachvollziehbarkeit.
- **Zugriffsmodell**: OIDC-geschützte Admin-Endpunkte, getrennt von öffentlichen Endpunkten.

Diese Vertragsregeln entsprechen insbesondere TA-48 bis TA-50, TA-80 bis TA-83, TA-151, TA-43 bis TA-46 sowie TA-58 bis TA-64.

---

<a id="abgleich-und-entscheidungen"></a>
## Abgleich und Entscheidungen

### Abgleich mit technischen Anforderungen

- Die Trennung von öffentlichen und administrativen APIs entspricht TA-02, TA-03 und TA-35.
- Public Write mit der extern betriebenen globalen APISIX-Policy für Altcha und Rate Limiting entspricht TA-47 bis TA-51.
- Konfigurations-Publishing mit Snapshot entspricht TA-27 bis TA-46.
- Offline-Pipeline, 3D Tiles Prinzipien und NGSI-LD-Export nach Stellio entsprechen TA-10 bis TA-18 sowie TA-72.

### Mapping zu Backend-Services

- **Configuration Service**: Konfigurationen, Versionierung, Publishing (TA-27 bis TA-46).
- **Config Snapshot Exporter**: Export der JSON-Snapshots (TA-44 bis TA-45).
- **User Data Service**: Public Write, Persistenz der Eingaben und Ergebnisse sowie Capability-geschützte Status-, JSON-Download- und Löschoperationen (TA-33, TA-36, TA-76, TA-77).
- **Triage/Reporting Service**: Triage, Freigabe, Reporting-Views sowie gezielte und bedingte gebündelte Löschoperationen (TA-34, TA-50, TA-151).
- **Berechnungsservice**: Server-Recompute für Verifikation (TA-49).
- **Geo Query Service**: räumliche Abfragen für Admin-Views (TA-37).
- **Auth Middleware**: Das Backend nimmt Access Tokens aus `X-Access-Token` oder `Authorization: Bearer` entgegen, validiert sie produktiv per RS256 gegen die konfigurierte Keycloak-JWKS-Quelle und wertet anschließend Claims und Rollen aus. APISIX schützt zusätzlich die externen Admin-Routen (TA-04).

### Entscheidung Reports

- Reports werden **nicht** als eigene dauerhafte Objekte gespeichert.
- Reports werden in der Anwendung **dynamisch aus der Datenbank** aggregiert.
- Bürgerseitige Report-Exporte sind optional und werden als **ReportExport** mit Metadaten (Zeitpunkt, Scope, Format) persistiert.
