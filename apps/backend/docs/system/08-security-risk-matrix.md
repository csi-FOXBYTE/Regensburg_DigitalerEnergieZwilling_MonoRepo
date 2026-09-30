# Sicherheitsrisikomatrix

## Zweck und Geltungsbereich

Diese Risikomatrix ist der Ausgangspunkt für die risikobasierte Planung von Sicherheitsprüfungen und des Penetrationstests vor der Produktivsetzung. Sie bewertet den aktuellen Systemstand und die geplante Einbindung lizenzgeschützter BKI-Kostendaten. Die Bewertung eines Risikos ist kein Nachweis einer bereits vorhandenen Schwachstelle.

Die Matrix gilt für:

- öffentlichen Bürger-Client und administrativen Client,
- APISIX, Keycloak, Backend-API, Datenbank und Berechnungskern,
- Offline-Pipeline, Airflow, Objektspeicher und Stellio-Übergabe,
- Deployment, Logging, Monitoring, Backups und Software-Lieferkette,
- den geplanten serverseitigen BKI-Kostendienst einschließlich Import, Speicherung, Berechnung, Ausgabe und Export.

Die Leistungsbeschreibung fordert Penetrationstests und Sicherheitsüberprüfungen vor der Produktivsetzung. Sie sieht den BKI-Kostenplaner 2024 als Grundlage für Investitionskosten und Wirtschaftlichkeitsberechnungen vor und verlangt die notwendigen Lizenzen. Der Datensatz, sein Datenmodell und seine konkreten Nutzungsbedingungen liegen derzeit nicht vor. Die BKI-Risiken beschreiben deshalb den abzusichernden Zielzustand und müssen nach Vorliegen der Lizenzbedingungen überprüft werden.

## Bewertungsmodell

### Eintrittswahrscheinlichkeit

| Wert | Bedeutung | Leitfrage |
|---:|---|---|
| 1 | sehr unwahrscheinlich | Erfordert außergewöhnliche Voraussetzungen und ist praktisch kaum reproduzierbar. |
| 2 | unwahrscheinlich | Erfordert spezielles Wissen, privilegierten Zugang oder mehrere schwer kombinierbare Voraussetzungen. |
| 3 | möglich | Ist mit realistischem Fachwissen und überschaubarem Aufwand durchführbar. |
| 4 | wahrscheinlich | Ist über eine erreichbare Angriffsfläche mit allgemein verfügbaren Methoden wiederholbar. |
| 5 | sehr wahrscheinlich | Ist ohne besondere Voraussetzungen automatisierbar oder wird voraussichtlich regelmäßig versucht. |

### Auswirkung

| Wert | Bedeutung | Mögliche Folge |
|---:|---|---|
| 1 | gering | Lokale, kurzfristige Beeinträchtigung ohne schützenswerte Daten oder fachliche Auswirkung. |
| 2 | begrenzt | Begrenzter Funktions- oder Datenverlust mit einfacher Wiederherstellung. |
| 3 | erheblich | Relevante Betriebs-, Datenschutz- oder Ergebnisbeeinträchtigung mit begrenztem Umfang. |
| 4 | schwer | Breiter Daten-, Integritäts- oder Verfügbarkeitsverlust, erhebliche fachliche Fehlentscheidung oder Vertragsverletzung. |
| 5 | kritisch | Umfassender unberechtigter Zugriff, nachhaltige Kompromittierung, Veröffentlichung lizenzgeschützter Daten oder gefährdete Produktivfreigabe. |

Für die Auswirkung gilt der höchste begründete Wert aus Vertraulichkeit, Integrität, Verfügbarkeit, Datenschutz, fachlicher Ergebnisqualität und Lizenzfolgen. Der inhärente Risikowert ergibt sich aus `Eintrittswahrscheinlichkeit × Auswirkung`.

| Risikowert | Klasse | Behandlung |
|---:|---|---|
| 1–4 | niedrig | Beobachten und im regulären Qualitätsprozess behandeln. |
| 5–9 | mittel | Schutzmaßnahme einplanen und risikobasiert prüfen. |
| 10–16 | hoch | Vor Produktivfreigabe behandeln und durch einen Negativtest nachweisen. |
| 17–25 | kritisch | Keine Produktivfreigabe ohne Behandlung und bestätigten Retest. |

Ein Restrisiko wird erst eingetragen, wenn die zugehörigen Schutzmaßnahmen implementiert und geprüft wurden. Bis dahin bleibt der inhärente Wert maßgeblich.

## Risikoregister

| ID | Bereich und Risikoszenario | E | A | Wert | Klasse | Primäre Behandlung und Prüfung |
|---|---|---:|---:|---:|---|---|
| RM-01 | Der administrative Routenschutz wird durch eine fehlerhafte APISIX-, OIDC- oder Backend-Konfiguration umgangen. | 3 | 5 | 15 | hoch | Direkte Backend-Aufrufe, manipulierte JWTs und die Unabhängigkeit beider Schutzschichten prüfen. |
| RM-02 | Benutzer weiten ihre Rechte horizontal oder vertikal zwischen `manager`, `maintainer`, `admin` oder fremden Objekten aus. | 3 | 5 | 15 | hoch | Vollständige Rollen- und Objektmatrix für Konfiguration, Zuweisung, Triage und Löschung prüfen. |
| RM-03 | Öffentliche Schreibendpunkte werden durch Umgehung von Altcha oder Rate Limiting automatisiert missbraucht. | 4 | 4 | 16 | hoch | Parallelität, Replay, Header-Manipulation, verteilte Requests und Ressourcenverbrauch prüfen. |
| RM-04 | Lösch-Tokens werden erraten, offengelegt oder wiederverwendet und ermöglichen Fremdlöschung oder unberechtigten Datenzugriff. | 3 | 4 | 12 | hoch | Entropie, Enumeration, Replay, Lebensdauer und Offenlegung in Logs und URLs prüfen. |
| RM-05 | Nicht vertrauenswürdige Inhalte führen über Einreichungen, Konfigurationen, Markdown, Fehler oder Exporte zu Stored- oder DOM-XSS. | 3 | 5 | 15 | hoch | Kontextbezogene Kodierung in Public Client, Admin Client und allen Exportformaten prüfen. |
| RM-06 | Manipulierte API-Eingaben ermöglichen Injection, Mass Assignment oder Ressourcenerschöpfung. | 3 | 4 | 12 | hoch | Schemaabweichungen, SQL-, JSON- und Header-Payloads sowie große und verschachtelte Requests prüfen. |
| RM-07 | Manipulierte Berechnungsergebnisse, Zustandsübergänge oder konkurrierende Änderungen verfälschen gespeicherte Fachergebnisse. | 3 | 4 | 12 | hoch | Server-Recompute, Grenzwerte, Zustandsautomaten und Race Conditions prüfen. |
| RM-08 | Backend, Datenbank, Objektspeicher, Airflow oder Entwicklungs- und Verwaltungsendpunkte sind extern erreichbar. | 3 | 5 | 15 | hoch | Netzgrenzen, exponierte Dienste, Servicekonten und Minimalrechte prüfen. |
| RM-09 | Tokens, Secrets, personenbezogene Daten oder Systemdetails gelangen in Logs, Traces oder Fehlerantworten. | 3 | 4 | 12 | hoch | Log-Injection, Redaction, Fehlerfälle, zentrale Aggregation und Zugriffsschutz prüfen. |
| RM-10 | Bösartige Geo-, JSON- oder Archivdateien kompromittieren die Offline-Pipeline oder veröffentlichen unvollständige Artefakte. | 3 | 5 | 15 | hoch | Path Traversal, Symlinks, ZIP Slip, Dekompressionsbomben und atomare Veröffentlichung prüfen. |
| RM-11 | Abhängigkeiten, Container-Images, Workflows oder eingebettete Secrets kompromittieren Build oder Laufzeit. | 3 | 5 | 15 | hoch | Dependency-, Secret-, SAST-, Image-, SBOM- und IaC-Prüfungen mit Commit- und Digest-Bezug durchführen. |
| RM-12 | Tracking ohne Einwilligung oder persistente lokale Gebäudedaten verletzen Datenschutzanforderungen, insbesondere auf gemeinsam genutzten Geräten. | 3 | 3 | 9 | mittel | Consent, Browser-Speicher, Ablauf, Löschen und Datensparsamkeit prüfen. |
| RM-13 | Manipulierte Tile- oder Terrain-Pfade führen zu unerlaubten Redirects, Header-Manipulation oder Informationsabfluss. | 3 | 3 | 9 | mittel | Pfadnormalisierung, kodierte Varianten und fest konfigurierte Zielsysteme prüfen. |
| RM-BKI-01 | Ein öffentlicher Berechnungsendpunkt erlaubt die systematische Rekonstruktion oder Massengewinnung des BKI-Katalogs. | 4 | 5 | 20 | kritisch | Abfrageoberfläche minimieren, Ergebnisse aggregieren sowie Quoten, Rate Limits, Anomalieerkennung und Anti-Automation vorsehen. |
| RM-BKI-02 | BKI-Rohwerte gelangen in Client-Bundles, öffentliche Konfigurationen, Source Maps, Browser-Caches oder Local Storage. | 3 | 5 | 15 | hoch | Strikte serverseitige Datenhaltung und Artefaktprüfung über Build, CDN und Browser nachweisen. |
| RM-BKI-03 | Detaillierte Antworten, Rundungsdifferenzen oder Variantenabfragen ermöglichen die schrittweise Inferenz einzelner BKI-Werte. | 4 | 4 | 16 | hoch | Lizenzabhängige Ausgaberegeln, Mindestaggregation, Rundung und Begrenzung kombinierbarer Abfragen festlegen. |
| RM-BKI-04 | PDF-, JSON- oder CSV-Exporte legen lizenzgeschützte Einzelpositionen oder rekonstruierbare Zwischenwerte offen. | 4 | 4 | 16 | hoch | Eigenständige Export-Policy definieren und alle maschinenlesbaren Ausgabewege prüfen. |
| RM-BKI-05 | BKI-Werte werden über Logs, Traces, Monitoring, Support-Dumps, Caches oder Backups offengelegt. | 3 | 5 | 15 | hoch | Feldbezogene Redaction, Cache-Regeln, Diagnoseartefakte, Zugriffsrechte und Aufbewahrung prüfen. |
| RM-BKI-06 | Manipulierte Katalogversionen, Kostenpositionen, Preisstände, Regionalfaktoren oder Zuordnungsregeln erzeugen falsche Wirtschaftlichkeitsaussagen. | 3 | 4 | 12 | hoch | Versionierte Importe, Integritätsnachweis, Vier-Augen-Freigabe, Provenienz und fachliche Referenzfälle vorsehen. |
| RM-BKI-07 | Technische BKI-Zugangsdaten werden entwendet oder Import- und Administrationsfunktionen unberechtigt genutzt. | 3 | 5 | 15 | hoch | Secrets-Management, getrennte Servicekonten, minimale Rechte, Rotation und Audit-Logging vorsehen. |
| RM-BKI-08 | Hohe Abfragelast oder der Ausfall eines BKI-Dienstes beeinträchtigt den öffentlichen Sanierungscheck. | 3 | 3 | 9 | mittel | Lizenzkonforme Caches, Timeouts, Circuit Breaker, Kapazitätsgrenzen und einen fachlich definierten Fehlerzustand vorsehen. |
| RM-BKI-09 | Entwicklung oder Veröffentlichung beginnt, ohne Rechte für Speicherung, Ableitung, Anzeige, Export, Caching und Nachnutzung verbindlich geklärt zu haben. | 4 | 5 | 20 | kritisch | Verbindliches Lizenz-Gate vor Architektur-, Implementierungs- und Produktivfreigabe einführen. |

## BKI-Schutzmodell und Lizenz-Gate

Vor der technischen Spezifikation und Implementierung müssen Auftraggeber, Lizenzverantwortliche, fachliche Verantwortung und technische Verantwortung mindestens klären:

- Zulässigkeit und Ort der dauerhaften Speicherung und Replikation von Rohdaten,
- erlaubte abgeleitete Werte und deren öffentliche Darstellung,
- zulässige Granularität von Kostenpositionen, Einheiten und Zwischenwerten,
- Vorgaben zu Rundung, Kostenbändern und aggregierten Gesamtergebnissen,
- Zulässigkeit und Dauer von Backend-, Gateway- und Browser-Caches,
- Speicherung in Nutzereinreichungen, PDF- und JSON-Exporten, Logs, Traces und Backups,
- Begrenzungen nach Kommune, Installation, Benutzerkreis und Abfragevolumen,
- Aktualisierung, Preisstand, Regionalisierung, Quellenangabe und Verhalten bei Lizenzende.

Bis zur Klärung werden zwei Ausgabevarianten bewertet:

1. **Aggregierte Ausgabe (bevorzugter Zielzustand):** Das Backend führt die Kostenberechnung aus und gibt nur freigegebene Kostenbänder, Gesamtergebnisse und erforderliche Erläuterungen aus. Rohpositionen und interne Katalogschlüssel verlassen das Backend nicht.
2. **Begrenzte Positionsausgabe:** Einzelne Positionen werden ausschließlich über eine fachliche Allow-List, reduzierte Granularität und lizenzkonforme Rundung ausgegeben. Diese Variante erfordert eine ausdrückliche Lizenzfreigabe.

Unabhängig von der gewählten Variante gelten folgende Mindestvorgaben:

- Kein BKI-Rohdatensatz in Frontend, öffentlich abrufbarer Konfiguration, Open-Source-Repository oder statischem Build-Artefakt.
- Keine frei parametrisierbare Katalogabfrage. Eine öffentliche API akzeptiert fachliche Sanierungsparameter und keine beliebigen BKI-Schlüssel oder Wertebereiche.
- Getrennte Berechtigungen für Import, fachliche Freigabe und produktive Nutzung.
- Version, Preisstand, Regionalisierung und Berechnungsregel werden intern nachvollziehbar mit dem Ergebnis verknüpft.
- Öffentlich sichtbare Quellen- und Versionsangaben werden auf den lizenzrechtlich freigegebenen Umfang beschränkt.
- API-Antwort, Export, Cache, Logging, Monitoring, Support-Dump und Backup werden als eigenständige Datenabflusspfade behandelt.
- Ein Lizenzende oder eine gesperrte Katalogversion führt zu einem definierten, sicheren Zustand und nicht zur Auslieferung lokaler Rohdaten an den Client.

## Verantwortlichkeiten und Pflege

| Verantwortungsbereich | Aufgabe |
|---|---|
| Fachliche Produktverantwortung | Fachliche Auswirkung, zulässige Kostenlogik und Ergebnisdarstellung bewerten. |
| Lizenzverantwortung des Auftraggebers | Nutzungs-, Speicher-, Ausgabe-, Export- und Nachnutzungsrechte verbindlich freigeben. |
| Technische Anwendungsverantwortung | Schutzmaßnahmen in API, Berechnung, Import und Export spezifizieren und umsetzen. |
| Plattformbetrieb | Gateway, IAM, Secrets, Netze, Logging, Monitoring, Backups und Kapazitätsgrenzen absichern. |
| Security-Prüfung | Angriffshypothesen ableiten, Maßnahmen unabhängig prüfen und Restrisiken bestätigen. |

Die Matrix wird mindestens vor jedem Produktivrelease, nach wesentlichen Architektur- oder Authentisierungsänderungen, nach Bekanntwerden relevanter Schwachstellen sowie vor und nach Einführung der BKI-Kostenfunktionen überprüft. Änderungen an Eintritt, Auswirkung oder Behandlung werden mit Datum, Begründung und verantwortlicher Rolle im zugehörigen Prüf- oder Entscheidungsnachweis festgehalten.

## Ableitung der Sicherheitsprüfungen

- Kritische Risiken sowie hohe Risiken mit Auswirkung 5 werden als P0 behandelt.
- Die übrigen hohen Risiken werden als P1 behandelt.
- Mittlere Risiken und ergänzende Härtungsprüfungen werden als P2 behandelt.
- Die konkreten Testfälle und Nachweisanforderungen stehen in der [Security-Testspezifikation](07-security-test-specification.md).
- Für jedes Risiko werden mindestens ein Negativtest und das erwartete sichere Verhalten dokumentiert.
- Ein blockierter Test reduziert das Risiko nicht und ist kein positiver Nachweis.
- BKI-Architekturtests können vor Verfügbarkeit der Originaldaten mit einem strukturell gleichwertigen synthetischen Katalog erfolgen.
- Die abschließenden BKI-Tests setzen die freigegebenen Lizenzbedingungen, den vorgesehenen Datenstand und die produktionsnahe Backend-Schnittstelle voraus.
- Ein Restrisiko darf erst nach implementierter Schutzmaßnahme und erfolgreichem Umgehungs- beziehungsweise Retest bewertet und akzeptiert werden.

### Zuordnung zu Testfallfamilien

| Risiken | Testfallfamilien der Security-Testspezifikation |
|---|---|
| RM-01 bis RM-02 | `AUTH`, `SESS`, `CRY`, `PLAT`, `DAST`, `PEN` |
| RM-03 bis RM-04 | `VAL`, `CRY`, `DATA`, `PLAT`, `DAST`, `PEN` |
| RM-05 bis RM-07 | `VAL`, `XSS`, `ERR`, `DB`, `DAST`, `PEN` |
| RM-08 bis RM-09 | `ERR`, `LOG`, `HARD`, `DB`, `PLAT`, `PEN` |
| RM-10 | `FILE`, `HARD`, `PEN` |
| RM-11 | `SUP`, `HARD`, `PEN` |
| RM-12 bis RM-13 | `DATA`, `REDIR`, `PLAT`, `DAST`, `PEN` |
| RM-BKI-01 bis RM-BKI-09 | `BKI`, `AUTH`, `VAL`, `LOG`, `HARD`, `SUP`, `PLAT`, `DAST`, `PEN` |
