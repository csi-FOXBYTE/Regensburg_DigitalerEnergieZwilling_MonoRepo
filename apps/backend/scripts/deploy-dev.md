Deployer requires two environment variables:
```
SSH_USER=your_ssh_user  
SSH_HOST=host_to_deploy_to
```
The deploy script reads these values from a `.env` file located in the same directory.

The script only restarts the deployments with the latest `:dev` images. The backend
refuses to start unless the deployment sets `KEYCLOAK_JWKS_URI` (HTTPS),
`KEYCLOAK_ISSUER` and `AUTH_EXPECTED_AUDIENCE`, and real tokens are only accepted
when the Keycloak client has the audience mapper. The add-on configures both; roll
out the add-on first. See the backend README, section "Umgebungsvariablen (.env)".
