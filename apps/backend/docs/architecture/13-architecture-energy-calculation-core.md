# Architektur - Berechnungskern

## Inhaltsverzeichnis

1. [Ziel dieser Sicht](#ziel-dieser-sicht)
2. [Hinweis zum Reifegrad](#hinweis-zum-reifegrad)
3. [Verantwortlichkeiten](#verantwortlichkeiten)
4. [Laufzeit und Einbettung](#laufzeit-und-einbettung)
5. [Eingaben und Ausgaben](#eingaben-und-ausgaben)
6. [Eingabetiefe (Spektrum)](#eingabetiefe-spektrum)
7. [Defaultannahmen (konfigurierbar)](#defaultannahmen-konfigurierbar)
8. [Lüftung (Parameterbeispiele)](#lueftung-parameterbeispiele)
9. [Anlagentechnik (Detailgrad)](#anlagentechnik-detailgrad)
10. [Wärmebrücken (Hinweis)](#waermebruecken-hinweis)
11. [Offene Modellierungsfragen aus dem Grobkonzept](#offene-modellierungsfragen-aus-dem-grobkonzept)
12. [Diagramm](#diagramm)
13. [Tests und Gegenprüfung](#tests-und-gegenpruefung)
14. [Versionierung und Nachvollziehbarkeit](#versionierung-und-nachvollziehbarkeit)
15. [Abgrenzung](#abgrenzung)

<a id="ziel-dieser-sicht"></a>
## Ziel dieser Sicht

Dieses Kapitel beschreibt Aufbau und Verwendung des Berechnungskerns als gemeinsamen Rechenkern für Frontend und Backend.

---

<a id="hinweis-zum-reifegrad"></a>
## Hinweis zum Reifegrad

Der Berechnungskern befindet sich noch nicht in einem finalen Stand. Inhalte und Schnittstellen dieses Kapitels können sich im weiteren Projektverlauf ändern.

---

<a id="verantwortlichkeiten"></a>
## Verantwortlichkeiten

- Berechnung von Heizwärmebedarf, Endenergie, CO₂, Primärenergie, Brennstoffverbrauch, Brennstoffkosten und Effizienzklassen.
- Umsetzung der Eingabelogik entlang eines kontinuierlichen Spektrums gemäß fachlichen Anforderungen.
- Deterministisches Verhalten bei identischer Konfiguration und Eingaben.

---

<a id="laufzeit-und-einbettung"></a>
## Laufzeit und Einbettung

- Implementiert als eigenständiges JavaScript-Modul.
- Ausführbar im Browser und in Node.js.
- Keine Abhängigkeit von Infrastruktur oder Datenbank.

---

<a id="eingaben-und-ausgaben"></a>
## Eingaben und Ausgaben

- Eingaben: Konfigurations-Snapshot (Version), Gebäudedaten/Potenziale, Nutzereingaben.
- Ausgaben: Ergebnisobjekte für Anzeige, Vergleich und Export.
- Die konkrete Übergabe von LOD2-Geometriekennwerten in die Eingabestruktur ist
  im
  [LOD2-zu-Frontend-Eingabefeld-Mapping](17-lod2-frontend-input-mapping.md)
  beschrieben.

---

<a id="eingabetiefe-spektrum"></a>
## Eingabetiefe (Spektrum)

- Ohne Nutzereingabe erfolgt die Vorbelegung über LOD2, Baualtersklasse und Standardannahmen.
- Mit jeder zusätzlichen manuellen Eingabe steigt die inhaltliche Genauigkeit der Berechnung.
- Bauteil-, Anlagen- und Nutzungsangaben können sukzessive ergänzt oder überschrieben werden.
- Bei umfassender manueller Eingabe sind detaillierte Sanierungsszenarien (Einzelmaßnahmen/Kombinationen) mit Vorher/Nachher-Vergleich möglich.

### Zuordnung der Grobkonzept-Datenstufen

Quelle: `20260320_RDEZ_Uebersicht_Berechnung_Grobkonzept.xlsx`

Die aktualisierte Arbeitsmappe präzisiert die Logik des Berechnungskerns, ohne das Grundprinzip zu ändern:
Der Rechenkern bildet weiterhin ein **kontinuierliches Eingabetiefe-Spektrum** ab.

- **Datenstufe 1** beschreibt den Fall ohne Nutzereingabe. Alle für die Berechnung benötigten Kennwerte werden aus Basisdaten, Katalogwerten und Standardannahmen abgeleitet.
- **Datenstufe 2** beschreibt den Fall vollständiger Nutzereingabe innerhalb der fachlich freigegebenen Felder.
- Beide Enden werden durch denselben Rechenkern verarbeitet; der Unterschied liegt ausschließlich in den bereitgestellten bzw. überschriebenen Eingabewerten.

### Rolle der Arbeitsmappe 2026-03-20

Die Arbeitsmappe dient fachlich als Referenz für vier Ebenen:

- `Grobkonzept`: fachliche Freigabe und Struktur der Eingaben entlang des Spektrums.
- `Berechnungen`: zentrale abgeleitete Zwischen- und Rechengrößen.
- Domänenblätter (`Dach-Fenster`, `OGD`, `AW-Fenster`, `UGD`, `Heizung`): bauteil- und anlagenspezifische Regeln.
- Katalogblätter (`Kat. 1 U-Wert`, `Kat. 2 Heizung`): normativ bzw. typologisch referenzierte Werte.

Die Arbeitsmappe ist damit Referenz für die fachliche Herleitung, nicht jedoch eine Vorgabe für eine 1:1-Abbildung in Datenbank-, API- oder UI-Strukturen.

### Berechnungsdomänen aus der Arbeitsmappe

- Hülle: `Dach-Fenster`, `OGD`, `AW-Fenster`, `UGD` mit HT-Teilbilanzen (`HT = F * U * A`).
- Wärmebrücken: pauschaler Zuschlag über `dUWB * Ages`.
- Lüftung: globaler Lüftungsfaktor im abgestimmten Rechenkern, nicht als direkte Nutzereingabe und ohne zusätzliche Baualtersdifferenzierung.
- Heizung: Systemart, Energieträger, Erzeugerart, Zusatzheizung, Heizflächenart, Heizkreistemperatur, Raumtemperaturregelung und optionale Sanierungsrandbedingungen.
- Rohrdämmung wird gemäß dem vom Auftraggeber freigegebenen Berechnungskonzept nicht als eigener Eingabe- oder Rechenparameter modelliert.
- Kataloge: `Kat. 1 U-Wert` (Baualtersklassen/U-Werte), `Kat. 2 Heizung` (Aufwandszahlen, Heizflächenzuschläge, Primärenergiefaktoren, CO₂-Faktoren, Heizwerte und Preismodelle).
- Rechenkette (`Berechnungen`/`Formeln`): Transmissionswärmeverlust, Lüftungswärmeverlust, interne/solare Gewinne, Warmwasser, Jahres-Heizwärmebedarf, Endenergie, Primärenergie, CO₂, Brennstoffverbrauch und Brennstoffkosten.

---

<a id="defaultannahmen-konfigurierbar"></a>
## Defaultannahmen (konfigurierbar)

- Fensteranteil am Fassadenbereich: Standardannahme (z.B. 40%), wenn nicht bekannt.
- Lüftungswärmeverlust: globaler Faktor gemäß implementiertem und am 06.02.2026 fachlich bestätigtem Umfang.
- Warmwasserbedarf: flächenbezogener Pauschalwert gemäß implementiertem und am 06.02.2026 fachlich bestätigtem Umfang; keine zusätzliche personenbezogene Vertiefung.
- Wärmebrücken: pauschaler Zuschlag auf U-Werte, eingabeabhängig.
- Beispiel- und Templatewerte aus der Referenzarbeitsmappe sind keine normativen Produktdefaults; produktive Defaults müssen konfigurierbar und kommunenprofilfähig bleiben.

---

<a id="lueftung-parameterbeispiele"></a>
## Lüftung (Parameterbeispiele)

- Der Lüftungswärmeverlust wird über einen globalen Faktor modelliert; Luftdichtheitsklassen und eine Baualtersabhängigkeit sind nicht Bestandteil des abgestimmten Umfangs.

---

<a id="anlagentechnik-detailgrad"></a>
## Anlagentechnik (Detailgrad)

- Ohne manuelle Eingaben arbeitet das System mit konfigurierten Standardannahmen.
- Mit manuellen Grundangaben (z.B. Baujahr, Energieträger) wird die Anlage grob vorbelegt.
- Mit weiterem Detaillierungsgrad können Erzeugerart, Heizflächenart, Heizkreistemperatur, Regelung und Zusatzheizung erfasst werden.
- Optional sind weitere berechnungsrelevante Anlagenparameter wie Brennstofflager-Kontext, Umbauwunsch zur Flächenheizung sowie Preis- und Verbrauchswerte erfassbar.

---

<a id="waermebruecken-hinweis"></a>
## Wärmebrücken (Hinweis)

Typische Bereiche: Balkonanschlüsse, Deckenauflager auf Außenwänden, Fensteranschlüsse, Gebäudekanten/-ecken, Rollladenkästen, Attiken.

---

<a id="offene-modellierungsfragen-aus-dem-grobkonzept"></a>
## Offene Modellierungsfragen aus dem Grobkonzept

- Kostenfelder sind in mehreren Hüllen-Blättern nur als Platzhalter vorhanden; ein konsistentes Kostenmodell fehlt. Wirtschaftlichkeit und Amortisation sollen wieder auf BKI-Kostendaten ausgerichtet werden. Stand 24.07.2026 fehlen Datenzugang und abgesicherter Verfügbarkeitszeitplan; ohne Dateneinsicht und fachlich freigegebenes Kostenmodell ist keine belastbare Implementierung im Berechnungskern möglich.
- Die PV-Datenfreigabe liegt vor. Der Umsetzungsdetailgrad für PV/Speicher ist jedoch noch nicht vereinbart: Die ursprüngliche LB-Detailstufe wurde von AG und AN als deutlich zu hoch bewertet, und der reduzierte AN-Vorschlag wurde vom AG nicht angenommen. Eine Implementierung im Berechnungskern erfolgt erst nach Festlegung des verbindlichen Ersatzumfangs.
- Korrekturfaktor `F` ist nicht für alle Bauteile in gleicher Tiefe fachlich definiert.
- Das Heizungsblatt enthält nun erste beispielhafte Maßnahmenzuordnungen; diese sind jedoch noch nicht als vollständige, deterministische Entscheidungslogik formalisiert.
- Beispiel- und Templatewerte in `Grobkonzept` und `Berechnungen` sind nicht konsistent genug für eine direkte Normierung von Produktdefaults und müssen fachlich geklärt werden.
- Einzelne Katalogbezeichner sind uneinheitlich/formal fehlerhaft und müssen vor produktiver Nutzung bereinigt werden.

---

<a id="diagramm"></a>
## Diagramm

![berechnung-core-architecture.png](./attachments/berechnung-core-architecture.png)

Quelle: `raw/berechnung-core-architecture.puml`

---

<a id="tests-und-gegenpruefung"></a>
## Tests und Gegenprüfung

Die [Testdokumentation der energetischen Berechnung](18-energy-calculation-test-documentation.md)
beschreibt die Gegenprüfung anhand zweier Testgebäudepaare, den Vergleich mit professionellen
Referenzwerten sowie die automatisierten Tests der Vorrangregeln und Berechnungspfade. Die Tests
sichern die implementierten Pfade und aktuelle absolute Ergebnisse gegen Regressionen ab. Die
fachliche Bewertung der Modellabweichungen und geeigneter Toleranzen steht noch aus. Die fachliche
Abnahme des Rechenkerns ist für Sprint 19 mit dem Energieberater terminiert.

Der [Nachweis der Rechenmethoden](19-calculation-method-evidence.md) ordnet die in
Core v0.19.0 ausgeführten Formeln und Katalogwerte den tatsächlich verwendeten,
extern validierbaren Fundstellen zu. Konfigurierbare Projektfestlegungen sind dort
getrennt von extern belegten Werten ausgewiesen.

---

<a id="versionierung-und-nachvollziehbarkeit"></a>
## Versionierung und Nachvollziehbarkeit

- Ergebnisse referenzieren die verwendete Konfigurationsversion.
- Reproduzierbarkeit durch unveränderliche Snapshots.

---

<a id="abgrenzung"></a>
## Abgrenzung

- Keine UI, keine Persistenz, keine Netzwerkanfragen.
- Potenzialdaten werden nicht berechnet, sondern als Eingabe genutzt.


