# Sicherheitskonzept

Dieses Kapitel beschreibt das Sicherheitskonzept des Digitaler Energie Zwilling (DEZ) als technische Leitlinie für Planung, Umsetzung und Betrieb. Es konkretisiert die Anforderungen aus den technischen Anforderungen und verankert die Orientierung am BSI IT-Grundschutz.

---

## Inhaltsverzeichnis

1. [Ziele](#ziele)
2. [Geltungsbereich](#geltungsbereich)
3. [BSI-Grundschutz-Bezug (Auswahl)](#bsi-grundschutz-bezug-auswahl)
4. [Mapping: Baustein DEZ-Maßnahmen (Kurzfassung)](#mapping-baustein-dez-massnahmen-kurzfassung)
5. [OWASP Secure Coding Practices: Soll-Ist-Mapping](#owasp-secure-coding-practices-soll-ist-mapping)
6. [Sicherheitsprinzipien](#sicherheitsprinzipien)
7. [Identität, Zugriff und Rollen](#identitaet-zugriff-und-rollen)
8. [Daten- und Datenschutzkonzept](#daten-und-datenschutzkonzept)
9. [Netzwerk- und Plattformschutz](#netzwerk-und-plattformschutz)
10. [Systemhärtung](#systemhaertung)
11. [Logging, Monitoring und Nachvollziehbarkeit](#logging-monitoring-und-nachvollziehbarkeit)
12. [Lieferkette und Open Source](#lieferkette-und-open-source)
13. [Prüfungen und Tests](#pruefungen-und-tests)
14. [Betrieb und Incident-Handling](#betrieb-und-incident-handling)

<a id="ziele"></a>

## Ziele

- Vertraulichkeit, Integrität und Verfügbarkeit der Systeme und Daten sicherstellen.
- Missbrauch öffentlicher Endpunkte verhindern und administrative Zugriffe schützen.
- Datenschutzfreundliche Nutzung ohne Zwang zur Speicherung persönlicher Daten.

---

<a id="geltungsbereich"></a>

## Geltungsbereich

- Öffentlicher Bürger-Client (statische Auslieferung).
- Administrativer Client (geschützter Bereich).
- Backend-API, Datenbank, Konfigurations-Publishing.
- Geplanter serverseitiger BKI-Kostendienst mit lizenzgeschütztem Datenbestand.
- Offline-Datenpipeline (Airflow, Container, externer Datendienst).
- Backend-Redirect für 3D Tiles und extern bereitgestellter Tiles-Dienst.

---

<a id="bsi-grundschutz-bezug-auswahl"></a>

## BSI-Grundschutz-Bezug (Auswahl)

- APP.3.1 Webanwendungen und Webservices.
- APP.3.2 Webserver.
- APP.4.3 Relationale Datenbanksysteme.
- SYS.1.1 Allgemeiner Server.
- NET.1.1 Netzarchitektur und -design.
- NET.3.1 Netzkomponenten.
- OPS.1.1.3 Patch- und Änderungsmanagement.
- CON.8 Software-Entwicklung.

---

<a id="mapping-baustein-dez-massnahmen-kurzfassung"></a>

## Mapping: Baustein DEZ-Maßnahmen (Kurzfassung)

- **APP.3.1 Webanwendungen und Webservices**: Trennung öffentlicher/administrativer Funktionen, serverseitige Validierung, Rate Limiting und Challenge für öffentliche Writes.
- **APP.3.2 Webserver**: Härtung der Auslieferung, TLS erzwingen, minimale Angriffsfläche, keine serverseitige Renderlogik im öffentlichen Client.
- **APP.4.3 Relationale Datenbanksysteme**: Zugriff nur über Backend, rollenbasierte Zugriffe, Audit-Logs für Admin-Aktionen.
- **SYS.1.1 Allgemeiner Server**: Container mit Non-Root, minimale Capabilities, Patch-Management, Secrets-Management.
- **NET.1.1 Netzarchitektur und -design**: Backend nicht direkt aus dem Internet erreichbar, Zugriff über API-Management/Reverse Proxy, Netzwerksegmentierung.
- **NET.3.1 Netzkomponenten**: Standardisierte Schnittstellen, klare Netzgrenzen, Monitoring der Schnittstellen.
- **OPS.1.1.3 Patch- und Änderungsmanagement**: Regelmäßige Updates, dokumentierte Änderungen, Rollback-Strategien.
- **CON.8 Software-Entwicklung**: SDLC nach OWASP, Code-Reviews, Security-Scanning, Penetrationstest vor Go-Live.

---

<a id="owasp-secure-coding-practices-soll-ist-mapping"></a>

## OWASP Secure Coding Practices: Soll-Ist-Mapping

Das Mapping verwendet die Kategorien der [OWASP Secure Coding Practices – Quick Reference Guide v2.1](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/assets/docs/OWASP_SCP_Quick_Reference_Guide_v21.pdf). Es bewertet den dokumentierten und im Quellcode nachvollziehbaren Stand der DEZ-Komponenten. Kontrollen der CIVITAS/CORE-Plattform werden getrennt ausgewiesen, wenn APISIX, Keycloak, Kubernetes oder zentrale Betriebsdienste den Nachweis erbringen müssen.

Bewertungsstand: 17.08.2026.

| OWASP-Bereich | Soll | Ist / Nachweis | Status und offener Punkt |
|---|---|---|---|
| Eingabevalidierung | Nicht vertrauenswürdige Eingaben werden serverseitig typ-, format-, längen- und wertebereichsbezogen validiert; ungültige Eingaben werden abgelehnt. | Fastify-Routen verwenden TypeBox-Schemata. Berechnungseingaben werden im Backend erneut mit der Core-Validierung geprüft und serverseitig berechnet. Die Trennung der Eingabe- und Vertrauensgrenzen ist in der [Daten- und API-Sicht](../architecture/08-data-model-api-view.md#security-by-design-im-daten-und-api-vertrag) dokumentiert. | ⚠️ Teilweise nachgewiesen. Ein komponentenübergreifender Negativtest für Query-, Path-, Header-, Body- und Pipeline-Eingaben sowie Größen- und Komplexitätsgrenzen fehlt. |
| Ausgabekodierung | Nicht vertrauenswürdige Inhalte werden kontextbezogen für HTML, JSON, URL und nachgelagerte Systeme kodiert oder bereinigt. | React übernimmt die standardmäßige HTML-Escapierung; API-Antworten werden als typisierte JSON-Antworten erzeugt. Datenbankzugriffe erfolgen über den ORM-Layer. | ⚠️ Teilweise nachgewiesen. Automatisierte XSS- und Encoding-Tests für Konfigurations-, Markdown-, Fehler- und Exportinhalte fehlen. |
| Authentisierung und Passwortmanagement | Geschützte Funktionen verwenden eine zentrale, bewährte Authentisierung; Prüfungen schlagen bei Fehlern sicher fehl; Zugangsdaten werden nicht in der Anwendung verwaltet oder offengelegt. | Administrative Zugriffe verwenden Keycloak/OIDC. APISIX prüft vorgelagert, das Backend validiert Access Tokens zusätzlich per RS256/JWKS. Das DEZ verwaltet keinen eigenen Passwortspeicher; Details stehen unter [Identität, Zugriff und Rollen](#identitaet-zugriff-und-rollen). | ⚠️ DEZ-seitig weitgehend umgesetzt. Passwort-, MFA-, Sperr- und Recovery-Regeln sowie deren Betriebsnachweis liegen bei Keycloak beziehungsweise dem Plattformbetreiber und sind noch zuzuordnen. |
| Sessionmanagement | Sitzungen und Tokens besitzen sichere Cookies, definierte Laufzeiten und einen wirksamen Logout; Sitzungskennungen erscheinen nicht in URLs, Antworten oder Logs. | Der OIDC-Flow und die geschützte Browser-Sitzung werden durch APISIX und Keycloak bereitgestellt; das Backend akzeptiert ausschließlich das weitergeleitete beziehungsweise als Bearer übermittelte Access Token. | ⚠️ Plattformnachweis offen. Cookie-Attribute, Ablaufzeiten, Token-Erneuerung, Logout und Sitzungsbeendigung müssen in der produktiven APISIX-/Keycloak-Konfiguration geprüft werden. |
| Zugriffskontrolle | Autorisierung wird für jede geschützte Anfrage serverseitig und nach dem Least-Privilege-Prinzip erzwungen; direkte Objektzugriffe und privilegierte Funktionen sind rollenbezogen geschützt. | Öffentliche und administrative Routen sind getrennt. APISIX und Backend bilden zwei Enforcement-Schichten; das Backend prüft die Rollen `manager`, `maintainer` und `admin` fachlich. Die Kontrollpunkte sind in der [Komponentensicht](../architecture/07-architecture-c4-components.md#security-kontrollpunkte) dokumentiert. | ⚠️ Teilweise nachgewiesen. Eine vollständige Positiv-/Negativmatrix aller Admin-Endpunkte, Rollen und Objektzugriffe fehlt. |
| Kryptografische Verfahren und Schlüssel | Kryptografie verwendet etablierte Bibliotheken und sichere Zufallsquellen; Schlüssel und Secrets werden geschützt und kontrolliert verwaltet. | JWT-Signaturen werden mit `jose` und RS256/JWKS geprüft. Lösch- und Wiederherstellungskennungen werden nicht als Passwörter verwaltet. Deployment-Secrets werden über Kubernetes-/Plattformmechanismen injiziert. | ⚠️ Teilweise nachgewiesen. Schlüsselrotation, Secret-Lebenszyklus, Zufallsquellen der fachlichen Tokens und produktive Secret-Berechtigungen müssen explizit geprüft werden. |
| Fehlerbehandlung und Logging | Fehler schlagen sicher fehl und legen keine Interna offen; sicherheitsrelevante Erfolge und Fehlschläge werden strukturiert, manipulationssicher und ohne sensible Inhalte protokolliert. | Das Backend verwendet zentrale Fehlerobjekte und Pino; Admin-Statusänderungen besitzen eine fachliche Änderungshistorie. Vorgaben stehen in [Fehlerbehandlung](04-error-handling.md) und [Logging, Monitoring und Nachvollziehbarkeit](#logging-monitoring-und-nachvollziehbarkeit). | ⚠️ Teilweise nachgewiesen. Vollständige Ereignismatrix, Prüfung auf Token-/Personendaten in Logs, Log-Injection-Schutz, zentrale Auswertung, Zugriffsschutz und Aufbewahrung sind offen. |
| Datenschutz und Schutz gespeicherter Daten | Sensible Daten werden minimiert, zugriffsgeschützt, nicht unnötig zwischengespeichert und fristgerecht gelöscht. | Der Bürgerbereich verlangt keine personenbezogene Anmeldung. Serverübermittlung ist freiwillig; ein tokenbasierter Löschpfad ist vorgesehen. Zweckbindung und Datenflüsse sind im [Datenschutzkonzept](#daten-und-datenschutzkonzept) beschrieben. | ⚠️ Teilweise nachgewiesen. Produktive Aufbewahrungsfristen, Backup-Löschung, Schutz temporärer Artefakte und Berechtigungen der Datenspeicher müssen bestätigt werden. |
| Kommunikationssicherheit | Sensible und authentisierte Kommunikation verwendet TLS ohne unsicheren Fallback; CORS, erlaubte Methoden und externe Vertrauensgrenzen sind restriktiv konfiguriert. | Externe Zugriffe laufen über APISIX; interne Dienste sollen nicht direkt öffentlich erreichbar sein. CORS, Security-Header und TLS-Routing werden im Deployment-Add-on konfiguriert; siehe [Netzwerk- und Plattformschutz](#netzwerk-und-plattformschutz). | ⚠️ Konfiguration vorhanden, produktiver Betriebsnachweis offen. TLS-Versionen und Cipher, Zertifikatskette, direkter Dienstzugriff, CORS und Header müssen gegen die bereitgestellte Instanz geprüft werden. |
| Systemkonfiguration und Härtung | Produktionssysteme laufen mit minimaler Angriffsfläche, aktuellen Komponenten, sicheren Defaults und geringstmöglichen Rechten; Entwicklungsfunktionen sind deaktiviert. | Die Deployment-Templates erzwingen Non-Root-Ausführung und reduzierte Containerrechte. Öffentliche und administrative Komponenten sind getrennt; Images werden digestbasiert referenziert. | ⚠️ Teilweise nachgewiesen. Read-only-Dateisystem, Capabilities, Ressourcenlimits, Netzwerkregeln, Debug-/Testendpunkte und Versionspreisgabe sind vor Produktivsetzung vollständig zu prüfen. |
| Datenbanksicherheit | Datenbankzugriffe sind parametrisiert und typisiert; Anwendungskonten besitzen minimale Rechte; Verbindungsdaten liegen nicht im Quellcode; die Datenbank ist nicht öffentlich erreichbar. | Der Backendzugriff erfolgt über ZenStack/PostgreSQL und eine injizierte `DATABASE_URL`; Clients besitzen keinen direkten Datenbankzugriff. | ⚠️ Teilweise nachgewiesen. Ein dedizierter Least-Privilege-Datenbankbenutzer, konkrete Schema-/Tabellenrechte, Backup-Schutz und produktive Netzisolation sind noch nachzuweisen. |
| Datei- und Artefaktmanagement | Dateipfade, Dateitypen, Größen und Inhalte werden begrenzt und validiert; Upload- und Arbeitsverzeichnisse sind nicht ausführbar; temporäre Daten werden sicher behandelt. | Die Offline-Pipeline verarbeitet definierte CityGML-, CityJSON- und Geodatenformate in getrennten Containern. Die Vertrauensgrenzen sind in der [Pipeline-Architektur](../architecture/10-architecture-offline-data-pipeline.md#security-by-design-pipeline) beschrieben. | ⚠️ Teilweise nachgewiesen. Negativtests für Pfadmanipulation, Symlinks, unerwartete Dateitypen, Größen-/Komplexitätsgrenzen und Dekompressionsbomben fehlen. |
| Speicherverwaltung | Bei nativer Speicherverwaltung werden Grenzen geprüft, Ressourcen sicher freigegeben und unsichere Funktionen vermieden. | Der anwendungseigene Code verwendet überwiegend speichersichere Laufzeiten (TypeScript/JavaScript und Python) und implementiert keine eigene native Speicherverwaltung. | ➖ Für den Anwendungscode nicht direkt anwendbar. Native Laufzeiten und Bibliotheken werden über Lieferketten- und Schwachstellenprüfungen abgedeckt. |
| Allgemeine sichere Codierung | Standardbibliotheken werden bevorzugt; dynamische Code- und Betriebssystemausführung wird vermieden; Nebenläufigkeit, Integrität, Abhängigkeiten und Änderungen werden kontrolliert. | Typisierte Codebasen, Lockfiles, automatisierte Fachtests, getrennte Komponenten und versionierte Konfigurationen sind vorhanden. | ⚠️ Teilweise nachgewiesen. Repoübergreifende verpflichtende Review-/Test-Gates sowie SAST-, Secret-, Dependency-, Container- und IaC-Scans sind nicht durchgängig belegt. |

Ein Status `⚠️` bezeichnet eine vorhandene Umsetzung mit noch fehlendem vollständigem Prüf- oder Betriebsnachweis. `➖` bezeichnet einen begründet nicht direkt anwendbaren Kontrollbereich. Der Abgleich ersetzt weder den separat geforderten Penetrationstest noch Patch-, CVE- und Incident-Management. Festgestellte Abweichungen sind mit Schweregrad, Maßnahme, Verantwortlichem und Termin in der Arbeitsplanung nachzuführen.

---

<a id="sicherheitsprinzipien"></a>

## Sicherheitsprinzipien

- Least Privilege und minimal notwendige Berechtigungen.
- Secure Defaults und Defense in Depth.
- Trennung öffentlicher und administrativer Funktionen.
- Konfigurations- und Datenhoheit über versionierte Freigaben.

---

<a id="identitaet-zugriff-und-rollen"></a>

## Identität, Zugriff und Rollen

- Admin-Zugriff ausschließlich über OIDC (Keycloak).
- Ist ein Nutzer nicht authentifiziert, wird der Login über Keycloak durchgeführt. APISIX schützt die administrativen Routen und übernimmt die vorgelagerte OIDC-Prüfung. Diese Prüfung ist nicht die einzige Vertrauensinstanz: Das Backend validiert das weitergeleitete Access Token in produktiven Umgebungen unabhängig per RS256 gegen die konfigurierte Keycloak-JWKS-Quelle.
- Rollenbasierte Freigaben für Systempflege und Triage. Das Rollenmodell ist in Definition:
  - `manager` (Verwalter): Zugriff auf eingereichte Gebäudedaten und deren Bearbeitung; kein Zugriff auf Systempflege.
  - `maintainer` (Systempfleger): Zugriff auf Systempflege; kein Zugriff auf eingereichte Gebäudedaten.
  - `admin` (Administrator): voller Zugriff auf den internen Client.
- Öffentliche Schreibzugriffe nur mit der globalen APISIX-Policy der externen Deployment-Plattform für Altcha und Rate Limiting sowie serverseitiger fachlicher Validierung im Backend. Bereitstellung, Betrieb und Nachweis der Gateway-Policy liegen außerhalb der DEZ-Repositories.
- Namespace-Policy für APIs:
  - `"/api/admin/*"` ist per Default geschützt; APISIX erzwingt den externen Routenschutz.
  - Das Backend nimmt Access Tokens aus `X-Access-Token` oder `Authorization: Bearer` entgegen, validiert sie produktiv per RS256/JWKS und wertet danach Claims/Rollen für die fachliche Zugriffskontrolle aus.
  - `"/api/public/*"` ist per Default nicht über Backend-Auth-Middleware geschützt; Absicherung erfolgt über APISIX-Policies plus serverseitige Validierung.

---

<a id="daten-und-datenschutzkonzept"></a>

## Daten- und Datenschutzkonzept

- Keine personenbezogene Pflichtdatenerfassung im Bürgerbereich.
- Optionale Übermittlung von Eingaben, stets explizit ausgelöst.
- Notwendige lokale Browser-Speicherung (Local Storage) für persistente Zustandswiederherstellung bei Wiederbesuchen, Consent für optionale serverseitige Speicherung und Matomo-Tracking.
- Hinweise zu `dct:title`, `dct:description`, `dct:publisher`, `dct:license`, `dct:accrualPeriodicity` sowie zu den relevanten `dcat:distribution`-Angaben der verwendeten Datenquellen werden in den Datenschutzhinweisen der DEZ-Webseite ausgewiesen; Verantwortung für Bereitstellung und Pflege liegt beim jeweiligen Betreiber der DEZ-Plattform. Die Auswahl ist auf DCAT-AP.de gemappt, bildet den Standard jedoch nicht vollständig ab.
- Löschprozess mit eindeutiger Identifikation (z.B. Link/QR im PDF).
- Lizenzgeschützte BKI-Kostendaten werden nicht an Clients ausgeliefert. Zulässige Ableitungen, Granularität, Caching, Export und Aufbewahrung werden vor der Implementierung durch ein Lizenz-Gate festgelegt; das Schutzmodell steht in der [Sicherheitsrisikomatrix](08-security-risk-matrix.md#bki-schutzmodell-und-lizenz-gate).

### Tracking-Strategie (verbindliche Festlegung)

- Für Nutzungsanalysen wird Matomo mit genau einer Site-ID für den gesamten öffentlichen Sanierungscheck verbindlich als Analytics-Lösung eingesetzt.
- Tracking und Analytics dürfen ausschließlich nach explizitem Opt-in aktiviert werden.
- Ohne gültiges Opt-in bleiben Tracking-Funktionen standardmäßig deaktiviert.
- Webanalyse und freiwillige Gebäudedatenspende bleiben technisch getrennte Datenströme. Matomo erhält keine Gebäude-, Adress-, Personen-, Verbrauchs-, Kosten- oder Berechnungsrohdaten.
- Gebäudetypen und Sanierungsmaßnahmen dürfen ausschließlich über fachlich freigegebene, niedrig-kardinale Schlüssel aus zentralen Allow-Lists erfasst werden.
- Vor produktiver Aktivierung sind Eventkatalog, Zweckbindung, Aufbewahrungsfristen, Anonymisierungsregeln, Löschkonzept und Rollen-/Rechtekonzept verbindlich zu dokumentieren und freizugeben.
- Der verbindliche fachliche Zielstand, Eventkatalog, die KPI-Definitionen und Abnahmekriterien sind im [Matomo-Trackingkonzept](06-matomo-trackingkonzept.md) dokumentiert.
- Diese Leitplanken konkretisieren insbesondere FA-115 bis FA-117 und FA-119 bis FA-124 sowie TA-129 bis TA-132 und TA-143 bis TA-150.

---

<a id="netzwerk-und-plattformschutz"></a>

## Netzwerk- und Plattformschutz

- Verschlüsselte Datenübertragung (TLS) für alle externen Zugriffe.
- Backend nicht direkt aus dem Internet erreichbar; Zugriff über API-Management (APISIX).
- Route-Schutz (public/protected) wird zentral im API-Gateway definiert und versioniert (lokal: `.devcontainer/apisix/apisix.yaml`).
- APISIX ist der verbindliche externe Enforcement-Point für Routenschutz und die vorgelagerte JWT/OIDC-Prüfung.
- Das Backend bildet eine eigenständige zweite Enforcement-Schicht: Es übernimmt das Access Token aus `X-Access-Token` oder `Authorization: Bearer`, prüft Signatur und zeitliche Gültigkeit erneut per RS256/JWKS und erzwingt die fachlichen Rollen und Berechtigungen. Eine alleinige Freigabe durch APISIX reicht für administrative Aktionen nicht aus.
- Keycloak stellt das Access Token aus. APISIX kann es im OIDC-Flow über das geschützte Browser-Cookie verarbeiten; das Backend erhält das Token über `X-Access-Token` oder `Authorization: Bearer` und führt darauf seine unabhängige Prüfung aus.
- Die externe Deployment-Plattform betreibt APISIX als Enforcement-Point für die globale Altcha- und Rate-Limit-Policy bei öffentlichen Schreibzugriffen. Die DEZ-Repositories setzen diese Policy voraus, stellen sie aber nicht selbst bereit; der Betriebsnachweis ist daher auf Plattformebene zu führen.
- Datenbankzugriff nur aus dem Backend, keine direkten Client-Verbindungen.

---

<a id="systemhaertung"></a>

## Systemhärtung

- Container mit minimalen Rechten (Non-Root, minimale Capabilities).
- Secrets ausschließlich über Secrets-Management.
- Regelmäßige Sicherheitsupdates und Patch-Management.

---

<a id="logging-monitoring-und-nachvollziehbarkeit"></a>

## Logging, Monitoring und Nachvollziehbarkeit

- Protokollierung von Nutzeraktionen, Systemprozessen und Fehlerereignissen.
- Maschinenlesbare Logs mit Standard-Log-Levels (DEBUG, INFO, WARN, ERROR, FATAL).
- Container schreiben Logs standardmäßig auf `stdout`/`stderr`; die zentrale Aggregation erfolgt über die Kubernetes-Plattform.
- Die dynamische Anpassung der wirksamen Log-Level zur Laufzeit ist der CIVITAS/CORE-Plattform zugeordnet und wird durch den Plattformbetreiber gesteuert.
- Das Backend nutzt Pino als strukturierten Standard-Logger von Fastify.
- Die statischen Frontends nutzen den Standard-Logger von nginx; Requests auf nicht-HTML-Assets werden dabei nicht protokolliert.
- Audit-Logs für Admin-Aktionen inkl. Zeitstempel und Benutzerkennung.
- Physische Löschungen erzeugen einen separaten, zielreferenzfreien Audit-Datensatz. Einreichungs-ID, Gebäude-ID, Adresse, Koordinaten und Lösch-Token werden dort nicht gespeichert. Die Zuordnung zu einer konkreten Löschung ist nur mit dem an den Aufrufer ausgegebenen vollständigen Löschbeleg möglich.
- URL-Pfadparameter der Capability-Routen sind in Backend-, Gateway- und Webserver-Logs zu redigieren. Insbesondere darf der Lösch-Token nicht in zentralen Protokollen persistiert werden. Die konkrete Konfiguration der vorgelagerten CIVITAS/CORE-Komponenten ist vor Produktivsetzung zu bestätigen.

---

<a id="lieferkette-und-open-source"></a>

## Lieferkette und Open Source

- Abhängigkeiten werden über CVE-Management beobachtet.
- SBOM wird gepflegt und mit Releases veröffentlicht.
- Sicherheits- und Bug-Kontaktstellen sind definiert.

---

<a id="pruefungen-und-tests"></a>

## Prüfungen und Tests

- Secure Development Lifecycle nach OWASP.
- Code-Reviews und automatisierte Tests als Standard.
- Penetrationstest vor Go-Live.
- Die [Sicherheitsrisikomatrix](08-security-risk-matrix.md) priorisiert die Angriffsszenarien und ist vor jedem Produktivrelease sowie bei wesentlichen Architekturänderungen zu aktualisieren.
- Die konkreten Testfälle, Prioritäten, Ausführungsorte und Nachweisanforderungen sind in der [Security-Testspezifikation](07-security-test-specification.md) festgelegt.
- Tatsächliche Läufe und Befunde werden in datierten Prüfprotokollen dokumentiert und auf Risiken sowie Testfall-IDs zurückgeführt.

---

<a id="betrieb-und-incident-handling"></a>

## Betrieb und Incident-Handling

- Zuständigkeiten für Betrieb und Support sind separat dokumentiert.
- Sicherheitsvorfälle werden klassifiziert, priorisiert und nachvollziehbar dokumentiert.
- Fällt ein Container wegen eines Health-Fehlers aus, erfolgt der Wiederanlauf im Regelbetrieb automatisiert über Kubernetes.
