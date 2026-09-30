# Regensburg Digital Twin - EnergyCalculationCore

TypeScript library providing core types and utilities for building energy calculation in the Regensburg Digital Energy Twin project.

## Installation

```bash
pnpm add @csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore
```

Requires an `.npmrc` pointing to GitHub Packages:

```
@csi-foxbyte:registry=https://npm.pkg.github.com
```

## Usage

```ts
import { calculate, DEFAULT_CONFIG } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";

const result = calculate(DEFAULT_CONFIG, {
  general: { lowestEaveHeight: 6, /* ... */ },
  heat: { isBasementHeated: false },
  roof: { area: 120 },
  topFloor: { area: 80 },
  outerWall: { area: 200, areaWithoutAttic: 180, atticArea: 20 },
  baseSlab: { area: 80 },
  roofWindows: { area: 4 },
  exteriorWallWindows: { area: 24 },
});

// result: { energyConsumptionPerSquareMeter, energyEfficiencyClass, yearlyCost, co2Emissions }
```

The artifact generator is Node-only and is available through a dedicated subpath:

```ts
import { generateDetBuildingEnergyProfileArtifacts } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore/generator";
```

## Exports

**Calculation:**
- `calculate(config, input)` — runs the energy calculation, returns `CalculationResult`
- `DEFAULT_CONFIG` — ready-to-use default configuration

**Config types:**
- `DETConfig`, `DETGeneralConfig`, `DETHeatConfig` — top-level and heat configuration
- `DETRoofConfig`, `DETTopFloorConfig`, `DETOuterWallConfig`, `DETBaseSlabConfig`, `DETWindowsConfig` — envelope component configuration
- `PrimaryEnergyCarrierData` — energy carrier data shape

**Input types:**
- `DETInput`, `DETGeneralInput`, `DETHeatInput` — top-level and heat input
- `DETRoofInput`, `DETTopFloorInput`, `DETOuterWallInput`, `DETBaseSlabInput` — envelope component input
- `DETRoofWindowsInput`, `DETExteriorWallWindowsInput` — window input

**Enums:**
- `BuildingType` — single/multi-family
- `EnergyEfficiencyClass` — A+ through H
- `HeatFlowDirection` — upward/horizontal/downward
- `RoofInsulationType` — between-rafter/above-rafter

**Shared types:**
- `Selection`, `SelectionFilter` — labelled options with localization and filtering
- `KeyedValues`, `RangeBands`, `YearBands`, `Ranges`, `RangeKey` — generic data structures

**Utility functions:**
- `resolveKeyedValue` — look up a value by key
- `resolveRangeBand` / `resolveYearBand` — resolve a value from range-based bands

## Development

```bash
pnpm install
pnpm run lint       # type-check
pnpm run test       # run tests
pnpm run build      # lint + test + bundle
pnpm run docs       # generate API docs + configurator
```

## Project Structure

```text
src/
  types/         # shared types, config and input schemas
  engine/        # resolver-based calculation engine
  calculators/   # domain-specific calculators (cuboid, energy)
```

## Publishing

Publishing is automated via GitHub Actions. Create a GitHub release and the package is published to GitHub Packages automatically.
