# LOD2-zu-Frontend-Eingabefeld-Mapping

## Inhaltsverzeichnis

1. [Ziel und Geltungsbereich](#ziel-und-geltungsbereich)
2. [Datenfluss und Priorität](#datenfluss-und-prioritaet)
3. [Zentrale Mapping-Übersicht](#zentrale-mapping-uebersicht)
4. [Indirekt abgeleitete Frontend-Werte](#indirekt-abgeleitete-frontend-werte)
5. [Geladene, aber nicht gemappte LOD2-Werte](#geladene-aber-nicht-gemappte-lod2-werte)
6. [Nicht aus LOD2 stammende Vorbelegungen](#nicht-aus-lod2-stammende-vorbelegungen)
7. [Implementierungsreferenzen und Pflege](#implementierungsreferenzen-und-pflege)

<a id="ziel-und-geltungsbereich"></a>

## Ziel und Geltungsbereich

Dieses Dokument ist die zentrale technische Übersicht für die Frage, welche
LOD2-Eingangsdaten auf welche im Frontend angezeigten oder intern verwendeten
Eingabefelder abgebildet werden. Es beschreibt den **implementierten Stand vom
28.07.2026** und unterscheidet zwischen:

- direkter Übernahme eines LOD2-Attributs,
- geometrischer Ableitung in der Offline-Anreicherung,
- weiterer Ableitung im Berechnungskern,
- Anzeige ohne Berechnungseingabe,
- gelesenen, aber derzeit nicht verwendeten Attributen.

Die Übersicht ist keine Beschreibung eines gewünschten Zielzustands. Insbesondere
werden Dachform, LOD2-Volumen und gesamte Hüllfläche aktuell nicht auf fachliche
Frontend-Eingabefelder gemappt.

Begriffe:

- **LOD2-Quelle**: CityGML/CityJSON-Gebäudeobjekt einschließlich Geometrie,
  Objektattributen und Adressobjekten.
- **Offline-Anreicherung**: Erzeugung der Kennwerte unter
  `attributes.digitalEnergyTwin`.
- **Frontend-Feld**: sichtbares Eingabefeld, sichtbare schreibgeschützte Anzeige
  oder intern an den Berechnungskern übergebener Wert.
- **Vorbelegung**: grauer beziehungsweise zurücksetzbarer Ausgangswert im
  Frontend; eine Nutzereingabe überschreibt diesen Wert.

<a id="datenfluss-und-prioritaet"></a>

## Datenfluss und Priorität

Der Datenfluss verläuft in dieser Reihenfolge:

1. CityGML-LOD2 wird nach CityJSON konvertiert.
2. Die Offline-Anreicherung berechnet Geometriekennwerte und schreibt sie nach
   `CityObject.attributes.digitalEnergyTwin`.
3. Die 3D-Tiles-Konvertierung stellt die Attribute als
   `Cesium3DTileFeature`-Properties bereit.
4. Das Frontend übernimmt die Properties in `$building` und bildet sie mit
   `$lod2Input` auf die Eingabestruktur des Berechnungskerns ab.
5. `$calculationInput` führt die Werte mit Defaults und Nutzereingaben zusammen.
6. Der Berechnungskern ergänzt katalog- und formelbasierte Werte. Das Frontend
   zeigt das Ergebnis als Vorbelegung der zugehörigen Eingabefelder.

Für Berechnungseingaben gilt folgende Priorität, von niedrig nach hoch:

1. technischer Platzhalter beziehungsweise Konfigurationsdefault,
2. LOD2- oder geometriebasierter Ausgangswert,
3. manuelle Nutzereingabe.

Beim Zurücksetzen eines bearbeitbaren Feldes wird wieder der berechnete
Ausgangswert verwendet. Adresse und Gebäude-ID dienen der Auswahl und Anzeige;
sie sind keine Eingaben des Berechnungskerns.

<a id="zentrale-mapping-uebersicht"></a>

## Zentrale Mapping-Übersicht

| LOD2-/CityJSON-Eingang | Transformation / 3D-Tiles-Property | Frontend-Ziel | Rechenkern-Ziel | UI-Status |
| --- | --- | --- | --- | --- |
| CityObject-ID aus `gml:id` | 3D-Tiles-Property `id` | `$building.id`, Auswahl und lokale Sitzungszuordnung | keines | Gebäudeauswahl, nicht editierbar |
| `attributes.function` | Präfixprüfung auf `31001_1000` | `isSelectableBuilding()` | keines | steuert nur, ob ein Gebäude auswählbar ist |
| `address[].ThoroughfareName` | `addresses.0.ThoroughfareName` | `building.properties.address.street` | keines | Adresssuche und Adressanzeige, nicht editierbar |
| `address[].Locality` | `addresses.0.Locality` | `building.properties.address.city` | keines | Adressanzeige, nicht editierbar |
| `GroundSurface`-Polygone | Summe der Flächen → `digitalEnergyTwin.groundArea` | intern `buildingBaseAreaField`; sichtbar `bottomFloorAreaField` („Fläche der untersten Geschossdecke“) | `general.buildingBaseArea`, `bottomFloor.area` | Grundfläche intern; Deckenfläche sichtbar und überschreibbar |
| `GroundSurface`-Polygone | `digitalEnergyTwin.upperFloorArea = digitalEnergyTwin.groundArea` | `topFloorAreaField` („Fläche der obersten Geschossdecke“) | `topFloor.area` | nur bei vorhandenem, unbeheiztem Dachraum sichtbar; überschreibbar |
| überwiegend vertikale `WallSurface`-Polygone | Summe der Flächen → `digitalEnergyTwin.grossExternalWallArea` | `outerWallAreaField` („Fläche der Außenwände“) | `outerWall.area` | sichtbar und überschreibbar |
| benachbarte `WallSurface`-Polygone | 3D-Schnittfläche → `digitalEnergyTwin.adjacentBuildings`; Frontend summiert `sharedWallArea` | `outerWallAdjacentWallAreaField` („angrenzende Wandfläche“) | `outerWall.adjacentWallArea` | sichtbar und überschreibbar; nur vorhanden, wenn der Adjazenzlauf aktiviert war |
| `RoofSurface`-Polygone | Summe der Flächen → `digitalEnergyTwin.roofArea` | `roofAreaField` („gesamte Dachfläche“) | `roof.area` | sichtbar und überschreibbar |
| minimale Höhe der `GroundSurface` und maximale Höhe der `RoofSurface` | Differenz → `digitalEnergyTwin.height`; Fallback auf `measuredHeight` | intern `buildingHeightField`; indirekt `numberOfStoriesField` | `general.buildingHeight`; Geschosszahl wird ohne Nutzerwert gerundet aus Höhe und konfigurierten Geschosshöhen berechnet | Gebäudehöhe selbst nicht sichtbar; Stockwerke sichtbar und überschreibbar |

### Adresssuche und Adressanzeige

Die Adressdaten haben zwei Laufzeitpfade:

- Für die Suche erzeugt die Offline-Anreicherung bei gesetztem
  `--address-output` aus `ThoroughfareName` sowie dem Mittelpunkt der
  Gebäudegrundfläche eine SQLite-Datenbank. Das Frontend nutzt Straße,
  Hausnummer und Koordinaten daraus, um zum Gebäude zu navigieren.
- Nach Auswahl eines Gebäudes liest das Frontend Straße und Ort
  direkt aus den 3D-Tiles-Properties `addresses.0.*` und zeigt sie im
  Gebäudefenster sowie oberhalb der Berechnungsschritte an.

Die kanonischen Adressattribute `address_full`, `street`, `house_number` und
`city` aus dem Mapping-Profil sind davon zu unterscheiden.
Der aktuelle Frontend-Adapter liest die oben genannten verschachtelten
`addresses.0.*`-Properties.

<a id="indirekt-abgeleitete-frontend-werte"></a>

## Indirekt abgeleitete Frontend-Werte

Einige sichtbare Vorbelegungen stammen nicht aus einem gleichnamigen LOD2-Feld,
werden aber aus LOD2-Geometrie und konfigurierten Faktoren berechnet:

| LOD2-Ausgangswerte | Regel im Berechnungskern | Frontend-Feld |
| --- | --- | --- |
| `digitalEnergyTwin.height` | `round(buildingHeight / (assumedInteriorStoryHeight + assumedFloorSlabThickness))`, sofern keine Nutzereingabe vorliegt | `numberOfStoriesField` („Stockwerke“) |
| `digitalEnergyTwin.groundArea` und abgeleitete Geschosszahl | Grundfläche × beheizte Geschosshöhe → Bruttovolumen → Nutz-/Nettogrundfläche über Konfigurationsfaktoren | `livingAreaField` („Wohnfläche“) |
| `digitalEnergyTwin.roofArea` | Dachfläche × `windows.roofAreaFactor`, sofern keine Nutzereingabe vorliegt | `roofWindowsAreaField` („Dachfensterfläche“) |
| `digitalEnergyTwin.grossExternalWallArea` und Summe angrenzender Wandflächen | `(outerWallArea - adjacentWallArea) × windows.exteriorWallAreaFactor`, sofern keine Nutzereingabe vorliegt | `exteriorWallWindowsAreaField` („Außenwandfensterfläche“) |

Wichtig: Das für Wohnfläche und Lüftungsvolumen verwendete Volumen wird im
Berechnungskern aus Grundfläche, Geschosszahl und Konfigurationswerten neu
ermittelt. `digitalEnergyTwin.volume` wird dafür derzeit nicht verwendet.

<a id="geladene-aber-nicht-gemappte-lod2-werte"></a>

## Geladene, aber nicht gemappte LOD2-Werte

| LOD2-/Anreicherungswert | Aktueller Stand | Auswirkung |
| --- | --- | --- |
| `digitalEnergyTwin.volume` | wird in `$building` geladen, aber nicht nach `$lod2Input` übernommen | keine UI- oder Rechenkernwirkung |
| `digitalEnergyTwin.envelopeArea` | wird in `$building` geladen, aber nicht nach `$lod2Input` übernommen | keine Anzeige als „Hüllfläche“ und keine direkte Rechenkernwirkung |
| `digitalEnergyTwin.roofPitchDegrees` | wird in `$building` geladen, aber nicht nach `$lod2Input` übernommen | keine Vorbelegung von Dachform oder Dachbauweise |
| LOD2-Attribut `roofType` | wird vom Frontend-Adapter nicht gelesen | keine Vorbelegung von `roofConstructionTypeField` |
| LOD2-Attribut `storeysAboveGround` | wird vom Frontend-Adapter nicht gelesen | keine direkte Vorbelegung der Geschosszahl; diese wird stattdessen aus der Höhe abgeleitet |
| Dachorientierung und einzelne Dachflächen | keine Übernahme in die Berechnungseingabe | derzeit nur Geometrie-/Darstellungskontext |

Damit gilt für das im Frontend als „Welche Bauweise hat Ihr Dach?“ beschriftete
`roofConstructionTypeField`: Der Wert stammt aktuell aus der
Berechnungskonfiguration oder aus einer manuellen Nutzereingabe. Es besteht
**kein implementiertes Mapping** von `roofType` oder `roofPitchDegrees` auf
dieses Feld.

<a id="nicht-aus-lod2-stammende-vorbelegungen"></a>

## Nicht aus LOD2 stammende Vorbelegungen

`digitalEnergyTwin.constructionYear` liegt technisch im selben
Anreicherungsblock wie die Geometriekennwerte, stammt aber nicht aus dem
LOD2-Datensatz. Es wird optional über den Mittelpunkt der Gebäudegrundfläche
aus dem externen Baualtersklassen-GeoPackage ermittelt. Das Frontend ordnet das
Jahr einer konfigurierten Baualtersklasse zu und verwendet es als Vorbelegung
für:

- `buildingYearField`,
- Bau-/Sanierungsjahr von Dach und Dachfenstern,
- Bau-/Sanierungsjahr von Außenwand und Außenwandfenstern,
- Bau-/Sanierungsjahr von oberster und unterster Geschossdecke.

Ohne diesen extern angereicherten Wert greifen Konfigurationsdefaults. Ebenso
stammen Gebäudetyp, Dachbauweise, Bauteilkonstruktionen, Dämmzustand, U-Werte,
Keller-/Dachraumstatus und Anlagentechnik nicht aus dem aktuell verdrahteten
LOD2-Mapping. Sie werden aus der Konfiguration abgeleitet oder manuell erfasst.

<a id="implementierungsreferenzen-und-pflege"></a>

## Implementierungsreferenzen und Pflege

| Repository | Maßgebliche Implementierung |
| --- | --- |
| Offline Enrichment | `src/geometry/building-metrics.ts`, `src/analysis/file-analyzer.ts`, `src/db/address-database.ts` |
| Frontend | `src/lib/state/building/index.ts`, `src/lib/state/computed/lod2-input.ts`, `src/lib/state/computed/calculation-input.ts`, `src/lib/state/inputs/`, `src/feature/energyCalculation/` |
| Energy Calculation Core | `src/calculate.ts`, `src/calculators/energy/resolvers/buildingGeometry.ts`, `src/calculators/energy/resolvers/*/*Inputs.ts` |

Bei Änderungen an LOD2-Attributen, der Offline-Anreicherung, dem
`Cesium3DTileFeature`-Adapter, `$lod2Input` oder den Eingabeschemas des
Berechnungskerns ist diese Übersicht gemeinsam mit Tests und Mapping-Profil zu
aktualisieren. Neue Zuordnungen gelten erst dann als implementiert, wenn der
Wert über die gesamte Kette von der Quelldatei bis zur sichtbaren Vorbelegung
beziehungsweise bis zum Berechnungseingang nachgewiesen ist.
