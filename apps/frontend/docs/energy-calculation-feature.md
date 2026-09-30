# Energy Calculation Feature — Architecture Reference

This document is intended to quickly orient an AI coding assistant on the structure, data flow, and conventions of the `energyCalculation` feature.

---

## Directory Layout

```
src/feature/energyCalculation/
├── EnergyCalculationField.tsx   # Shared wrapper: label + reset button
├── EnergyNumberInput.tsx        # Number input field
├── EnergySelectInput.tsx        # Select/dropdown input (3 variants)
├── EnergyBooleanInput.tsx       # Yes/No radio input
├── InfoButton.tsx               # InfoTooltipButton and InfoDialogButton
├── ButtonBar.tsx                # Back/Continue navigation
├── CurrentStats.tsx             # Live stats cards (4 KPIs)
├── general/
│   ├── GeneralDataStep.astro
│   └── GeneralDataStepForm.tsx
├── electricity/
│   ├── ElectricityStep.astro
│   └── ElectricityStepForm.tsx
├── heat/
│   ├── HeatStep.astro
│   └── HeatStepForm.tsx
├── outer/
│   ├── OuterPartsStep.astro
│   ├── OuterPartsStepForm.tsx
│   ├── RoofPaper.tsx
│   ├── RoofWindowsPaper.tsx
│   ├── TopFloorPaper.tsx
│   ├── OuterWallPaper.tsx
│   ├── WindowsPaper.tsx
│   └── BottomFloorPaper.tsx
├── renovation/
│   ├── RenovationStep.astro
│   ├── RenovationStepForm.tsx        # Three category tables with chaining
│   ├── RenovationMultiSelectTable.tsx # Checkbox selection with savings
│   ├── RenovationSingleSelectTable.tsx # Radio selection with savings
│   ├── RenovationRow.tsx             # Shared table row (label + savings cell)
│   └── RenovationStats.tsx           # Before/after KPI comparison cards
└── result/
    └── Result.astro            # Placeholder — no result content yet

src/lib/
├── field-store.ts               # FieldStore<T> pattern
├── selection-store.ts           # SelectionStore / RangeBandStore helpers
└── state/
    ├── building/index.ts        # Selected 3D building atom
    ├── calculation-config/index.ts  # $config atom (dropdown options)
    ├── inputs/
    │   ├── atoms.ts             # Single $inputState atom (InputState) + renovation selection atoms
    │   ├── general.ts           # Field stores for general step
    │   ├── heat.ts              # Field stores for heat step
    │   ├── electricity.ts       # Field stores for electricity step
    │   ├── renovation.ts        # Selection atoms for renovation step
    │   ├── roof.ts
    │   ├── roof-windows.ts
    │   ├── outer-wall.ts
    │   ├── exterior-wall-windows.ts
    │   ├── top-floor.ts
    │   ├── bottom-floor.ts
    │   └── index.ts
    ├── computed/
    │   ├── lod2-input.ts        # Geometry → input shape
    │   ├── calculation-input.ts # Merges all inputs → DETInput
    │   ├── current-energy-state.ts  # Calls calculate(), emits KPIs
    │   ├── renovated-energy-state.ts # Applies $renovations, calls calculate()
    │   ├── renovation-options.ts    # Computed Renovation[] lists from $config
    │   ├── resolved-input.ts    # Extracts per-section resolved values
    │   └── index.ts
    └── ui/
        ├── progress.ts          # $step atom (Step enum 0-7)
        └── index.ts
```

---

## Step Routing

Steps are encoded as an enum in `src/lib/state/ui/progress.ts`:

```ts
enum Step {
  Welcome      = 0,
  Building     = 1,
  GeneralData  = 2,
  OuterParts   = 3,
  Heat         = 4,
  Electricity  = 5,
  Renovation   = 6,
  Result       = 7,
}
```

`$step` is a nanostore atom. `ButtonBar` reads it to increment/decrement. The Astro layout (`EnergyCalculationPage.astro`) uses a `data-step-gate` attribute to show/hide content based on the current step. `hasNextStep = step < 7` (all steps have a Continue button).

---

## State Flow

```
3D Scene (Cesium feature)
        │  setBuilding(feature)
        ▼
   $building  ──────────────────────────────────────┐
        │                                           │
        │  on change → $inputState.set({})          │
        ▼                                           ▼
  $lod2Input (computed)                  [used as fallback geometry]
  (geometry → input shape)
        │
        ▼
  $calculationInput (computed)
  ┌────────────────────────────────────────────────────────┐
  │  merges (lowest → highest priority):                  │
  │    hard defaults  <  LOD2 geometry  <  $inputState    │
  └──────────────────────────────┬─────────────────────────┘
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
        calculate($config, input)    $renovations (computed)
                     │               (flat array of selected
                     ▼                Renovation[] from all 3 categories)
          $currentEnergyState              │
          ┌────────────────────┐           ▼
          │ energyConsumption  │   applyRenovation(input, renovations)
          │ energyEfficiency   │           │
          │ yearlyCost         │           ▼
          │ co2Emissions       │   calculate($config, renovatedInput)
          │ resolvedInput ◄────┤           │
          └────────┬───────────┘           ▼
                   │               $renovatedEnergyState
                   ▼               (same KPI shape as $currentEnergyState)
     $resolvedInput (full DETInput)
          │
          ├─ $resolvedInputState (InputState shape — used as placeholderStore)
          │
          └─ $resolvedGeneralInput, $resolvedHeatInput, ... (per-section, kept for compatibility)
```

User edits in forms flow **up** into `$inputState` via `FieldStore.setValue()`. The computed chain re-runs automatically because nanostores tracks dependencies.

---

## FieldStore Pattern (`src/lib/field-store.ts`)

Every individual input field is backed by a `FieldStore<T>`. All field stores write into the single `$inputState` atom and navigate to their section via `getValue`/`setValue`:

```ts
const myField = makeFieldStore({
  store: $inputState,                     // single unified atom
  getValue: (s) => s.general.fieldName,   // navigate to the section
  setValue: (draft, v) => {               // immer draft mutation
    draft.general.fieldName = v;
  },
  placeholderStore: $resolvedInputState,  // provides grey placeholder
  resettable: true,
});
```

**Key properties available on a FieldStore:**

| Property | Type | Description |
|---|---|---|
| `$store` | `ReadableAtom<T \| undefined>` | Current user value |
| `$placeholder` | `ReadableAtom<T \| undefined>` | Resolved/calculated default |
| `setValue(v)` | function | Write new value via immer |
| `resettable` | boolean | Whether a reset button is shown |

There is no `reset()` method. Callers reset by calling `field.setValue(undefined)`, which the input components do automatically when the reset button is clicked.

---

## SelectionStore & RangeBandStore (`src/lib/selection-store.ts`)

Used for dropdown options.

- **`makeSelectionStore(configKey, filterFn?)`** — creates a readable atom of `{ value, label }[]` derived from `$config`. An optional `filterFn` (which can itself read other atoms) enables dependent dropdowns (e.g., heating system types filtered by energy carrier).
- **`makeRangeBandStore(configKey)`** — same but for year-range objects; handles custom equality for `RangeKey`.

---

## Input Components

### `EnergyCalculationField.tsx`

Wrapper used by all three input types. Accepts these props:

```tsx
<EnergyCalculationField
  labelKey="translation.key"   // i18n key (optional)
  info={<InfoTooltipButton />} // info icon element (optional)
  onReset={() => field.setValue(undefined)}  // enables reset button (optional)
  resetDisabled={value == null}              // greys out reset when nothing to reset
  className="..."
>
  {/* input element */}
</EnergyCalculationField>
```

The reset button is rendered when `onReset` is provided; it is greyed out when `resetDisabled` is true. Input components (`EnergyNumberInput`, `EnergySelectInput`) handle the `field.resettable` check and pass `onReset` accordingly.

### `InfoButton.tsx`

Two exports for adding info icons to field labels:

```tsx
// Tooltip — shows content inline on hover
<InfoTooltipButton content={<p>Explanation text</p>} />

// Dialog trigger — calls onClick to open a dialog
<InfoDialogButton onClick={() => setDialogOpen(true)} />
```

Pass either as the `info` prop of `EnergyNumberInput`, `EnergySelectInput`, or `EnergyCalculationField` directly.

### `EnergyNumberInput.tsx`

```tsx
<EnergyNumberInput
  field={someFieldStore}         // FieldStore<number | undefined>
  labelKey="translation.key"
  info={<InfoTooltipButton content="..." />}
  suffix=" m²"
  decimalScale={1}
/>
```

Placeholder text is the resolved value formatted with suffix. Calls `field.setValue()` on change. Passes `onReset` to `EnergyCalculationField` when `field.resettable` is true.

### `EnergySelectInput.tsx`

Three usage variants depending on the options source:

```tsx
// 1. Static options array
<EnergySelectInput field={f} options={[{ value: 'A', label: 'Option A' }]} />

// 2. SelectionStore (filtered/translated from $config)
<EnergySelectInput field={f} selectionStore={heatingSystemTypeOptions} />

// 3. RangeBandStore (year ranges)
<EnergySelectInput field={f} rangeBandStore={buildingYearOptions} />
```

All variants also accept optional `info`, `disabled`, and `className` props. Auto-selects and disables the select when only one option is available. Clears the value if the current selection disappears from the option list (e.g., after a dependent filter changes).

### `EnergyBooleanInput.tsx`

```tsx
<EnergyBooleanInput field={someFieldStore} labelKey="translation.key" />
```

Renders two radio buttons (Yes / No). When value is `undefined` but a placeholder exists, a subtle dot indicates the calculated default.

---

## Step Forms

### Pattern

Each step is an Astro page (`*Step.astro`) that imports a React form (`*StepForm.tsx`):

```astro
<EnergyCalculationPage step={3}>
  <Typography variant="h2">{t('title')}</Typography>
  <CurrentStats client:load />
  <OuterPartsStepForm client:visible />
  <ButtonBar client:load />
</EnergyCalculationPage>
```

- `client:load` — hydrated immediately (ButtonBar, CurrentStats need it for interactivity)
- `client:visible` — hydrated when scrolled into view (lazy, used for heavy forms)

### GeneralDataStepForm

4 fields in a 2-column grid:

| Field | Type | Resettable |
|---|---|---|
| `buildingYearField` | RangeBand | yes |
| `buildingTypeField` | Selection (SINGLE_FAMILY / MULTI_FAMILY) | yes |
| `numberOfStoriesField` | Number (integer) | yes |
| `livingAreaField` | Number (1 decimal, m²) | yes |

Two additional field stores exist in `general.ts` but are **not rendered** in `GeneralDataStepForm`: `buildingHeightField` and `buildingBaseAreaField`. These are populated from LOD2 geometry and are used internally by the calculation pipeline.

### HeatStepForm

Two sections:

**Versorgung** (supply booleans, top Paper):

| Field | Type | Notes |
|---|---|---|
| `hasGasSupplyField` | Boolean | resettable |
| `hasStorageField` | Boolean | resettable; rendered beside gas supply on large screens |

**Heizung** (main fields, second Paper):

| Field | Type | Notes |
|---|---|---|
| `heatingSystemConstructionYearField` | RangeBand | resettable; uses `buildingYearOptions` from `general.ts` |
| `primaryEnergyCarrierField` | Selection | resettable |
| `heatingSystemTypeField` | Selection | filtered by carrier; resettable |
| `heatingSurfaceTypeField` | Selection | resettable |

### ElectricityStepForm

One boolean field:

| Field | Type | Notes |
|---|---|---|
| `hasRenewableEnergyField` | Boolean | from `src/lib/state/inputs/electricity.ts`; resettable: false |

### RenovationStepForm

Three category sections rendered with `RenovationMultiSelectTable` (Dämmung) and `RenovationSingleSelectTable` (Heizungsfläche, Heizung). Categories influence each other in a chain:

- **Dämmung** receives `$calculationInput` as `baseInput`
- **Heizungsfläche** receives `applyRenovation(baseInput, selectedInsulation)` — so its savings are calculated on top of insulation changes
- **Heizung** receives insulation + heating-surface renovations applied — savings are calculated on the fully patched base

Selection atoms (`$selectedInsulationRenovations`, `$selectedHeatingSurfaceRenovations`, `$selectedHeatingRenovations`) live in `src/lib/state/inputs/renovation.ts`. The computed `$renovations` atom concatenates all three.

`RenovationStats` (rendered with `client:load` in `RenovationStep.astro`) reads `$currentEnergyState` and `$renovatedEnergyState` to show before/after cards.

### RenovationMultiSelectTable / RenovationSingleSelectTable

Both share the same prop shape:

```ts
{
  renovations: Renovation[];
  value: Renovation[];                           // controlled selection
  onSelectionChange: (selected: Renovation[]) => void;
  baseInput: DETInput;
  config: DETConfig;
}
```

- **Multi** uses TanStack Table + `Checkbox`; `RowSelectionState` is derived from `value` via id matching. Footer shows combined savings for the currently selected set (only when `renovations.length > 1`).
- **Single** uses TanStack Table + `RadioGroup`; `value[0].id` drives the controlled radio. Has a hardcoded "Keine Maßnahme" row at the bottom (`id = '__none__'`). No footer.
- Both compute per-row savings via `calculate()` inside `useMemo`, keyed by renovation `id`. Row savings are always relative to `baseInput`.

`RenovationRow` is the shared `<tr>` — renders the selection cell, label, and a colour-coded savings cell (`green-600` / `red-600` / `text-muted-foreground`).

### OuterPartsStepForm

Composed of 6 "Paper" sub-sections stacked vertically:

1. **RoofPaper** — year, area, constructionType; hasAttic, isAtticHeated; insulation fields
2. **RoofWindowsPaper** — year, area, windowType, uValue
3. **TopFloorPaper** — rendered only when `hasAttic && !isAtticHeated`; year, area, topFloorType + insulation
4. **OuterWallPaper** — year, area, constructionType + optional additional insulation
5. **WindowsPaper** — year, area, windowType, uValue (exterior wall windows)
6. **BottomFloorPaper** — context-aware labels based on `hasBasement` + `isBasementHeated`

Conditional visibility inside papers follows the pattern: render the field only if the controlling boolean field store value (or its placeholder) is truthy.
For outer walls, the additional-insulation fields are only shown when the resolved
`allowsAdditionalInsulation` value is true. Both user overrides are cleared when it
becomes false.

### Result

Currently a placeholder — `Result.astro` renders the step title and a `ButtonBar` with `backTextKey="backFromResults"`. No result content exists yet.

---

## Renovation State (`src/lib/state/inputs/renovation.ts`)

```ts
export const $selectedInsulationRenovations = atom<Renovation[]>([]);
export const $selectedHeatingSurfaceRenovations = atom<Renovation[]>([]);
export const $selectedHeatingRenovations = atom<Renovation[]>([]);

export const $renovations = computed(
  [$selectedInsulationRenovations, $selectedHeatingSurfaceRenovations, $selectedHeatingRenovations],
  (insulation, heatingSurface, heating) => [...insulation, ...heatingSurface, ...heating],
);
```

`$renovations` is consumed by `$renovatedEnergyState` in `computed/renovated-energy-state.ts`.

## Renovation Options (`src/lib/state/computed/renovation-options.ts`)

Three computed atoms generate `Renovation[]` from `$config` (and `$resolvedInput` for heating):

```ts
export const $insulationRenovations = computed([$config], (config) =>
  generateInsulationRenovations(config, translateInsulationKey));

export const $heatingSurfaceRenovations = computed([$config, $resolvedInput], (config, resolvedInput) =>
  generateHeatingSurfaceRenovations(config, resolvedInput, i18next.language));

export const $heatingRenovations = computed([$config, $resolvedInput], (config, resolvedInput) =>
  generateHeatingRenovations(config, resolvedInput, i18next.language, i18next.t('...')));
```

Labels are resolved via i18next at computation time. Language changes do not trigger recomputation (known limitation of using i18next inside nanostores computed).

Each `Renovation` has a stable `id` generated by the core library from its functional parameters (i.e., functionally identical renovations produce the same id). This makes id-based selection stable across recomputations.

---

## Adding a New Field — Checklist

1. **Extend the input type** in the energy calculation core types if needed (new fields on an existing `DET*Input` section are picked up automatically via `Partial<>`).
2. **Add a field store** in the relevant `src/lib/state/inputs/*.ts` file using `makeFieldStore(...)`. Point `store` at `$inputState` and navigate to the correct section in `getValue`/`setValue`.
3. **Export** the new field store (and any associated options store) from that file.
4. **Wire placeholder**: if the core `calculate()` already resolves this field it will appear in `$resolvedInputState` automatically — no change needed. If a new `DETInput` section is ever added, extend `InputState` in `atoms.ts` and the mapping in `$resolvedInputState` in `resolved-input.ts`.
5. **Render** in the appropriate `*StepForm.tsx` or `*Paper.tsx` using `<EnergyNumberInput>`, `<EnergySelectInput>`, or `<EnergyBooleanInput>`.
6. **Translate**: add the label key to `src/i18n/locales/de/energyCalculation.json` and `src/i18n/locales/en/energyCalculation.json`.

---

## Key External Dependency

The calculation engine is `@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore`. It exports:

- `calculate(config: DETConfig, input: DETInput, options?: { debug?: boolean }): DETResult`
- `applyRenovation(input: DETInput, renovations: Renovation | Renovation[]): DETInput`
- `generateInsulationRenovations(config, translateKey): Renovation[]`
- `generateHeatingSurfaceRenovations(config, language): Renovation[]`
- `generateHeatingRenovations(config, resolvedInput, language): Renovation[]`
- Type definitions: `DETInput`, `DETConfig`, `DETResult`, `Renovation`, `EnergyEfficiencyClass`, and sub-types per section

`$config` is loaded once and stored in `src/lib/state/calculation-config/index.ts`. It drives all dropdown option lists and renovation generation.
