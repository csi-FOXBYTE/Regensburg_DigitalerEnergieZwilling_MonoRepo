# Projektplanung (Entwurf)

Dieses Dokument fasst Planungs- und Backlog-Notizen aus dem UX/UI-Board zusammen. Es dient als Arbeitsgrundlage und ist nicht verbindlich.

---

## Inhaltsverzeichnis

1. [Sprint 1 – Vorschlag](#sprint-1-vorschlag)
2. [Backlog-Struktur (Entwurf)](#backlog-struktur-entwurf)
3. [Testing (vereinbart)](#testing-vereinbart)
4. [Offene Punkte / Klärungsbedarf](#offene-punkte-klaerungsbedarf)

<a id="sprint-1-vorschlag"></a>
## Sprint 1 – Vorschlag

- Funktionale und technische Analyse der Leistungsbeschreibung (LB).
- Abstimmung/Befragung von Stakeholdern.
- Definition der Hauptprozesse: Gebäudedaten → Berechnung → Reporting.

---

<a id="backlog-struktur-entwurf"></a>
## Backlog-Struktur (Entwurf)

- **Epic**: Konzept
- **Feature**: UX/UI
- **Stories**:
  - Backend/Architektur
  - Frontend
  - Datenintegration
  - Berechnung
  - Recherche Geoportal
  - Entwicklungsprozesse (Entwicklungsumgebung, CI/CD, DoR/DoD, Testing)
  - Zugänge und Datenaustausch
  - MVP
  - Entwicklung
  - Deployment

---

<a id="testing-vereinbart"></a>
## Testing (vereinbart)

- Unit-Tests werden dort umgesetzt, wo sie sinnvoll sind: im Backend, im Berechnungskern und in den Konvertern.
- Für das Frontend sind keine Unit-Tests vorgesehen.
- Integrationstests finden nachgelagert statt.
- Vor dem Final Release wird ein Lasttest mit einem zwischen Auftraggeber und Auftragnehmer abgestimmten, realistischen Lastprofil durchgeführt. Eine belastbare erwartete Nutzerzahl ist derzeit nicht vorgegeben; tausende gleichzeitige Aufrufe werden für den vorgesehenen kommunalen Einsatz nicht erwartet.
- Die fachliche Bewertung und Abnahme des Rechenkerns erfolgt durch qualifizierte Energieberatung.
- Automatisierte Tests dienen der technischen Regression. Normative Golden Tests und eine projektweit verbindliche Coverage-Schwelle sind keine zusätzlichen fachlichen Abnahmekriterien.

---

<a id="offene-punkte-klaerungsbedarf"></a>
## Offene Punkte / Klärungsbedarf

- Welche Daten liegen aktuell vor, welche fehlen oder kommen später?
- Wie soll die Integration mit dem Geoportal erfolgen (Modul vs. separater Client)?
- MVP-Umfang und Priorisierung (jetzt vs. später).
