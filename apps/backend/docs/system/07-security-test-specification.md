# Security-Testspezifikation

## Zweck und Geltungsbereich

Diese Spezifikation operationalisiert die offenen Prüfpunkte aus dem [Sicherheitskonzept](03-security-concept.md), insbesondere dem [OWASP-Soll-Ist-Mapping](03-security-concept.md#owasp-secure-coding-practices-soll-ist-mapping), und die Szenarien der [Sicherheitsrisikomatrix](08-security-risk-matrix.md). Sie gilt für:

- öffentlichen Bürger-Client und administrativen Client,
- Backend-API und Berechnungskern,
- geplanten serverseitigen BKI-Kostendienst einschließlich Import, Speicherung, Berechnung, Ausgabe und Export,
- Offline-Pipeline und Airflow-Orchestrierung,
- Deployment-Add-on sowie die angebundene CIVITAS/CORE-Plattform,
- Datenbank, Objektspeicher, Logging, Backups und Identitätsmanagement.

Die Testfälle orientieren sich an den Kategorien der [OWASP Secure Coding Practices – Quick Reference Guide v2.1](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/assets/docs/OWASP_SCP_Quick_Reference_Guide_v21.pdf). Sie ersetzen weder die betriebliche Freigabe noch den unabhängigen Penetrationstest vor dem Go-Live.

## Priorität und Ausführungsstufen

| Kennung | Bedeutung |
|---|---|
| P0 | Kritische Zugriffskontrolle oder unmittelbare Produktionsfreigabe-Bedingung; zuerst prüfen. |
| P1 | Hoher Schutzbedarf oder breite Angriffsfläche; vor jedem Release prüfen. |
| P2 | Härtung, Nachweisführung oder vertiefende Prüfung; spätestens vor Go-Live prüfen. |

| Stufe | Wo | Wann |
|---|---|---|
| LOKAL | Im jeweils genannten Repository auf einem Entwickler- oder Prüfplatz | Bei sicherheitsrelevanten Änderungen sowie vor einem Pull Request |
| CI | In den GitHub-Actions-Workflows aller betroffenen Repositories | Bei jedem Pull Request; vollständiger Lauf zusätzlich vor Release-Tags |
| INTEGRATION | Lokale Devcontainer-/Docker-Umgebung mit Backend, Datenbank, APISIX und Testdaten | Nach Änderungen an API, Datenmodell, Pipeline oder Gateway-Konfiguration |
| STAGING | Vollständig bereitgestellte, produktionsnahe CIVITAS/CORE-Testinstanz | Nach jedem Deployment eines Release-Kandidaten und vor der Abnahme |
| BETRIEB | Produktive Konfiguration, Logs und Betriebsnachweise; nur lesende bzw. freigegebene Prüfungen | Vor Go-Live, nach relevanten Konfigurationsänderungen und regelmäßig im Betrieb |
| EXTERN | Durch organisatorisch unabhängige Prüfer gegen eine freigegebene Vorproduktionsinstanz | Vor Go-Live und nach wesentlichen Architektur- oder Authentisierungsänderungen |

## Allgemeine Durchführung und Nachweise

Jeder Testlauf dokumentiert mindestens Testfall-ID, Datum, Prüfer, Commit-SHA oder Image-Digest, Umgebung, Werkzeugversion, Testdaten, Ergebnis und Fundstelle des unveränderten Prüfartefakts. Zulässige Ergebnisse sind `BESTANDEN`, `NICHT BESTANDEN`, `BLOCKIERT` und `NICHT ANWENDBAR`. Ein blockierter Test ist kein positiver Nachweis.

Sicherheitsrelevante Testdaten dürfen keine produktiven Geheimnisse oder personenbezogenen Echtdaten enthalten. Aktive Scans, Lasttests, Rate-Limit-Tests und Penetrationstests dürfen nur gegen ausdrücklich dafür freigegebene Umgebungen erfolgen. Ein Test gilt nur dann als bestanden, wenn das erwartete Ergebnis vollständig erfüllt ist und kein gleichwertiger Umgehungspfad gefunden wurde.

## Testfälle

### Authentisierung, Session und Zugriffskontrolle

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| AUTH-01 | P0 | Admin-Endpunkte ohne Token sowie mit leerem, syntaktisch ungültigem oder falschem Auth-Schema aufrufen. | Jeder Zugriff wird mit `401` abgelehnt; keine geschützten Daten und keine Interna werden ausgegeben. | INTEGRATION und STAGING; bei jeder Änderung an Auth-Middleware oder Gateway-Routen |
| AUTH-02 | P0 | JWT mit ungültiger Signatur, falschem Aussteller oder Publikum sowie nicht erlaubtem Algorithmus verwenden. | Das Backend validiert unabhängig von APISIX und lehnt jedes Token sicher mit `401` ab. | INTEGRATION; automatisiert bei jedem Pull Request des Backends |
| AUTH-03 | P0 | Abgelaufene und noch nicht gültige Tokens sowie Tokens ohne erforderliche Claims verwenden. | Zugriff wird mit `401` abgelehnt; Zeit- und Claim-Prüfung kann nicht umgangen werden. | INTEGRATION; bei jedem Pull Request des Backends |
| AUTH-04 | P0 | Für jeden Admin-Endpunkt die Rollen `manager`, `maintainer`, `admin` und keine Rolle positiv und negativ prüfen. | Nur die dokumentierte Rolle erhält Zugriff; Ablehnungen liefern `403`; `admin` besitzt nur die festgelegten Vollzugriffe. | INTEGRATION und STAGING; bei jeder Änderung an Route oder Rollenmodell |
| AUTH-05 | P0 | Direkte Objektzugriffe mit fremden, nicht vorhandenen und manipulierten Objekt-IDs prüfen. | Keine horizontale oder vertikale Rechteausweitung; Antwort legt keine fremden Daten offen. | INTEGRATION und STAGING; bei Änderungen an Triage-, Konfigurations- oder Löschendpunkten |
| AUTH-06 | P1 | Keycloak-Regeln für Passwort, MFA, Sperre, Recovery und technische Clients gegen die freigegebene Plattformvorgabe prüfen. | Alle freigegebenen Regeln sind aktiv und durch Konfigurationsauszug oder Test belegt. | STAGING/BETRIEB; vor Go-Live und nach Keycloak-Änderungen |
| SESS-01 | P0 | OIDC-Login, Token-Erneuerung, Ablauf, Logout und serverseitige Sitzungsbeendigung prüfen. | Abgelaufene oder beendete Sitzungen gewähren keinen Zugriff; Logout ist wirksam. | STAGING; pro Release-Kandidat und nach APISIX-/Keycloak-Änderungen |
| SESS-02 | P1 | Cookies und Browser-Speicher auf `Secure`, `HttpOnly`, `SameSite`, angemessene Pfade/Laufzeiten sowie Token in URL oder Storage prüfen. | Authentisierungsdaten erscheinen weder in URLs noch in ungeschütztem Browser-Speicher; Cookie-Attribute sind restriktiv. | STAGING; pro Release-Kandidat |

### Eingabevalidierung und fachliche Integrität

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| VAL-01 | P0 | Query-, Path-, Header- und Body-Felder mit fehlenden, falschen und zusätzlichen Werten gegen alle API-Routen prüfen. | Schemawidrige Eingaben werden deterministisch mit `4xx` abgelehnt; es entsteht keine Zustandsänderung. | INTEGRATION; bei jedem Pull Request des Backends |
| VAL-02 | P0 | Numerische und textuelle Felder an Minimum, Maximum, direkt außerhalb der Grenzen, `NaN`, Unendlich, leer und überlang prüfen. | Dokumentierte Grenzwerte werden akzeptiert, alle Werte außerhalb der Grenzen abgelehnt. | LOKAL im Berechnungskern und INTEGRATION im Backend; bei jedem Pull Request |
| VAL-03 | P0 | Manipulierte clientseitige Berechnungsergebnisse an das Backend senden. | Das Backend vertraut dem Ergebnis nicht, validiert die Eingabe und berechnet serverseitig neu. | INTEGRATION; bei Änderungen an Berechnungs- oder Speicherendpunkten |
| VAL-04 | P0 | Einzel- und Gruppenlöschung in allen Triage-Zuständen sowie bei konkurrierenden Änderungen ausführen. | Gruppenlöschung erfolgt atomar nur, wenn alle Einreichungen abgelehnt sind; keine Teillöschung. | INTEGRATION mit Testdatenbank; bei Änderungen am Lösch- oder Triage-Code |
| VAL-05 | P1 | Typische SQL-, JSON-, Header- und Kommando-Injection-Zeichenfolgen in alle externen Eingabekanäle geben. | Eingaben werden abgelehnt oder als Daten behandelt; keine Abfrage-, Header- oder Befehlsmanipulation. | INTEGRATION und ergänzend DAST auf STAGING; pro Release-Kandidat |
| VAL-06 | P1 | Stark verschachtelte, sehr große und hochkomplexe Requests kontrolliert einspeisen. | Konfigurierte Grenzen greifen mit `4xx`; Dienst bleibt verfügbar und erzeugt keine übermäßige Ressourcennutzung. | INTEGRATION; Lastanteil nur auf freigegebener STAGING-Umgebung vor Release |

### Ausgabekodierung, XSS und Redirects

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| XSS-01 | P0 | HTML-, Attribut-, URL- und Skript-Payloads über alle im Frontend dargestellten API- und Konfigurationsfelder einspeisen. | Payload wird als Text dargestellt oder verworfen; kein Skript wird ausgeführt und kein DOM-Event ausgelöst. | INTEGRATION mit Playwright; bei jedem Pull Request der Frontends |
| XSS-02 | P1 | Markdown- und Rich-Text-Inhalte mit HTML, gefährlichen Links und Event-Handlern prüfen. | Nur freigegebene Syntax wird gerendert; gefährliche Protokolle, Elemente und Attribute bleiben unwirksam. | LOKAL/INTEGRATION im öffentlichen Frontend; bei Änderungen am Rendering |
| XSS-03 | P1 | Manipulierte Werte in Fehlermeldungen, PDF-, CSV-, JSON- und sonstige Exporte übernehmen. | Kontextgerechte Kodierung verhindert HTML-, Formel-, JSON- und Dokument-Injection. | INTEGRATION; bei Änderungen an Fehlern oder Exporten |
| REDIR-01 | P1 | Tiles- und sonstige Redirect-Ziele mit fremden Hosts, Protokollwechseln und kodierten Varianten prüfen. | Redirects bleiben auf explizit konfigurierte, vertrauenswürdige Ziele beschränkt. | INTEGRATION und STAGING; bei Änderungen an Redirect- oder Routing-Konfiguration |

### Fehlerbehandlung und Logging

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| ERR-01 | P0 | Kontrolliert Validierungs-, Auth-, Datenbank- und unbekannte Fehler auslösen. | Einheitliches Fehlerschema; außerhalb Development keine Stacktraces, Pfade, SQL-Texte oder Abhängigkeitsdetails. | INTEGRATION und STAGING; bei Änderungen an Fehlerbehandlung |
| LOG-01 | P0 | Logs nach Access-/Refresh-Tokens, Cookies, Secrets, Verbindungszeichenfolgen und sensiblen Eingabedaten durchsuchen. | Keine Geheimnisse oder nicht erforderlichen sensiblen Daten in Logs. | INTEGRATION und STAGING; pro Release-Kandidat und regelmäßig im Betrieb |
| LOG-02 | P1 | Zeilenumbrüche, Steuerzeichen und gefälschte strukturierte Felder in protokollierte Eingaben geben. | Log-Einträge bleiben eindeutig strukturiert; keine zusätzlichen oder manipulierten Ereignisse. | INTEGRATION; bei Änderungen am Logging |
| LOG-03 | P1 | Erfolgreiche und abgelehnte Admin-Aktionen, Rollenfehler, Triage- und Löschvorgänge ausführen. | Definierte Sicherheitsereignisse enthalten Zeit, Akteur, Aktion, Ergebnis und Korrelations-ID, aber keine Secrets. | INTEGRATION und STAGING; pro Release-Kandidat |
| LOG-04 | P2 | Zentrale Aggregation, Zugriffsschutz, Integrität, Alarmierung und Aufbewahrungsfrist anhand Plattformkonfiguration und Stichprobe prüfen. | Nur berechtigte Rollen haben Zugriff; Fristen und Alarme entsprechen der Betriebsfreigabe. | BETRIEB/STAGING; vor Go-Live und mindestens jährlich |

### Kryptografie, Datenschutz und Datenlebenszyklus

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| CRY-01 | P0 | JWT-Implementierung und Laufzeitkonfiguration auf Algorithmus-Allow-List, HTTPS-JWKS und sicheres Fehlschlagen prüfen. | Nur RS256 aus der freigegebenen JWKS-Quelle wird akzeptiert; Schlüsselabruf nutzt TLS. | LOKAL durch Code-/Konfigurationsprüfung und INTEGRATION; bei Auth-Änderungen |
| CRY-02 | P1 | Erzeugung fachlicher Lösch- und Wiederherstellungskennungen auf kryptografische Zufallsquelle, ausreichende Entropie und fehlende Vorhersagbarkeit prüfen. | Token stammen aus einer kryptografischen Zufallsquelle, sind nicht ableitbar und werden nicht im Klartext protokolliert. | LOKAL/INTEGRATION; bei Änderungen an Token-Erzeugung |
| CRY-03 | P1 | JWKS-Rotation, Secret-Rotation, Ablage, Zugriffsrechte und Widerruf testen. | Rotation ohne unsicheren Fallback; alte oder widerrufene Secrets verlieren fristgerecht ihre Wirkung. | STAGING/BETRIEB; vor Go-Live und nach Rotationen |
| DATA-01 | P0 | Anwendung ohne Analytics-Opt-in bedienen und Netzverkehr sowie Browser-Speicher prüfen. | Matomo bleibt deaktiviert; keine Tracking-Requests oder Tracking-Cookies vor Einwilligung. | STAGING mit Browser-Test; pro Release-Kandidat |
| DATA-02 | P1 | Widerruf und Löschung gespeicherter Bürgerdaten einschließlich ungültigem oder fremdem Lösch-Token prüfen. | Nur der berechtigte Löschpfad wirkt; Daten werden gemäß Konzept entfernt und fremde Daten bleiben geschützt. | INTEGRATION und STAGING; vor Go-Live |
| DATA-03 | P1 | Aufbewahrung und Löschung in Datenbank, temporären Verzeichnissen, Objektspeicher, Logs und Backups gegen freigegebene Fristen prüfen. | Fristen sind umgesetzt und nachweisbar; temporäre Artefakte und Backups werden kontrolliert behandelt. | STAGING/BETRIEB; vor Go-Live und mindestens jährlich |

### Datei- und Pipeline-Sicherheit

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| FILE-01 | P0 | Unerwartete Dateitypen, falsche Endungen, ungültige CityJSON-/Geo-Daten und polyglotte Dateien einspeisen. | Verarbeitung bricht kontrolliert vor Veröffentlichung ab; kein Teilresultat wird aktiv geschaltet. | LOKAL im Offline-Enrichment und INTEGRATION im DAG; bei Pipeline-Änderungen |
| FILE-02 | P0 | Relative/absolute Pfade, `..`, alternative Separatoren, Symlinks und Links außerhalb des Job-Verzeichnisses prüfen. | Lesen und Schreiben bleiben innerhalb des zugewiesenen Job-Verzeichnisses; Links nach außen werden abgelehnt. | LOKAL und INTEGRATION; bei Änderungen an Datei- oder DAG-Operationen |
| FILE-03 | P1 | Sehr große Dateien, extrem tiefe Geometrien, große Objektzahlen und aufwendige Strukturen kontrolliert prüfen. | Definierte Größen-, Zeit- und Komplexitätsgrenzen greifen; sauberer Abbruch ohne Veröffentlichung. | INTEGRATION auf begrenzter Testumgebung; vor Release |
| FILE-04 | P1 | ZIP-Slip, Dekompressionsbombe, verschachtelte Archive und hohe Kompressionsrate prüfen. | Extraktion verlässt das Zielverzeichnis nicht und bricht vor Ressourcenerschöpfung ab. | INTEGRATION in isolierter Pipeline-Testumgebung; vor Release |
| FILE-05 | P1 | Fehler und Wiederanlauf in jeder DAG-Phase simulieren; Arbeitsverzeichnisse, Manifest und Veröffentlichungszeiger prüfen. | Temporäre Daten werden kontrolliert bereinigt; unvollständige Artefakte werden nicht veröffentlicht; Status bleibt nachvollziehbar. | INTEGRATION mit Airflow und Objektspeicher; bei DAG-Änderungen |

### Härtung, Datenbank und Lieferkette

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| HARD-01 | P0 | Kubernetes-Manifeste auf Non-Root, `allowPrivilegeEscalation: false`, minimale Capabilities, Seccomp, Read-only-Dateisystem und Ressourcenlimits prüfen. | Jede Komponente erfüllt die freigegebene Baseline oder besitzt eine dokumentierte, genehmigte Ausnahme. | LOKAL/CI im Deployment-Add-on; bei jedem Pull Request und Release |
| HARD-02 | P1 | Container mit den produktiven Security Contexts starten und Schreib-, Prozess- sowie Netzwerkversuche ausführen. | Anwendung funktioniert mit minimalen Rechten; unzulässige Aktionen scheitern. | INTEGRATION; pro Release-Kandidat |
| HARD-03 | P1 | Exponierte Routen, Header und Antworten auf Debug-/Testendpunkte, Verzeichnislisten und Versionspreisgabe prüfen. | Keine Entwicklungsendpunkte oder unnötigen Versionsinformationen sind extern verfügbar. | STAGING; pro Release-Kandidat |
| DB-01 | P0 | Datenzugriffsschicht auf parametrisierte/typisierte Abfragen und dynamische SQL-Konstruktion prüfen; Injection-Tests aus `VAL-05` wiederholen. | Keine ungeprüfte String-Konkatenation für SQL; Injection bleibt wirkungslos. | LOKAL/CI durch SAST und Review, ergänzend INTEGRATION; bei Backend-Änderungen |
| DB-02 | P0 | Rechte des Anwendungskontos und Erreichbarkeit der Datenbank prüfen. | Dediziertes Konto besitzt nur erforderliche Schema-/Tabellenrechte; Datenbank ist extern nicht erreichbar. | STAGING/BETRIEB; vor Go-Live und nach Rechte-/Netzänderungen |
| SUP-01 | P0 | Lint, Build sowie vorhandene Unit-, Integrations- und E2E-Tests in allen Repositories ausführen. | Alle verpflichtenden Qualitätsprüfungen laufen reproduzierbar und ohne Fehler. | LOKAL und CI; bei jedem Pull Request, vollständig vor Release |
| SUP-02 | P0 | Produktionsabhängigkeiten aller Ökosysteme auf bekannte Schwachstellen prüfen. | Keine ungeklärten kritischen oder hohen Schwachstellen; Ausnahmen sind bewertet, befristet und freigegeben. | CI täglich und vor Release; zusätzlich bei Sicherheitsmeldungen |
| SUP-03 | P1 | SAST über TypeScript-, JavaScript-, Python-, Shell- und Konfigurationscode ausführen. | Keine ungeklärten kritischen oder hohen Befunde; relevante Regeln sind aktiviert. | CI bei jedem Pull Request und vollständig vor Release |
| SUP-04 | P0 | Repository-Historie, Arbeitsbaum, Images und Build-Artefakte auf Secrets prüfen. | Keine gültigen Geheimnisse; Testwerte sind eindeutig ungefährlich. | CI bei jedem Pull Request und vor Release |
| SUP-05 | P1 | SBOM je veröffentlichtem Image/Artefakt erzeugen, Format validieren und Abdeckung stichprobenartig prüfen. | SBOM ist vollständig, maschinenlesbar, dem Digest zugeordnet und Release-Artefakt. | CI bei Release-Tags |
| SUP-06 | P0 | Gebaute Container-Images einschließlich Basisimage und Betriebssystempaketen scannen. | Keine ungeklärten kritischen oder hohen Schwachstellen; Ergebnis ist dem Image-Digest zugeordnet. | CI bei Image-Build und regelmäßig nach Veröffentlichung |
| SUP-07 | P1 | Kubernetes-, Docker-, Workflow- und Gateway-Konfiguration mit IaC-/Policy-Regeln prüfen. | Keine ungeklärten kritischen oder hohen Fehlkonfigurationen; Baseline-Verstöße sind sichtbar. | CI bei jedem Pull Request des Deployment-Add-ons und der Workflows |
| SUP-08 | P1 | Workflows auf verpflichtende Tests, geschützte Freigaben, unveränderliche Action-/Image-Referenzen und minimale Token-Rechte prüfen. | Sicherheitsprüfungen sind nicht still umgehbar; Drittkomponenten sind unveränderlich referenziert; Rechte sind minimal. | LOKAL durch Review und CI-Policy; vor Release und bei Workflow-Änderungen |

### Plattform, dynamische Prüfung und Wiederherstellung

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| PLAT-01 | P0 | TLS-Versionen, Cipher, Zertifikatskette, Hostnamen und HTTP-zu-HTTPS-Weiterleitung prüfen. | Gültige Kette und Hostnamen; keine veralteten Protokolle oder unsicheren Fallbacks. | STAGING und BETRIEB; pro Release-Kandidat sowie nach Zertifikats-/Ingress-Änderungen |
| PLAT-02 | P0 | CORS mit erlaubten und fremden Origins, Preflight-Varianten, Methoden und Credential-Modus prüfen. | Nur explizit freigegebene Origins, Header und Methoden werden akzeptiert; kein gefährlicher Wildcard-Credential-Mix. | STAGING; pro Release-Kandidat |
| PLAT-03 | P1 | Security-Header einschließlich CSP, HSTS, Frame-Schutz, MIME-Sniffing und Referrer-Policy prüfen. | Freigegebene Header sind auf allen relevanten Antworten konsistent gesetzt. | STAGING; pro Release-Kandidat |
| PLAT-04 | P0 | Backend, Datenbank, Objektspeicher, Airflow und interne Admin-Dienste aus externen Netzen direkt adressieren. | Nur die vorgesehenen APISIX-/Ingress-Endpunkte sind öffentlich erreichbar. | STAGING/BETRIEB mit Netzfreigabe; vor Go-Live und nach Netzänderungen |
| PLAT-05 | P0 | Öffentliche Schreibendpunkte kontrolliert ohne bzw. mit ungültiger Altcha-Challenge und oberhalb der Rate-Limits aufrufen. | Ungültige Requests werden abgewiesen; Rate Limiting greift ohne Umgehung über Header oder Parallelität. | STAGING, ausschließlich abgestimmt; vor Go-Live und nach Gateway-Änderungen |
| DAST-01 | P1 | Authentisierten und nicht authentisierten OWASP-DAST-Scan gegen alle freigegebenen Routen durchführen. | Keine ungeklärten kritischen oder hohen Befunde; Fehlalarme sind nachvollziehbar bewertet. | STAGING; pro Release-Kandidat, außerhalb produktiver Lastzeiten |
| REST-01 | P1 | Wiederherstellung von Datenbank, Objektspeicher und Konfiguration aus einem freigegebenen Backup testen. | Wiederherstellung erreicht dokumentierte RTO/RPO; Rechte, Integrität und Löschvorgaben bleiben erhalten. | Separate Recovery-/STAGING-Umgebung; vor Go-Live und mindestens jährlich |
| PEN-01 | P0 | Unabhängiger Penetrationstest von Web, API, Authentisierung, Autorisierung, Plattformgrenzen und relevanter Pipeline-Angriffsfläche. | Keine offenen kritischen oder hohen Befunde vor Produktivfreigabe; Retest bestätigt Korrekturen. | EXTERN gegen freigegebene Vorproduktion; vor Go-Live und nach wesentlichen Änderungen |

### Lizenzgeschützte BKI-Kostendaten

Die Testfälle in diesem Abschnitt beschreiben den geplanten Zielzustand. Solange Originaldaten, Nutzungsbedingungen oder Schnittstelle fehlen, werden technisch mögliche Teile mit einem strukturell gleichwertigen synthetischen Katalog ausgeführt. Ein dadurch blockierter Lizenz- oder Originaldatentest gilt nicht als bestanden.

| ID | Prio | Szenario und Methode | Erwartetes Ergebnis | Wo / wann |
|---|---:|---|---|---|
| BKI-01 | P0 | Zu RM-BKI-02: Frontend-Bundles, öffentliche Konfigurationen, Source Maps, Browser-Speicher, statische Artefakte und Repositories nach BKI-Rohdaten, Katalogschlüsseln und rekonstruierbaren Tabellen durchsuchen. | Weder Rohdaten noch eine massenhaft auswertbare Katalogrepräsentation werden an den Client oder in öffentliche Artefakte ausgeliefert. | LOKAL/CI und STAGING; ab erstem BKI-Prototyp und vor jedem Release mit Kostenfunktionen |
| BKI-02 | P0 | Zu RM-BKI-01 und RM-BKI-03: Den öffentlichen Kostenpfad mit systematisch variierten Maßnahmen, Dimensionen, Regionalfaktoren, Rundungsgrenzen, Reihenfolgen und Parallelität abfragen und Antworten auf Rekonstruierbarkeit untersuchen. | API und Ergebnisgranularität erlauben keine wirtschaftlich verwertbare Rekonstruktion des Katalogs; Quoten, Rate Limits und Anomalieerkennung begrenzen automatisierte Extraktion. | INTEGRATION und abgestimmt auf STAGING; vor erster Produktivfreigabe und nach Änderungen am Kostenvertrag |
| BKI-03 | P1 | Zu RM-BKI-04: PDF-, JSON-, CSV- und sonstige Exporte sowie Fehlermeldungen auf Einzelpositionen, interne Schlüssel, Zwischenwerte und unzulässige Provenienzangaben prüfen. | Jeder Ausgabeweg hält die freigegebene Granularität ein und legt keine zusätzlichen lizenzgeschützten Informationen offen. | INTEGRATION und STAGING; bei Änderungen an Kostenanzeige oder Export |
| BKI-04 | P0 | Zu RM-BKI-05 und RM-BKI-07: Logs, Traces, Metriken, Caches, Support-Dumps und testweise Backups nach BKI-Werten und Zugangsdaten durchsuchen; Cache- und Diagnosefehler kontrolliert auslösen. | Rohwerte und Zugangsdaten werden redigiert; Zugriffe und Aufbewahrung entsprechen der Lizenz- und Betriebsfreigabe. | INTEGRATION sowie STAGING/BETRIEB mit freigegebenem Zugriff; vor Go-Live und nach Observability-Änderungen |
| BKI-05 | P0 | Zu RM-BKI-06 und RM-BKI-07: Import und Aktivierung mit manipuliertem Artefakt, falscher Prüfsumme, nicht freigegebener Version, unzulässigem Preisstand sowie unberechtigten Rollen ausführen. | Nur integre, fachlich freigegebene und lizenzgültige Versionen werden aktiviert; Import, Freigabe und Nutzung sind getrennt und auditierbar. | INTEGRATION und STAGING; bei jeder Änderung an Import oder Freigabeprozess |
| BKI-06 | P1 | Zu RM-BKI-06: Referenzfälle für Kostenposition, Einheit, Menge, Preisstand, Regionalisierung, Rundung und fachliche Zuordnung positiv und negativ prüfen. | Berechnung ist deterministisch, auf die aktive Version rückführbar und weist fachlich falsche oder unvollständige Zuordnungen ab. | LOKAL im Kostenmodell und INTEGRATION im Backend; bei jedem Kostenmodell-Release |
| BKI-07 | P1 | Zu RM-BKI-08: Timeouts, hohe zulässige Parallelität, Cache-Ausfall, gesperrte Katalogversion und Lizenzende simulieren. | Der Dienst bleibt innerhalb der freigegebenen Kapazitätsgrenzen verfügbar oder schlägt kontrolliert fehl; kein Fallback liefert Rohdaten oder nicht freigegebene Altwerte aus. | INTEGRATION und abgestimmt auf STAGING; vor Go-Live und nach Betriebsänderungen |
| BKI-08 | P0 | Zu RM-BKI-09: Lizenzfreigabe gegen tatsächliche Speicherung, Ableitung, API-Ausgabe, Export, Caching, Backups, Benutzerkreis und Nachnutzung abgleichen. | Alle technischen Datenflüsse sind von der dokumentierten Freigabe gedeckt; ungeklärte oder abweichende Verwendungen verhindern die Produktivfreigabe. | DESIGN-Review und STAGING-Abnahme; vor Implementierungsfreigabe erneut vor Go-Live |

## Repository-spezifische Startbefehle

Die Befehle gelten aus dem Stammverzeichnis des jeweiligen Repositories. Sie beschreiben den derzeit vorhandenen Einstiegspunkt; fehlende Testskripte sind als Lücke zu behandeln.

| Repository | Direkt verfügbarer Einstieg | Einschränkung / benötigte Umgebung |
|---|---|---|
| Backend | `pnpm run lint`, `pnpm run build` | Das derzeitige `pnpm test` ist nur ein fehlschlagender Platzhalter; Auth-, API- und Fehlerbehandlungstests benötigen eine Testdatenbank und einen echten Test-Runner-Einstieg. |
| Frontend | `pnpm run build`, `pnpm run test:e2e` | Playwright verwendet standardmäßig die konfigurierte Webinstanz; für reproduzierbare Prüfung `PLAYWRIGHT_BASE_URL` explizit auf die freigegebene Umgebung setzen. |
| AdminFrontend | `pnpm run lint`, `pnpm run build` | Noch kein automatisierter Unit- oder E2E-Testeinstieg vorhanden. |
| EnergyCalculationCore | `pnpm test`, `pnpm run build` | Lokal ohne Plattformzugang ausführbar. |
| OfflineEnrichment | `pnpm test`, `pnpm run build`, `pnpm run test:e2e:docker` | Docker-E2E benötigt Docker sowie die im Repository beschriebene Containerumgebung. |
| AirflowDAGs | `python -m pytest` | Benötigt Python-Testabhängigkeiten; Integrationsfälle zusätzlich Airflow, Docker und Test-Objektspeicher. |
| digital-energy-twin_addon | Manifest-/Policy-Prüfung mit einem festgelegten IaC-Scanner | Noch kein repositoryeigener Test- oder Scan-Einstieg vorhanden. |

## Freigaberegel

Ein Release-Kandidat darf sicherheitsseitig nur freigegeben werden, wenn alle P0-Testfälle, die für den bereitgestellten Scope anwendbar sind, `BESTANDEN` sind, keine ungeklärten kritischen oder hohen Befunde bestehen und blockierte P0-Prüfungen vor der Produktivsetzung nachgeholt wurden. P1-/P2-Abweichungen benötigen Risiko, Maßnahme, Verantwortlichen und Termin. Das zugehörige datierte Prüfprotokoll verweist für jedes Ergebnis auf die Testfall-ID dieser Spezifikation und die zugehörige ID der [Sicherheitsrisikomatrix](08-security-risk-matrix.md). BKI-basierte Funktionen dürfen zusätzlich erst freigegeben werden, wenn `BKI-08` bestanden ist und die übrigen für den bereitgestellten Kostenumfang anwendbaren BKI-P0-Testfälle bestanden sind.
