# Testdokumentation der energetischen Berechnung

Stand: 01.09.2026
Status: technische Prüfung abgeschlossen; fachliche Bewertung durch den Energieberater ausstehend

## 1. Ziel

Dieses Dokument fasst die Berechnung der beiden Gebäudepaare 1 → 2 und 3 → 4 zusammen. Für jedes Paar werden vier Zustände gegenübergestellt:

1. Bestand
2. nur Sanierung der Gebäudehülle
3. nur Austausch der Heizung einschließlich Umstellung auf Flächenheizung
4. Vollsanierung aus Hülle und Heizung

Die Tabellen sollen dem Energieberater ermöglichen, sich auf fachlich relevante Modellunterschiede zu konzentrieren. Eine einfache Kontrolle der Excel-Formeln oder eine erneute manuelle Übertragung sämtlicher Werte ist nicht vorgesehen.

Ergänzend werden die Vorrangregeln, Berechnungspfade und absoluten Größenänderungen direkt im Code geprüft. Dadurch wird intern abgesichert, dass Nutzerangaben, LOD2-/Anreicherungsdaten und konfigurierte Vorgaben in der vorgesehenen Reihenfolge übernommen werden und dass typische Gebäudevarianten den richtigen Pfad im Core auslösen.

Ein zusätzlicher Vergleich realer LOD2-Gebäude mit dem professionellen Rechentool ist nicht Bestandteil dieses Testplans. Die LOD2- und Anreicherungsdaten werden vom Kunden bereitgestellt und nicht fachlich plausibilisiert. Die Vorgaben und Defaults sind mit Kunde und Energieberater abgestimmt; intern geprüft werden daher Übertragung, Pfadauswahl und stabile Ergebnisänderungen.

## 2. Berechnungsbasis und Abgrenzung

Die Berechnungen wurden direkt mit dem im Bürger-Frontend installierten EnergyCalculationCore in Version 0.19.0 und dessen `DEFAULT_CONFIG` ausgeführt.

Die `DEFAULT_CONFIG` wird aktuell in der Testumgebung verwendet. Die nachfolgenden Ergebnisse sind damit die verbindlichen Sollwerte für die Gegenprüfung in dieser Umgebung.

Nicht Gegenstand der Prüfung sind komplexe Mischnutzungen, gemischte Heizanlagen, weitergehende Lüftungsmodelle und Kostenergebnisse. Diese Aspekte gehen über den vorgesehenen Funktionsumfang des leicht bedienbaren Grobmodells hinaus; Kostendaten sind derzeit nicht verfügbar.

Für den Vergleich mit den professionellen Rechenergebnissen werden folgende Größen verwendet:

- **Endenergie\***: `annualHeatingEnergyDemand`, also der Energiebedarf für Heizung und Warmwasser ohne Haushaltsstrom.
- **Primärenergie\***: Primärenergie ohne den Anteil des Haushaltsstroms.
- **THG\***: Treibhausgasemissionen ohne den Anteil des Haushaltsstroms.
- **UI gesamt**: `annualTotalEnergyDemand` einschließlich des vom Core angesetzten Haushaltsstroms.

Die mit einem Stern gekennzeichneten Werte sind daher für die Gegenüberstellung mit den Tabellen des Energieberaters vorgesehen. Die Spalte „UI gesamt“ zeigt ergänzend den im Produktkontext verwendeten Gesamtwert.

## 3. Eingabekonfigurationen

### 3.1 Gebäudepaar 1 → 2: Einfamilienhaus

Unveränderte Geometrie und Gebäudemerkmale:

- Baujahr: 1968
- Grundfläche: 77 m²
- Geschosse: 2
- Gebäudehöhe aus der Vorlage: 5,9 m
- Außenwandfläche: 212 m²
- Fensterfläche: 42,4 m²
- unbeheizter Dachraum
- vorhandener, unbeheizter Keller

Sanierung der Gebäudehülle:

| Bauteil | Bestand | Saniert | Einheit |
|---|---:|---:|---|
| Oberste Geschossdecke | 0,7 | 0,2 | W/(m²K) |
| Außenwand | 1,4 | 0,2 | W/(m²K) |
| Fenster | 2,7 | 1,5 | W/(m²K) |
| Kellerdecke | 1,0 | 0,5 | W/(m²K) |

Heizungsänderung:

| Zustand | Energieträger und Wärmeerzeuger | Baujahr | Wärmeübergabe |
|---|---|---:|---|
| Bestand | Erdgas, Brennwertkessel 70/55 °C | 1998 | freie Heizflächen/Heizkörper |
| Saniert | Luft-Wasser-Wärmepumpe unter 40 °C | 2010 | Flächenheizung |

### 3.2 Gebäudepaar 3 → 4: Mehrfamilienhaus

Unveränderte Geometrie und Gebäudemerkmale:

- Baujahr: 1968
- Grundfläche: 97 m²
- Geschosse: 3
- Gebäudehöhe aus der Vorlage: 8,9 m
- Außenwandfläche: 350,66 m²
- Fensterfläche: 70,132 m²
- unbeheizter Dachraum
- vorhandener, unbeheizter Keller

Sanierung der Gebäudehülle:

| Bauteil | Bestand | Saniert | Einheit |
|---|---:|---:|---|
| Oberste Geschossdecke | 0,7 | 0,2 | W/(m²K) |
| Außenwand | 1,4 | 0,2 | W/(m²K) |
| Fenster | 3,0 | 1,5 | W/(m²K) |
| Kellerdecke | 1,0 | 0,5 | W/(m²K) |

Heizungsänderung:

| Zustand | Energieträger und Wärmeerzeuger | Baujahr | Wärmeübergabe |
|---|---|---:|---|
| Bestand | Heizöl, Standardkessel 70/55 °C | 1998 | freie Heizflächen/Heizkörper |
| Saniert | Sole-Wasser-Wärmepumpe unter 40 °C | 2010 | Flächenheizung |

## 4. Ergebnisse der vier Varianten

### 4.1 Gebäudepaar 1 → 2

| Variante | Endenergie\* kWh/a | Einsparung | Primärenergie\* kWh/a | Einsparung | THG\* kg/a | Einsparung | UI gesamt kWh/a | Effizienzklasse |
|---|---:|---:|---:|---:|---:|---:|---:|:---:|
| Bestand | 52.504 | – | 57.754 | – | 10.553 | – | 55.466 | H |
| Nur Hülle | 22.840 | 56,5 % | 25.125 | 56,5 % | 4.591 | 56,5 % | 25.803 | F |
| Nur Heizung | 12.518 | 76,2 % | 22.532 | 61,0 % | 4.581 | 56,6 % | 15.480 | D |
| Vollsanierung | 5.748 | 89,1 % | 10.346 | 82,1 % | 2.104 | 80,1 % | 8.710 | B |

### 4.2 Gebäudepaar 3 → 4

| Variante | Endenergie\* kWh/a | Einsparung | Primärenergie\* kWh/a | Einsparung | THG\* kg/a | Einsparung | UI gesamt kWh/a | Effizienzklasse |
|---|---:|---:|---:|---:|---:|---:|---:|:---:|
| Bestand | 100.000 | – | 110.000 | – | 28.800 | – | 105.663 | H |
| Nur Hülle | 44.558 | 55,4 % | 49.014 | 55,4 % | 12.833 | 55,4 % | 50.221 | F |
| Nur Heizung | 11.800 | 88,2 % | 21.240 | 80,7 % | 4.319 | 85,0 % | 17.463 | B |
| Vollsanierung | 5.784 | 94,2 % | 10.411 | 90,5 % | 2.117 | 92,6 % | 11.447 | A |

## 5. Vergleich mit den professionellen Referenzwerten

In jeder Tabellenzelle stehen nacheinander Core-Wert, professioneller Referenzwert und relative Abweichung des Cores.

| Testgebäude | Endenergie kWh/a | Primärenergie kWh/a | THG kg/a |
|---|---:|---:|---:|
| 1 – EFH Bestand | 52.504 / 58.115 / −9,7 % | 57.754 / 58.572 / −1,4 % | 10.553 / 12.982 / −18,7 % |
| 2 – EFH saniert | 5.748 / 7.080 / −18,8 % | 10.346 / 12.745 / −18,8 % | 2.104 / 3.965 / −46,9 % |
| 3 – MFH Bestand | 100.000 / 93.337 / +7,1 % | 110.000 / 94.103 / +16,9 % | 28.800 / 20.864 / +38,0 % |
| 4 – MFH saniert | 5.784 / 8.378 / −31,0 % | 10.411 / 15.080 / −31,0 % | 2.117 / 4.692 / −54,9 % |

### 5.1 Relative Wirkung der Vollsanierung

| Gebäudepaar | Kennzahl | Einsparung Core | Einsparung Rechentool | Differenz |
|---|---|---:|---:|---:|
| 1 → 2 | Endenergie | 89,1 % | 87,8 % | +1,2 Prozentpunkte |
| 1 → 2 | Primärenergie | 82,1 % | 78,2 % | +3,8 Prozentpunkte |
| 1 → 2 | THG | 80,1 % | 69,5 % | +10,6 Prozentpunkte |
| 3 → 4 | Endenergie | 94,2 % | 91,0 % | +3,2 Prozentpunkte |
| 3 → 4 | Primärenergie | 90,5 % | 84,0 % | +6,6 Prozentpunkte |
| 3 → 4 | THG | 92,6 % | 77,5 % | +15,1 Prozentpunkte |

## 6. Interne Prüfung von Vorrangregeln, Berechnungspfaden und absoluten Größenänderungen

### 6.1 Prüfumfang und Ergebnis

Die Pfadauswahl wurde direkt auf Codeebene geprüft. Damit wird nicht erneut beurteilt, ob die vom Kunden und Energieberater vorgegebenen Defaults fachlich richtig sind, sondern ob die vorgesehenen Eingaben tatsächlich Vorrang erhalten und der Core abhängig von der Gebäudekonfiguration den richtigen Rechenweg verwendet.

Die Vorrangregeln im Frontend wurden mit folgenden Fällen geprüft; alle Fälle waren erfolgreich:

| Prüffall | Erwartetes und bestätigtes Verhalten |
|---|---|
| Nutzerangabe, LOD2-Wert und Default vorhanden | Nutzerangabe hat Vorrang vor LOD2-Wert und Default. |
| Keine Nutzerangabe, LOD2-Wert vorhanden | LOD2-Wert hat Vorrang vor dem Default. |
| Nutzerangabe ist `undefined` | Der vorhandene LOD2-Wert bleibt wirksam. |
| Explizite nullable Nutzerangabe ist `null` | `null` überschreibt den LOD2-Wert, sofern das Feld `null` zulässt. |
| Explizite Nutzerangabe ist `false` | `false` wird nicht durch einen wahrheitswertbasierten Fallback ersetzt. |
| Zurücksetzen eines Eingabefeldes | Der LOD2-Wert wird wieder wirksam. |
| Wechsel zu einem neuen Gebäude ohne gespeicherte Sitzung | Eingaben des vorherigen Gebäudes werden nicht übernommen. |
| Wiederherstellen einer gespeicherten Sitzung | Gespeicherte Nutzerangaben haben Vorrang vor den aktuellen LOD2-Werten. |

Im Core wurden fünf automatisierte Testgruppen mit insgesamt 21 Varianten angelegt. Sie verwenden die in der Testumgebung eingesetzte `DEFAULT_CONFIG` und prüfen sowohl den gewählten Rechenpfad als auch feste absolute Ergebniswerte. Alle fünf Testgruppen sind erfolgreich.

### 6.2 Dachraum und obere thermische Grenze

Referenz ist ein Gebäude mit 77 m² Grundfläche und unbeheiztem Dachraum.

| Variante | Dachverlust W/K | Verlust oberste Geschossdecke W/K | Beheiztes Volumen m³ | Endenergie kWh/a | Änderung zur Referenz |
|---|---:|---:|---:|---:|---:|
| Flachdach, kein Dachraum | 61,6 | 0,0 | 438,90 | 53.193 | +1,3 % |
| Geneigtes Dach, Dachraum unbeheizt – Referenz | 0,0 | 53,9 | 438,90 | 52.504 | – |
| Geneigtes Dach, Dachraum beheizt | 61,6 | 0,0 | 666,05 | 56.951 | +8,5 % |

Bestätigt sind damit die alternative Verwendung von Dach oder oberster Geschossdecke sowie die Volumenerweiterung bei beheiztem Dachraum.

### 6.3 Keller und untere thermische Grenze

Referenz ist dasselbe Gebäude mit vorhandenem, unbeheiztem Keller.

| Variante | Verwendete Konstruktion | U-Wert W/(m²K) | Boden-/Deckenverlust W/K | Beheiztes Volumen m³ | Endenergie kWh/a | Änderung zur Referenz |
|---|---|---:|---:|---:|---:|---:|
| Kein Keller | Stahlbeton gegen Erdreich | 1,2 | 92,4 | 438,90 | 53.882 | +5,4 % |
| Keller vorhanden, unbeheizt – Referenz | Holzbalkendecke | 0,8 | 61,6 | 438,90 | 51.126 | – |
| Keller vorhanden und beheizt | Stahlbeton gegen Erdreich | 1,2 | 92,4 | 666,05 | 57.414 | +12,3 % |

Bestätigt sind die Auswahl zwischen erdberührtem Boden und Kellerdecke sowie die Volumenerweiterung bei beheiztem Keller.

### 6.4 Sanierungsstand der Bauteile

| Variante | Dach U | Oberste Geschossdecke U | Außenwand U | Fenster U | Unterer Abschluss U | Endenergie kWh/a | Änderung zum unsanierten Zustand |
|---|---:|---:|---:|---:|---:|---:|---:|
| Katalogwerte, unsaniert | 1,400 | 0,700 | 1,400 | 2,700 | 1,200 | 53.882 | – |
| Teilweise saniert, Ableitung aus Dämmung/Jahr | 0,206 | 0,152 | 0,232 | 1,500 | 0,228 | 21.124 | −60,8 % |
| Explizite U-Werte | 0,210 | 0,220 | 0,230 | 1,240 | 0,250 | 20.724 | −61,5 % |

Bestätigt sind die Pfade für unsanierte Katalogwerte, die Ableitung aus Sanierungsangaben und der Vorrang expliziter U-Werte. Die absoluten Sollwerte sichern zusätzlich ab, dass spätere Code- oder Konfigurationsänderungen nicht unbemerkt zu anderen Größenordnungen führen.

Damit der Dach-U-Wert nicht nur aufgelöst, sondern auch in einem aktiven thermischen Pfad geprüft wird, sind zusätzlich drei Varianten mit beheiztem Dachraum abgesichert:

| Variante mit beheiztem Dachraum | Dach-U-Wert W/(m²K) | Endenergie kWh/a |
|---|---:|---:|
| Unsanierter Katalogwert | 1,400 | 62.362 |
| Nur Dachdämmung, aus 16 cm Dämmstärke abgeleitet | 0,206 | 54.287 |
| Explizite U-Werte für die Bauteile | 0,210 | 25.021 |

### 6.5 Energieträger und Heizsystem

Die Gebäudehülle bleibt in diesen Varianten unverändert; geändert werden nur Energieträger und Heizsystem.

| Variante | Kombinierter Anlagenfaktor | Elektrischer Anteil | Endenergie kWh/a | Primärenergie Heizung kWh/a | Änderung Endenergie zu Gas |
|---|---:|---:|---:|---:|---:|
| Erdgas, Brennwertkessel | 1,13741 | 0 | 52.504 | 57.754 | – |
| Heizöl, Standardkessel | 1,41379 | 0 | 64.954 | 71.449 | +23,7 % |
| Fernwärme | 1,08426 | 0 | 50.110 | 50.110 | −4,6 % |
| Pellets, Standardkessel | 1,41379 | 0 | 64.954 | 12.991 | +23,7 % |
| Luft-Wasser-Wärmepumpe unter 40 °C, Flächenheizung | 0,39938 | 1 | 12.518 | 22.532 | −76,2 % |

Bestätigt sind die thermische Zuordnung bei Kessel- und Fernwärmesystemen, die elektrische Zuordnung bei der Wärmepumpe sowie die getrennte Wirkung von Anlagen-, Primärenergie- und Energieträgerfaktoren. Dass Heizöl und Pellets bei gleichem Anlagenfaktor dieselbe Endenergie, aber deutlich unterschiedliche Primärenergie ergeben, ist ein erwarteter und nun explizit abgesicherter Pfad.

### 6.6 Geschosszahl und Gebäudetyp

| Variante | Beheiztes Volumen m³ | Endenergie kWh/a | Änderung |
|---|---:|---:|---:|
| Aus Gebäudehöhe abgeleitete 2 Geschosse | 438,90 | 52.504 | Referenz |
| Explizit vorgegebene 3 Geschosse | 666,05 | 56.904 | +8,4 % |
| Wärmepumpe im EFH | 438,90 | 12.518 | Referenz |
| Wärmepumpe im MFH | 438,90 | 9.629 | −23,1 % |

Bestätigt sind der Vorrang einer expliziten Geschosszahl gegenüber der Ableitung sowie der gebäudetypabhängige Faktor für interne Gewinne.

### 6.7 Aussagekraft und verbleibender fachlicher Prüfbedarf

Die automatisierten Tests sichern die Auswahl der implementierten Berechnungspfade und deren derzeitige absolute Ergebnisse zuverlässig gegen Regressionen ab. Ein zusätzlicher Vergleich realer LOD2-Gebäude würde für diese Fragestellung keinen eigenständigen Mehrwert liefern: Er würde Datenqualität, Eingabeunterschiede und Modellabweichung vermischen, obwohl LOD2-Plausibilisierung und Default-Festlegung ausdrücklich nicht Prüfgegenstand sind.

Die Tests belegen nicht, dass die absoluten Ergebnisgrößen fachlich richtig oder die Abweichungen zum professionellen Rechentool akzeptabel sind. Genau hier liegt der verbleibende Mehrwert des Energieberaters: Systemgrenzen und Faktoren der vier vorhandenen professionellen Referenzfälle klären, auffällige Abweichungen einordnen und die Größenordnung ausgewählter Varianten fachlich bewerten. Die Entscheidung über akzeptable Toleranzen trifft primär der Kunde; der Energieberater gibt dazu eine fachliche Empfehlung.

### 6.8 Technisches Testergebnis

| Prüfung | Ergebnis |
|---|---|
| Gezielter Golden-Master-Test der Berechnungspfade | 5 von 5 Testgruppen bestanden; 21 Varianten geprüft |
| TypeScript-/Lint-Prüfung des Cores | bestanden |
| Vollständige Core-Testsuite | 205 von 206 Tests bestanden; der einzige Fehlschlag ist ein bestehender CLI-Infrastrukturtest, der unter Windows wegen fehlender Berechtigung keinen symbolischen Link im Temp-Verzeichnis anlegen konnte (`EPERM`) |

Der Fehlschlag der Gesamtsuite betrifft weder eine Berechnung noch den neuen Test. Die neue Testdatei selbst ist vollständig grün.

## 7. Fachliche Interpretation

### 7.1 Hülle und Heizung

In beiden Testfällen reduziert der reine Heizungstausch den Endenergiebedarf im Modell stärker als die reine Hüllensanierung. Für die Primärenergie- und THG-Wirkung ist zusätzlich entscheidend, welche Faktoren der jeweiligen Energieform zugeordnet sind.

Die Wirkung der Vollsanierung darf nicht als Summe der beiden Einzelersparnisse bewertet werden. Beide Maßnahmen wirken auf dieselbe Ausgangslast und sind über Warmwasserbedarf, interne Gewinne sowie Anlagen- und Regelungsfaktoren gekoppelt. Verglichen mit einer multiplikativ unabhängigen Kombination liegt der verbleibende Endenergiebedarf der Vollsanierung bei Gebäudepaar 1 → 2 etwa 5,5 % und bei Gebäudepaar 3 → 4 etwa 10,0 % höher.

### 7.2 Strombezogener CO₂-Faktor

Aus den professionellen Ergebnissen der vollständig mit Wärmepumpe versorgten Testgebäude 2 und 4 lässt sich näherungsweise ein Faktor von 560 g CO₂/kWh Strom ableiten. Die im Core verwendete Default-Konfiguration setzt 366 g CO₂/kWh an. Dieser Unterschied erklärt einen erheblichen Teil der besonders großen THG-Abweichungen der sanierten Gebäude.

### 7.3 Energieträger von Testgebäude 3

Die Eingaben der Vorlage beschreiben für Testgebäude 3 einen Öl-Standardkessel. Der professionelle Referenzwert entspricht bezogen auf den ausgewiesenen Endenergiebedarf jedoch nur rund 224 g CO₂/kWh und wirkt damit eher gasähnlich. Zu prüfen ist, ob im professionellen Rechentool tatsächlich Heizöl hinterlegt wurde oder ob Endenergie und THG aus unterschiedlichen Berechnungsständen stammen.

### 7.4 Gebäudevolumen

Die Excel-Herleitung verwendet für das beheizte Gebäudevolumen die Grundfläche multipliziert mit der angegebenen Gebäudehöhe:

- Testgebäude 1 und 2: 77 m² × 5,9 m = 454,3 m³
- Testgebäude 3 und 4: 97 m² × 8,9 m = 863,3 m³

Der Core berechnet das Volumen dagegen aus der Grundfläche, der Anzahl beheizter Geschosse sowie konfigurierten Standardwerten für Geschosshöhe und Deckendicke. Daraus ergeben sich 438,9 m³ beziehungsweise 839,05 m³. Diese Abweichung wirkt unter anderem auf Nutzfläche, Luftvolumen, Lüftungswärmeverlust, Warmwasser und Haushaltsstrom.

### 7.5 Systemgrenze Haushaltsstrom

Der Core weist den Haushaltsstrom separat aus, bezieht ihn aber in mehrere UI-Gesamtkennzahlen ein. Vor einer fachlichen Bewertung muss bestätigt werden, ob die professionellen Ist-Werte ausschließlich Heizung und Warmwasser oder zusätzlich Haushaltsstrom enthalten. Die vorliegenden Relationen sprechen dafür, dass der Haushaltsstrom nicht enthalten ist.

## 8. Konkrete Prüffragen an den Energieberater

| Nr. | Prüffrage | Zweck |
|---:|---|---|
| 1 | Enthalten die professionellen Werte für Endenergie, Primärenergie und THG ausschließlich Heizung und Warmwasser? | Vergleichbare Systemgrenzen bestätigen und den Haushaltsstrom korrekt abgrenzen. |
| 2 | Welche Primärenergie- und CO₂-Faktoren wurden für Erdgas, Heizöl und Netzstrom verwendet? | Erklären, welcher Anteil der Ergebnisabweichung aus abweichenden Faktoren statt aus der Rechenlogik stammt. |
| 3 | Ist in Testgebäude 3 tatsächlich Heizöl als Energieträger hinterlegt und stammen Endenergie und THG aus demselben Berechnungsstand? | Die auffällige gasähnliche THG-Relation des professionellen Referenzwerts klären. |
| 4 | Sind die relativen Einsparungen der Einzelmaßnahmen und der Vollsanierung in beiden Gebäudepaaren fachlich plausibel? | Die Wirkung von Hülle, Heizung und ihrer Kombination bewerten. |
| 5 | Sind die absoluten Größenänderungen der ausgewählten Dachraum-, Keller-, Sanierungs- und Energieträgervarianten fachlich plausibel? | Nicht den bereits getesteten Pfad, sondern die daraus resultierende Größenordnung fachlich beurteilen. |
| 6 | Welche fachliche Toleranz gegenüber dem professionellen Rechentool empfiehlt der Energieberater für das vereinfachte Grobmodell? | Eine begründete Empfehlung als Entscheidungsgrundlage für den Kunden erhalten. |

## 9. Interne Testartefakte und technische Fundstellen

- [Verwendete Rechenmethoden und validierte externe Quellen](19-calculation-method-evidence.md)

Excel-Arbeitsmappen:

- [Testgebäude 1](../attachments/26-03-06_Testgebäude%201.xlsx)
- [Testgebäude 2](../attachments/26-04-23_Testgebäude%202.xlsx)
- [Testgebäude 3](../attachments/26-04-23_Testgebäude%203.xlsx)
- [Testgebäude 4](../attachments/26-04-23_Testgebäude%204.xlsx)

Technische Fundstellen:

- Frontend-Version des Cores: `Regensburg_DigitalerEnergieZwilling_Frontend/package.json`
- Ergebnisfelder des Cores: `Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/src/calculate.ts`
- Default-Energie- und Emissionsfaktoren: `Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/src/types/config/default-config.ts`
- Herleitung des Gebäudevolumens: `Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/src/calculators/energy/resolvers/buildingGeometry.ts`
- Golden-Master-Test der Berechnungspfade und absoluten Größenänderungen: `Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/test/resolvers/calculationPathsAbsolute.test.ts`
