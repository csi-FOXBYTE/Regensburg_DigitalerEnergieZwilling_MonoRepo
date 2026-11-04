import { Type } from "@sinclair/typebox";

// Every parameter altcha-lib signs: a parameter missing here would be dropped
// from the response and the widget's solution would fail verification.
export const AltchaChallengeOutputDto = Type.Object({
  parameters: Type.Object({
    algorithm: Type.String(),
    nonce: Type.String(),
    salt: Type.String(),
    cost: Type.Integer(),
    keyLength: Type.Integer(),
    keyPrefix: Type.String(),
    keySignature: Type.String(),
    expiresAt: Type.Integer(),
  }),
  signature: Type.String(),
});

// Documents the header on the protected routes; installAltchaGuard checks it
// in onRequest, before this schema is applied.
export const AltchaHeadersDto = Type.Object({
  "x-altcha": Type.Optional(Type.String({
    description: "Base64 Altcha payload: a solved challenge from GET /api/public/altcha/challenge, usable once.",
  })),
});
