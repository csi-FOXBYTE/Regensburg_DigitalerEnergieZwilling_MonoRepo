# Nachweis der Rechenmethoden

Stand: 02.09.2026

Rechenkernstand: v0.19.0

Status: für den implementierten Rechenumfang technisch nachvollzogen

## 1. Zweck und Geltungsbereich

Dieser Nachweis beschreibt die im EnergyCalculationCore v0.19.0 tatsächlich
ausgeführten Rechenschritte und die dafür verwendeten, extern validierbaren
Quellen. Er gilt für die `DEFAULT_CONFIG` und die in der
[Testdokumentation](18-energy-calculation-test-documentation.md) geprüften
Berechnungspfade.

Die Quellenliste enthält ausschließlich Belege, deren Werte oder
Tabellenzeilen im Rechenkern verwendet werden. Konfigurierbare
Projektfestlegungen sind davon getrennt ausgewiesen und werden nicht als
externe Quellen dargestellt.

Vor einer Aktualisierung dieses Dokuments müssen Core-Paket, Backend,
Bürger-Frontend, Admin-Frontend, Lockfiles und Testdokumentation dieselbe
Core-Version referenzieren. Bei einer Abweichung ist die Aktualisierung zu
blockieren. Als Sollstand wird vor den lokalen Vergleichen der höchste stabile
semantische Core-Tag aus GitHub einschließlich seines `package.json` gelesen und
verifiziert. Schlägt dieser Abruf fehl, bleibt die Aktualisierung ebenfalls
blockiert. Die Prüfung verändert weder Abhängigkeiten noch Git-Repositories.

## 2. Implementierte Rechenkette

Die folgenden Formeln bezeichnen die tatsächlich ausgeführten Operationen.
Die verlinkten Implementierungen sind auf den Tag `v0.19.0` festgelegt.

| Rechenschritt | Implementierte Methode | Implementierung |
|---|---|---|
| Geometrie und Bezugsflächen | Beheiztes Bruttovolumen = Grundfläche × beheizte Geschosshöhe; beheiztes Luftvolumen und Nutz-/Nettogrundfläche werden daraus mit konfigurierten Faktoren abgeleitet. | [`buildingGeometry.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/buildingGeometry.ts) |
| U-Wert eines nachträglich gedämmten opaken Bauteils | `R0 = 1 / U0`, `RDämmung = d / λ`, `U = 1 / (R0 + RDämmung)`. Ein explizit eingegebener U-Wert hat Vorrang. | [`roofUValue.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/roof/roofUValue.ts), analog für Außenwand, oberste Geschossdecke und unteren Abschluss |
| Transmissionswärmeverlust | Je Hüllfläche `H = A × U × F`; anschließend Summe aus Dach beziehungsweise oberster Geschossdecke, Dachfenstern, Außenwand, Außenfenstern und unterem Abschluss. | [`heatingDemand.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/heatingDemand.ts) und bauteilspezifische `*HeatLoss.ts`-Resolver |
| Lüftungswärmeverlust | `HV = 0,34 × beheiztes Luftvolumen × 0,79`. | [`ventilationHeatLoss.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/ventilationHeatLoss.ts) |
| Raumwärmebedarf | `QH = (HT + HV) × 3.279 × 0,024`. | [`heatingDemand.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/heatingDemand.ts) |
| Warmwasser und Anlagenaufwand | `QWW = Nettogrundfläche × 9,84`; kombinierter Anlagenfaktor = Erzeugeraufwandszahl × Regelungsfaktor; thermische Ausgangsbasis = `QH × Anlagenfaktor + QWW`. | [`heatingSystem.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/heatingSystem.ts), [`heatingDemand.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/heatingDemand.ts) |
| Interne Gewinne und Aufteilung | Die thermische Ausgangsbasis wird abhängig von Gebäude- und Anlagentyp mit einem konfigurierten Faktor multipliziert und anschließend anhand des elektrischen Anteils in thermischen und elektrischen Bedarf geteilt. | [`internalGains.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/internalGains.ts), [`energyDemandSplit.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/energyDemandSplit.ts) |
| Primärenergie | Je Energieträger `Qp = QEndenergie × fp`; thermischer und elektrischer Anteil werden addiert. | [`thermalEnergy.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/thermalEnergy.ts), [`electricalEnergy.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/electricalEnergy.ts) |
| Treibhausgasemissionen | Je Energieträger `mCO2 = QEndenergie × CO2-Faktor × 10^-6` in Tonnen; thermischer und elektrischer Anteil werden addiert. | [`thermalEnergy.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/thermalEnergy.ts), [`electricalEnergy.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/electricalEnergy.ts) |
| Verbrauch und laufende Energiekosten | Brennstoffmenge = thermischer Endenergiebedarf / Energie je Einheit; laufende Kosten = Menge × Arbeitspreis + Grundpreis. Nutzerwerte haben nach den dokumentierten Vorrangregeln Vorrang. | [`thermalEnergy.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/thermalEnergy.ts) |
| Energieeffizienzklasse | Gesamt-Endenergiebedarf / Gebäudenutzfläche; Zuordnung zu A+ bis H anhand der konfigurierten Grenzwerte. | [`totals.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/calculators/energy/resolvers/totals.ts) |
| Empfehlungen für Hüllbauteile | Das Bau- beziehungsweise Sanierungsjahr wird mit dem bauteilspezifischen `recommendYearRange` verglichen. Bei Dach, oberster Geschossdecke, unterem Abschluss und Außenwand unterdrückt eine bereits vorhandene Dämmung die Empfehlung. | [`default-config.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/types/config/default-config.ts), [`generate.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/types/renovation/generate.ts) |

Die zugehörigen Katalogwerte und Schwellen stehen in
[`default-config.ts`](https://github.com/csi-FOXBYTE/Regensburg_DigitalerEnergieZwilling_EnergyCalculationCore/blob/v0.19.0/src/types/config/default-config.ts).

## 3. Verwendete und validierte externe Quellen

| Quelle und Ausgabe | Fundstelle | Tatsächlich verwendeter Inhalt |
|---|---|---|
| [Bekanntmachung der Regeln zur Datenaufnahme und Datenverwendung im Wohngebäudebestand vom 8. Oktober 2020, BAnz AT 04.12.2020 B1](https://bundesanzeiger.de/pub/publication/qzQUGd8A3unSCCbVMcf/content/qzQUGd8A3unSCCbVMcf/BAnz%20AT%2004.12.2020%20B1.pdf?inline=) | PDF-S. 5-6, Tabelle 2; PDF-S. 7, Tabelle 3 und Nummer 3.3 mit Formel zur Korrektur nachträglich gedämmter Bauteile; PDF-S. 11-13, Nummer 4.2, Tabelle 5, insbesondere Zeilen 10.1 bis 26 auf PDF-S. 12-13 | Baualters- und konstruktionsabhängige U-Werte opaker Bauteile und Fenster; Widerstandsaddition `1/U0 + d/λ`; Erzeugeraufwandszahlen für Standard-, Niedertemperatur- und Brennwertkessel, Fern-/Nahwärme, Luft- und Erdreichwärmepumpen sowie Einzel- und Direktheizgeräte. |
| [Gebäudeenergiegesetz, Anlage 4 zu § 22 Absatz 1](https://www.gesetze-im-internet.de/geg/anlage_4.html) | Tabelle „Primärenergiefaktoren“, Nummern 1, 2, 6, 8, 9, 10 und 12 | Primärenergiefaktoren für Heizöl und Erdgas `1,1`, Biogas `1,1`, Holz `0,2`, Netzstrom `1,8` sowie gebäudenah erzeugten Strom und Umweltwärme `0,0`. |
| [BAFA, Informationsblatt CO2-Faktoren 2022](https://www.bafa.de/SharedDocs/Downloads/DE/Energie/eew_infoblatt_co2_faktoren_2022.pdf?__blob=publicationFile&v=5) | PDF-S. 7, Tabelle 2, Zeilen Pellets, Strom beim Energieträgerwechsel, Strom aus erneuerbarer Quelle, Biogas, Erdgas, Heizöl schwer und Nah-/Fernwärme | Im Core verwendete CO2-Faktoren `36`, `366`, `0`, `152`, `201`, `288` und `280` g CO2/kWh nach Umrechnung von t CO2/MWh. |
| [Gebäudeenergiegesetz, Anlage 10 zu § 86](https://www.gesetze-im-internet.de/geg/anlage_10.html) | Gesamte Tabelle, Zeilen A+ bis H | Im Core hinterlegte numerische Schwellen `30`, `50`, `75`, `100`, `130`, `160`, `200` und `250` kWh/(m²·a) für die Klassen A+ bis H. Die Abweichung an den exakten Grenzwerten ist unten dokumentiert. |
| [BEG EM - Technische Mindestanforderungen, Bekanntmachung vom 29. Dezember 2023](https://www.energiewechsel.de/KAENEF/Redaktion/DE/PDF-Anlagen/BEG/bundesfoerderung-fuer-effiziente-gebaeude-einzelmassnahmen-20231229.pdf?__blob=publicationFile&v=1) | PDF-S. 18-19, Tabelle in Nummer 1.1, Zeilen Außenwand, Fenster, Dachflächenfenster, Schräg-/Flachdach, oberste Geschossdecke, Decken gegen unbeheizte Räume/Kellerdecken und Bodenflächen gegen Erdreich | Ziel-U-Werte der Sanierungsempfehlungen: Außenwand `0,20`, Fenster `0,95`, Dachflächenfenster `1,0`, Dach und oberste Geschossdecke `0,14`, unterer Abschluss `0,25` W/(m²·K). |

## 4. Bestätigte und konfigurierbare Projektfestlegungen

### 4.1 Bauteilbezogene Empfehlungsgrenzen

Die folgenden sechs Grenzjahre wurden vom Energieberater vorgeschlagen und im
vom Kunden abgenommenen Rechenkonzept bestätigt. Fachliche Referenz ist die
[Arbeitsmappe zum Rechenkonzept](../attachments/20260320_RDEZ_Uebersicht_Berechnung_Grobkonzept.xlsx),
insbesondere die bauteilbezogenen Domänenblätter. Die technische Umsetzung
erfolgt über `recommendYearRange` in der `DEFAULT_CONFIG`:

| Bauteil | Empfehlung bei Bau-/Sanierungsjahr bis einschließlich | Zusätzliche Bedingung |
|---|---:|---|
| Unterer Gebäudeabschluss | 1986 | keine bereits vorhandene Dämmung |
| Dach | 2006 | keine bereits vorhandene Dämmung |
| Oberste Geschossdecke | 1986 | keine bereits vorhandene Dämmung |
| Außenwand | 1978 | keine bereits vorhandene Dämmung |
| Außenfenster | 1994 | keine zusätzliche Dämmungsbedingung |
| Dachflächenfenster | 1994 | keine zusätzliche Dämmungsbedingung |

Die Grenzjahre sind projektbezogene Empfehlungsregeln und keine in Jahren
angegebenen rechnerischen Nutzungsdauern. Sie werden insbesondere nicht als
Zahlenwerte aus VDI 2067 ausgewiesen. VDI 2067 Blatt 1 behandelt insoweit
Anlagentechnik; [VDI 2067 Blatt 50](https://www.vdi.de/mitgliedschaft/vdi-richtlinien/details/vdi-2067-blatt-50-wirtschaftlichkeit-von-bauteilen)
erweitert die Wirtschaftlichkeitsbetrachtung zwar auf Hochbauteile und enthält
laut [offiziellem Inhaltsverzeichnis](https://www.vdi.de/fileadmin/pages/vdi_de/redakteure/richtlinien/inhaltsverzeichnisse/2852500.pdf)
Anwendungsbeispiele zur Bestimmung der Nutzungsdauer, belegt aber nicht die sechs
im Core verwendeten Grenzjahre.

### 4.2 Weitere Projektfestlegungen

Die folgenden im Rechenkern verwendeten Werte sind fachlich abgestimmte,
änderbare Projektparameter. Für sie wird in diesem Nachweis keine externe
Quelle behauptet:

- Geometrie-, Flächen- und Fensteranteilsfaktoren,
- Heizgradtage `3.279`, Lüftungsfaktor `0,79`, Warmwasserfaktor `9,84` und
  Haushaltsstromfaktor `23`,
- Regelungs- und interne Gewinnfaktoren sowie der Aufwandsfaktor des
  Gas-Wärmepumpen-Hybrids,
- Heizwerte, Arbeitspreise und Grundpreise der Energieträger; die
  Referenzarbeitsmappe bezeichnet den gesamten Datenblock als „gemäß
  GEG/EnEV“, nennt aber keine konkrete Fundstelle. Insbesondere die Preiswerte
  lassen sich in den amtlichen GEG-/EnEV-Texten nicht als Festwerte validieren,
- Primärenergiefaktor `1,0` für den allgemeinen Fernwärme-Default,
- CO2-Faktor `30 g/kWh` für den Stückholz-Default.

Nutzer- oder kommunenspezifisch konfigurierte Werte ersetzen die Defaults
nach den im Core implementierten Vorrangregeln. Die im Konfigurationsobjekt
vorhandenen Platzhalter für `source` und `date` sind keine Quellennachweise.

## 5. Technische Verifikation und Abgrenzung

Die absoluten Referenzfälle und die Eingabevorrangregeln sind in der
[Testdokumentation](18-energy-calculation-test-documentation.md) beschrieben.
Für v0.19.0 bestanden am 01.09.2026 alle 21 Varianten des gezielten
Golden-Master-Tests. In der vollständigen Suite bestanden 205 von 206 Tests;
der einzige Fehlschlag betrifft ausschließlich die fehlende Berechtigung zum
Anlegen eines symbolischen Links im Windows-Temp-Verzeichnis.

Der dokumentierte Kostenpfad berechnet ausschließlich laufende
Energieträgerkosten. Investitionskosten von Sanierungsmaßnahmen und daraus
abgeleitete Amortisationswerte sind nicht Bestandteil des implementierten und
hier belegten Rechenumfangs, solange der benötigte Kostendatenzugang und das
darauf aufbauende Berechnungsmodell fehlen.

Die amtliche Klassentabelle verwendet jeweils eine einschließlich formulierte
Obergrenze. Der Range-Resolver von v0.19.0 wechselt dagegen bei exakter
Gleichheit mit `30`, `50`, `75`, `100`, `130`, `160`, `200` oder `250` bereits
in die folgende Klasse. Die Schwellenwerte stammen damit aus Anlage 10; diese
Randwertsemantik bleibt als bekannte Modellabweichung sichtbar und wird nicht
durch den Quellennachweis verdeckt.

Die Referenzarbeitsmappe ordnet sowohl `288 g CO2/kWh` für Heizöl schwer als
auch `30 g CO2/kWh` für Biomasse Holz dem BAFA-Informationsblatt zu. Der
BAFA-Wert für Heizöl schwer beträgt tatsächlich `0,288 t CO2/MWh` und stimmt
nach Einheitenumrechnung exakt mit dem Core überein. Für Biomasse Holz nennt das
Informationsblatt dagegen `0,027 t CO2/MWh`, also `27 g CO2/kWh`. Die im Core
verwendeten `30 g CO2/kWh` sind deshalb keine exakte Übernahme des belegten
BAFA-Werts; mangels dokumentierter Rundungsregel bleibt dieser Wert als
Projektfestlegung ausgewiesen.
