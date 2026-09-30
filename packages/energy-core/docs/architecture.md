# Project Architecture & Resolver Pattern

## Project Purpose

TypeScript library for building energy calculations in the Regensburg Digital Energy Twin. Uses a resolver-based dependency graph for all values.

## The Resolver Pattern

Every value in the system flows through a **resolver** — an object with a `key` and a `resolve(ctx)` function. The engine (`createCalculator` in `src/engine/engine.ts`) provides lazy evaluation, memoization, and circular dependency detection.

### Resolver types by role

1. **User input passthrough** — reads from `ctx.input.input.*`
   ```ts
   resolve: (ctx) => ctx.input.input.general.buildingHeight
   ```

2. **Config constant** — reads from `ctx.input.config.*`
   ```ts
   resolve: (ctx) => ctx.input.config.general.assumedFloorSlabThickness
   ```

3. **Computed value** — depends on other resolvers via `ctx.get()`
   ```ts
   resolve: (ctx) => ctx.get("buildingBaseArea") * ctx.get("totalStoryHeight")
   ```

4. **User override with fallback calculation** — uses input if provided, otherwise computes
   ```ts
   resolve: (ctx) => {
     const override = ctx.input.input.general.numberOfStories;
     if (override != null) return override;
     return Math.max(1, Math.round(ctx.get("lowestEaveHeight") / (ctx.input.config.general.assumedInteriorStoryHeight + ctx.get("floorSlabThickness"))));
   }
   ```

### How to add a resolver

1. Create a file in `src/calculators/energy/resolvers/`
2. Extend `DETCalculatorRegistry` via `declare module "../"` with the new key and type
3. Export a default resolver object using `satisfies Resolver<DETCalculatorContext, DETCalculatorRegistry, "keyName">`
4. Register it in `src/calculators/energy/index.ts`

### Key design rule

**Every constant should be written as a resolver**, not accessed directly in calculations. This allows any constant to later become a user-overridable input without changing downstream resolvers. The resolver is the abstraction boundary.

5. **User override with config fallback** — optional input, falls back to config default
   ```ts
   resolve: (ctx) => {
     const override = ctx.input.input.heat.heatEmitterType;
     if (override != null) return override;
     return ctx.input.config.heat.defaultHeatEmitterType;
   }
   ```

6. **Hardcoded constant** — fixed value, no config or input
   ```ts
   resolve: () => 0.34
   ```

### Error handling for range band resolution

`resolveRangeBand` returns `T | undefined` (overloads were removed). All resolvers that call it must check the result and throw on `undefined`:
```ts
const result = resolveRangeBand(bands, key);
if (result == null) throw new Error("Failed to resolve <resolverName>");
return result;
```

### Selection-type inputs (catalogues)

Some string inputs (e.g. `heatEmitterType`, `heatingSurfaceType`, `primaryEnergyCarrier`) follow a pattern:
- Config has a catalogue array at the top of the config type (e.g. `heatEmitterTypes: string[]`)
- Config has a default value (e.g. `defaultHeatEmitterType: string`)
- Input has an optional override (e.g. `heatEmitterType?: string | null`)
- Resolver uses override if provided, otherwise falls back to config default

### Year-type inputs

Any resolver representing a year (e.g. `heatingSystemConstructionYear`) is typed `number | RangeKey` and falls back to `buildingYear` when no user override is provided.

## Context Structure

```
DETCalculatorContext {
  config: DETConfig          // system constants (src/types/config/)
    ├─ general: DETGeneralConfig
    └─ heat: DETHeatConfig
  input: DETInput            // user inputs (src/types/input/)
    ├─ general: DETGeneralInput
    └─ heat: DETHeatInput
}
```

## Calculation Flow (Energy Calculator)

```
Direct inputs:
  buildingHeight, lowestEaveHeight, buildingBaseArea, buildingType, livingArea?, isBasementHeated

Config constants (via resolvers):
  floorSlabThickness, netFloorAreaFromLivingAreaFactor,
  usableFloorAreaFactor, heatedAirVolumeCorrectionFactor (RangeBands by numberOfStories)

Level 1 derived:
  numberOfStories (override or max(1, round(lowestEaveHeight / (assumedInteriorStoryHeight + floorSlabThickness))))
  heatedAttic = hasAttic && isAtticHeated
  aboveGroundHeatedHeight = heatedAttic ? buildingHeight : lowestEaveHeight

Level 2 derived:
  interiorStoryHeight = (aboveGroundHeatedHeight - numberOfStories * floorSlabThickness)
                        / (numberOfStories + (heatedAttic ? 1 : 0))
  basementHeight = hasBasement && isBasementHeated ? interiorStoryHeight + floorSlabThickness : 0
  totalStoryHeight = aboveGroundHeatedHeight + basementHeight
  grossHeatedVolume = buildingBaseArea * totalStoryHeight

Level 3 derived:
  usableFloorArea = grossHeatedVolume * usableFloorAreaFactor
  heatedAirVolume = grossHeatedVolume * heatedAirVolumeCorrectionFactor
  netFloorAreaFromUsableFloorAreaFactor (keyed lookup by buildingType & isBasementHeated)

Final:
  netFloorArea = livingArea ? livingArea * factor : usableFloorArea * factor
```

## Helper Types

- `KeyedValues<K, T>` + `resolveKeyedValue()` — lookup table by key (src/types/keyed-values.ts)
- `RangeBands` — range-based value resolution for year bands (src/types/range-bands.ts)
- `BuildingType` enum — SINGLE_FAMILY, MULTI_FAMILY (src/types/building-type.ts)

## Cuboid Calculator

`src/calculators/cuboid/` is a minimal reference implementation of the resolver pattern (a, b, c -> volume, surface). Use it to understand the pattern in isolation.
