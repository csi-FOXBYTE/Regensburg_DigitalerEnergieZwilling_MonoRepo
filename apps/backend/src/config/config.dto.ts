import { Static, Type } from "@sinclair/typebox";

export const CreateConfigInputDto = Type.Object({
  versionName: Type.String({ minLength: 1 }),
  calculationConfig: Type.String(),
  subsidies: Type.Array(Type.String()),
});

export const ConfigDto = Type.Object({
  versionName: Type.String(),
  calculationConfig: Type.String(),
  subsidies: Type.Array(Type.String()),
  isActive: Type.Boolean(),
  createdAt: Type.Any(),
  publishedAt: Type.Any(),
});

export const ConfigListOutputDto = Type.Object({
  configs: Type.Array(ConfigDto),
});

export const ActiveConfigOutputDto = Type.Object({
  versionName: Type.String(),
  calculationConfig: Type.String(),
  subsidies: Type.Array(Type.String()),
  publishedAt: Type.Any(),
});

export const MapResourcesOutputDto = Type.Object({
  terrainBaseUrl: Type.String({ minLength: 1 }),
  tilesBaseUrl: Type.String({ minLength: 1 }),
  addressDatabaseUrl: Type.String({ minLength: 1 }),
});

export type CreateConfigInput = Static<typeof CreateConfigInputDto>;
