# User Experience, Nutzerreise & Informationsarchitektur

Dieses Kapitel bündelt die nutzerzentrierte Sicht auf den Digitaler Energie Zwilling (DEZ): Ziele, Nutzerbedürfnisse, Interaktionslogik und die fachliche Informationsarchitektur.

## Inhaltsverzeichnis

1. [Ziel und Nutzungskontext](#ziel-und-nutzungskontext)
2. [Hauptzielgruppe: Bürger (Eigentümer/Vermieter)](#hauptzielgruppe-buerger-eigentuemer-vermieter)
3. [Nutzerreise und Interaktion im Bürgerbereich](#nutzerreise-und-interaktion-im-buergerbereich)
4. [Informationsarchitektur und Datenstruktur](#informationsarchitektur-und-datenstruktur)
5. [Nebenzielgruppe: Stadtverwaltung / Fachpersonal](#nebenzielgruppe-stadtverwaltung-fachpersonal)
6. [Interaktions- und Screenkonzept](#interaktions-und-screenkonzept)
7. [UX-Leitprinzipien des Systems](#ux-leitprinzipien-des-systems)

<a id="ziel-und-nutzungskontext"></a>

## Ziel und Nutzungskontext

Das Kapitel dient als Orientierung für fachliche, UX- und MVP-Entscheidungen.

- Es beschreibt, wie Bürger (Eigentümer/Vermieter) das System verstehen und nutzen.
- Es zeigt, welche Informationen in welcher Reihenfolge benötigt werden.
- Es grenzt den Charakter des Tools klar als Orientierungshilfe ab.

Ergebnisse sind indikativ und ersetzen keine individuelle Fachberatung.

---

<a id="hauptzielgruppe-buerger-eigentuemer-vermieter"></a>

## Hauptzielgruppe: Bürger (Eigentümer/Vermieter)

Die primäre Zielgruppe des Sanierungstools sind Bürger (Eigentümer/Vermieter). Die Nutzer verfügen in der Regel über begrenztes technisches und energetisches Fachwissen und haben keinen vollständigen Überblick über den energetischen Zustand ihres Gebäudes.

### Ausgangslage / Wissensstand

- Der energetische Ist-Zustand des Gebäudes ist meist unbekannt oder nur grob eingeschätzt.
- Daten zu Energiebedarf, Effizienzklassen oder Sanierungsstand liegen nicht strukturiert vor.
- Förderprogramme, Kostenstrukturen und Einsparpotenziale sind unübersichtlich.
- Technische Begriffe, Normen und Annahmen (DIN, Effizienzklassen, Kennwerte) sind schwer verständlich.

### Zentrale Probleme & Pain Points

- Unsicherheit, welche Sanierungsmaßnahmen sinnvoll, technisch machbar und wirtschaftlich tragfähig sind.
- Angst vor Fehlentscheidungen, Fehlinvestitionen und unerwartet hohen Kosten.
- Fehlendes Verständnis für Datenqualität und Modellannahmen mit dem Risiko falscher Erwartungen.
- Hohe Einstiegshürde durch komplexe Fachsprache und umfangreiche Datenerfassung.
- Schwierigkeit, Maßnahmen im eigenen Gebäude realistisch einzuordnen (Vergleich, Wirkung, Priorisierung).

### Motivation & Zielsetzung der Nutzer

- Schneller, verständlicher Überblick über den energetischen Zustand des eigenen Gebäudes.
- Fundierte Entscheidungsgrundlage für die Frage, ob sich eine Sanierung lohnt und welche Maßnahmen Priorität haben.
- Transparenz über Kosten, Einsparpotenziale (Energie, Kosten, CO₂) und wirtschaftliche Effekte.
- Reduktion von Risiken durch realistische, nicht überoptimistische Einschätzungen.
- Nutzung von Förderungen ohne aufwendige externe Recherche.
- Orientierung statt Detailtiefe: Fokus auf Wirkung und Priorisierung statt auf technische Detailplanung.

Ein Erfolg aus Nutzersicht liegt nicht in einer perfekten Berechnung, sondern in einer plausiblen und nachvollziehbaren Entscheidungsbasis.

### Anforderungen an das Tool aus Nutzersicht

- Automatische Vorbefüllung relevanter Gebäudedaten (z. B. LOD2, Stadtdaten, Ableitungen von Normen).
- Möglichkeit zur Korrektur und Ergänzung durch den Nutzer.
- Minimale, intuitive Eingaben ohne komplexe Fragebögen.
- Klare Darstellung von aktuellem Zustand, Sanierungsszenarien und Vergleich „heute vs. nach Sanierung“.
- Einordnung im Vergleich zum eigenen Gebiet bzw. Gebäudebestand in anonymisierter Form.
- Sichtbarmachung von Unsicherheiten und Annahmen bei unvollständigen Daten.
- Kombination und Vergleich mehrerer Maßnahmen (z. B. Fassade + Fenster + Heizung).
- Ergebnisdarstellung als verständliche Einschätzung, keine Fachberatung.
- Exportmöglichkeit (z. B. PDF) zur Weiterverwendung.

### Nutzungskontext & Rahmenbedingungen

- Nutzung erfolgt prinzipiell lokal und anonym, es sei denn der Übermittlung personenbezogener Daten wurde zugestimmt.
- Der Nutzer arbeitet ausschließlich mit seinem eigenen Gebäude.
- Zeitrahmen: wenige Minuten, keine langfristige oder komplexe Datenerfassung.
- Primärnutzung auf Desktop/Laptop, mobile Nutzung ist möglich.
- Ergebnisse sind als Vorschläge und Orientierungswerte zu verstehen, nicht als verbindliche Planung.

---

<a id="nutzerreise-und-interaktion-im-buergerbereich"></a>

## Nutzerreise und Interaktion im Bürgerbereich

### Nutzerreise (Phasen)

Die folgende User Journey beschreibt den typischen Nutzungspfad eines privaten Vermieters, der den energetischen Zustand eines Mehrfamilienhauses einschätzen und Sanierungsoptionen bewerten möchte.
Ziel ist es, die zentralen Entscheidungsphasen, Nutzerbedürfnisse, Risiken und daraus abgeleiteten UX-Anforderungen entlang des gesamten Nutzungskontexts darzustellen.
Die Journey dient als Grundlage für:

- UX- und Interaktionsentscheidungen
- Priorisierung von Funktionen im MVP
- Abgrenzung zwischen Orientierungshilfe und Fachberatung

| Phase         | Ziel                 | Ergebnis                                      |
| ------------- | -------------------- | --------------------------------------------- |
| Awareness     | Problem erkennen     | Heizkosten steigen, Handlungsdruck entsteht   |
| Consideration | Nutzen prüfen        | Tool wirkt verlässlich und einfach            |
| Onboarding    | Gebäude finden       | Gebäude wählen, Daten prüfen                  |
| Berechnung    | Optionen testen      | Maßnahmen vergleichen, Effekte verstehen      |
| Review        | Entscheidung stützen | Zusammenfassung, PDF-Export, nächste Schritte |

### Schritte & Aktionen (Kurzfassung)

| Schritt      | Nutzeraktion                           | Systemantwort                                  |
| ------------ | -------------------------------------- | ---------------------------------------------- |
| Einstieg     | Website öffnen, Kurzbeschreibung lesen | Transparente Erklärung, Datenschutz-Hinweis    |
| Gebäudewahl  | Adresse eingeben oder Karte nutzen     | Treffer anzeigen, Daten vorbefüllen            |
| Gebäudedaten | Daten prüfen und ergänzen              | Plausibilitätschecks, Herkunftskennzeichnung   |
| Varianten    | Maßnahmen auswählen                    | Vorher-/Nachher-Werte und Delta-Darstellungen  |
| Bewertung    | Ergebnisse sichten                     | Zusammenfassung, Förderinfos, nächste Schritte |
| Export       | PDF herunterladen                      | Report inkl. Gebäudedaten und Links            |

### Eingabetiefe (fachliche UX-Sicht)

Die Eingaben bewegen sich auf einem kontinuierlichen Spektrum von "keine Nutzereingabe" bis
"vollständig durch Nutzer definiert". Es gibt keine festen Stufen und keine explizite Auswahl einer Datenstufe durch den Nutzer.

- Die Anwendung startet immer mit automatisch vorbelegten Werten auf Basis von LOD2, Baualtersklassen, Katalogen und Standardannahmen.
- Mit jeder zusätzlichen manuellen Eingabe verschiebt sich die Berechnung entlang des Spektrums in Richtung höherer Individualisierung.
- Die in der Arbeitsmappe genannten **Datenstufe 1** und **Datenstufe 2** sind fachliche Referenz-Enden dieses Spektrums, keine UI-Modi.
- Editierbar sind nur die fachlich freigegebenen Werte; interne Rechengrößen bleiben für Nutzer verborgen.
- Alle Eingaben und abgeleiteten Werte sind transparent als automatisch, manuell oder geschätzt zu kennzeichnen.

### Eingabeumfang im Spektrum

Die detaillierten Eingabefelder inkl. Pflicht-/Optionaleingaben entlang des Spektrums sind in den Anforderungen beschrieben:
`docs/requirements/02-functional-requirements.md` und `docs/requirements/03-technical-requirements.md`.

Bezug zur Arbeitsmappe `20260320_RDEZ_Uebersicht_Berechnung_Grobkonzept.xlsx`:

- Datenstufe 1 steht für das untere Ende des Spektrums (keine Nutzereingabe).
- Datenstufe 2 steht für das obere Ende des Spektrums (maximale Nutzereingabe).
- Beide Begriffe sind nur Spektrum-Enden und keine separaten UI-Stufen.

Alle Eingaben sind als „automatisch“, „manuell“ oder „geschätzt“ zu kennzeichnen.

### Screen-Flow (vereinfacht)

1. Landingpage mit Kurzbeschreibung und Datenschutz-Hinweis.
2. Gebäude finden über Karte oder Adresse.
3. Basisdaten anzeigen, prüfen und korrigieren.
4. Maßnahmen/PV/Geothermie auswählen, Varianten vergleichen.
5. Zusammenfassung, Wirtschaftlichkeit, Förderinfos, nächste Schritte.
6. PDF-Export, optionaler Löschhinweis (falls Daten gespeichert wurden).

Die vereinfachten UX-Schritte sind keine technische Tracking-Nummerierung. Für Funnel-Auswertungen gelten die stabilen semantischen Schritt-IDs und Abschlusskriterien aus dem [Matomo-Trackingkonzept](06-matomo-trackingkonzept.md#funnel-schritte). Dadurch können mehrere fachliche Abschnitte in einem Screen zusammengefasst oder Screens umgestaltet werden, ohne historische Auswertungen durch geänderte Schrittzahlen zu verfälschen.

> ⚠️ **Hinweis MVP:** Solarthermie ist derzeit nicht Teil des vorgesehenen Rechenwegs im Berechnungskern. Offen sind damit aktuell vor allem die zwei PV-Darstellungen und die Geothermie-Bewertung.
> Hinweis Datenstand Geothermie: Die Daten wurden durch den Auftraggeber bereitgestellt und sollen verwendet werden; die Implementierung befindet sich in Arbeit. Herkunfts-, Lizenz-, Turnus- und Schemametadaten sind noch zu klären. Ein zusätzlicher Fallback zur Berechnung flurstücksbezogener Potenziale nach dem Vorbild der LfU-/TUM-Studie wird nicht benötigt.

### User Stories (Private Gebäudenutzer)

- Als privater Gebäudenutzer möchte ich eine klare Erklärung, was das Tool kann, damit ich sofort verstehe, wie es mir hilft.
- Als privater Gebäudenutzer möchte ich mein Gebäude schnell über Adresse oder Karte finden, damit ich ohne Aufwand starten kann.
- Als privater Gebäudenutzer möchte ich fehlende Gebäudedaten einfach ergänzen, damit die Berechnung realistisch bleibt.
- Als privater Gebäudenutzer möchte ich Maßnahmen auswählen und vergleichen, damit ich Alternativen bewerten kann.
- Als privater Gebäudenutzer möchte ich sehen, welche Daten automatisch stammen, damit ich die Verlässlichkeit einschätzen kann.
- Als privater Gebäudenutzer möchte ich verständliche Ergebnisse und klare nächste Schritte, damit ich entscheiden kann.
- Als privater Gebäudenutzer möchte ich einen PDF-Report exportieren, um Ergebnisse weiterzugeben.

---

<a id="informationsarchitektur-und-datenstruktur"></a>

## Informationsarchitektur und Datenstruktur

![informationsarchitektur-domaenen-datenstruktur-system.png](./attachments/informationsarchitektur-domaenen-datenstruktur-system.png)

Quelle: `attachments/informationsarchitektur-domaenen-datenstruktur-system.png`

Das Diagramm beschreibt die fachliche Struktur der Eingaben und die Ableitung der Ergebnisse.
Alle Eingabedomänen laufen in einem zentralen Datenobjekt zusammen und speisen die Live-Berechnung sowie den Sanierungsvorschlag.

### Domäne Allgemeine Gebäudedaten

- Gebäudetyp, Wohneinheiten, Wohnfläche, Vollgeschosse, angrenzende Gebäude und Personenanzahl.
- Diese Basisdaten steuern Vorbelegungen und Plausibilitätsprüfungen in nachgelagerten Modulen.

### Domäne Wärmeversorgung

- Heizsystem und Warmwasserbereitstellung als zentrale Strukturfelder.
- Energieträger und Erzeugerkontext (z. B. Öl, Erdgas, Fernwärme, Strom, Wärmepumpe/Geothermie) inkl. Heizflächenart, Heizkreistemperatur und Regelung.
- Verbrauchs-, Preis- und Faktorwerte als Grundlage für Endenergie-, Kosten- und Emissionsberechnung.
- Zusätzliche Entscheidungskontexte wie Brennstofflagerfähigkeit oder Umbauwunsch zur Flächenheizung können bei höherer Eingabetiefe relevant werden.

### Domäne Strom und Erneuerbare Energien

- Photovoltaik-Parameter inkl. Baujahr, Flächennutzung und Anlagenkontext.
- Strombezug mit Stromart und Strompreis.
- Optionaler Speicher als Zusatzmodul zur Eigenverbrauchsbetrachtung.

### Domäne Gebäudehülle

- Struktur pro Bauteil: Dach, oberste Geschossdecke, Außenwand, Fenster, Kellerdecke.
- Je Bauteil werden Ist-Zustand, Material-/Baukontext und Sanierungszustand geführt.
- Daraus abgeleitete technische Kennwerte (z. B. U-Wert, Dämmannahmen) werden in der Berechnung genutzt.

### Domäne Sanierungsmaßnahmen und Fördermittel

- Maßnahmenkatalog für Hülle, Anlagentechnik und erneuerbare Komponenten.
- Maßnahmenselektion mit Wirkung auf Energiebedarf, CO₂ und Kosten.
- Verknüpfung mit Förderlogik und Hinweisen für priorisierte Maßnahmen.

### Ergebnis- und Entscheidungsebene

- Live-Ergebnisse: Heizwärmebedarf, Endenergie, Primärenergie, Energieeffizienz, CO₂-Emissionen sowie verbrauchs- und kostenbezogene Kennzahlen.
- Sanierungsvorschlag als zusammenfassende Empfehlung auf Basis der Eingaben.
- Fördermittel-Block zur Einordnung verfügbarer Förderoptionen.
- Der grafische Darstellungsumfang besteht aus Energieklassenbalken und Delta-Darstellungen für relevante Vorher-/Nachher-Werte. Weitere quantitative Diagrammtypen sind nicht vorgesehen.

### Datenquellen & Kennzeichnung

- Automatisch abgeleitet: LOD2-Geometrie, Baualtersklassen, Standardannahmen.
- Manuell: Nutzereingaben zu Bauteilen, Anlagen und Kostenparametern.
- Geschätzt: Werte aus Katalogen/Normtabellen/Typologien, die anhand der aktuellen Eingaben referenziert werden; dies kann sowohl automatisch abgeleitete als auch manuell angepasste Eingaben betreffen.
- Beispiel- und Templatewerte aus der Referenzarbeitsmappe dürfen in der UI nicht als verbindliche Standardwerte erscheinen.

### Baualtersklassen

Das Raster der Baualtersklassen ist in den fachlichen Anforderungen festgelegt (siehe `docs/requirements/02-functional-requirements.md`, FA-96).

---

<a id="nebenzielgruppe-stadtverwaltung-fachpersonal"></a>

## Nebenzielgruppe: Stadtverwaltung / Fachpersonal

In der Konzeption ist dafür eine eigene Verwaltungsoberfläche vorgesehen, in der Gebäudedaten angezeigt und weiterverarbeitet werden.

> ⚠️ **Hinweis zur Priorisierung:** \
> Die Entwicklung einer eigenständigen Verwaltungsoberfläche ist nachrangig und nicht Fokus des MVP.

### Rollenbeschreibung

Die Nebenzielgruppe umfasst Mitarbeitende der Stadtverwaltung / Fachpersonal (z. B. Klimaschutz, Stadtplanung, Energieplanung). Sie prüfen einzelne freiwillige Einreichungen fachlich und pflegen Berechnungskonfigurationen. Aggregierte Analysen sind davon getrennt und befinden sich noch in fachlicher Prüfung.

Für den internen Client sind drei Rollen vorgesehen:

- `manager` (Verwalter): Zugriff auf eingereichte Gebäudedaten und deren Bearbeitung; kein Zugriff auf Systempflege.
- `maintainer` (Systempfleger): Zugriff auf Systempflege; kein Zugriff auf eingereichte Gebäudedaten.
- `admin` (Administrator): voller Zugriff auf den internen Client.

### Ausgangslage / Datenproblem

- Aktuell stehen nur sehr grobe Datengrundlagen zur Verfügung (z. B. leitungsgebundener Gasverbrauch).
- Kaum Transparenz über den tatsächlichen Sanierungsstand einzelner Gebäude und die Wirkung bereits umgesetzter Maßnahmen.
- Fehlende belastbare Daten zur Sanierungsdynamik, zur Verteilung von Effizienzklassen und zur realistischen Potenzialabschätzung.
- Bestehende Daten sind heterogen, veraltet und schwer vergleichbar.

### Motivation & Zielsetzung der Verwaltung

- Aufbau einer verlässlicheren Datenbasis für kommunale Wärmeplanung, Klimaschutzstrategien und langfristige Szenarien.
- Überblick über den energetischen Zustand des gesamten Gebäudebestands sowie über Sanierungspotenziale und deren Verteilung.
- Nutzung aggregierter Ergebnisse aus dem Bürger-Tool, um Datenlücken zu schließen und Annahmen zu validieren.
- Verbesserung der Datenqualität durch plausibilisierte Nutzereingaben und steigende Nutzung des Tools.

Wichtig: Ziel der Verwaltung ist nicht die Einzelentscheidung, sondern strukturelle Erkenntnis.

### Zentrale Pain Points

- Sehr grobe Ausgangsdaten mit hoher Unsicherheit.
- Große Streuung der Datenqualität bei Bürgereingaben.
- Implizite Erwartung, dass Bürger korrekt und vollständig eingeben; realistisch ist das nicht durchgängig erfüllbar.
- Fehlende Transparenz darüber, welche Daten belastbar sind und welche nicht.

### Anforderungen an das Tool aus Verwaltungssicht

- Rollenbasierter Zugriff auf einzelne freiwillige Einreichungen, soweit dies für Triage und Qualitätssicherung erforderlich ist.
- Filterung nach Adresse, Status und Prüfperson sowie Navigation zwischen Einreichungen desselben Gebäudes.
- Aggregierte Filter-, Analyse- und Berichtsfunktionen auf Bestands- und Quartiersebene befinden sich noch in fachlicher und datenschutzrechtlicher Prüfung.
- Transparente Kennzeichnung der Datenqualität (z. B. Anteil geschätzter vs. bestätigter Daten).

### Nutzerreise Verwaltung (Phasen)

| Phase        | Ziel               | Ergebnis                      |
| ------------ | ------------------ | ----------------------------- |
| Login        | Zugang sichern     | Zugriff auf Admin-Funktionen  |
| Übersicht    | Überblick gewinnen | Liste und Karte der Eingaben  |
| Prüfung      | Qualität sichern   | Gruppierte Navigation & Plausibilisierung |
| Freigabe     | Daten bestätigen   | Status „freigegeben“; bisherige Freigabe wird bei einer späteren Freigabe „ersetzt“ |
| Systempflege | Grundlagen pflegen | Kataloge aktuell halten       |
| Auswertung   | Analyse            | Aggregierte Erkenntnisse      |

### Schritte & Aktionen (Verwaltung)

| Schritt           | Aktion                       | Systemantwort                    |
| ----------------- | ---------------------------- | -------------------------------- |
| Login             | Admin-Seite öffnen, anmelden | Rollenprüfung, Admin-Bereich     |
| Übersicht         | Liste/Karte der Eingaben     | Filter nach Adresse, Status und Prüfperson; Sortierung und Pagination |
| Detail            | Gebäudegruppe öffnen         | Navigation zwischen Geschwistereinreichungen |
| Plausibilisierung | Datensatz prüfen             | Status „in Prüfung“, Notizen     |
| Freigabe          | Datensatz auswählen          | Status „freigegeben“ + Audit-Log; vorhandene Freigabe nach Bestätigung auf „ersetzt“ setzen |
| Ablehnung         | Datensatz fachlich verwerfen  | Status „abgelehnt“ + Audit-Log |
| Physische Löschung | Einzelne Einreichung gezielt löschen | Separate Löschoperation; kein Triage-Status |
| Gebündelte Löschung | Alle Einreichungen einer Gebäude-ID löschen | Nur möglich, wenn alle Einreichungen der Gebäudegruppe abgelehnt sind |
| Systempflege      | Kataloge bearbeiten          | Versionierung, Validierung       |
| Auswertung        | Kennzahlen prüfen            | Aggregierte Ansicht              |

### Ziele & Erwartungen (Verwaltung)

- Verlässliche Datenbasis für Wärmeplanung herstellen.
- Plausible Datensätze schnell identifizieren.
- Systemweit konsistente Eingabeoptionen sicherstellen.

### Schmerzpunkte (Verwaltung)

- Viele ähnliche Datensätze je Gebäude.
- Uneinheitliche Qualität der Eingaben.
- Unklare Rollen oder Rechte.
- Änderungen wirken systemweit.

### Chancen und UX-Ansätze (Verwaltung)

- Klar definierte Rollen und Berechtigungen.
- Gruppierung „alle Eingaben zu einem Gebäude“.
- Vergleich durch Navigation zwischen den Geschwistereinreichungen einer Gebäudegruppe; keine Side-by-side- oder Delta-Ansicht der Einreichungen.
- Technische Vollständigkeit als Dateninvariante der Admin-Triage; kein eigener Vollständigkeitsfilter. Datenqualität und Plausibilität werden weiterhin fachlich geprüft.
- Statuskennzeichnung: neu / in Prüfung / freigegeben / abgelehnt / ersetzt.
- Eine spätere Einreichung bleibt prüfbar. Bei ihrer Freigabe weist ein Bestätigungsdialog auf die vorhandene Freigabe hin, verlinkt diese in einem neuen Browserfenster beziehungsweise Browser-Tab und ermöglicht den Abbruch.
- Nach Bestätigung setzt das Backend die neue Einreichung atomar auf `freigegeben`, die bisherige Freigabe auf `ersetzt` und weitere offene Geschwistereinreichungen auf `abgelehnt`.
- Die Admin-Aktion „Datensatz abgelehnt“ setzt den Endstatus „abgelehnt“ (im Code `DECLINED`). Die physische Löschung ist davon klar getrennt und wird nicht als Status dargestellt.
- Einzelne Einreichungen können im Triage-Prozess gezielt physisch gelöscht werden. Die gebündelte Löschaktion einer Gebäudegruppe ist nur verfügbar, wenn alle Einreichungen zu ihrer Gebäude-ID den Status „abgelehnt“ besitzen.
- Audit-Log: Wer hat wann mit welchem Prüfkommentar einen Status geändert und welche Einreichung hat einen automatischen Statuswechsel ausgelöst?
- Aggregierte, filterbare Auswertungen bleiben bis zum Abschluss der fachlichen Prüfung außerhalb des verbindlichen Admin-Umfangs.

### User Stories (Stadtverwaltung)

- Als Stadtverwalter/in möchte ich mich im internen Bereich anmelden können, damit ich Zugriff auf Verwaltungsfunktionen habe.
- Als Stadtverwalter/in möchte ich eine Übersicht aller Nutzereingaben sehen, damit ich erkenne, was geprüft werden muss.
- Als Stadtverwalter/in möchte ich innerhalb einer Gebäudegruppe zwischen Geschwistereinreichungen navigieren, um die Datensätze nacheinander zu prüfen; eine parallele Side-by-side- oder Delta-Ansicht benötige ich dafür nicht.
- Als Stadtverwalter/in möchte ich Datensätze als plausibel markieren und freigeben können, damit sie als übermittelte Daten intern weiterverarbeitet werden.
- Als Stadtverwalter/in möchte ich vor der Freigabe einer späteren Einreichung die aktuelle Freigabe in einem neuen Fenster öffnen und den Vorgang abbrechen können, damit ich keine Freigabe unbeabsichtigt ersetze.
- Als Stadtverwalter/in möchte ich unplausible oder automatisch abgelehnte Datensätze als abgelehnt markieren können, damit sie nicht weiterverwendet werden und dennoch nachvollziehbar bleiben.
- Als Stadtverwalter/in möchte ich eine einzelne Einreichung gezielt löschen können, ohne andere Einreichungen derselben Gebäude-ID zu entfernen.
- Als Stadtverwalter/in möchte ich alle Einreichungen einer Gebäude-ID gebündelt löschen können, wenn sie ausnahmslos abgelehnt wurden, damit nicht versehentlich noch relevante Einreichungen entfernt werden.
- Als Stadtverwalter/in möchte ich Energieeffizienzklassen, Gebäudetypen und Heizarten pflegen, damit Eingaben konsistent bleiben.
- Als Stadtverwalter/in möchte ich angebundene Datenquellen pflegen und aktualisieren können, damit Berechnungen und Nutzereingaben stets auf einer konsistenten und aktuellen Datengrundlage basieren.

<a id="interaktions-und-screenkonzept"></a>

## Interaktions- und Screenkonzept

Dieses Kapitel beschreibt die visuelle und funktionale Ausgestaltung des Digitaler Energie Zwilling anhand zentraler Anwendungsscreens.  
Die Darstellungen entsprechen High-Fidelity-Mockups und bilden die angestrebte Zielinteraktion ab.

> ⚠️ **Hinweis zum Bearbeitungsstand:**\
> Die folgenden Darstellungen zeigen konzeptionelle High-Fidelity-Mockups im aktuellen Arbeitsstand der Konzeptphase.
> Sie dienen der Visualisierung von Struktur, Interaktionslogik und Designrichtung und stellen **keine finale Designfreigabe** dar.
> Layout, Inhalte, visuelle Ausgestaltung sowie funktionale Details können sich im weiteren Projektverlauf (insbesondere nach Reviews, Tests und fachlicher Abstimmung) noch verändern.

---

<a id="1-startseite-einstieg"></a>

### 1 Startseite / Einstieg

![0_Startseite.png](./attachments/0_Startseite.png)
_Startseite_

**Ziel:** Niederschwelliger Einstieg in das Tool und Aktivierung des
Nutzers.

#### Beschreibung

Die Startseite vermittelt klar den Nutzen des Tools:\
Berechnung der energetischen Gebäudesanierung auf Basis städtischer
Daten.

**Zentrale Elemente:**

- Prägnante Leitfrage („Wie effizient ist Ihr Gebäude...?")
- Kurze Nutzenargumentation (kostenlos, unverbindlich, datengestützt)
- Primärer Call-to-Action („Jetzt starten")
- Transparenzhinweis zur Modellhaftigkeit der Berechnungen
- Visuelle Verankerung durch 3D-Stadtmodell

**UX-Prinzip:**

- Reduktion auf einen klaren Einstiegspunkt
- Vertrauensbildung durch institutionellen Kontext (Stadt Regensburg)
- Erwartungsmanagement über Hinweisbox

---

<a id="2-gebaeudewahl-energetische-ersteinschaetzung"></a>

### 2 Gebäudewahl & Energetische Ersteinschätzung

![1_Ersteinschätzung.png](./attachments/1_Ersteinschätzung.png)
_Energetische Erstauswertung nach Gebäudeauswahl über 3D Gebäude oder Suchfeld_

**Ziel:** Automatische Ableitung eines energetischen Ausgangszustands.

#### Beschreibung

Nach Auswahl eines Gebäudes auf der Karte wird eine energetische
Ersteinschätzung angezeigt.\
Die Werte basieren auf LoD2-Daten, Typologien und Modellannahmen.\

**Angezeigt werden:**

- Heizwärmebedarf / Energiebedarf (kWh/m²a)
- Endenergiebedarf
- Primärenergiebedarf
- Energieeffizienzklasse
- CO₂-Emissionen
- Brennstoffverbrauch und Energiekosten
- Vergleich mit städtischem Durchschnitt
- Einsparpotenzial (Benchmark-basierte Abschätzung)

**UX-Prinzip:**

- Sofortiges Feedback nach Gebäudeauswahl
- Transparente Kennzeichnung als modellbasierte Ableitung
- Vergleich mit Gebäudebestand zur Einordnung

---

<a id="3-allgemeine-daten-pruefen-anpassen"></a>

### 3 Allgemeine Daten prüfen & anpassen

![2_Datenanpassung.png](./attachments/2_Datenanpassung.png)
_Gebäudedaten (Exemplarische Darstellung des Eingabebereichs)_

**Ziel:** Validierung und Individualisierung der automatisch
abgeleiteten Gebäudedaten.

#### Beschreibung

In diesem Schritt können Nutzer systemseitig abgeleitete Parameter
prüfen und korrigieren.

**Beispielhafte Eingaben:**

- Baualtersklasse
- Wohnfläche
- Anzahl der Geschosse
- Personen im Haushalt
- Gebäudetyp (freistehend / angrenzend)

**Live-Feedback:**

- Energiebedarf
- Energieeffizienzklasse
- Kosten
- CO₂-Emissionen

**UX-Prinzip:**

- Transparente Herkunft der Daten („vom System abgeleitet")
- Klare Trennung zwischen abgeleiteten und manuell veränderbaren
  Werten
- Sofortige Aktualisierung der Kennzahlen

---

<a id="4-auswahl-von-sanierungsmassnahmen"></a>

### 4 Auswahl von Sanierungsmaßnahmen

![3_Sanierungsmaßnahmen.png](./attachments/3_Sanierungsmaßnahmen.png)
_Sanierungsmaßnahmen_

**Ziel:** Berechnung verschiedener Sanierungsszenarien.

#### Beschreibung

Nutzer können Maßnahmen an Gebäudehülle und Heizsystem auswählen.

**Bereiche:**

- Dämmung (Dach, Fassade, Kellerdecke, Fenster)
- Heizsysteme (Wärmepumpe etc.)
- Zusatztechnik (PV; Solarthermie derzeit nicht im vorgesehenen Rechenweg)
- Anzeige von:
  - Sparpotenzial
  - Investitionskosten
  - Förderungen
  - Eigenanteil
- Budgetbasierte Sanierungsvorschläge

**Interaktionslogik:**

- Mehrfachauswahl möglich
- Live-Aktualisierung der energetischen Kennwerte
- Kennzeichnung empfohlener Maßnahmen

**UX-Prinzip:**

- Vergleichbarkeit durch tabellarische Darstellung
- Klare wirtschaftliche Transparenz
- Entscheidungsunterstützung durch Empfehlungen

---

<a id="5-ergebnisse-entscheidungsuebersicht"></a>

### 5 Ergebnisse & Entscheidungsübersicht

![4_Ergebnis.png](./attachments/4_Ergebnis.png)
_Ergebnis_

**Ziel:** Ganzheitliche Bewertung der gewählten Sanierungsstrategie mit detailiertem Vergleich IST- und SOLL-Zustand.

#### Beschreibung

Die Ergebnisseite aggregiert alle relevanten Kennzahlen:

- Neuer Energiebedarf
- Neue Effizienzklasse
- Jährliche Kosten
- CO₂-Emissionen
- Vergleich mit Gebäudebestand
- Energieklassenbalken
- Delta-Darstellungen für relevante Vorher-/Nachher-Werte

Weitergehende quantitative Diagramme, insbesondere zusätzliche Histogramme oder Chart-Typen, sind im abgenommenen Konzept und in der aktuellen Planung nicht vorgesehen.

**UX-Prinzip:**

- Fokus auf Entscheidungsfähigkeit
- Visuelle Einordnung über Energieklassenbalken und Delta-Darstellungen
- Transparenz von Wirkung, Kosten und Emission

## UX-Leitprinzipien des Systems

Das Interface folgt folgenden Grundprinzipien:

1.  **Datenreduktion durch Vorbefüllung (LoD2, Typologien)**
2.  **Transparenz über Modellannahmen**
3.  **Live-Aktualisierung zentraler Kennwerte**
4.  **Vergleichbarkeit von Maßnahmen**
5.  **Entscheidungsunterstützung durch Energieklassenbalken und Delta-Darstellungen**
6.  **Niederschwelliger Zugang ohne Fachkenntnisse**

