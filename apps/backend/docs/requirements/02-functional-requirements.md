# Fachliche Anforderungen – Digitaler Energie Zwilling (DEZ)

## Inhaltsverzeichnis

1. [Ziel der fachlichen Anforderungen](#ziel-der-fachlichen-anforderungen)
2. [Nutzerrollen](#nutzerrollen)
3. [Fachliche Hauptfunktionen](#fachliche-hauptfunktionen)
4. [Fachliche Anforderungen an die Administration (Stadtverwaltung / Fachpersonal)](#fachliche-anforderungen-an-die-administration-stadtverwaltung-fachpersonal)
5. [Fachliche Abgrenzungen](#fachliche-abgrenzungen)
6. [Erweiterte Anforderungen](#erweiterte-anforderungen)
7. [Offene MVP-Klärung: Solarthermie, PV und Geothermie](#offene-mvp-klaerung-solarthermie-pv-und-geothermie)
8. [Nachnutzung und White-Labeling](#nachnutzung-und-white-labeling)
9. [Festlegung: Nutzungsdaten und Tracking](#festlegung-nutzungsdaten-und-tracking)
10. [Abnahmeprozess und Ansprechpartner](#abnahmeprozess-und-ansprechpartner)
11. [Konkretisierung: Matomo-Auswertungsumfang](#konkretisierung-matomo-auswertungsumfang)
12. [Priorisierung (implizit)](#priorisierung-implizit)
13. [Übergang zu technischen Anforderungen](#uebergang-zu-technischen-anforderungen)

<a id="ziel-der-fachlichen-anforderungen"></a>

## Ziel der fachlichen Anforderungen

Dieses Dokument beschreibt die **fachlichen Anforderungen** an den Digitaler Energie Zwilling (DEZ).  
Es beantwortet die Frage, **welche Funktionen und Nutzungsmöglichkeiten** das System aus Sicht der Anwender bereitstellen muss, unabhängig von der konkreten technischen Umsetzung.

Die fachlichen Anforderungen sind bewusst **indikativ** formuliert und bilden die Grundlage für die technische Ausgestaltung und Architekturentscheidungen.

Verbindlichkeit: **MUSS** = verpflichtend, **SOLL** = wünschenswert/nice-to-have, **KANN** = optional.

Die Anforderungs-IDs sind dauerhaft stabil. Entfällt eine Anforderung, bleibt ihre Nummer als beabsichtigte Lücke unbesetzt; vorhandene Anforderungen werden nicht nachträglich umnummeriert und freie IDs nicht erneut vergeben.

---

<a id="nutzerrollen"></a>

## Nutzerrollen

### Bürger (Eigentümer/Vermieter)

Bürger (Eigentümer/Vermieter) nutzen den Digitaler Energie Zwilling (DEZ) ohne Authentifizierung, um sich einen Überblick über energetische Potenziale einzelner Gebäude zu verschaffen und einfache Szenarien zu berechnen.  
Fokus liegt auf einer ersten Orientierung für Sanierungsentscheidungen.

### Stadtverwaltung / Fachpersonal

Fachpersonal nutzt den Digitaler Energie Zwilling (DEZ) über einen geschützten administrativen Bereich zur Pflege von Parametern, Qualitätssicherung und zur Sichtung von Nutzereingaben.

---

<a id="fachliche-hauptfunktionen"></a>

## Fachliche Hauptfunktionen

### Visualisierung des Stadtmodells

<a id="fa-01"></a>

**FA-01**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss ein dreidimensionales Stadtmodell des Stadtgebiets Regensburg bereitstellen.

<a id="fa-02"></a>

**FA-02**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Gebäude müssen einzeln auswählbar sein.

<a id="fa-03"></a>

**FA-03**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Zu jedem Gebäude müssen energetische Potenziale visuell darstellbar sein.

---

### Anzeige energetischer Potenziale

<a id="fa-04"></a>

**FA-04**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Wenn belastbare Solarpotenzialdaten rechtzeitig bereitgestellt werden, muss das System Solarpotenziale (PV) auf Gebäude- oder Dachflächenebene anzeigen können.

<a id="fa-05"></a>

**FA-05**  
*Release-Zuordnung:* [Release 7](../roadmap/mvp-definition.md#release-7)  
Die vom Auftraggeber bereitgestellten Geothermiedaten müssen für eine gebäudebezogene Anzeige des Geothermiepotenzials verwendet werden. Die technische Datenanreicherung wurde nach der Datenfreigabe in Sprint 17 umgesetzt. Die für Veröffentlichung und Nachnutzung erforderlichen Metadaten sind noch zu klären.

<a id="fa-06"></a>

**FA-06**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die Potenziale müssen für den Nutzer verständlich und vergleichbar dargestellt werden.

> ⚠️ **Hinweis:** Für Solarthermie zur Warmwasserbereitung ist im aktuellen Berechnungskern noch kein Rechenweg vorgesehen. Eine spätere Einbindung kann im Projektverlauf neu bewertet werden.

---

### Interaktive Berechnung (Bürger (Eigentümer/Vermieter))

<a id="fa-07"></a>

**FA-07**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bürger müssen für ein ausgewähltes Gebäude einfache energetische Szenarien berechnen können.

<a id="fa-08"></a>

**FA-08**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Berechnung muss Eingabemöglichkeiten für typische Sanierungsmaßnahmen bieten, z.B.:

- Fenster
- Dämmung
- Heizungsart

<a id="fa-09"></a>

**FA-09**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Berechnungsergebnisse müssen unmittelbar oder mit minimaler Verzögerung dargestellt werden.

<a id="fa-10"></a>

**FA-10**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Berechnungsergebnisse müssen verständlich und nicht fachlich überladen präsentiert werden.

---

### Eingabetiefe-Spektrum (Bürger (Eigentümer/Vermieter))

<a id="fa-11"></a>

**FA-11**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss ein kontinuierliches Eingabetiefe-Spektrum unterstützen, von "keine Nutzereingabe" bis "vollständig durch Nutzer definiert", ohne feste Stufenlogik.

<a id="fa-12"></a>

**FA-12**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Am unteren Ende des Spektrums müssen Berechnungen ohne Nutzereingaben auskommen und auf LOD2, Baualtersklasse und Standardannahmen basieren.

<a id="fa-13"></a>

**FA-13**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bei wenigen manuell ergänzten Angaben (z.B. Baujahr) müssen schnelle Erstwerte geliefert werden.

<a id="fa-14"></a>

**FA-14**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Mit zunehmender manueller Eingabetiefe müssen bauteilspezifische Eingaben möglich sein.

<a id="fa-15"></a>

**FA-15**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bei hoher manueller Eingabetiefe müssen detaillierte Eingaben möglich sein; Förderparameter pro Maßnahme sollen optional erfassbar sein.

### Eingabefelder entlang des Spektrums (Spezifikation)

| Orientierungsbereich im Spektrum (keine festen Stufen) | Pflichtangaben                                        | Optionale Angaben                                                                                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ohne Nutzereingabe                                     | keine                                                 | keine                                                                                                                                                                                |
| Grundangaben                                           | Baujahr                                               | Energieträger, Jahresverbrauch oder Kosten, Warmwasser elektrisch (Ja/Nein), Personenanzahl (Klassen)                                                                                |
| Bauteile und Anlage                                    | Bauteilzustände je Dach/Außenwand/Fenster/Kellerdecke | Heizflächenart, Erzeugerart, Baujahre je Bauteil                                                                                                                                     |
| Detaillierung                                          | keine zusätzlichen globalen Pflichtangaben            | Überschreiben von Defaults je Bauteil, Dämmung ja/nein, Sanierungsjahr, Verglasungsart/Rahmen |
| Szenarien und Kombinationen                            | Auswahl mindestens einer Sanierungsmaßnahme           | Kombinationen, Budget, Förderlogik (optional)                                                                                                                                        |

> ⚠️ **Hinweis:** Die genannten Eingaben bilden keine festen Stufen. Sie können entlang eines kontinuierlichen Spektrums bedarfsorientiert kombiniert werden.
>
> Luftdichtheit wird nicht direkt durch Nutzer eingegeben. Im abgestimmten Berechnungskern wird der Lüftungswärmeverlust über einen globalen Faktor berücksichtigt; eine baualtersabhängige Luftdichtheitsklasse ist nicht Bestandteil des vereinbarten Umfangs.
>
> Alle Eingaben sind als „automatisch“, „manuell“ oder „geschätzt“ zu kennzeichnen.

### Konkretisierung aus dem Grobkonzept (Arbeitsmappe 2026-03-20)

Quelle: `20260320_RDEZ_Uebersicht_Berechnung_Grobkonzept.xlsx`

Die aktualisierte Arbeitsmappe bestätigt das fachliche Ziel eines **stufenlosen Eingabetiefe-Spektrums**.
Die Begriffe **Datenstufe 1** und **Datenstufe 2** bezeichnen dabei ausschließlich die beiden fachlichen Referenz-Enden dieses Spektrums und **keine festen UI-Stufen**.

Interpretation für dieses Dokument:

- **Datenstufe 1** = keine Nutzereingabe; alle für die Berechnung verwendeten Kennwerte werden aus Basisdaten, Katalogwerten und Standardannahmen abgeleitet.
- **Datenstufe 2** = volle Nutzereingabe; alle dafür freigegebenen Werte wurden durch den Nutzer angepasst oder überschrieben.
- Alle Zwischenstände sind als kontinuierliche Kombination aus automatisch abgeleiteten und manuell überschriebenen Werten zu verstehen.

Für die fachliche Modellierung bedeutet das:

- Das System startet immer mit automatisch vorbelegten Werten.
- Nutzer wählen keine feste Datenstufe aus.
- Mit jeder zusätzlichen Eingabe verschiebt sich die Berechnung entlang des Spektrums in Richtung höherer Individualisierung.
- Nicht alle internen Rechengrößen sind Nutzereingaben; editierbar sind nur die fachlich freigegebenen Werte.

| Domäne                      | Unteres Ende (keine Nutzereingabe)                                                   | Oberes Ende (maximale Nutzereingabe)                                                            | Geplante Sanierungsmaßnahmen                                                           |
| --------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dach und Dachfenster        | Flächen aus LOD, U-Werte über Baujahr/Baualtersklasse (Kat. 1), Standardfaktoren     | Manuelle Flächenangaben, manuelle U-Werte bzw. schichtbasierte Ermittlung, Konstruktionsangaben | Dachdämmung/Komplettsanierung (Richtwert U=0,14), Dachfenstertausch (Richtwert U=1,00) |
| OGD                         | Grundfläche aus LOD, U-Wert über Baujahr/Baualtersklasse, Standardkonstruktion       | Manuelle Flächenangabe, schichtbasierte U-Wert-Ermittlung, Detaillierung der Konstruktion       | OGD-Dämmung/Komplettsanierung (Richtwert U=0,14)                                       |
| Außenwand und Fenster/Türen | Außenwand/Fensterflächen über LOD-Annahmen, U-Werte aus Baujahr/Baualtersklasse      | Manuelle Flächen/U-Werte, konstruktive Detaillierung (Rahmen/Glas/Schichten)                    | AW-Dämmung bzw. Austausch (Richtwert U=0,20), Fenstertausch (Richtwert U=0,95)         |
| UGD                         | Fläche aus LOD-Grundfläche, U-Wert aus Baujahr/Baualtersklasse, Standardkonstruktion | Manuelle Flächen/U-Werte und Konstruktionsdetails (z.B. Decke/Boden gegen Erdreich)             | UGD-Dämmung (Richtwert U=0,25)                                                         |
| Heizung/Anlage              | Standardannahmen aus Baujahr, Energieträger- und Erzeuger-Katalog                    | Detaileingaben zu Systemart, Erzeugerart, Heizflächenart, Heizkreistemperatur, Regelung, Zusatzheizung sowie Brennstofflager-/Umbaukontext und Preisen/Faktoren | Austausch-/Modernisierungsempfehlungen je Erzeugerart (inkl. erneuerbarer Optionen)    |

Die im ursprünglichen LB-Wortlaut beispielhaft genannte Rohrdämmung ist im vom Auftraggeber freigegebenen Berechnungskonzept nicht als Eingabe- oder Rechenparameter vorgesehen und stellt keine offene Anforderung dar.

### Explizite offene Punkte aus dem Grobkonzept

Die folgenden Inhalte sind im aktuellen Tabellenstand als Platzhalter oder unklar definiert und müssen vor finaler Fachfreigabe konkretisiert werden:

- In den Blättern `OGD`, `AW-Fenster` und `UGD` sind Kosten explizit nur als "Platzhalter für Kosten" enthalten. Für Sanierungsmaßnahmen ist wieder eine Umsetzung auf Basis von BKI-Kostendaten vorgesehen. Stand 24.07.2026 bestehen jedoch weder ein Zugang zu diesen Daten noch ein abgesicherter Zeitplan für deren Verfügbarkeit; bis dahin bleibt die Kostenlogik fachlich und zeitlich offen.
- Mehrere Ergebniszellen enthalten im Template `0` oder `#`; diese sind keine validierten Referenzwerte.
- Korrekturfaktor `F` ist für mehrere Bauteile nicht fachlich ausreichend hergeleitet bzw. dokumentiert.
- Im Blatt `Heizung` liegt nun eine erste beispielhafte Maßnahmenmatrix vor; diese muss vor Produktivnutzung in deterministische und vollständige Entscheidungsregeln überführt werden.
- Für Fälle wie `Fernwärme`, `Gas-Hybrid/Fernwärme` und `Biomasse (kein Lager = Fernwärme)` ist die fachliche Vollständigkeit der Maßnahmenlogik noch abschließend zu prüfen.
- Im Blatt `Kat. 2 Heizung` sind einzelne Bezeichnungen/Zeichen fehlerhaft oder uneinheitlich und müssen bereinigt werden, bevor sie als Normkatalog in die produktive Konfiguration übernommen werden.
- Die neuen Struktur- und Rechenblätter (`Grobkonzept`, `Berechnungen`) präzisieren Ergebnis- und Parameterlogik und müssen deshalb verbindlich in Anforderungen, Datenmodell und UX-Beschreibung gespiegelt werden.

---

### Berechnungslogik (fachlich)

<a id="fa-16"></a>

**FA-16**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Berechnung muss Gebäudehülle, Lüftung, Warmwasser und Anlagentechnik berücksichtigen.

<a id="fa-17"></a>

**FA-17**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Transmissionswärmeverluste über Dach, Außenwände, Fenster und Kellerdecke müssen über U-Werte modelliert werden.

<a id="fa-18"></a>

**FA-18**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Wärmebrücken müssen pauschal über einen Faktor auf den U-Wert berücksichtigt werden (eingabeabhängige Genauigkeit).

<a id="fa-19"></a>

**FA-19**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Lüftungswärmeverluste werden im Berechnungskern über den implementierten globalen Lüftungsfaktor berücksichtigt. Eine zusätzliche Differenzierung nach Luftdichtheitsklasse und Gebäudealter ist nicht Bestandteil des abgestimmten Umfangs. Inhalt und Umfang des Rechenkerns wurden am 06.02.2026 durch den Auftraggeber fachlich bestätigt.

<a id="fa-20"></a>

**FA-20**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Der Warmwasserbedarf wird im Berechnungskern als flächenbezogener Pauschalwert berücksichtigt. Eine zusätzliche personenbezogene Vertiefung ist nicht Bestandteil des abgestimmten Umfangs. Inhalt und Umfang des Rechenkerns wurden am 06.02.2026 durch den Auftraggeber fachlich bestätigt.

<a id="fa-21"></a>

**FA-21**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Anlagentechnik muss entlang des Eingabetiefe-Spektrums differenziert erfassbar sein (von Standardannahmen bis zu detaillierten Erzeuger- und Anlagenparametern).

<a id="fa-22"></a>

**FA-22**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Primärenergie muss als Vergleichsebene über einen Faktor (Vorkette) ausweisbar sein.

### Konkretisierung aus der Grobkonzept-Arbeitsmappe 2026-03-20

- Die Anlagentechnik muss fachlich so modelliert sein, dass neben Energieträger, Erzeugerart und Heizflächenart auch Heizkreistemperatur, Regelung, Brennstofflager-Kontext und Umbauwunsch zur Flächenheizung differenziert abbildbar sind.
- Die Ergebnisdarstellung muss Heizwärmebedarf, Warmwasser, Endenergie, Primärenergie, CO₂-Emissionen, Brennstoffverbrauch und Brennstoffkosten als getrennte, nachvollziehbare Größen ausweisen können.
- Beispiel- und Templatewerte der Arbeitsmappe sind nicht automatisch als normative Produktdefaults zu übernehmen; fachlich widersprüchliche Referenzwerte sind vor Übernahme in Konfigurationen zu klären.

---

### Nutzerführung & Transparenz (Bürger (Eigentümer/Vermieter))

<a id="fa-23"></a>

**FA-23**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Vor der Nutzung muss transparent erklärt werden, welche Daten erhoben, verarbeitet und gespeichert werden.

<a id="fa-24"></a>

**FA-24**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Der Nutzen und die Grenzen des Tools müssen für Nutzer klar und verständlich erklärt werden.

<a id="fa-25"></a>

**FA-25**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Nutzer müssen Gebäude schnell über Adresse oder Auswahl in der Karte finden können.

<a id="fa-26"></a>

**FA-26**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Nutzer müssen sehen, welche Gebäudedaten automatisch übernommen wurden und welche ergänzt werden müssen; Korrekturen müssen möglich sein.

<a id="fa-27"></a>

**FA-27**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Für Eingabewerte muss ersichtlich sein, ob sie automatisch, manuell oder geschätzt sind.

<a id="fa-28"></a>

**FA-28**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss Hinweise geben, wenn Eingaben untypisch oder unvollständig sind.

<a id="fa-29"></a>

**FA-29**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Nutzerführung muss klare, leicht verständliche Formulierungen ohne Expertenjargon nutzen.

<a id="fa-30"></a>

**FA-30**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss die im abgenommenen Konzept vorgesehenen grafischen Ergebnisdarstellungen bereitstellen: Energieklassenbalken sowie Delta-Darstellungen für relevante Vorher-/Nachher-Werte. Weitergehende quantitative Diagrammtypen sind nicht Bestandteil des vereinbarten Umfangs.

---

### Ergebnisdarstellung & Export (Bürger (Eigentümer/Vermieter))

<a id="fa-31"></a>

**FA-31**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Nutzer müssen einzelne oder kombinierte Sanierungsmaßnahmen auswählen und ihre Wirkung anhand der Ergebniswerte und vorhandenen Delta-Darstellungen vergleichen können. Zusätzliche quantitative Diagrammtypen sind hierfür nicht erforderlich.

<a id="fa-32"></a>

**FA-32**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Das System muss zeigen, wie sich der Energiebedarf je Maßnahme verändert.

<a id="fa-33"></a>

**FA-33**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Das System muss zeigen, wie sich die CO₂-Emissionen je Maßnahme verändern.

<a id="fa-34"></a>

**FA-34**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Die Energieeffizienzklasse vor und nach einer Maßnahme muss vergleichbar dargestellt werden.

<a id="fa-35"></a>

**FA-35**  
*Release-Zuordnung:* [Release 4](../roadmap/mvp-definition.md#release-4)  
Zu ausgewählten Maßnahmen müssen passende Förderprogramme (z.B. Links/Kategorien) angezeigt werden.

<a id="fa-36"></a>

**FA-36**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Das System muss eine technische Kostenschätzung ohne Förderung ausweisen.

<a id="fa-37"></a>

**FA-37**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Das System muss eine klare Zusammenfassung der Ergebnisse bereitstellen.

<a id="fa-38"></a>

**FA-38**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Nutzer müssen einen PDF-Report der Ergebnisse exportieren können. Bei einer freiwilligen Einreichung muss zusätzlich ein JSON-Export angeboten werden, der bewusst auf den in der Einreichung enthaltenen Datenumfang reduziert ist. Zusätzliche Hinweise und Informationen, die nur für Bürger nützlich sind und nicht für die Einreichung oder die kommunale Wärmeplanung benötigt werden, verbleiben ausschließlich im PDF-Report. Diese Trennung dient der Datensparsamkeit und Transparenz: Bürger können anhand des JSON-Exports genau nachvollziehen, welche Daten an die Stadt übermittelt wurden. Eine Datei wird nur bei explizitem Export erzeugt. Details zu Inhalten siehe FA-74.

<a id="fa-39"></a>

**FA-39**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss konkrete Hinweise zu möglichen nächsten Schritten geben.

---

### Datenschutzfreundliche Nutzung

<a id="fa-40"></a>

**FA-40**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bürger müssen den Digitaler Energie Zwilling (DEZ) nutzen können, ohne personenbezogene Daten zu übermitteln.

<a id="fa-41"></a>

**FA-41**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Durchführung einer Berechnung darf nicht zwingend eine Speicherung oder Übertragung von Nutzereingaben erfordern.

---

### Speicherung von Nutzereingaben (optional)

<a id="fa-42"></a>

**FA-42**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Bürger müssen optional die Möglichkeit haben, ihre Eingaben und Ergebnisse an das System zu übermitteln.

<a id="fa-43"></a>

**FA-43**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Übermittelte Nutzereingaben müssen eindeutig einem Gebäude zuordenbar sein.

---

<a id="fachliche-anforderungen-an-die-administration-stadtverwaltung-fachpersonal"></a>

## Fachliche Anforderungen an die Administration (Stadtverwaltung / Fachpersonal)

### Zugriff & Rollen

<a id="fa-44"></a>

**FA-44**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss sich im internen Bereich des Systems anmelden können, um administrative Funktionen zu nutzen.

---

### Konfigurationsmanagement

<a id="fa-45"></a>

**FA-45**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss Berechnungsparameter pflegen und anpassen können.

<a id="fa-46"></a>

**FA-46**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Änderungen an Berechnungsparametern müssen ohne Softwareanpassung möglich sein.

<a id="fa-47"></a>

**FA-47**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Berechnungsparameter müssen versionierbar sein.

---

### Triage und Qualitätssicherung

<a id="fa-48"></a>

**FA-48**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss übermittelte Nutzereingaben sichten können.

<a id="fa-49"></a>

**FA-49**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Nutzereingaben müssen klassifizierbar und kommentierbar sein.

<a id="fa-50"></a>

**FA-50**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss in der Lage sein, relevante Fälle für eine weitere Bearbeitung zu identifizieren.

<a id="fa-51"></a>

**FA-51**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss eine Übersicht aller eingegangenen Nutzereingaben sehen können.

<a id="fa-52"></a>

**FA-52**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss Nutzereingaben filtern können.

<a id="fa-53"></a>

**FA-53**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss mehrere Nutzereingaben zu einem Gebäude über eine gemeinsame Gebäudegruppierung und die Navigation zwischen den zugehörigen Geschwistereinreichungen prüfen können. Ein paralleler Side-by-side- oder automatisch berechneter Delta-Vergleich der Einreichungen ist nicht vorgesehen.

<a id="fa-125"></a>

**FA-125**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss im Triage-Prozess einzelne Einreichungen gezielt physisch löschen können. Eine gebündelte physische Löschung aller Einreichungen zu einer Gebäude-ID darf nur möglich sein, wenn sämtliche Einreichungen dieser Gebäudegruppe den Status `abgelehnt` besitzen. Nach erfolgreicher Löschung muss das System einen herunterladbaren Löschbeleg bereitstellen. Der Beleg ermöglicht zusammen mit einem unabhängigen Audit-Ereignis den späteren Nachweis für die konkrete Einreichung beziehungsweise Gebäudegruppe, ohne dass das Audit-Ereignis selbst eine Einreichungs-, Gebäude-, Adress- oder Tokenreferenz speichert.

<a id="fa-54"></a>

**FA-54**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss Energieeffizienzklassen definieren und bearbeiten können.

<a id="fa-55"></a>

**FA-55**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss auswählbare Eingabeoptionen (z.B. Gebäudetypen, Heizungsarten) bearbeiten können.

<a id="fa-56"></a>

**FA-56**  
*Release-Zuordnung:* [Release 4](../roadmap/mvp-definition.md#release-4)  
Fachpersonal muss Förderprogramme (Links/Kategorien) pflegen können.

---

### Reporting

<a id="fa-57"></a>

**FA-57**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Fachpersonal muss geprüfte Daten aggregiert auswerten können, damit sie verständlich und zuverlässig in der Wärmeplanung genutzt werden können.

<a id="fa-59"></a>

**FA-59**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss Berichte pro Quartier generieren können.

---

### Quartiersanalyse & Planung

<a id="fa-60"></a>

**FA-60**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss Quartiere nach energetischen Kennzahlen vergleichen können.

<a id="fa-61"></a>

**FA-61**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss Hotspots mit besonders hohem Energiebedarf identifizieren können.

<a id="fa-62"></a>

**FA-62**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss die Möglichkeiten für erneuerbare Energien visuell darstellen können, um geeignete Flächen zu identifizieren.

<a id="fa-63"></a>

**FA-63**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss erkennen können, welche Quartiere den größten Bedarf haben, um Prioritäten für die Wärmeplanung zu setzen.

<a id="fa-64"></a>

**FA-64**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Fachpersonal muss aus der Analyse Empfehlungen ableiten können, welche Maßnahmen sinnvoll sind.

---

<a id="fachliche-abgrenzungen"></a>

## Fachliche Abgrenzungen

<a id="fa-65"></a>

**FA-65**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Der Digitaler Energie Zwilling (DEZ) ersetzt keine individuelle Energieberatung.

<a id="fa-66"></a>

**FA-66**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Berechnungsergebnisse stellen keine förderfähigen Berechnungen dar.

<a id="fa-67"></a>

**FA-67**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System liefert keine rechtsverbindlichen Aussagen.

---

<a id="erweiterte-anforderungen"></a>

## Erweiterte Anforderungen

<a id="fa-68"></a>

**FA-68**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Bei einer freiwilligen Einreichung dürfen nur die für den vorgesehenen fachlichen und technischen Zweck notwendigen Daten übermittelt werden. Dazu gehören insbesondere die vollständige Gebäudeadresse, die Gebäude-ID und die Koordinaten sowie die freigegebenen Eingabe- und Berechnungsdaten. Die Einreichung ist daher nicht als anonym zu bezeichnen. Personenbezogene Angaben sind auf das notwendige Minimum zu begrenzen; soweit möglich, sind klassifizierte Angaben zu verwenden (z.B. Personenanzahl als Klassen 1–5 bzw. >5).

<a id="fa-69"></a>

**FA-69**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Personenbezogene Angaben sollen, wenn fachlich nicht zwingend erforderlich, nur in klassifizierter oder aggregierter Form erfasst werden.

<a id="fa-70"></a>

**FA-70**  
*Release-Zuordnung:* [Release 1](../roadmap/mvp-definition.md#release-1-plattformaufbau)  
Der Bürgerbereich muss ohne Registrierung nutzbar sein; der aktuelle Bearbeitungszustand muss für Wiederbesuche standardmäßig über Local Storage persistiert werden.

<a id="fa-71"></a>

**FA-71**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Nach Abschluss einer Berechnung soll ein Feedback-Formular automatisch angeboten werden; zusätzlich soll ein Feedback-Button jederzeit verfügbar sein. Die Funktion befindet sich noch in Arbeit. Die Zieldatenbank beziehungsweise das Zielsystem in der Kundenumgebung ist noch nicht abschließend geklärt; bis zu dieser Klärung darf die Oberfläche keine erfolgreiche Übermittlung bestätigen.

<a id="fa-72"></a>

**FA-72**  
*Release-Zuordnung:* [Release 4](../roadmap/mvp-definition.md#release-4)  
Fehler müssen über klare, „sprechende“ Fehlermeldungen kommuniziert werden (z.B. „Eingabedaten ungültig“, „Bitte Seite neu laden“, „Kontaktieren Sie Support“).

<a id="fa-73"></a>

**FA-73**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Die Benutzeroberfläche muss barrierefrei gemäß § 4 BGG konzipiert sein und vollständig responsiv für Desktop, Tablet und Mobile sein.

<a id="fa-74"></a>

**FA-74**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Das System muss eine Reporting-Funktion bereitstellen: einen PDF-Report (max. 5 Seiten, CI/CD-konform) sowie bei einer freiwilligen Einreichung einen JSON-Export des tatsächlich eingereichten Datenumfangs für die maschinelle Weiterverarbeitung.
Der Report muss mindestens enthalten:

- Projektinfo (Gebäudename/Projektname/Adresse)
- Übersicht der Gebäudedaten (inkl. Herkunftskennzeichnung)
- Zusammenfassung der Energieeffizienz-Analyse (aktuelle Klasse, Klasse nach Sanierung, Reduktion Energiebedarf, Reduktion CO₂)
- Energiebedarf (aktuell/neu, Einsparung)
- CO₂-Emissionen (aktuell/neu, Einsparung in t CO₂-Äquivalent)
- Sanierungsszenarien je ausgewählter Maßnahme (Komponente, Zustand, Vorschlag, energetische Wirkung)
- Vergleich des Gebäudes mit einem bundesweiten statistischen Referenzwert (vor/nach Sanierung)
- Grafische Elemente im vereinbarten Umfang: Energieklassenbalken und Delta-Darstellungen für relevante Vorher-/Nachher-Werte; weitergehende quantitative Diagramme sind nicht vorgesehen
- CI/CD-konformes Layout; ein IDML-Template kann vom Auftraggeber bereitgestellt werden
- Zusätzlich fünf Kennwerte, die im Projektverlauf definiert werden
- Konkrete nächste Schritte
- Wenn Daten gespeichert wurden: Link/QR zur Löschanfrage

Der PDF-Report darf zusätzliche Hinweise, Erläuterungen und Kontaktinformationen für Bürger enthalten. Diese Inhalte werden nicht in den JSON-Export übernommen, wenn sie für die Einreichung oder die kommunale Wärmeplanung nicht benötigt werden. Der JSON-Export ist aus Gründen der Datensparsamkeit und Transparenz bewusst kein vollständiges Abbild des PDF-Reports. Er bildet genau den übermittelten Datenumfang ab, sodass Bürger nachvollziehen können, welche Daten an die Stadt übermittelt wurden.

Kosten-, Budget-, Förder- sowie PV-/Geothermie-bezogene Reportinhalte sind erst nach Abschluss der fachlichen und technischen Klärung und der anschließenden Umsetzung in späteren Releases verpflichtend. Wirtschaftlichkeits- und Amortisationsaussagen sollen auf BKI-Kostendaten aufbauen. Stand 24.07.2026 fehlen weiterhin der Datenzugang und ein abgesicherter Zeitplan für die Verfügbarkeit; eine belastbare Umsetzung und Release-Zuordnung sind deshalb noch nicht möglich.

<a id="fa-75"></a>

**FA-75**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Das System soll eine Sanierungsvariante auf Basis eines Nutzerbudgets vorschlagen können (Ziel: maximale Energiebedarfsreduktion).

<a id="fa-76"></a>

**FA-76**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Das System muss jährliche und monatliche Kosten für Wärme- und Stromversorgung ausweisen sowie Gesamtenergiekosten und Einsparungen (absolut und relativ).

<a id="fa-77"></a>

**FA-77**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die PV-Datenfreigabe durch den Auftraggeber liegt vor. Der in der LB beschriebene Detailgrad mit mehreren PV-Ausprägungen, Speicher-Dimensionierungen für Haushalte mit und ohne Wärmepumpe sowie DGS-Obergrenzen wurde inzwischen von Auftraggeber und Auftragnehmer als deutlich zu hoch eingestuft. Ein vom Auftragnehmer präsentierter reduzierter Umsetzungsvorschlag wurde vom Auftraggeber nicht angenommen. Der verbindliche funktionale PV-/Speicher-Umfang muss daher noch gemeinsam festgelegt werden; die ursprünglichen Detailpfade sind bis dahin keine einzelnen Abnahmekriterien.

Die vom Auftraggeber bereitgestellten Geothermiedaten sind für die vorgesehenen Geothermie-Ausprägungen zu verwenden. Herkunfts-, Lizenz-, Turnus- und Schemametadaten sind vor der produktiven Veröffentlichung noch zu klären.

<a id="fa-78"></a>

**FA-78**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Nutzer müssen Energiequelle, Energiepreis und Stromart angeben können; Standardwerte sind vorzubelegen (z.B. Erdgas, 0,09 €/kWh; Strom 0,30 €/kWh).

<a id="fa-79"></a>

**FA-79**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss Energieeffizienzklassen (A+ bis H) in der energetischen Bewertung ausweisen. Nach Auswertung des Usertestings wird das ausgewählte Gebäude im 3D-Modell gut sichtbar und statisch hervorgehoben; eine flächendeckende Einfärbung aller Gebäude nach Energieeffizienzklasse ist nicht vorgesehen.

<a id="fa-80"></a>

**FA-80**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
CO₂-Emissionen müssen BISKO-konform berechnet und ausgewiesen werden.

<a id="fa-81"></a>

**FA-81**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Für alle automatisch abgeleiteten Werte muss die Datenherkunft in UI und Export nachvollziehbar sein (z.B. LOD2, Normtabellen, Baualtersklassen).

<a id="fa-82"></a>

**FA-82**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Nutzer sollen ihre Eingaben jederzeit abbrechen und bei Wiederbesuch automatisch aus dem Local Storage wieder aufnehmen können; wenn eine Speicherung im Backend explizit ausgelöst wurde, muss zusätzlich eine Wiederherstellung vom Server möglich sein.

<a id="fa-83"></a>

**FA-83**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System soll einen klaren Einstieg („So funktioniert’s“) mit Hinweis auf Datenquellen sowie Aussagekraft und Grenzen der Ergebnisse bieten.

<a id="fa-84"></a>

**FA-84**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Das System soll eine Übersicht der Maßnahmen mit relativem Einsparpotenzial und Kostenniveau bieten und eine Empfehlung für „beste Maßnahme bei Budget X“ ableiten können. Die Kosten- und Budgetaspekte sind blockiert, solange die vorgesehenen BKI-Daten, ihre Nutzungsbedingungen und das fachliche Kostenmodell nicht vorliegen.

<a id="fa-85"></a>

**FA-85**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die Herleitung von Empfehlungen soll nachvollziehbar dargestellt werden (z.B. verwendete Eingaben, Annahmen und Datenquellen).

<a id="fa-86"></a>

**FA-86**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Die Verwaltung muss Nutzereingaben je Gebäude gruppiert sehen und innerhalb dieser Gruppe zwischen Geschwistereinreichungen navigieren können. Der fachliche Vergleich erfolgt durch das nacheinander erfolgende Prüfen der gruppierten Datensätze; eine parallele Side-by-side- oder Delta-Ansicht ist nicht vorgesehen.

<a id="fa-87"></a>

**FA-87**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Jeder Nutzerdatensatz muss einen Status besitzen (`neu`, `in Prüfung`, `freigegeben`, `abgelehnt`, `ersetzt`) und die Statusänderung einschließlich Prüfkommentar nachvollziehbar sein. Spätere Einreichungen zu einem bereits freigegebenen Gebäude bleiben prüfbar. Vor ihrer Freigabe muss ein Bestätigungsdialog die aktuell freigegebene Einreichung in einem neuen Browserfenster beziehungsweise Browser-Tab zugänglich machen und den Abbruch ermöglichen. Nach der Bestätigung erhält die neue Einreichung den Status `freigegeben`, die bisherige Freigabe den Status `ersetzt` und weitere offene Einreichungen desselben Gebäudes den Status `abgelehnt`. Die Admin-Aktion „Datensatz abgelehnt“ setzt den fachlichen Endstatus `abgelehnt` (im Code `DECLINED`). Damit bleibt die Ablehnung sprachlich und technisch eindeutig von einer tatsächlichen Löschung getrennt. Eine Löschung entfernt den Datensatz als separate Operation gemäß FA-125 und wird nicht als Triage-Status modelliert.

<a id="fa-88"></a>

**FA-88**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Die Verwaltung muss Datensätze insbesondere nach Adresse, Status und zuständiger Prüfperson filtern sowie sortieren und paginiert anzeigen können. Die technische Vollständigkeit der in die Admin-Triage übernommenen Datensätze ist eine verbindliche Dateninvariante und deshalb keine eigene Filterdimension. Datenqualität, Herkunft und Plausibilität bleiben davon getrennte Prüfaspekte.

<a id="fa-90"></a>

**FA-90**  
*Release-Zuordnung:* [Release 3](../roadmap/mvp-definition.md#release-3)  
Systempflege-Änderungen (z.B. Kataloge) müssen mit Rollen/Rechten geschützt und für Nutzer klar erkennbar sein.

<a id="fa-91"></a>

**FA-91**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Am unteren Ende des Spektrums muss das Ergebnis einen groben Wärmebedarf und eine grobe Effizienzklasse liefern.

<a id="fa-92"></a>

**FA-92**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bei wenigen manuell ergänzten Angaben muss eine Einordnung/Benchmark des Gebäudes geliefert werden (z.B. Skala, Ampel oder Tacho).

<a id="fa-93"></a>

**FA-93**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Mit zunehmender manueller Eingabetiefe sollen bauteilbezogene Sanierungseffekte und eine einfache Notwendigkeitsprüfung je Bauteil möglich sein.

<a id="fa-94"></a>

**FA-94**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bei hoher manueller Eingabetiefe sollen Unsicherheiten sichtbar gemacht und Eingaben "Ich weiß es nicht" unterstützt werden.

<a id="fa-95"></a>

**FA-95**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Am oberen Ende des Spektrums sollen Variantenvergleiche (Energiebedarf, Kostenband, CO₂-Reduktion) und eine Empfehlung möglich sein. Der energetische Vergleich und die CO₂-Bewertung sind davon unabhängig; Kostenband und kostenbezogene Empfehlungen bleiben bis zur Bereitstellung und fachlichen Freigabe der BKI-Daten blockiert.

<a id="fa-96"></a>

**FA-96**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Baualtersklassen müssen als klar definiertes Raster bereitgestellt werden (z.B. bis 1918, 1919–1948, 1949–1957, 1958–1968, 1969–1978, 1979–1983, 1984–1994, 1995–2001, 2002–2006, ab 2007).

<a id="fa-97"></a>

**FA-97**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System soll Live-Ergebnisse nach Änderungen anzeigen (z.B. Energiebedarf, Kosten, Effizienzklasse), ohne expliziten „Berechnen“-Schritt.

<a id="fa-98"></a>

**FA-98**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Mit zunehmender manueller Eingabetiefe müssen Heizungsdetails auf Basis von Baujahr und Erzeugerart erfasst werden können (z.B. Heizflächenart, Zusatzheizung).

<a id="fa-99"></a>

**FA-99**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Bei hoher manueller Eingabetiefe müssen weitere berechnungsrelevante Anlagenparameter optional erfasst werden können.

---

<a id="offene-mvp-klaerung-solarthermie-pv-und-geothermie"></a>

## Offene MVP-Klärung: Solarthermie, PV und Geothermie

<a id="fa-100"></a>

**FA-100**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Für Solarthermie zur Warmwasserbereitung besteht im aktuellen Berechnungskern noch kein vorgesehener Rechenweg. Eine spätere Einbindung als zusätzliche Maßnahme kann fachlich neu bewertet werden.

<a id="fa-101"></a>

**FA-101**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Vor einer möglichen Umsetzung von Solarthermie müssen fachlicher Rechenweg, Eingabeparameter, Ergebnislogik und Abgrenzung zum bestehenden Warmwasser- und Heizungspfad verbindlich definiert werden.

<a id="fa-102"></a>

**FA-102**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die PV-Potenzialdaten sind freigegeben. Ob und in welcher Tiefe PV-Anlage und Speicher für den Betrieb einer Wärmepumpe einschließlich energetischer und finanzieller Effekte dargestellt werden, ist Bestandteil der noch offenen Scope-Abstimmung mit dem Auftraggeber.

<a id="fa-103"></a>

**FA-103**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die ursprünglich vorgesehene maximale Flächenausnutzung und Potenzialkommunikation für Haushaltsstrom, KFZ-Ladung oder vergleichbare Verbräuche gehört zur inzwischen von Auftraggeber und Auftragnehmer als deutlich zu hoch eingestuften LB-Detailstufe. Der vom Auftragnehmer präsentierte reduzierte Umsetzungsvorschlag wurde vom Auftraggeber nicht angenommen; ein verbindlicher Ersatzumfang steht noch aus.

<a id="fa-104"></a>

**FA-104**  
*Release-Zuordnung:* [Release 7](../roadmap/mvp-definition.md#release-7)  
Die vom Auftraggeber bereitgestellten Geothermiedaten sind die verbindliche Grundlage für die gebäudebezogene Einschätzung des Geothermiepotenzials. Die technische Datenanreicherung wurde nach der Datenfreigabe in Sprint 17 umgesetzt. Kollektor und Sonde werden im bereitgestellten Datensatz nicht geführt und müssen daher nicht als eigene Eignungsvarianten ausgewertet werden. Eine Luft-Wärmepumpe ist grundsätzlich verfügbar und benötigt keine gesonderte standortbezogene Prüfung. Eine Erd-Wärmepumpe wird nach fachlicher Einschätzung des Energieberaters nicht empfohlen beziehungsweise als vernachlässigbar eingestuft und ist kein eigener Auswertungspfad. Herkunfts-, Lizenz-, Turnus- und Schemametadaten sind vor der produktiven Veröffentlichung noch zu klären.

<a id="fa-105"></a>

**FA-105**  
*Release-Zuordnung:* [Release 2](../roadmap/mvp-definition.md#release-2)  
Das System muss aus dem MasterPortal heraus über einen verpflichtenden Einstiegspunkt erreichbar sein; hierfür muss im MasterPortal mindestens ein Link auf die DEZ-Plattform bereitgestellt werden.

> **Begründung (fachlich):** Der Link-Out unterstützt einen niedrigschwelligen Zugang per direkter URL, bessere Auffindbarkeit (inkl. Landingpages), direktes Teilen per Link/QR sowie eine DEZ-spezifische Nutzerführung.

---

<a id="nachnutzung-und-white-labeling"></a>

## Nachnutzung und White-Labeling

*Planungsstand:* Die Umsetzung der White-Labeling-Anforderungen ist für Sprint 18 innerhalb der Inbetriebnahmephase vorgesehen.

<a id="fa-106"></a>

**FA-106**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Das System muss fachlich so nutzbar sein, dass neben Regensburg auch weitere Kommunen mit eigenen Datenbeständen betrieben werden können.

<a id="fa-107"></a>

**FA-107**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Für jede Kommune muss ein eigenes Profil nutzbar sein, das mindestens Name, Branding, Texte, Basiskartenbezug und lokale Datenquellen beschreibt.

<a id="fa-108"></a>

**FA-108**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Regensburg-spezifische Inhalte (z.B. Vergleiche gegen den lokalen Gebäudebestand, lokale Begriffe, lokale Förderbezüge) müssen als kommunenspezifischer Profilinhalt austauschbar sein.

<a id="fa-109"></a>

**FA-109**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Die Nutzerführung und Kernfunktionen (Gebäudeauswahl, Berechnung, Maßnahmenvergleich, Ergebnisdarstellung) müssen über alle Kommunen hinweg fachlich gleichartig bleiben.

<a id="fa-110"></a>

**FA-110**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Für den Datenimport neuer Kommunen muss eine fachlich nachvollziehbare Zuordnung auf ein einheitliches Zielmodell möglich sein, damit die gleichen Ergebniskategorien bereitgestellt werden können.

<a id="fa-111"></a>

**FA-111**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Wenn erweiterte Fachdaten in einem für DEZ geeigneten und kompatiblen Format vorliegen, sollen diese fachlich vorrangig genutzt werden; fehlen sie, muss die Anwendung weiterhin mit den Basisdaten arbeitsfähig bleiben. CityGML Energy ADE ist im aktuellen Stand dafür nicht geeignet, da Version 1.0 nicht mit CityGML 3.0-Dateien kompatibel ist.

<a id="fa-112"></a>

**FA-112**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Für automatisch übernommene oder transformierte Werte muss die Herkunft für Fachpersonal nachvollziehbar sein (Quelle der Kommune, verwendetes Profil, ggf. Fallback).

<a id="fa-113"></a>

**FA-113**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Die Einführbarkeit in weiteren Kommunen soll ohne fachliche Neudefinition der Kernlogik möglich sein; kommunenspezifische Unterschiede sollen primär über Profile und Konfigurationen abgebildet werden.

<a id="fa-114"></a>

**FA-114**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Eine DEZ-Instanz soll fachlich immer genau eine Kommune abbilden; die Nachnutzung für weitere Kommunen erfolgt über getrennte Deployments und nicht über eine gleichzeitige Mehrkommunen-Nutzung in derselben Instanz.

---

<a id="festlegung-nutzungsdaten-und-tracking"></a>

## Festlegung: Nutzungsdaten und Tracking

*Planungsstand:* Matomo bleibt die fachlich vorgesehene Analytics-Lösung, die technische Umsetzung ist aktuell jedoch niedrig priorisiert und keinem verbindlichen Sprint zugeordnet. Entgegen der ursprünglichen Annahme steht in der Kundenumgebung keine bereits nutzbare Matomo-Instanz zur Verfügung. Eine eigene Instanz und deren Betrieb müssen zunächst mit dem Auftraggeber abgestimmt werden; eine Umsetzung in Sprint 18 oder 19 ist derzeit unsicher.

<a id="fa-115"></a>

**FA-115**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Für Nutzungsanalysen wird Matomo verbindlich eingesetzt.

<a id="fa-116"></a>

**FA-116**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Nutzungsdatenanalysen dürfen fachlich nur nach expliziter Einwilligung (Opt-in) erfolgen.

<a id="fa-117"></a>

**FA-117**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Der konkrete fachliche Umfang für Tracking, einschließlich Metriken, Auswertungszielen, Eventkatalog und Berichtskreisen, muss vor produktiver Aktivierung verbindlich festgelegt sein. Der aktuelle fachliche Zielstand ist im [Matomo-Trackingkonzept](../system/06-matomo-trackingkonzept.md) dokumentiert.

---

<a id="abnahmeprozess-und-ansprechpartner"></a>

## Abnahmeprozess und Ansprechpartner

<a id="fa-118"></a>

**FA-118**  
*Release-Zuordnung:* [Inbetriebnahme](../roadmap/mvp-definition.md#inbetriebnahme)  
Für den Abnahmeprozess sind bei der Stadt Regensburg jeweils ein fachlicher und ein technischer Projektleiter als Ansprechpartner benannt. Die fachliche Bewertung und Abnahme des Rechenkerns erfolgt durch qualifizierte Energieberatung; der Abnahmetermin mit dem Energieberater ist für Sprint 19 abgestimmt. Automatisierte Tests dienen der technischen Regression; normative Golden Tests oder eine projektweit verbindliche Coverage-Schwelle sind keine zusätzlichen fachlichen Abnahmekriterien.

---

<a id="konkretisierung-matomo-auswertungsumfang"></a>

## Konkretisierung: Matomo-Auswertungsumfang

*Planungsstand:* Die folgenden Anforderungen beschreiben weiterhin den fachlichen Zielumfang, sind wegen der noch ausstehenden Bereitstellung und Betriebsabstimmung einer eigenen Matomo-Instanz jedoch aktuell keinem verbindlichen Sprint zugeordnet.

<a id="fa-119"></a>

**FA-119**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Der gesamte öffentliche Sanierungscheck einschließlich des gesonderten Prozesses zur freiwilligen Gebäudedatenspende muss fachlich über genau eine Matomo-Site ausgewertet werden. Die eigentlichen Daten der Gebäudedatenspende sind davon ausgenommen.

<a id="fa-120"></a>

**FA-120**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Die Webanalyse muss begonnene und abgeschlossene Sanierungschecks, PDF-Exporte, Beratungskontakte, begonnene und abgeschlossene Datenspenden sowie Abbruchabschnitte und Abbruchquote auswerten können. Definitionen und Nenner der Kennzahlen müssen dem [Matomo-Trackingkonzept](../system/06-matomo-trackingkonzept.md#kennzahlen) entsprechen.

<a id="fa-121"></a>

**FA-121**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Gebäudetypen und ausgewählte Sanierungsmaßnahmen dürfen für aggregierte Auswertungen als fachlich freigegebene Kategorieschlüssel erfasst werden. Wertebereiche und Bezeichnungen müssen versioniert und auf die im Sanierungstool tatsächlich auswählbaren Optionen beschränkt sein.

<a id="fa-122"></a>

**FA-122**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Matomo darf keine Gebäude-ID, Adresse, Koordinaten, Einreichungs- oder Löschkennung, Kontaktdaten, Freitexte, exakten Verbrauchs- oder Kostenwerte und keine vollständigen Eingabe-, Ergebnis- oder Einreichungsdaten erhalten. Die fachliche Gebäudedatenspende muss einen von Matomo getrennten Datenstrom verwenden.

<a id="fa-123"></a>

**FA-123**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Tracking darf nur für ausdrücklich eingewilligte Sitzungen erfolgen. Ohne freigegebene dauerhafte Besucherkennung müssen Berichte und Kennzahlen Sitzungen beziehungsweise Besuche ausweisen und dürfen diese nicht als eindeutig identifizierte Personen bezeichnen.

<a id="fa-124"></a>

**FA-124**  
*Release-Zuordnung:* Nicht im aktuellen Releaseplan zugeordnet.  
Dashboards müssen die verbindlichen KPI-Definitionen verwenden und aggregierte Ergebnisse bereitstellen. Für die Auswertung von Maßnahmenkombinationen ist vor Produktivbetrieb eine fachlich und datenschutzrechtlich freigegebene Mindestfallzahl festzulegen.

---

<a id="priorisierung-implizit"></a>

## Priorisierung (implizit)

- Kernfunktionen für Bürger (Eigentümer/Vermieter) (Visualisierung, Berechnung) haben höchste Priorität.
- Administrative Funktionen dienen der Qualitätssicherung und Weiterentwicklung.
- Analyse- oder Beratungsfunktionen, die über den verbindlich freigegebenen Matomo-Umfang hinausgehen, sind nicht Bestandteil der initialen fachlichen Anforderungen.

---

<a id="uebergang-zu-technischen-anforderungen"></a>

## Übergang zu technischen Anforderungen

Die in diesem Dokument beschriebenen fachlichen Anforderungen werden in den **Technischen Anforderungen** konkretisiert.  
Dort wird festgelegt, **wie** diese Funktionen technisch umzusetzen sind und welche nicht-funktionalen Randbedingungen einzuhalten sind.
