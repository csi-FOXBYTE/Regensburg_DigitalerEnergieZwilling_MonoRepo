# DEZ-Rollen in Keycloak zuweisen

## Zweck

Diese Anleitung richtet sich an die technische Administration der Regensburger CIVITAS/CORE-Keycloak-Instanz. Sie beschreibt die Zuweisung vorhandener DEZ-Client-Rollen zu vorhandenen Benutzerkonten.

Die Installation des DEZ, die Anlage des OIDC-Clients und die Erstellung der Client-Rollen sind nicht Bestandteil dieser Anleitung. Das DEZ-Add-on legt die Rollen `admin`, `manager` und `maintainer` für den konfigurierten OIDC-Client an.

Die Regensburger CIVITAS/CORE-Keycloak-Instanz verwendet für diesen Betrieb einen Realm. Legen Sie keinen zusätzlichen Realm für den DEZ an.

## Rollen

| Client-Rolle | Berechtigung |
| --- | --- |
| `manager` | Dashboard und fachliche Bearbeitung von Einreichungen |
| `maintainer` | Systempflege und Konfigurationsverwaltung |
| `admin` | Vollzugriff auf Einreichungen und Systempflege |

## Rolle zuweisen

1. Öffnen Sie die Keycloak-Administrationskonsole der Regensburger CIVITAS/CORE-Instanz.
2. Melden Sie sich mit einem berechtigten Administrationskonto an.
3. Wählen Sie den vorhandenen Regensburger Realm aus.
4. Öffnen Sie **Users**.
5. Suchen Sie das vorhandene Benutzerkonto.
6. Öffnen Sie das Benutzerkonto.
7. Öffnen Sie **Role mapping**.
8. Klicken Sie auf **Assign role**.
9. Filtern Sie nach Client-Rollen.
10. Wählen Sie den für den DEZ konfigurierten OIDC-Client aus. Der Standardname lautet `digital-energy-twin`.
11. Markieren Sie `manager`, `maintainer` oder `admin`.
12. Klicken Sie auf **Assign**, um die Zuweisung zu bestätigen.
13. Prüfen Sie, ob die Rolle unter den zugewiesenen Rollen erscheint.

Fordern Sie die betroffene Person auf, sich ab- und erneut anzumelden. Erst ein neu ausgestelltes Token enthält die geänderte Rolle.

## Rolle entfernen

1. Öffnen Sie das Benutzerkonto.
2. Öffnen Sie **Role mapping**.
3. Markieren Sie die zu entfernende DEZ-Client-Rolle.
4. Klicken Sie auf **Unassign**.
5. Bestätigen Sie das Entfernen.
6. Fordern Sie die betroffene Person auf, sich ab- und erneut anzumelden.

## Kontrolle

Prüfen Sie nach der erneuten Anmeldung die sichtbaren Bereiche:

- `manager`: **Dashboard** und **Gebäudeliste**
- `maintainer`: **Systempflege**
- `admin`: **Dashboard**, **Gebäudeliste** und **Systempflege**

Prüfen Sie die Client-ID und die Rollenzuweisung, wenn kein Bereich oder ein unzulässiger Bereich erscheint. Weisen Sie keine Realm-Rolle gleichen Namens als Ersatz für die erforderliche Client-Rolle zu.
