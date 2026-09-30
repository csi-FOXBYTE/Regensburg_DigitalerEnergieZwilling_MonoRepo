# Architektur – Manuelles Deployment ohne Kubernetes/Cluster (nicht empfohlen)

## Inhaltsverzeichnis

1. [Ziel dieses Kapitels](#ziel-dieses-kapitels)
2. [Ausgangslage](#ausgangslage)
3. [Kopplungen an CIVITAS/CORE im aktuellen Add-on](#kopplungen-an-civitascore-im-aktuellen-add-on)
4. [Einordnung und klare Empfehlung](#einordnung-und-klare-empfehlung)
5. [Risiken und Betriebsnachteile](#risiken-und-betriebsnachteile)
6. [Was man manuell dauerhaft übernehmen muss](#was-man-manuell-dauerhaft-uebernehmen-muss)
7. [Mindestanforderungen für Ausnahmefälle](#mindestanforderungen-fuer-ausnahmefaelle)

<a id="ziel-dieses-kapitels"></a>
## Ziel dieses Kapitels

Dieses Kapitel beschreibt, wie der Digitale Energie Zwilling (DEZ) vollständig manuell betrieben werden kann:

- ohne Kubernetes
- ohne Cluster
- ohne Ansible-Tasks aus CIVITAS/CORE

Grundlage ist die Analyse des Add-on-Repositories `Regensburg_DigitalerEnergieZwilling_digital-energy-twin_addon`.
Der Fokus dieses Kapitels ist ausdrücklich eine belastbare Entscheidungsgrundlage gegen diesen Betriebsweg.

---

<a id="ausgangslage"></a>
## Ausgangslage

Das bestehende Add-on deployt und konfiguriert drei Container:

- Admin-Frontend
- Public-Frontend
- Backend

Zusätzlich konfiguriert das Add-on zur Laufzeit:

- Ingress-Einträge für die drei Hosts (in Kubernetes)
- APISIX-Upstreams und APISIX-Routen
- OIDC-Client und Rollen (`manager`, `maintainer`, `admin`) in Keycloak
- Backend-Datenbankzugang aus zentralem CIVITAS/CORE-DB-Secret

---

<a id="kopplungen-an-civitascore-im-aktuellen-add-on"></a>
## Kopplungen an CIVITAS/CORE im aktuellen Add-on

Die aktuelle Implementierung ist an zentrale CIVITAS/CORE-Bausteine gekoppelt:

- **Konfigurationsmodell** über `inv_*`-Variablen (`inv_access`, `inv_k8s`, `inv_central_db`, `DOMAIN`)
- **Identity-Integration** über Keycloak-Admin-API und den Import von `tasks/access/apis/idm_settings_for_apis.yaml`
- **Gateway-Integration** über APISIX-Admin-API (`api-admin.<DOMAIN>`) inklusive Plugins (`openid-connect`, `cors`, `limit-count`, `response-rewrite`)
- **Datenbankbindung** über Secret-Lookup in der zentralen DB-Namespace (`postgres.central-db.credentials.postgresql.acid.zalan.do`)
- **Ingress/TLS** über CIVITAS/CORE-Parameter (`ingressClass`, cert-manager issuer, CA-Pfade)

Folge: Das Add-on ist kein Standalone-Installer. Ohne CIVITAS/CORE müssen alle Infrastruktur- und Security-Bausteine manuell bereitgestellt werden.

---

<a id="einordnung-und-klare-empfehlung"></a>
## Einordnung und klare Empfehlung

Manuelles Deployment ohne Kubernetes/Cluster wird für DEZ **nicht empfohlen**.

Begründung:

- Das bestehende Add-on automatisiert zentrale Sicherheits- und Betriebsaufgaben, die im manuellen Betrieb vollständig in Eigenverantwortung liegen.
- Der Betriebsaufwand steigt dauerhaft, nicht nur beim initialen Setup.
- Die Fehlerrate steigt typischerweise bei Routing, OIDC-Konfiguration, Zertifikatsbetrieb und Secret-Handling.
- Das Betriebsrisiko verschiebt sich von einer standardisierten Plattform zu projektindividuellem Betrieb.

Empfehlung: Produktiver Betrieb soll auf dem vorgesehenen CIVITAS/CORE-Betriebsmodell erfolgen.

---

<a id="risiken-und-betriebsnachteile"></a>
## Risiken und Betriebsnachteile

Die folgenden Risiken sind im manuellen Deployment regelmäßig zu erwarten:

- **Sicherheitsrisiko**: OIDC-Flows, Gateway-Regeln sowie die davon unabhängige Token- und Rollenprüfung im Backend können inkonsistent oder unvollständig umgesetzt werden.
- **Compliance-Risiko**: Security-Header, CORS und Rate-Limits werden nicht einheitlich gepflegt.
- **Betriebsrisiko**: Zertifikatsablauf, DNS-Fehler und Secret-Rotation müssen manuell überwacht werden.
- **Verfügbarkeitsrisiko**: Fehlende Cluster-Mechanismen (Self-Healing, Rolling Update, standardisierte Probes) erhöhen Ausfallwahrscheinlichkeit.
- **Wartungsrisiko**: Plattformwissen bleibt personengebunden; Übergaben und Onboarding werden aufwändiger.
- **Kostenrisiko**: Kurzfristig einfache Umsetzung führt mittelfristig zu höheren Betriebs- und Entstörungskosten.
- **Upgrade-Risiko**: Versionsupdates erfolgen nicht über den standardisierten CIVITAS/CORE-Upgradepfad, sondern manuell und damit fehleranfälliger.

---

<a id="was-man-manuell-dauerhaft-uebernehmen-muss"></a>
## Was man manuell dauerhaft übernehmen muss

Wer dennoch manuell deployt, übernimmt dauerhaft:

- Provisionierung und Betrieb von `admin`, `public`, `backend`
- vollständige Gateway-Konfiguration für `admin_host`, `public_host`, `backend_host`
- OIDC-Client-Lifecycle (Anlage, Secret-Rotation, Redirect-URI-Pflege, Rollenmodell)
- Betrieb der Sicherheitskontrollen (`openid-connect`, Gateway-Routenschutz, unabhängige Token-/Rollenprüfung im Backend, CORS, Rate-Limit, Security-Header)
- TLS-/Zertifikatsmanagement inklusive Erneuerung und Monitoring
- Secret-Management für Datenbank und OIDC
- Incident-Handling bei Auth-/Routing-/Zertifikatsfehlern
- laufende Regressionstests nach jeder Änderung an Gateway, Identity oder DNS
- Planung und Durchführung von Upgrades (Images, Gateway-Regeln, OIDC-Konfiguration, DB-Migrationen) ohne Plattformautomatisierung

---

<a id="mindestanforderungen-fuer-ausnahmefaelle"></a>
## Mindestanforderungen für Ausnahmefälle

Nur wenn der manuelle Betrieb zwingend ist, gelten mindestens:

- [ ] Architekturentscheidung mit Begründung und expliziter Risikoübernahme dokumentiert
- [ ] Betriebsteam mit Keycloak-, Gateway-, TLS- und DEZ-Backend-Kompetenz benannt
- [ ] Runbooks für Zertifikatswechsel, Secret-Rotation, OIDC-Fehler, Rollback vorhanden
- [ ] Monitoring/Alerting für Zertifikate, Auth-Fehler, 4xx/5xx, Latenz und Verfügbarkeit aktiv
- [ ] Regelmäßige Security- und Regressionstests eingeplant
- [ ] Upgrade-Runbook mit Wartungsfenstern, Rollback-Strategie und Vorabtests vorhanden
- [ ] Klare Rückfallstrategie auf standardisiertes CIVITAS/CORE-Deployment definiert

Fazit: Manuelles Deployment ist für DEZ ein Ausnahmeweg mit hohem Betriebsrisiko und sollte nicht als Standard etabliert werden.
