# Matomo-Trackingkonzept und Eventkatalog

> **Status:** Fachlicher Zielstand, Stand 14. August 2026  
> **Umsetzungsstand:** Matomo und Consent-Management sind im Public-Frontend noch nicht produktiv aktiviert und aktuell niedrig priorisiert. Entgegen der früheren Annahme steht keine zugängliche Matomo-Instanz des Auftraggebers bereit. Eine eigene Instanz sowie Betrieb und Zuständigkeiten müssen abgestimmt werden; die Umsetzung in Sprint 18 oder 19 ist nicht verbindlich zugesagt. Die technische Anbindung ist im Public-Frontend vorbereitet und bleibt inaktiv, solange für die Umgebung keine Matomo-Instanz konfiguriert ist (siehe [Technische Umsetzung](#technische-umsetzung)).  
> **Geltungsbereich:** Öffentlicher Teil des Sanierungstools des Digitalen Energie Zwillings (DEZ)

## Inhaltsverzeichnis

1. [Ziel und Auswertungszwecke](#ziel-und-auswertungszwecke)
2. [Verbindliche Festlegungen](#verbindliche-festlegungen)
3. [Trennung der Datenströme](#trennung-der-datenstroeme)
4. [Consent und Sitzungsbezug](#consent-und-sitzungsbezug)
5. [Eventkatalog](#eventkatalog)
6. [Zulässige und unzulässige Parameter](#zulaessige-und-unzulaessige-parameter)
7. [Funnel-Schritte](#funnel-schritte)
8. [Kennzahlen](#kennzahlen)
9. [Betriebsparameter und Berichtszugriff](#betriebsparameter-und-berichtszugriff)
10. [Abnahmekriterien](#abnahmekriterien)
11. [Änderungsprozess](#aenderungsprozess)
12. [Technische Umsetzung](#technische-umsetzung)

<a id="ziel-und-auswertungszwecke"></a>

## Ziel und Auswertungszwecke

Matomo dient ausschließlich der Webanalyse des Sanierungstools. Die Auswertung soll beantworten:

- wie viele eingewilligte Sitzungen den Sanierungscheck beginnen und abschließen,
- an welchen fachlichen Abschnitten Sitzungen den Prozess verlassen,
- wie häufig Ergebnisbericht, Beratungskontakt und freiwillige Datenspende genutzt werden,
- welche fachlich freigegebenen Gebäudetypen und Sanierungsmaßnahmen in aggregierten Auswertungen vorkommen,
- an welchen Abschnitten Hilfetexte oder die Nutzerführung verbessert werden sollten.

Die Kennzahlen bewerten Nutzung und Nutzerführung des Werkzeugs. Sie ersetzen weder fachliche Gebäudedaten noch die getrennte Gebäudedatenspende.

<a id="verbindliche-festlegungen"></a>

## Verbindliche Festlegungen

- Für den gesamten öffentlichen Sanierungscheck wird genau eine Matomo-Site-ID verwendet.
- Matomo wird ausschließlich nach ausdrücklichem Opt-in aktiviert.
- Vor der Einwilligung werden weder Matomo-Skripte geladen noch Matomo-Endpunkte aufgerufen oder Ereignisse zwischengespeichert.
- Ereignisse vor dem Opt-in werden nach einer späteren Einwilligung nicht rückwirkend übertragen.
- Matomo verarbeitet ausschließlich Ereignisse und Parameter aus dem freigegebenen Eventkatalog und den zugehörigen Allow-Lists.
- Gebäudetypen und Sanierungsmaßnahmen dürfen nur über fachlich freigegebene, niedrig-kardinale Schlüssel erfasst werden.
- Matomo erhält keine Gebäude-, Adress-, Personen-, Verbrauchs-, Kosten- oder Berechnungsrohdaten.
- Die tatsächlichen Daten einer freiwilligen Gebäudedatenspende werden nicht über Matomo übertragen.
- Auswertungen und Dashboards werden aggregiert bereitgestellt. Für Auswertungen von Maßnahmenkombinationen ist vor Produktivbetrieb eine Mindestfallzahl festzulegen.

Das Konzept einschließlich der aggregierten Erfassung von Gebäudetypen und Sanierungsmaßnahmen wurde mit den zuständigen ISB-/DSB-Kollegen ohne geäußerte Bedenken besprochen. Diese fachliche Abstimmung ersetzt nicht die noch ausstehende Festlegung und technische Prüfung der Betriebsparameter.

<a id="trennung-der-datenstroeme"></a>

## Trennung der Datenströme

| Datenstrom | Zweck | Inhalt | Übertragungsweg |
| --- | --- | --- | --- |
| Matomo-Webanalyse | Nutzungs-, Funnel- und Conversion-Auswertung | Freigegebene Ereignisse, semantische Schritt-ID, fachlich freigegebene Kategorieschlüssel und zufälliger Sitzungsbezug | Zentraler Tracking-Adapter des Public-Frontends zur noch bereitzustellenden und betrieblich abzustimmenden eigenen Matomo-Instanz |
| Freiwillige Gebäudedatenspende | Fachliche Nutzung ausdrücklich bereitgestellter Gebäude- und Berechnungsdaten | Separat eingewilligte Einreichungsdaten gemäß Datenschutzhinweisen und Backend-Schema | Public-Frontend über die öffentliche API zum Backend |

`donation_started` und `donation_completed` bilden in Matomo nur Beginn und Abschluss des Einreichungsprozesses ab. Sie enthalten weder die Einreichung selbst noch eine Einreichungs-, Gebäude- oder Löschkennung.

<a id="consent-und-sitzungsbezug"></a>

## Consent und Sitzungsbezug

- Der Consent-Status für Webanalyse ist von technisch notwendiger lokaler Speicherung und von der gesonderten Einwilligung zur Gebäudedatenspende getrennt.
- Erst nach Opt-in erzeugt der Tracking-Adapter einen zufälligen, nicht aus Nutzungs- oder Gebäudedaten abgeleiteten Sitzungsbezug.
- Der Sitzungsbezug darf nicht als dauerhafte, kommunenübergreifende oder anwendungsübergreifende Nutzerkennung eingesetzt werden.
- Widerruft ein Nutzer die Einwilligung, werden weitere Matomo-Aufrufe sofort unterbunden und lokal gespeicherte Matomo-Kennungen nach Maßgabe der freigegebenen Konfiguration entfernt.
- Sitzungsdauer, Inaktivitäts-Timeout, eingesetzte Cookies oder sonstige Speichertechniken und deren Laufzeiten sind vor Produktivbetrieb verbindlich festzulegen.
- Ohne freigegebene dauerhafte Besucherkennung bezeichnen Kennzahlen eingewilligte Sitzungen beziehungsweise Besuche und nicht eindeutig identifizierte Personen.

<a id="eventkatalog"></a>

## Eventkatalog

Für alle Ereignisse wird die Kategorie `Sanierungstool` verwendet. Eventcodes und Parameter werden technisch als Allow-List umgesetzt.

| Eventcode | Trigger | Zulässige Parameter | Auswertungszweck |
| --- | --- | --- | --- |
| `tool_started` | Aufruf des ersten fachlichen Bearbeitungsschritts nach Betätigung des Start-Buttons | keine | Begonnene Sanierungschecks |
| `step_completed` | Vollständiger Abschluss eines definierten Funnel-Schritts und Wechsel zum nächsten Schritt | `step_id` aus der Funnel-Allow-List | Funnel und letzter vollständig bearbeiteter Abschnitt |
| `building_type_confirmed` | Bestätigung oder Übernahme eines Gebäudetyps im zugehörigen Eingabeabschnitt | `building_type_key` aus der versionierten fachlichen Allow-List | Aggregierte Verteilung der Gebäudetypen |
| `renovation_measure_confirmed` | Bestätigung der Maßnahmenauswahl; je ausgewählter Maßnahme ein Ereignis | `measure_key` aus der versionierten fachlichen Allow-List | Aggregierte Maßnahmenhäufigkeiten und, nach Mindestfallzahl, Kombinationen |
| `tool_completed` | Erstes Erreichen der Ergebnisseite nach vollständigem Bearbeitungsprozess | keine | Abgeschlossene Sanierungschecks und Abschlussquote |
| `pdf_downloaded` | Auslösen des PDF-Exports | `document_type` mit freigegebenem konstantem Wert | Nutzung des Ergebnisberichts |
| `contact_requested` | Aufruf des freigegebenen Beratungskontakts oder erfolgreiches Absenden eines später implementierten Kontaktformulars | `contact_channel` aus der Allow-List | Übergang zur Energieberatung |
| `donation_started` | Öffnen beziehungsweise Starten des gesonderten Prozesses zur freiwilligen Gebäudedatenspende | keine | Beginn des Einreichungsprozesses |
| `donation_completed` | Technisch bestätigter erfolgreicher Abschluss der freiwilligen Gebäudedatenspende | keine | Abschluss und Quote der Datenspende |

Wiederholte UI-Renderings oder technische Retries dürfen kein zusätzliches fachliches Ereignis erzeugen. Die Implementierung muss je Ereignistyp einen geeigneten Schutz vor unbeabsichtigter Mehrfacherfassung vorsehen.

<a id="zulaessige-und-unzulaessige-parameter"></a>

## Zulässige und unzulässige Parameter

Zulässig sind ausschließlich:

- die in diesem Dokument festgelegten Eventcodes,
- semantische `step_id`-Werte,
- versionierte Schlüssel für Gebäudetypen und Sanierungsmaßnahmen,
- niedrig-kardinale, fachlich freigegebene Kanal- oder Dokumenttypen,
- technisch notwendige, datensparsam konfigurierte Matomo-Angaben nach Opt-in.

Insbesondere unzulässig sind:

- Gebäude-ID, Einreichungs-ID, Lösch-Token oder andere Objektkennungen,
- Adresse, Hausnummer, Flurstück, Koordinaten oder Kartenausschnitt,
- Name, E-Mail-Adresse, Freitext oder andere direkte Kontaktdaten,
- exakte Verbrauchs-, Kosten-, Flächen-, Alters-, Personen- oder Berechnungswerte,
- vollständige Eingabe-, Ergebnis-, Berichts- oder Einreichungsobjekte,
- URL-Queryparameter oder URL-Fragmente mit Sitzungs-, Wiederherstellungs-, Einreichungs- oder Löschdaten,
- Hashes, Pseudonyme oder abgeleitete Kennungen aus einem der ausgeschlossenen Werte,
- frei befüllbare Eventnamen oder Parameterwerte außerhalb der Allow-Lists.

Die Maßnahmenauswahl wird je freigegebenem `measure_key` erfasst. Eine vollständige Kombination wird nicht als frei zusammengesetzter String übertragen, sondern ausschließlich aus den freigegebenen Einzelereignissen einer eingewilligten Sitzung aggregiert.

<a id="funnel-schritte"></a>

## Funnel-Schritte

Die technische Erfassung verwendet semantische IDs statt instabiler Schrittzahlen. UI-Screens dürfen mehrere fachliche Schritte zusammenfassen; die IDs bleiben bei rein visuellen Änderungen stabil.

| `step_id` | Fachlicher Abschnitt |
| --- | --- |
| `landing` | Einstieg und Start des Sanierungschecks |
| `building_selection` | Karte oder Adresssuche vor Auswahl eines Gebäudes |
| `initial_assessment` | Ersteinschätzung nach Gebäudeauswahl |
| `building_data` | Allgemeine Gebäudedaten |
| `building_envelope` | Außenbauteile und Gebäudehülle |
| `heating` | Wärmeversorgung |
| `electricity_renewables` | Strom und erneuerbare Energien |
| `renovation_measures` | Auswahl der Sanierungsmaßnahmen |
| `results` | Ergebnisse und Vergleich |
| `pdf_export` | Ergebnisbericht |
| `consulting_contact` | Kontakt zur Energieberatung |
| `data_donation` | Gesonderter Prozess der freiwilligen Gebäudedatenspende |

Vor Implementierung ist jede `step_id` genau einem fachlichen Abschlusskriterium und der zugehörigen Frontend-Route beziehungsweise UI-Zustandsänderung zuzuordnen. Ein Abbruchabschnitt ist der letzte vollständig bearbeitete Schritt einer gestarteten, nach dem festgelegten Session-Timeout nicht abgeschlossenen Sitzung.

### Zuordnung der Abschlusskriterien

Das Public-Frontend besitzt keine Routen je Schritt; die Schritte sind UI-Zustände einer Seite. Ereignisse werden ausschließlich durch ausdrückliche Nutzeraktionen ausgelöst. Wiederherstellungen aus dem Browser oder über Wiederherstellungslinks, Zurück-Navigation, Sprünge über die Fortschrittsleiste und „Neu beginnen“ erzeugen keine Ereignisse. Eine über einen Wiederherstellungslink direkt geöffnete Ergebnisseite zählt daher nicht als `tool_completed`.

| `step_id` | Abschlusskriterium | Zusätzliche Ereignisse |
| --- | --- | --- |
| `landing` | „Jetzt starten“ auf der Einstiegsseite betätigt | `tool_started` |
| `building_selection` | Gebäude per Klick in der Karte oder über die Adresssuche ausgewählt; Gebäudeverweise per externem Link zählen nicht | – |
| `initial_assessment` | „Jetzt Sanierungsvorschlag ermitteln“ in der Ersteinschätzung betätigt; „Dort weitermachen“ setzt eine gespeicherte Bearbeitung fort und zählt nicht | – |
| `building_data` | „Weiter“ im Schritt Allgemeine Daten betätigt | `building_type_confirmed` mit dem übernommenen oder geänderten Gebäudetyp |
| `building_envelope` | „Weiter“ im Schritt Außenbauteile des Gebäudes betätigt | – |
| `heating` | „Weiter“ im Schritt Wärmeversorgung betätigt | – |
| `electricity_renewables` | „Weiter“ im Schritt Strom & erneuerbare Energien betätigt | – |
| `renovation_measures` | „Ergebnis anzeigen“ im Schritt Sanierungsmaßnahmen betätigt | je ausgewählter Maßnahme `renovation_measure_confirmed` |
| `results` | Ergebnisseite durch denselben Schritt erstmals erreicht | `tool_completed` |
| `pdf_export` | PDF-Bericht erfolgreich erzeugt | `pdf_downloaded` mit `document_type = energy_report_pdf` |
| `consulting_contact` | Link zur Energieberatung auf der Ergebnisseite angeklickt (auch Mittelklick) | `contact_requested` mit `contact_channel = energy_advice_link` |
| `data_donation` | Einreichung der Datenspende vom Backend erfolgreich bestätigt | `donation_completed` |

`donation_started` wird ausgelöst, wenn der Download mit gesetzter Einwilligung zur Datenspende gestartet wird, unmittelbar vor der Übermittlung an das Backend. Ein eigener Prozess zur Datenspende existiert derzeit nicht. Der im PDF-Bericht abgedruckte Beratungslink kann technisch nicht erfasst werden.

**Fachlich zu klären:** `tool_started` entsteht nur über den Start-Button der Einstiegsseite. Sitzungen, die eine gespeicherte Bearbeitung fortsetzen, über einen externen Gebäudelink einsteigen oder nach dem Session-Timeout mitten im Ablauf neu beginnen, können `tool_completed` ohne `tool_started` enthalten. Mit den verbindlichen Definitionen kann die Abschlussquote dadurch über 100 % liegen und die Abbruchquote negativ werden. Vor Produktivbetrieb ist festzulegen, ob der Nenner auf Sitzungen mit `tool_started` und `tool_completed` eingeschränkt oder `tool_started` zusätzlich bei Fortsetzungen ausgelöst wird.

### Kategorieschlüssel (Katalogversion 1)

| Parameter | Zulässige Werte |
| --- | --- |
| `building_type_key` | `single_family`, `multi_family` |
| `measure_key` | `envelope_roof`, `envelope_top_floor`, `envelope_bottom_floor`, `envelope_outer_walls`, `envelope_windows`, `envelope_roof_windows`, `heating_system_renewal`, `heating_air_source_heat_pump`, `heating_ground_source_heat_pump`, `heating_wood_pellet_boiler`, `heating_biogas_condensing_boiler`, `heating_district_heating`, `heating_surface_radiant` |
| `document_type` | `energy_report_pdf` |
| `contact_channel` | `energy_advice_link` |

Die Maßnahmenschlüssel werden aus den Renovierungskennungen des Rechenkerns und der Standardkonfiguration abgebildet. Heizungsmaßnahmen, die eine später veröffentlichte Konfiguration ergänzt, haben keinen Schlüssel und werden nicht übertragen, bis der Katalog nach dem Änderungsprozess erweitert ist.

<a id="kennzahlen"></a>

## Kennzahlen

Die folgenden Definitionen sind für Dashboards verbindlich. Gezählt werden jeweils eingewilligte Sitzungen im ausgewählten Berichtszeitraum.

| Kennzahl | Definition |
| --- | --- |
| Tool gestartet | Sitzungen mit mindestens einem `tool_started` |
| Tool abgeschlossen | Sitzungen mit mindestens einem `tool_completed` |
| Abschlussquote | Sitzungen mit `tool_completed` geteilt durch Sitzungen mit `tool_started` |
| PDF heruntergeladen | Sitzungen mit mindestens einem `pdf_downloaded` |
| PDF-Quote | Sitzungen mit `pdf_downloaded` geteilt durch Sitzungen mit `tool_completed` |
| Kontaktaufnahme Energieberatung | Sitzungen mit mindestens einem `contact_requested` |
| Kontaktquote | Sitzungen mit `contact_requested` geteilt durch Sitzungen mit `tool_completed` |
| Datenspende abgeschlossen | Sitzungen mit mindestens einem `donation_completed` |
| Datenspendequote | Sitzungen mit `donation_completed` geteilt durch Sitzungen mit `tool_completed` |
| Abbruchabschnitte | Verteilung der letzten `step_completed`-Ereignisse gestarteter Sitzungen ohne `tool_completed` |
| Abbruchquote | Eins minus Abschlussquote |

Alternative Nenner oder zusätzliche Segmentierungen dürfen nur nach fachlicher Freigabe als eigene, eindeutig bezeichnete Kennzahl ergänzt werden.

<a id="betriebsparameter-und-berichtszugriff"></a>

## Betriebsparameter und Berichtszugriff

Vor Produktivbetrieb sind verbindlich zu dokumentieren und freizugeben:

- URL und Betreiber der Matomo-Instanz,
- produktive Site-ID und umgebungsspezifische Konfiguration,
- eingesetzte Cookies oder sonstige Speichertechniken einschließlich Laufzeiten,
- Sitzungs- und Inaktivitäts-Timeout,
- IP-Anonymisierung und Ausschluss der IP-Adresse als Analysekennung,
- Aufbewahrungs-, Lösch- und gegebenenfalls Aggregationsfristen,
- Rollen, Rechte und konkrete Berichtsempfänger,
- Mindestfallzahl für Auswertungen von Maßnahmenkombinationen,
- freigegebene Versionen der Event-, Funnel- und Parameter-Allow-Lists.

<a id="abnahmekriterien"></a>

## Abnahmekriterien

Vor Aktivierung in der Produktivumgebung ist mindestens nachzuweisen:

1. Ohne Opt-in werden keine Matomo-Ressourcen geladen, keine Matomo-Requests gesendet und keine Ereignisse zur späteren Übermittlung gespeichert.
2. Nach Widerruf werden keine weiteren Analyseereignisse übertragen.
3. Alle Eventcodes und Parameter werden zentral gegen die freigegebenen Allow-Lists validiert.
4. Ausgeschlossene Daten erscheinen weder in Eventdaten noch in Seitentiteln, URLs, Referrern oder benutzerdefinierten Dimensionen.
5. URLs werden ohne sensible Queryparameter und Fragmente an Matomo übergeben.
6. Gebäudedatenspende und Matomo-Aufrufe verwenden getrennte Datenobjekte und Übertragungswege.
7. Eventtrigger, Deduplizierung und KPI-Berechnungen sind automatisiert und in einer freigegebenen Testumgebung geprüft.
8. Datenschutzhinweise, Consent-Text und tatsächliche Matomo-Konfiguration stimmen überein.

<a id="aenderungsprozess"></a>

## Änderungsprozess

Neue Events, Parameter, Funnel-Schritte, Werte oder Auswertungszwecke dürfen nicht allein durch Frontend-Änderungen eingeführt werden. Erforderlich sind:

1. fachliche Beschreibung von Zweck, Trigger und gewünschter Auswertung,
2. Datenschutzprüfung einschließlich Datenminimierung und Kardinalität,
3. Aktualisierung dieses Eventkatalogs und der Allow-Lists,
4. technische Umsetzung und automatisierte Prüfung,
5. Aktualisierung der Datenschutzhinweise, sofern sich die dort beschriebene Verarbeitung ändert,
6. Freigabe vor produktiver Aktivierung.

<a id="technische-umsetzung"></a>

## Technische Umsetzung

- Das Backend liefert unter `GET /api/public/analytics-config` die Tracker-URL und Site-ID der Umgebung aus den Variablen `MATOMO_URL` und `MATOMO_SITE_ID`. Fehlt einer der Werte, ist die Antwort `{ "matomo": null }`; das Public-Frontend bietet die Webanalyse dann in den Datenschutzeinstellungen nicht an und sendet nichts.
- Die Einwilligung zur Webanalyse ist ein eigener Zweck (`analytics`) neben der optionalen lokalen Speicherung. Entscheidungen, die vor dem Angebot der Webanalyse getroffen wurden, bleiben für die lokale Speicherung gültig; der Einwilligungsdialog wird nach Aktivierung jedoch einmalig erneut angezeigt. Der Dialog wartet beim Seitenaufruf höchstens drei Sekunden auf die Konfiguration, damit er nicht nachträglich über anderen Dialogen erscheint. Wer bei der erneuten Abfrage optionale Speicherung ablehnt, widerruft damit auch die bisher erteilte Einwilligung zur lokalen Speicherung; gespeicherte Bearbeitungsstände werden dann entfernt.
- Der zentrale Tracking-Adapter (`apps/frontend/src/lib/analytics`) validiert Eventcode und Parameter gegen den versionierten Katalog, verwirft Ereignisse ohne Konfiguration oder Einwilligung ohne Zwischenspeicherung und dedupliziert je Sitzung.
- Es wird kein Matomo-Skript geladen. Ereignisse werden über die Bulk-Schnittstelle der Matomo-HTTP-Tracking-API ohne Cookies und ohne Referrer übertragen. Ereignisse derselben Nutzeraktion werden gemeinsam gesendet, und eine Übertragung beginnt erst nach Abschluss der vorherigen. Parallele Anfragen würden in Matomo einen neuen Besuch doppelt anlegen und die Reihenfolge der Ereignisse vertauschen, auf der die Kennzahl „Abbruchabschnitte“ beruht. Als Seitenadresse wird ausschließlich die Startadresse der Sprachversion übergeben; Seitentitel, Referrer und benutzerdefinierte Dimensionen werden nicht gesetzt.
- Der Sitzungsbezug ist eine zufällige 16-stellige Hex-Kennung im Session Storage des Browser-Tabs (`det_analytics_session`). Nach 30 Minuten Inaktivität wird eine neue Kennung erzeugt; dieser Wert ist als Betriebsparameter noch freizugeben. Bei Widerruf wird der Eintrag gelöscht.
- Die Kennzahlen dieses Konzepts sind als geprüfte Referenzimplementierung (`computeKpis`) hinterlegt.
- Pflichtkonfiguration der Matomo-Instanz für diesen Tracker: `[Tracker] trust_visitors_cookies = 1` in `config.ini.php` und „Disable all tracking cookies“ (`forceCookielessTracking`) **ausgeschaltet**. Andernfalls ignoriert Matomo den gesendeten Sitzungsbezug und fasst alle Nutzenden mit gleichem gekürztem IP-Präfix und gleichem Browser zu einem Besuch zusammen; Starts, Abschlussquote und Abbruchabschnitte wären dann falsch. Der Tracker setzt unabhängig davon keine Cookies, und Matomo setzt über die Tracking-API ohne aktivierte Drittanbieter-Cookies keine.
- Für die übrigen Datenschutzeinstellungen ist als Vorschlag vorgesehen: IP-Adresse vollständig maskieren, auch für die Anreicherung; User-ID und Bestell-ID anonymisieren; Referrer nicht speichern; Geolokalisierung deaktiviert; „Randomize config_ID“ ausgeschaltet. Die lokale Matomo-Instanz des Devcontainers erzwingt zusätzlich die CNIL-Compliance-Richtlinie (`cnil_v1`), die unter anderem die Rohdaten nach 180 Tagen löscht und das Besucher-Log abschaltet; die Testumgebung (`apps/frontend/tests/matomo`) verzichtet darauf, weil ihr Funnel-Test das Besucher-Log ausliest. Beide wenden diese Konfiguration automatisch an. Diese Werte sind Einstellungen des Matomo-Betreibers und keine Zusagen des Sanierungstools. Die Datenschutzhinweise (Abschnitt 12) beschreiben die Konfiguration der Devcontainer-Instanz; die produktive Instanz muss vor der Aktivierung gleich konfiguriert oder der Abschnitt angepasst werden.
- Der Punkt „Opt-Out Configured“ der CNIL-Prüfliste bleibt in Matomo dauerhaft „unknown“: Matomo kann den Einwilligungsdialog des Sanierungstools nicht erkennen. Der Opt-out besteht aus dem Widerruf in den Datenschutzeinstellungen; der Matomo-eigene Opt-out per Cookie wirkt nicht, weil der Tracker ohne Cookies sendet.
- Die Browser-Tests unter `apps/frontend/tests/e2e/analytics.spec.ts` simulieren Konfiguration und Matomo-Endpunkt und prüfen Ruhezustand, erneute Abfrage, Ablehnung, Ereignisfolge, Deduplizierung und Widerruf. Zusätzlich wurde im Oktober 2026 einmalig gegen eine lokale Matomo-5.14-Instanz mit Standardeinstellungen getestet: Ein vollständiger Durchlauf ergab genau einen Besuch mit allen Ereignissen in Auslösereihenfolge, Antworten ohne `Set-Cookie`, als Seitenadresse ausschließlich die Startadresse der Sprachversion und nach Widerruf keine weiteren Ereignisse. Die Testumgebung dafür ist noch nicht im Repository abgelegt. Die Ereignisse der Datenspende sind nur durch Unit-Tests abgedeckt, weil ein Browser-Durchlauf echte Einreichungen im Backend erzeugen würde.
