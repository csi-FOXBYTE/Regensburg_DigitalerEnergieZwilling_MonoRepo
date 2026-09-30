#!/usr/bin/env node
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const defaults = {
  key: "dev_admin",
  secret: "dev_admin-secret-change-me",
  issuer: "http://localhost:8080/realms/dev",
  audience: "account",
  clientId: "digital-energy-twin",
  username: "dev.user",
  email: "dev.user@example.local",
  givenName: "Dev",
  familyName: "User",
  scope: "openid profile email",
  roles: ["admin"],
  ttl: 15552000,
  output: "full",
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = "true";
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  pnpm jwt:dev [options]
  node scripts/create-dev-jwt.mjs [options]

Options:
  --key <consumer-key>         APISIX jwt-auth key claim (default: dev_admin)
  --secret <hmac-secret>       APISIX jwt-auth secret
  --issuer <iss>               JWT iss claim
  --audience <aud>             JWT aud claim
  --client-id <azp/client>     JWT azp and resource_access client
  --username <name>            preferred_username
  --given-name <name>          given_name claim (default: Dev)
  --family-name <name>         family_name claim (default: User)
  --email <email>              email claim
  --roles <csv>                role list (default: admin,user)
  --scope <scope>              scope claim
  --ttl <seconds>              token lifetime in seconds (default: 3600)
  --sub <subject>              subject UUID (default: random UUID)
  --output <full|raw|bearer>   output format (default: full)
  --help                       show this help
`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help === "true") {
  usage();
  process.exit(0);
}

const ttl = Number(args.ttl ?? defaults.ttl);
if (!Number.isFinite(ttl) || ttl <= 0) {
  console.error("Invalid --ttl. Use a positive number of seconds.");
  process.exit(1);
}

const roles = (args.roles ?? defaults.roles.join(","))
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

const now = Math.floor(Date.now() / 1000);
const payload = {
  key: args.key ?? defaults.key,
  iss: args.issuer ?? defaults.issuer,
  sub: args.sub ?? randomUUID(),
  aud: args.audience ?? defaults.audience,
  azp: args["client-id"] ?? defaults.clientId,
  typ: "Bearer",
  preferred_username: args.username ?? defaults.username,
  email: args.email ?? defaults.email,
  given_name: args["given-name"] ?? defaults.givenName,
  family_name: args["family-name"] ?? defaults.familyName,
  name: `${args["given-name"] ?? defaults.givenName} ${args["family-name"] ?? defaults.familyName}`,
  email_verified: true,
  realm_access: { roles },
  resource_access: {
    [args["client-id"] ?? defaults.clientId]: { roles },
  },
  scope: args.scope ?? defaults.scope,
  iat: now,
  exp: now + ttl,
};

const secret = args.secret ?? defaults.secret;
const token = jwt.sign(payload, secret, { algorithm: "HS256" });

const output = args.output ?? defaults.output;
if (output === "raw") {
  console.log(token);
  process.exit(0);
}
if (output === "bearer") {
  console.log(`Bearer ${token}`);
  process.exit(0);
}

console.log("Claims:");
console.log(JSON.stringify(payload, null, 2));
console.log(`JWT token:
${token}

Authorization header:
Bearer ${token}
`);
