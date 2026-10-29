# Scanner and test service images of the CI and release workflows, pinned by
# digest. The scanner versions started from the pentest baseline
# (SUP-02/03/04/06).
# This file is never built: it lets Dependabot propose version and digest
# updates. The workflows read the references with image.sh.
FROM semgrep/semgrep:1.130.0@sha256:7674a72a8bd5beaa4591b728e5950c04c58b27b82803901f36e7f9d70b828906 AS semgrep
FROM zricethezav/gitleaks:v8.24.3@sha256:e1b35e12a8c6fa8901f060459cfb6b2fc4c484d3afbe3b029733a3bbfab07055 AS gitleaks
FROM aquasec/trivy:0.65.0@sha256:a22415a38938a56c379387a8163fcb0ce38b10ace73e593475d3658d578b2436 AS trivy
# Throwaway database of the image smoke test (.github/smoke/image.sh).
FROM postgres:16.15-alpine@sha256:0cefaabd882e42bcb2a2f3dc56d3ce4770560ba62fd7f197f1a2e008fd5731ab AS postgres
