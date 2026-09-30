# CIVITAS/CORE Local Development Setup (WSL 2 Native)

Diese Dokumentation beschreibt die Einrichtung einer vollständigen Entwicklungsumgebung für **CIVITAS/CORE** unter Windows 11 unter Verwendung von **WSL 2 (Ubuntu 24.04)**.

> **⚠️ Wichtiger Hinweis**
> Diese Anleitung ist ausschließlich für **lokales Development und Tests** gedacht.
> Sie ist **nicht** für den Aufbau oder Betrieb einer Produktivumgebung geeignet.
> Enthaltene Zugangsdaten sind lokale Beispielwerte und dürfen außerhalb einer lokalen Entwicklungsumgebung nicht unverändert verwendet werden.

**Besonderheit:** Wir nutzen **kein Docker Desktop** und **kein Minikube**, sondern natives Docker in WSL und **k3d** für maximale Performance und Stabilität.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Schritt 1: WSL Installation & Basis-Setup](#schritt-1-wsl-installation-basis-setup)
3. [Schritt 2: Native Tools installieren](#schritt-2-native-tools-installieren)
4. [Schritt 3: Projekt Setup](#schritt-3-projekt-setup)
5. [Schritt 4: Cluster Start & Netzwerk](#schritt-4-cluster-start-netzwerk)
6. [Schritt 5: Konfiguration (Inventory)](#schritt-5-konfiguration-inventory)
7. [Schritt 6: Deployment starten](#schritt-6-deployment-starten)
8. [Schritt 7: Zugriff & Verifikation](#schritt-7-zugriff-verifikation)

<a id="voraussetzungen"></a>

## Voraussetzungen

- Windows 10 oder 11
- Administrator-Rechte (nur für die einmalige WSL-Installation)
- Virtualisierung im BIOS aktiviert

---

<a id="schritt-1-wsl-installation-basis-setup"></a>

## Schritt 1: WSL Installation & Basis-Setup

Öffne die **Windows PowerShell** als Administrator:

```powershell
# 1. Ubuntu 24.04 installieren
wsl --install -d Ubuntu-24.04

# Falls bereits installiert, neue Instanz erstellen (Optional):
# wsl --import CivitasDev C:\WSL\CivitasDev [Pfad-zum-Tarball]
```

Nach der Installation Computer neu starten und User/Passwort für Ubuntu vergeben.

### Wichtig: Systemd aktivieren

Öffne die Ubuntu-Konsole und führe folgendes aus, damit Docker später automatisch startet:

```bash
# Systemd aktivieren
sudo bash -c 'printf "[boot]\nsystemd=true\n" > /etc/wsl.conf'
```

**ACHTUNG:** Jetzt zwingend die WSL neustarten!
Führe in der **PowerShell** aus:

```powershell
wsl --shutdown
```

Öffne danach Ubuntu wieder.

```powershell
wsl -d Ubuntu-24.04
```

---

<a id="schritt-2-native-tools-installieren"></a>

## Schritt 2: Native Tools installieren

Wir installieren Docker, Firefox (ohne Snap) und die Kubernetes-Tools direkt in Ubuntu.

### Docker & User-Rechte

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io -y
sudo usermod -aG docker $USER
newgrp docker
```

### Firefox (Native Version)

Wichtig für lokale Tests, da die Snap-Version in WSL oft Probleme macht.

```bash
sudo add-apt-repository ppa:mozillateam/ppa -y
echo '
Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001
' | sudo tee /etc/apt/preferences.d/mozilla-firefox
sudo apt update
sudo apt install firefox -y
```

### Kubernetes Tools (K3d, Kubectl, Helm)

```bash
# K3d (Leichtgewichtiger K8s Cluster in Docker)
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | bash

# Kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Hilfstools
sudo apt-get install -y openssl gettext
```

---

<a id="schritt-3-projekt-setup"></a>

## Schritt 3: Projekt Setup

```bash
# Repo klonen
git clone https://gitlab.com/civitas-connect/civitas-core/civitas-core.git
cd civitas-core

# Python Virtual Environment (Python 3.12 kompatibel)
sudo apt install python3.12-venv -y
python3 -m venv .venv
source .venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt
ansible-galaxy collection install -r ansible-collections.yml
```

---

<a id="schritt-4-cluster-start-netzwerk"></a>

## Schritt 4: Cluster Start & Netzwerk

### Cluster hochfahren

```bash
./local_deployment/startup.sh -k
```

### SSL Zertifikate vertrauen (Linux System)

```bash
sudo cp ./local_deployment/.ssl/civitas.crt /usr/local/share/ca-certificates/civitas.crt
sudo update-ca-certificates
# Ausgabe sollte sein: "1 added"
```

### DNS Routing (/etc/hosts)

Damit die lokalen Domains (`.test`) auf den Cluster (localhost) zeigen.

```bash
export DOMAIN=civitas.test
sudo bash -c "cat << HOSTS >> /etc/hosts
127.0.0.1 \${DOMAIN}
127.0.0.1 alertmanager.\${DOMAIN}
127.0.0.1 api-dashboard.\${DOMAIN}
127.0.0.1 api.\${DOMAIN}
127.0.0.1 api-admin.\${DOMAIN}
127.0.0.1 apim.\${DOMAIN}
127.0.0.1 geoportal.\${DOMAIN}
127.0.0.1 geoserver.\${DOMAIN}
127.0.0.1 grafana.\${DOMAIN}
127.0.0.1 idm.\${DOMAIN}
127.0.0.1 minio-tenant-console.\${DOMAIN}
127.0.0.1 minio-tenant.\${DOMAIN}
127.0.0.1 monitoring.\${DOMAIN}
127.0.0.1 mqtt.\${DOMAIN}
127.0.0.1 oauth.\${DOMAIN}
127.0.0.1 oauth.geoportal.\${DOMAIN}
127.0.0.1 pgadmin.\${DOMAIN}
127.0.0.1 superset.\${DOMAIN}
127.0.0.1 datacatalog.\${DOMAIN}
127.0.0.1 repo.datacatalog.\${DOMAIN}
127.0.0.1 search.datacatalog.\${DOMAIN}
HOSTS"
```

---

<a id="schritt-5-konfiguration-inventory"></a>

## Schritt 5: Konfiguration (Inventory)

Wichtig: Das folgende Inventory ist nur für lokale Entwicklung gedacht.
Für produktive Umgebungen müssen Secrets über ein geeignetes Secrets-Management bereitgestellt werden.

Kopiere das hier in die datei `cc_cli_inventory.yml` im Hauptverzeichnis.

```yaml
# yaml-language-server: $schema=https://gitlab.com/civitas-connect/civitas-core/civitas-core/-/raw/main/core_platform/inventory_schema.json

###########################################################
# Inventory for the Open City Platform
###########################################################

all:
  vars:
    DOMAIN: "civitas.test"
    INGRESS_DOMAIN: "{{ DOMAIN }}"
    ENVIRONMENT: "cc-loc"
    kubeconfig_file: config

  children:
    controller:
      hosts:
        localhost:
          ansible_host: 127.0.0.1
          ansible_connection: local
          ansible_python_interpreter: "{{ ansible_playbook_python }}"

      vars:
        ###########################################################
        ## Kubernetes general settings
        ###########################################################

        inv_k8s:
          config:
            context: "k3d-civitas-local"

          storage_class:
            rwo: "local-path"
            rwx: "local-path"
            loc: "local-path"

          ingress:
            ca_path: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crt" # Path to your local self-signed CA certificate
            http: false # Allow http access (without SSL)

          cert_manager:
            issuer_name: "selfsigned-ca"

          ###########################################################
          ## Operation stack
          ## The operation stack will be the place, where all management components will live.
          ###########################################################

          ingress_class: nginx
          gitlab_access:
            user_email: ""
            user: ""
            token: ""
        inv_op_stack:
          prometheus: # sammelt Log-Daten über die Umgebung. Kann man dann über Grafana angucken
            enable: false

          # Keel Operator automatically updates docker images
          keel_operator:
            enable: false
            admin: "admin@{{ DOMAIN }}"
            password: "J0LQ~Mae+x{g8zeN"

          # PGAdmin to manage postgres databases
          pgadmin:
            enable: false
            default_email: "admin@{{ DOMAIN }}"
            default_password: "9gK1Ur<8Zs;z8TUS"

          kyverno_operator:
            enable: false

          # Monitoring stack with prometheus, grafana, alertmanager, loki and promtail
          monitoring:
            enable: false
            prometheus:
              enable: true
            grafana:
              enable: true
            alertmanager:
              enable: true
            loki:
              enable: true
            promtail:
              enable: true

        ###########################################################
        ## Access management stack
        ## Identity and api management.
        ###########################################################

        inv_access:
          enable: true

          ## IDM (keycloak) Users
          platform:
            admin_first_name: "Admin"
            admin_surname: "Admin"
            admin_email: "admin@{{ DOMAIN }}"
            master_username: "admin@{{ DOMAIN }}"
            master_password: "O-C4BInm>-?nYvEa"
            k8s_secret_name: "{{ ENVIRONMENT }}-keycloak-admin"
            hostname: "https://idm.{{ DOMAIN }}"

          keycloak:
            enable: true
            log_level: "INFO"
            replicas: 1
            enable_logical_backup: false
            theme: "keycloak"
            password_policy:
              length: 12
              digits: 1
              lowerCase: 1
              upperCase: 1
              specialChars: 1
              notUsername: true
              forceExpiredPasswordChange: false
              passwordHistory: 5

          # API management
          apisix:
            enable: true
            dashboard:
              enable: false
              jwt_secret: "999SlB99W0dfHa_c" #openssl rand -base64 12
              admin:
                username: "admin@{{ DOMAIN }}"
                password: "1_jftS{g9ZSht.9E"

            api_credentials:
              admin_role: V/AE23M}37QXQhXC
              viewer_role: PD/K7~9K5}?e_j<i
          service_portal:
            enable: false
            certs:
              enable: true
              civitas_crt: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crt"
              civitas_crl: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crl"
              civitas_crl_pem: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crl.pem"
            oidc:
              enable: false

        ###########################################################
        ## Context Management
        ## context management components, i.e., Frost, Stellio, Mimir, ...
        ###########################################################

        inv_cm:
          frost:
            enable: true # Issues on k3d
            mqtt:
              enable: false
              session_affinity: "None"

          ###########################################################
          ## Dashboards: Grafana and Superset
          ###########################################################

          quantumleap:
            enable: false
          stellio:
            enable: false
            helm_credentials:
              username: ""
              password: ""
        inv_da:
          superset:
            enable: true
            mapbox_api_token: "TODO_PLEASE_SET_A_VALUE"
            # Generate once per System with > openssl rand -base64 42
            db_secret: "zqx|39-E.y^t+-AK"
            admin_user_name: admin
            admin_user_password: "lXj2w_Jdd/1y5<uW"
            redis_auth_password: ",_uMwEg4y<wr^hfx"

          grafana:
            enable: false
            admin: "admin"
            password: "k7/.pMk|}g7,cHJj"

        ###########################################################
        ## GeoData Stack
        ###########################################################

        inv_gd:
          enable: true

          # Masterportal in Version 2.xx
          masterportal_1:
            enable: false

          # Mapfish to generate PDF maps from masterportal
          mapfish:
            enable: false

          # GeoServer
          geoserver:
            enable: true

            # Portal Backend to support authentication in MasterPortal
            geoserverPassword: E+v6/3I}n,KAwC_z
          portal_backend:
            enable: true

          ###########################################################
          ## AddOns
          ## Platform addons can be added and configured here. See example addon repository for documentation
          ###########################################################

          gd_components: []
        inv_addons:
          import: true
          addons: []
          # - 'addons/my-service/tasks.yml'

        # inv_cust:
        #   nodered:
        #     enable: true
        #     ns_create: true
        #     ns_name: "{{ ENVIRONMENT }}-connector-stack"
        #     ns_kubeconfig: "{{ kubeconfig_file }}"
        #     enable_keycloak_sso: true

        inv_checks:
          enable: false
          api:
            default_max_retries: 20
          deployment:
            default_max_retries: 30
        inv_email:
          server: mail.civitas.test
          user: admin@civitas.test
          password: "|oQINe_91<qyV6be"
          email_from: noreply@civitas.test
        inv_datacatalog:
          piveau:
            enable: false
            hub_repo:
              virtuoso:
                password: "|PPO.bw}8bcNOgLn"
```

---

<a id="schritt-6-deployment-starten"></a>

## Schritt 6: Deployment starten

Jetzt wird die Plattform installiert:

```bash
# Im civitas-core Ordner
./cc_cli.py
```

Wenn alles durchläuft: **Success!** 🎉

---

<a id="schritt-7-zugriff-verifikation"></a>

## Schritt 7: Zugriff & Verifikation

### URLs

- **Keycloak:** [https://idm.civitas.test](https://idm.civitas.test)
- **Login:** `admin@civitas.test`
- **Passwort:** `O-C4BInm>-?nYvEa`

### Browser Config (Einmalig)

Damit Firefox nicht meckert:

1.  Firefox in WSL öffnen (`firefox &`)
2.  `Settings` -> `Privacy & Security` -> `Certificates` -> `View Certificates`
3.  `Import...` -> Datei `civitas-core/local_deployment/.ssl/civitas.crt` auswählen.
4.  Haken setzen bei "Trust this CA to identify websites".

### Täglicher Start (Nach Reboot)

1.  WSL öffnen.
2.  `./local_deployment/startup.sh -k` (Startet den Cluster).
3.  Prüfen ob alles läuft: `kubectl get pods -A`.

> DAS NACHFOLGENDE IGNORIEREN (NUR DOKUMENTATION DER GENUTZEN BEFEHLE FALLS GEMINI EINEN FEHLER MACHT BEIM ZUSAMMENFASSEN)

```raw
wsl --install -d Ubuntu-24.04

sudo apt update && sudo apt upgrade -y

sudo apt install docker.io -y
sudo usermod -aG docker $USER
newgrp docker

sudo nano /etc/wsl.conf
# Füge das hier ein (wenn nicht schon da):
[boot]
systemd=true

# In Windows wsl herunterfahren
wsl --shutdown

# Dann in windows wieder in wsl shell rein
wsl -d Ubuntu-24.04

sudo add-apt-repository ppa:mozillateam/ppa -y
echo '
Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001
' | sudo tee /etc/apt/preferences.d/mozilla-firefox
sudo apt update
sudo apt install firefox -y

# Install k3d
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | bash

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install additional tools
sudo apt-get install -y openssl gettext

git clone https://gitlab.com/civitas-connect/civitas-core/civitas-core.git
cd civitas-core

sudo apt install python3.12-venv

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ansible-galaxy collection install -r ansible-collections.yml

./local_deployment/startup.sh -k

sudo cp ./local_deployment/.ssl/civitas.crt /usr/local/share/ca-certificates/civitas.crt
sudo update-ca-certificates (hier sollte 1 added dranstehen)

export DOMAIN=civitas.test
sudo bash -c "cat << EOF >> /etc/hosts
127.0.0.1 \${DOMAIN}
127.0.0.1 alertmanager.\${DOMAIN}
127.0.0.1 api-dashboard.\${DOMAIN}
127.0.0.1 api.\${DOMAIN}
127.0.0.1 api-admin.\${DOMAIN}
127.0.0.1 apim.\${DOMAIN}
127.0.0.1 geoportal.\${DOMAIN}
127.0.0.1 geoserver.\${DOMAIN}
127.0.0.1 grafana.\${DOMAIN}
127.0.0.1 idm.\${DOMAIN}
127.0.0.1 minio-tenant-console.\${DOMAIN}
127.0.0.1 minio-tenant.\${DOMAIN}
127.0.0.1 monitoring.\${DOMAIN}
127.0.0.1 mqtt.\${DOMAIN}
127.0.0.1 oauth.\${DOMAIN}
127.0.0.1 oauth.geoportal.\${DOMAIN}
127.0.0.1 pgadmin.\${DOMAIN}
127.0.0.1 superset.\${DOMAIN}
127.0.0.1 datacatalog.\${DOMAIN}
127.0.0.1 repo.datacatalog.\${DOMAIN}
127.0.0.1 search.datacatalog.\${DOMAIN}
EOF"

# Check cluster status
kubectl cluster-info --context k3d-civitas-local

# Verify ingress controller
kubectl get pods -n ingress-nginx

# Check cert-manager
kubectl get pods -n cert-manager

# Verify MetalLB
kubectl get pods -n metallb-system

# (Optional) Wenn in Firefox keine Zertifikatsfehlermeldung kommen soll
Firefox öffnen -> Einstellungen -> Zertifikate -> Importieren -> civitas.crt auswählen.

# Das hier in cc_cli_inventory.yml

# yaml-language-server: $schema=https://gitlab.com/civitas-connect/civitas-core/civitas-core/-/raw/main/core_platform/inventory_schema.json

###########################################################
# Inventory for the Open City Platform
###########################################################

all:
  vars:
    DOMAIN: "civitas.test"
    INGRESS_DOMAIN: "{{ DOMAIN }}"
    ENVIRONMENT: 'cc-loc'
    kubeconfig_file: config

  children:
    controller:
      hosts:
        localhost:
          ansible_host: 127.0.0.1
          ansible_connection: local
          ansible_python_interpreter: "{{ ansible_playbook_python }}"

      vars:

        ###########################################################
        ## Kubernetes general settings
        ###########################################################

        inv_k8s:
          config:
            context: "k3d-civitas-local"

          storage_class:
            rwo: "local-path"
            rwx: "local-path"
            loc: "local-path"

          ingress:
            ca_path: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crt" # Path to your local self-signed CA certificate
            http: false # Allow http access (without SSL)

          cert_manager:
            issuer_name: "selfsigned-ca"

        ###########################################################
        ## Operation stack
        ## The operation stack will be the place, where all management components will live.
        ###########################################################

          ingress_class: nginx
          gitlab_access:
            user_email: ''
            user: ''
            token: ''
        inv_op_stack:
          prometheus: # sammelt Log-Daten über die Umgebung. Kann man dann über Grafana angucken
            enable: false

          # Keel Operator automatically updates docker images
          keel_operator:
            enable: false
            admin: "admin@{{ DOMAIN }}"
            password: "J0LQ~Mae+x{g8zeN"

          # PGAdmin to manage postgres databases
          pgadmin:
            enable: false
            default_email: "admin@{{ DOMAIN }}"
            default_password: "9gK1Ur<8Zs;z8TUS"

          kyverno_operator:
            enable: false

          # Monitoring stack with prometheus, grafana, alertmanager, loki and promtail
          monitoring:
            enable: false
            prometheus:
              enable: true
            grafana:
              enable: true
            alertmanager:
              enable: true
            loki:
              enable: true
            promtail:
              enable: true


        ###########################################################
        ## Access management stack
        ## Identity and api management.
        ###########################################################

        inv_access:
          enable: true

          ## IDM (keycloak) Users
          platform:
            admin_first_name: "Admin"
            admin_surname: "Admin"
            admin_email: "admin@{{ DOMAIN }}"
            master_username: "admin@{{ DOMAIN }}"
            master_password: "O-C4BInm>-?nYvEa"
            k8s_secret_name: "{{ ENVIRONMENT }}-keycloak-admin"
            hostname: "https://idm.{{ DOMAIN }}"

          keycloak:
            enable: true
            log_level: "INFO"
            replicas: 1
            enable_logical_backup: false
            theme: "keycloak"
            password_policy:
              length: 12
              digits: 1
              lowerCase: 1
              upperCase: 1
              specialChars: 1
              notUsername: true
              forceExpiredPasswordChange: false
              passwordHistory: 5

          # API management
          apisix:
            enable: true
            dashboard:
              enable: false
              jwt_secret: "999SlB99W0dfHa_c" #openssl rand -base64 12
              admin:
                username: "admin@{{ DOMAIN }}"
                password: "1_jftS{g9ZSht.9E"


            api_credentials:
              admin_role: V/AE23M}37QXQhXC
              viewer_role: PD/K7~9K5}?e_j<i
          service_portal:
            enable: false
            certs:
              enable: true
              civitas_crt: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crt"
              civitas_crl: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crl"
              civitas_crl_pem: "{{ inventory_dir }}/local_deployment/.ssl/civitas.crl.pem"
            oidc:
              enable: false

        ###########################################################
        ## Context Management
        ## context management components, i.e., Frost, Stellio, Mimir, ...
        ###########################################################

        inv_cm:
          frost:
            enable: true   # Issues on k3d
            mqtt:
              enable: false
              session_affinity: "None"


        ###########################################################
        ## Dashboards: Grafana and Superset
        ###########################################################

          quantumleap:
            enable: false
          stellio:
            enable: false
            helm_credentials:
              username: ''
              password: ''
        inv_da:
          superset:
            enable: true
            mapbox_api_token: "TODO_PLEASE_SET_A_VALUE"
            # Generate once per System with > openssl rand -base64 42
            db_secret: "zqx|39-E.y^t+-AK"
            admin_user_name: admin
            admin_user_password: "lXj2w_Jdd/1y5<uW"
            redis_auth_password: ",_uMwEg4y<wr^hfx"

          grafana:
            enable: false
            admin: "admin"
            password: "k7/.pMk|}g7,cHJj"

        ###########################################################
        ## GeoData Stack
        ###########################################################

        inv_gd:
          enable: true

          # Masterportal in Version 2.xx
          masterportal_1:
            enable: false

          # Mapfish to generate PDF maps from masterportal
          mapfish:
            enable: false

          # GeoServer
          geoserver:
            enable: true

          # Portal Backend to support authentication in MasterPortal
            geoserverPassword: E+v6/3I}n,KAwC_z
          portal_backend:
            enable: true

        ###########################################################
        ## AddOns
        ## Platform addons can be added and configured here. See example addon repository for documentation
        ###########################################################

          gd_components: []
        inv_addons:
          import: true
          addons: []
          # - 'addons/my-service/tasks.yml'

        # inv_cust:
        #   nodered:
        #     enable: true
        #     ns_create: true
        #     ns_name: "{{ ENVIRONMENT }}-connector-stack"
        #     ns_kubeconfig: "{{ kubeconfig_file }}"
        #     enable_keycloak_sso: true

        inv_checks:
          enable: false
          api:
            default_max_retries: 20
          deployment:
            default_max_retries: 30
        inv_email:
          server: mail.civitas.test
          user: admin@civitas.test
          password: '|oQINe_91<qyV6be'
          email_from: noreply@civitas.test
        inv_datacatalog:
          piveau:
            enable: false
            hub_repo:
              virtuoso:
                password: '|PPO.bw}8bcNOgLn'


# Dann in venv
cc_cli exec
```
