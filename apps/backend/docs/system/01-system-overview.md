# Systemüberblick - Digitaler Energie Zwilling (DEZ)

## Inhaltsverzeichnis

1. [Zielsetzung](#zielsetzung)
2. [Zielgruppen](#zielgruppen)
3. [Nutzen](#nutzen)
4. [Abgrenzung und Nicht-Ziele](#abgrenzung-und-nicht-ziele)
5. [Systemkontext](#systemkontext)
6. [MasterPortal-Integration (Link-Out)](#masterportal-integration-link-out)
7. [Datenhaltung und Datenfluss](#datenhaltung-und-datenfluss)
8. [MVP-Klärungsbedarf (erneuerbare Maßnahmen)](#mvp-klaerungsbedarf-erneuerbare-massnahmen)
9. [Zentrale Leitprinzipien](#zentrale-leitprinzipien)
10. [Dokumentstruktur](#dokumentstruktur)

<a id="zielsetzung"></a>
## Zielsetzung

Der Digitaler Energie Zwilling (DEZ) ist eine webbasierte 3D-Anwendung zur Visualisierung und indikativ-orientierenden Bewertung energetischer Potenziale von Gebäuden im Stadtgebiet Regensburg. Ziel ist eine niedrigschwellige, verständliche und datenschutzfreundliche Entscheidungsunterstützung für Eigentümer und Vermieter. DEZ steht für Digitaler Energie Zwilling und nicht für das Donau Einkaufszentrum.

Der DEZ richtet sich nicht an Energieberater oder Förderstellen und liefert keine rechtsverbindlichen Aussagen. Ergebnisse sind indikativ und dienen der Orientierung.

### Motivation

- Beitrag zu den Klimaschutzzielen der Stadt Regensburg und zur Fortschreibung der Wärmeplanung auf Quartiersebene.
- Verbesserung der Datenbasis durch die freiwillige Nutzung des Tools durch Eigentümer und interessierte Bürger.

### Ziele der Lösung

- Bereitstellung gebäude- und flächenspezifischer Energiebedarfsschätzungen.
- Berechnung und Vorschläge für Sanierungsmaßnahmen.
- Integration von Geodaten (z.B. LOD2), um Nutzereingaben zu minimieren.
- Nutzung von Normen, Richtlinien und Katalogen zur Berechnung von Energie-, Kosten- und THG-Kennwerten.
- Darstellung von Sanierungseffekten (Energie-/Kosteneinsparungen, CO₂-Reduktionen).
- Abschätzung von Investitionskosten und Wirtschaftlichkeit.
- Niederschwelliges, digitales Bürgerangebot mit intuitiver Bedienung.
- Langfristige Skalierbarkeit und Integration in bestehende Systeme (Geoportal/MasterPortal, CIVITAS/CORE).
- Verpflichtender Einstiegspunkt aus dem MasterPortal über einen Link auf die DEZ-Plattform.

---

<a id="zielgruppen"></a>
## Zielgruppen

### Bürger (Eigentümer/Vermieter)
- Zugriff ohne Authentifizierung
- Interaktive 3D-Visualisierung des Stadtmodells mit Gebäudeauswahl
- Anzeige von Solarpotenzialen (PV) nach Festlegung des verbindlichen Umsetzungsdetailgrads sowie von Geothermiepotenzialen aus den vom Auftraggeber bereitgestellten Daten
- Gut sichtbare statische Hervorhebung des ausgewählten Gebäudes im 3D-Client; die Energieeffizienzklasse wird in der energetischen Bewertung ausgewiesen
- Auswahl erneuerbarer Maßnahmen inkl. PV-Szenarien erst nach Einigung auf einen verbindlichen Ersatzumfang; die Datenfreigabe liegt vor, der AN-Vorschlag wurde vom AG nicht angenommen. Solarthermie ist aktuell nicht Teil des vorgesehenen Berechnungskern-Umfangs
- Einfache Berechnungen für Sanierungsmaßnahmen mit variabler Eingabetiefe (kontinuierliches Spektrum)
- Datensparsame Eingabe (z.B. Personenanzahl als Klassen 1–5 bzw. >5); eine freiwillige Einreichung ist wegen vollständiger Gebäudeadresse und Koordinaten nicht anonym
- Eingabetiefe-Spektrum von "keine Nutzereingabe" bis "vollständig durch Nutzer definiert" (von reinen Basisannahmen bis vollständig manuell angepassten Angaben)
- Keine Registrierung; Bearbeitungszustand wird über lokale Browser-Speicherung (Local Storage) persistiert, optionale Wiederherstellung vom Server bei expliziter Speicherung
- Nutzung ohne verpflichtende Datenübermittlung; Export nur auf Wunsch

### Stadtverwaltung / Fachpersonal
- Zugriff über geschützten Admin-Bereich
- Pflege und Veröffentlichung von Berechnungskonfigurationen
- Sichtung, Triage und Qualitätssicherung von Nutzereingaben
- Auswertung für Quartiersanalyse und interne Berichte

---

<a id="nutzen"></a>
## Nutzen

### Allgemein
- Austausch zwischen Bürgern und Kommune durch aggregierte, freiwillig bereitgestellte Ergebnisse
- Beitrag zu Nachhaltigkeit und Klimaschutz

### Bürger
- Verständliche Informationen zu baulichen Maßnahmen
- „Beratung light“ als Orientierung vor einer echten Energieberatung

### Verwaltung
- Bessere Planbarkeit für Wärmeplanung und Klimaschutzmaßnahmen
- Evidenzbasierte Priorisierung von Maßnahmen auf Quartiersebene

---

<a id="abgrenzung-und-nicht-ziele"></a>
## Abgrenzung und Nicht-Ziele

Der DEZ ist kein:
- förderfähiges Berechnungstool
- Ersatz für individuelle Energieberatung
- amtliches Auskunftssystem
- Echtzeit-Berechnungssystem mit detaillierter Gebäudephysik

---

<a id="systemkontext"></a>
## Systemkontext

Das System besteht aus:
- einem öffentlichen 3D-Client für Visualisierung und Berechnung
- einem administrativen Bereich für Fachpersonal
- einem Berechnungskern als JavaScript-Modul (clientseitig, optional serverseitig)
- einem Backend für Authentifizierung, Konfiguration, Persistenz und Triage
- einer Offline-Datenpipeline zur Vorverarbeitung von Geodaten
- APISIX als zentralem Web/API-Gateway für externe Zugriffe
- einem extern bereitgestellten Tiles-Dienst; das Backend leitet Zugriffe unter `/api/public/tiles/*` auf die über `TILES_URL` konfigurierte Ziel-URL weiter

Rechenintensive Potenzialanalysen werden offline durchgeführt und als Attribute in 3D Tiles abgelegt. Zur Laufzeit findet keine Neuberechnung der Potenziale statt.

---

<a id="masterportal-integration-link-out"></a>
## MasterPortal-Integration (Link-Out)

Die Integration in das MasterPortal erfolgt im MVP ausschließlich als **Link-Out** auf die DEZ-Plattform.

- Im MasterPortal wird ein Einstiegspunkt (Link) auf die öffentliche DEZ-URL bereitgestellt.
- Der Link-Out kann als spezieller Deep-Link mit Query-Parameter umgesetzt werden, z. B. `det-rg.de?select-building=1234`; damit kann ein im MasterPortal ausgewähltes Gebäude beim Einstieg in den DEZ direkt übernommen werden.
- Die Implementierung und Einbindung dieses Links im MasterPortal ist durch den Betreiber der Plattform vorgesehen.
- Es besteht **keine** fachliche oder technische Kopplung über APIs zwischen MasterPortal und DEZ.
- Es besteht **keine** gemeinsame Session oder SSO-Kopplung zwischen MasterPortal und DEZ.
- Datenhaltung, Berechnung und Persistenz verbleiben vollständig innerhalb der DEZ-Architektur.

Warum der DEZ als separate Applikation verlinkt wird:

- **Niedrigschwelliger Zugang**: Direkte DEZ-URL ohne Vorwissen über Struktur und Navigation des Geo-/Masterportals.
- **Auffindbarkeit und Kampagnenfähigkeit**: Eigenständige Landingpages sind besser indexierbar und einfacher für Kommunikation/Öffentlichkeitsarbeit nutzbar.
- **Bessere UX-Steuerung**: Einstieg, Funnel, Hinweise, Fehlermeldungen und Hilfetexte können DEZ-spezifisch geführt werden.
- **Direktes Teilen**: Links und QR-Codes aus PDF, Mailings, Presse oder Social Media funktionieren ohne Portal-Umweg.
- **Datenschutz/Analytics getrennt steuerbar**: Consent- und Tracking-Regeln können unabhängig vom Geo-/Masterportal DEZ-spezifisch umgesetzt werden.
- **Barrierefreiheit**: BITV-orientierte Optimierungen können direkt in der DEZ-Oberfläche umgesetzt und getestet werden.

---

<a id="datenhaltung-und-datenfluss"></a>
## Datenhaltung und Datenfluss

- Statische, allgemein gültige Potenziale liegen ausschließlich in den 3D Tiles.
- 3D Tiles enthalten Gebäudegeometrie, Adressen aus LOD2 sowie Vegetationsobjekte (Bäume). Die PV-Datenfreigabe liegt vor; Solarpotenzial-Attribute inklusive Textur werden nach Festlegung des verbindlichen Import- und Darstellungsumfangs übernommen.
- Dynamische, nutzerspezifische Daten liegen in der Datenbank.
- Konfigurationen werden versioniert und als veröffentlichte JSON-Snapshots für den Client bereitgestellt.
- Es gibt keine doppelte Datenhaltung statischer Potenziale im Backend.
- Wenn Nutzereingaben gespeichert werden, ist ein Löschprozess über einen eindeutigen Link/QR vorgesehen.

---

<a id="mvp-klaerungsbedarf-erneuerbare-massnahmen"></a>
## MVP-Klärungsbedarf (erneuerbare Maßnahmen)

- **Solarthermie**: aktuell nicht Teil des vorgesehenen Rechenwegs im Berechnungskern; eine spätere Erweiterung erfordert zuerst fachliche und technische Klärung.
- **PV/Speicher**: Die Datenfreigabe liegt vor. Die ursprüngliche LB-Detailstufe wurde von AG und AN als deutlich zu hoch bewertet; der reduzierte AN-Vorschlag wurde vom AG nicht angenommen. Der verbindliche Ersatzumfang ist noch festzulegen.
  1) Dimensionierung von PV + Speicher für den Wärmepumpenbetrieb inkl. energetischer/finanzieller Effekte.  
  2) Maximale Ausnutzung geeigneter PV-Flächen zur Kommunikation von Potenzialen für Haushaltsstrom, KFZ-Ladung und ähnliche Verbräuche.
- **Solar-Anreicherung**: Solarpotenzialdaten sind aktuell noch nicht durch den Auftraggeber freigegeben. Daher findet keine vorbereitende Anreicherungs- oder Mapping-Implementierung statt.
- **Geothermie**: Die vom Auftraggeber bereitgestellten Daten werden anhand der tatsächlich gelieferten Merkmale ausgewertet. Kollektor und Sonde sind im Datensatz nicht geführt. Luft-WP ist grundsätzlich verfügbar und wird nicht standortbezogen geprüft; Erd-WP ist nach Einschätzung des Energieberaters nicht empfohlen beziehungsweise vernachlässigbar. Herkunfts-, Lizenz-, Turnus- und Schemametadaten sind noch zu klären. Ein zusätzlicher Fallback nach dem Vorbild der LfU-/TUM-Studie wird nicht benötigt.

---

<a id="zentrale-leitprinzipien"></a>
## Zentrale Leitprinzipien

### Privacy-by-Design
Berechnungen können vollständig clientseitig durchgeführt werden. Nutzereingaben werden nur auf expliziten Wunsch übertragen und gespeichert.

### Trennung von statisch und dynamisch
Statische Potenziale liegen in Tiles, dynamische Nutzereingaben und Konfigurationen in der Datenbank. Diese Trennung reduziert Komplexität und schützt personenbezogene Daten.

### Offline-Vorverarbeitung
Komplexe Geodaten werden außerhalb des Laufzeitsystems verarbeitet, um Performance und Skalierbarkeit sicherzustellen.

### Leichtgewichtiges Backend
Das Backend stellt ausschließlich Konfiguration, Authentifizierung und Persistenz bereit und liefert keine großen Datenmengen aus.

### Skalierung und Betriebsmonitoring
Die containerisierte, weitgehend zustandslose Bereitstellung unterstützt horizontale und vertikale Skalierung. Eine belastbare erwartete Nutzerzahl ist derzeit nicht vorgegeben; tausende gleichzeitige Aufrufe werden im vorgesehenen kommunalen Nutzungskontext nicht erwartet. Betriebsmonitoring, bedarfsgerechte Skalierung und dynamische Log-Level-Steuerung werden durch die CIVITAS/CORE-Plattform abgedeckt. Kapazität und Performance werden in der Post-Deployment-Phase beobachtet und bei Bedarf angepasst. Für den Final Release wird unabhängig davon ein realistisches Lastprofil zwischen Auftraggeber und Auftragnehmer abgestimmt und getestet.

---

<a id="dokumentstruktur"></a>
## Dokumentstruktur

Die weitere Dokumentation ist wie folgt aufgebaut:
- Fachliche Anforderungen
- Technische Anforderungen
- Architekturübersicht und C4-Diagramme
- Datenmodell & API-View
- Runtime-Flows & Betriebsaspekte
- Offline-Datenpipeline & Berechnung
- Betrieb, Sicherheit und Datenschutz

Dieses Dokument dient als Einstieg und Referenzpunkt für die übrigen Kapitel.
