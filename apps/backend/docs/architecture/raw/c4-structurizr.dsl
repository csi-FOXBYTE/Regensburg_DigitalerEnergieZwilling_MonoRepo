workspace "Digitaler Energie Zwilling (DEZ)" "C4-Modell der implementierten Bereitstellung" {
  !identifiers hierarchical

  model {
    citizen = person "Bürger/Eigentümer/Vermieter" "Nutzt den öffentlichen 3D-Client"
    admin = person "Stadtverwaltung/Fachpersonal" "Nutzt Konfigurations- und Triage-Funktionen"

    masterportal = softwareSystem "MasterPortal" "Verknüpft zum öffentlichen DEZ-Client"
    geo = softwareSystem "Städtische Geodienste" "WMS- und WMTS-Basiskarten"
    lod2 = softwareSystem "CityGML-LoD2-Quelle" "Pflichteingabe der Pipeline einschließlich Adressen"
    solar = softwareSystem "Solarpotenzialquelle" "Optionale Eingabe nach Datenfreigabe"
    geothermal = softwareSystem "Geothermiequelle" "Vom Auftraggeber bereitgestellte Daten; Metadaten noch offen"
    tiles = softwareSystem "Externer Kacheldienst" "Bei der Bereitstellung vorgegebene, als TILES_URL konfigurierte URL"
    keycloak = softwareSystem "Keycloak" "OIDC-Identitätsanbieter und JWKS-Quelle"
    stellio = softwareSystem "Stellio-Kontextbroker" "NGSI-LD-Ziel"

    dez = softwareSystem "Digitaler Energie Zwilling (DEZ)" "Öffentliche und administrative Frontends sowie Backend-Dienste" {
      gateway = container "APISIX" "Externer Einstiegspunkt und Routenschutz" "API-Gateway"
      publicFrontend = container "Öffentliches Frontend" "Separate statische öffentliche Anwendung" "Astro SSG + nginx"
      adminFrontend = container "Admin-Frontend" "Separate statische administrative Anwendung" "Astro SSG + nginx"
      backend = container "Backend-API" "OpenAPI 3.0+, RS256/JWKS-Authentifizierung, Einreichungen/Konfiguration und Kachelweiterleitung" "Node.js + Fastify"
      database = container "DEZ-Datenbank" "Dynamische und administrative Persistenz" "PostgreSQL" {
        tags "Database"
      }
      calculationCore = container "Berechnungskern" "Gemeinsames Berechnungs- und Validierungsmodul" "JavaScript-Paket"
    }

    pipeline = softwareSystem "DEZ-Offline-Datenpipeline" "Separates CIVITAS/CORE-Airflow-Add-on" {
      airflow = container "Airflow-Orchestrierung" "Führt einen kombinierten LoD2-basierten DAG aus" "Apache Airflow"
      workers = container "Pipeline-Worker" "Extrahieren, konvertieren, reichern an und exportieren" "Batch-Container"
      artifacts = container "Pipeline-Artefaktspeicher" "Aufgabeneingaben und erzeugte Ausgaben" "S3-kompatibler Speicher" {
        tags "Database"
      }
    }

    citizen -> dez.gateway "nutzt" "HTTPS"
    admin -> dez.gateway "nutzt" "HTTPS"
    masterportal -> dez.gateway "verknüpft den öffentlichen Einstieg" "HTTPS"
    dez.gateway -> dez.publicFrontend "leitet die öffentliche Website weiter"
    dez.gateway -> dez.adminFrontend "leitet die Admin-Website weiter"
    dez.gateway -> dez.backend "leitet /api weiter"
    dez.publicFrontend -> dez.calculationCore "läuft im Browser"
    dez.publicFrontend -> dez.backend "lädt die Konfiguration und sendet optionale Nutzerdaten"
    dez.adminFrontend -> dez.backend "verwaltet Konfiguration und Einreichungen"
    dez.backend -> dez.database "liest und schreibt" "SQL"
    dez.backend -> dez.calculationCore "validiert die Konfiguration und berechnet Einreichungen neu"
    dez.backend -> keycloak "validiert Zugriffstoken" "JWKS/RS256"
    dez.backend -> tiles "leitet /api/public/tiles/* weiter" "HTTP 3xx"
    dez.publicFrontend -> geo "lädt Basiskarten" "WMS/WMTS"

    lod2 -> pipeline.artifacts "liefert aktuelle LoD2-Daten einschließlich Adressen"
    solar -> pipeline.artifacts "liefert optionale Eingaben"
    geothermal -> pipeline.artifacts "liefert vom Auftraggeber bereitgestellte Eingaben"
    pipeline.airflow -> pipeline.workers "orchestriert den kombinierten DAG"
    pipeline.workers -> pipeline.artifacts "liest und schreibt Auftragsartefakte"
    pipeline.workers -> tiles "veröffentlicht Kachelartefakte"
    pipeline.workers -> stellio "veröffentlicht statische Entitäten" "NGSI-LD"
  }

  views {
    systemContext dez "dez-context" {
      include *
      autolayout lr
    }

    container dez "dez-container" {
      include *
      autolayout lr
    }

    container pipeline "pipeline-container" {
      include *
      autolayout lr
    }

    styles {
      element "Person" {
        shape Person
        background "#08427b"
        color "#ffffff"
      }
      element "Software System" {
        background "#1168bd"
        color "#ffffff"
      }
      element "Container" {
        background "#438dd5"
        color "#ffffff"
      }
      element "Database" {
        shape Cylinder
      }
    }
  }
}
