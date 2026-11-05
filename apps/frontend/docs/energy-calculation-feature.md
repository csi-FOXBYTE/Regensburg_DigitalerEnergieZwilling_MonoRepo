# Energy Calculation Feature — Architecture Reference

This document is intended to quickly orient an AI coding assistant on the structure, data flow, and conventions of the `energyCalculation` feature.

---

## Directory Layout

```
src/feature/energyCalculation/
├── EnergyCalculationField.tsx   # Shared wrapper: label + info + reset button + error
├── EnergyNumberInput.tsx        # Number input field
├── EnergySelectInput.tsx        # Select/dropdown input (3 variants)
├── EnergyBooleanInput.tsx       # Yes/No radio input
├── InfoButton.tsx               # InfoTooltipButton and InfoDialogButton
├── ButtonBar.tsx                # Back/Continue navigation
├── BuildingAddress.tsx          # Address line of the selected building
├── CurrentStats.tsx             # Live stats cards (4 KPIs, compact variant)
├── buildingData/
│   ├── BuildingDataDialog.tsx   # Read-only summary of all entered building data
│   └── *Section.tsx, useBuildingDataFormat.ts
├── general/
│   ├── GeneralDataStep.astro
│   ├── GeneralDataStepForm.tsx
│   └── GeneralDataButtonBar.tsx # ButtonBar gated by $canProgressGeneralDataStep
├── outer/
│   ├── OuterPartsStep.astro
│   ├── OuterPartsStepForm.tsx
│   ├── OuterPartsButtonBar.tsx  # ButtonBar gated by $canProgressOuterPartsStep
│   ├── OuterSectionNav.tsx      # Sticky jump navigation between the papers
│   ├── BuildingPartInfoButton.tsx
│   ├── RoofPaper.tsx
│   ├── RoofWindowsPaper.tsx
│   ├── TopFloorPaper.tsx
│   ├── OuterWallPaper.tsx
│   ├── WindowsPaper.tsx
│   └── BottomFloorPaper.tsx
├── heat/
│   ├── HeatStep.astro
│   ├── HeatStepForm.tsx
│   └── HeatButtonBar.tsx        # ButtonBar gated by $canProgressHeatStep
├── electricity/
│   ├── ElectricityStep.astro
│   └── ElectricityStepForm.tsx
├── renovation/
│   ├── RenovationStep.astro
│   ├── RenovationStepForm.tsx         # Three category tables with chaining
│   ├── RenovationMultiSelectTable.tsx # Checkbox selection with deltas + total row
│   ├── RenovationSingleSelectTable.tsx # Radio selection with deltas + "no measure" row
│   ├── RenovationRow.tsx              # Shared table row (label, badge, deltas)
│   ├── RenovationTableHead.tsx        # Sortable table header
│   ├── renovationColumns.ts           # TanStack column definitions (sorting only)
│   ├── RenovationRecommendedToggle.tsx # Global "select recommended" switch
│   ├── recommendedSelection.ts        # Logic behind the switch
│   ├── RenovationStats.tsx            # Before/after KPI comparison cards
│   ├── RenovationSummaryDialog.tsx    # Selected measures (used on the result step)
│   └── RenovationSummaryContent.tsx
└── result/
    ├── Result.astro
    ├── EnergyClassDisplay.tsx   # Energy class before/after (EnergyClassBars)
    ├── SubsidySection.tsx       # Subsidies from the active config (SubsidyCard)
    └── NextStepsSection.tsx     # PDF report download + optional data donation

src/lib/
├── field-store.ts               # FieldStore<T> pattern
├── selection-store.ts           # makeSelectionStore / makeRangeBandStore / bindFieldToOptions
├── yearHelper/rangeBandOptions.ts # Year band options, labels, equality
└── state/
    ├── building/index.ts        # Selected building atom + session transitions
    ├── calculation-config/index.ts  # Active config, subsidies, version name
    ├── inputs/
    │   ├── atoms.ts             # $inputState + renovation selection atoms + hydrateInputs()
    │   ├── general.ts           # Field stores for general step
    │   ├── heat.ts              # Field stores for heat step
    │   ├── electricity.ts       # Field stores for electricity step
    │   ├── outer-parts.ts       # $canProgressOuterPartsStep
    │   ├── renovation.ts        # Re-exports selection atoms, $renovations
    │   ├── roof.ts
    │   ├── roof-windows.ts
    │   ├── outer-wall.ts
    │   ├── exterior-wall-windows.ts
    │   ├── top-floor.ts         # Also hasAttic / isAtticHeated
    │   ├── bottom-floor.ts      # Also hasBasement / isBasementHeated
    │   └── index.ts
    ├── computed/
    │   ├── lod2-input.ts        # Building geometry → input shape
    │   ├── calculation-input.ts # Merges all inputs → DETInput
    │   ├── current-energy-state.ts  # Calls calculate() on the current state
    │   ├── renovated-energy-state.ts # Applies $renovations, calls calculate()
    │   ├── renovation-options.ts    # Renovation[] lists + patched inputs for the tables
    │   ├── resolved-input.ts    # Resolved values (placeholders)
    │   └── index.ts
    ├── session/
    │   ├── storage.ts           # Consent-aware localStorage persistence
    │   ├── index.ts             # Save/load/start over, current snapshot
    │   ├── auto-save.ts         # Saves on every relevant store change
    │   └── restore-codec.ts     # Validation + encoding for the recovery link
    └── ui/
        ├── progress.ts          # Step enum, $step, $maxStepReached, navigateToStep()
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

- `$step` holds the current step, `$maxStepReached` the furthest step reached (persisted in the session).
- `navigateToStep(target)` moves forward via `history.pushState` (one entry per step) and backward via `history.go()`. The `popstate` handler in `src/pages/[...locale]/index.astro` then calls `setStep()`.
- All steps are rendered on one page (`src/pages/[...locale]/index.astro`). Each step is wrapped in `EnergyCalculationPage.astro`, which sets a `data-step-gate` attribute. A script in `DETLayout.astro` subscribes to `$step` and shows only the matching section.
- `ButtonBar` reads `$step`, tracks the confirmed step (`trackStepConfirmed`) and calls `navigateToStep(step ± 1)`. `hasNextStep = step < Step.Result`. An optional `canProgress` atom disables the Continue button; the step-specific wrappers (`GeneralDataButtonBar`, `OuterPartsButtonBar`, `HeatButtonBar`) pass the matching `$canProgress*Step` atom.

---

## State Flow

```
3D Scene (Cesium feature) / session restore
        │  setBuilding(...) / setBuildingState(...)
        ▼
   $building  ─────────────────────────────────────────────┐
        │                                                  │
        │  on change → hydrateInputs(getSession(id))       │
        │  (restores saved inputs + renovations or empty)  │
        ▼                                                  ▼
  $inputState, $selected*Renovations          $lod2Input (computed)
        │                                     (geometry, construction year,
        │                                      geothermal availability)
        └──────────────────┬───────────────────────────────┘
                           ▼
              $calculationInput (computed)
  ┌────────────────────────────────────────────────────────┐
  │  merges per section (lowest → highest priority):      │
  │    placeholders  <  LOD2 values  <  $inputState       │
  │    (only defined user values override)                │
  └──────────────────────────────┬─────────────────────────┘
                                 │
                     ┌───────────┴────────────────┐
                     ▼                            ▼
   calculate($config, input, { debug })   $renovations (computed)
                     │                    (flat array of selected
                     ▼                     Renovation[] from all 3 categories)
          $currentEnergyState                     │
          (CalculationResult)                     ▼
          ├─ preRenovationValues ──────► applyRenovation(
          │                               { ...input, preRenovationValues },
          │                               renovations)
          │                                       │
          │                                       ▼
          │                         calculate($config, renovatedInput)
          │                                       │
          │                                       ▼
          │                             $renovatedEnergyState
          │                             (same CalculationResult shape)
          ▼
     $resolvedInput (full resolved DETInput)
          │
          ├─ $resolvedInputState (InputState shape — used as placeholderStore)
          │
          └─ $resolvedGeneralInput, $resolvedHeatInput, ... (per-section)
```

User edits in forms flow **up** into `$inputState` via `FieldStore.setValue()`. The computed chain re-runs automatically because nanostores tracks dependencies.

`preRenovationValues` carry reference values of the current state (e.g. energy carrier, heating system, electricity offset) into the renovated calculation, so that the renovated result stays comparable to the current state.

`emptyInputState()` presets `heat.heatingSurfaceType = 'free_heat_emitter'`; all other sections start empty.

---

## Calculation Config (`src/lib/state/calculation-config/index.ts`)

On page load the frontend fetches `/api/public/config/active` and validates `calculationConfig` with `validateConfig()`.

| Store | Content |
|---|---|
| `$config` | Active `DETConfig`; falls back to `DEFAULT_CONFIG` while loading, on validation errors and on load errors |
| `$versionName` | Name of the active config version (`'DEFAULT'` on fallback); sent with the data donation |
| `$subsidies` | Subsidies delivered with the active config (result step) |
| `$configLoadFailed` | `true` if loading failed |
| `$energyEfficiencyClasses` | Thresholds and colours per energy efficiency class |

`$config` drives all dropdown option lists and renovation generation.

---

## Session Persistence (`src/lib/state/session/`)

- Each building has its own saved session (`det_building_data_<buildingId>`), plus a meta entry `det_meta` with the last active building and step. Storage only takes place if functional storage is permitted by consent; progress expires after 90 days (`PROGRESS_TTL`).
- A session contains step, `maxStepReached`, building, camera target, `$inputState` and the three renovation selections.
- `auto-save.ts` listens to `$step`, `$maxStepReached`, `$inputState` and the selection atoms. The in-memory copy is updated immediately, the persistent copy is flushed after 1 s and on `pagehide`. Changes during a session transition (`isSessionTransition()`) are ignored.
- Before the building changes, the current session is saved (`beforeBuildingChange(saveSession)`).
- `startOverSession(id)` clears the saved session and returns to `Step.GeneralData`.
- Recovery link: `encodeSessionRestore(snapshot)` produces the `#restore=…` fragment that is part of the PDF report. On page load, `index.astro` decodes it, validates it with `isSavedSession()` and loads it via `loadSessionFromData()`.

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

Validation is modelled as computed atoms next to the field stores (e.g. `$isLivingAreaInvalid`, `$isThermalBaseRateInvalid`). They are shown via the `error` prop of the input and combined into `$canProgress*Step` atoms for the step's ButtonBar.

---

## Option Stores (`src/lib/selection-store.ts`)

Used for dropdown options.

- **`makeSelectionStore(getOptions, filter?)`** — readable atom of `Selection[]` derived from `$config`. The optional `filter` (`{ $store, getKey, getFilter }`) restricts the options via a `SelectionFilter` from the config, keyed by a value from another store.
- **`makeRangeBandStore({ getRanges, formatLabel? })`** — year-band options from the config. With an additional `$store`, `getRanges(config, state)` can depend on other values (e.g. `buildingOrNewerYearOptions`: only bands at or after the building year).
- **`bindFieldToOptions(field, optionsStore, isEqual?)`** — keeps a field valid for a reactive option list independent of mounted components: an invalid value is cleared, a sole option is selected automatically.

Some option lists are plain `computed` atoms where the filter logic does not fit `makeSelectionStore`. Example from `heat.ts`:

- `primaryEnergyCarrierOptions` — carriers filtered by `isCarrierCompatible()` (gas supply, fuel storage).
- `heatingSystemTypeOptions` — systems filtered by `allowedHeatingSystemTypesByCarrier` for the resolved carrier and by `isHeatingSystemCompatible()` (geothermal availability).

---

## Input Components

### `EnergyCalculationField.tsx`

Wrapper used by all three input types. Accepts these props:

```tsx
<EnergyCalculationField
  labelKey="translation.key"   // i18n key (optional)
  info={<InfoTooltipButton />} // info icon element (optional)
  error={errorMessage}         // validation message below the input (optional)
  onReset={() => field.setValue(undefined)}  // enables reset button (optional)
  resetDisabled={value == null}              // greys out reset when nothing to reset
  labelFor={inputId}           // links the label to the input (optional)
  labelId={labelId}            // id of the label, e.g. for aria-labelledby (optional)
  errorId={errorId}            // id of the error element (optional)
  className="..."
>
  {/* input element */}
</EnergyCalculationField>
```

The reset button is rendered when `onReset` is provided; it is greyed out when `resetDisabled` is true. Without `onReset`, a spacer keeps the inputs aligned. Input components handle the `field.resettable` check and pass `onReset` accordingly.

### `InfoButton.tsx`

Two exports for adding info icons to field labels:

```tsx
// Tooltip — shows content on hover/click
<InfoTooltipButton content={<p>Explanation text</p>} />

// Dialog — opens a dialog with title, optional media and content
<InfoDialogButton title="Title" content="Explanation text" media={<img ... />} />
```

Pass either as the `info` prop of `EnergyNumberInput`, `EnergySelectInput`, `EnergyBooleanInput`, or `EnergyCalculationField` directly.

### `EnergyNumberInput.tsx`

```tsx
<EnergyNumberInput
  field={someFieldStore}         // FieldStore<number | undefined>
  labelKey="translation.key"
  info={<InfoTooltipButton content="..." />}
  suffix=" m²"
  decimalScale={1}
  displayFactor={100}            // optional: shown value = stored value × factor (e.g. m → cm)
  error={invalid ? t('...') : undefined}
/>
```

Further `NumberInputProps` from `@/components/ui/number-input` (e.g. `allowNegative`, `fixedDecimalScale`, `isAllowed`) are passed through. Placeholder text is the resolved value formatted with suffix. Calls `field.setValue()` on change. Passes `onReset` to `EnergyCalculationField` when `field.resettable` is true.

### `EnergySelectInput.tsx`

Three usage variants depending on the options source:

```tsx
// 1. Static options array
<EnergySelectInput field={f} options={[{ value: 'A', label: 'Option A' }]} />

// 2. Selection store (Selection[] from $config, label from localization)
<EnergySelectInput field={f} selectionStore={heatingSystemTypeOptions} />

// 3. RangeBandStore (year ranges)
<EnergySelectInput field={f} rangeBandStore={buildingYearOptions} />
```

All variants also accept optional `info`, `disabled`, `sortAlphabetically` and `className` props. Without `sortAlphabetically` the config order is kept. Variants 2 and 3 disable the select when only one option is available. The component does not change the value itself: auto-selecting a sole option and clearing a value that disappears from the option list is done by `bindFieldToOptions()`, which the input stores call for their select fields.

### `EnergyBooleanInput.tsx`

```tsx
<EnergyBooleanInput
  field={someFieldStore}
  labelKey="translation.key"
  trueKey={{ ns: 'energyCalculation', key: 'booleanLabels.heated' }}   // optional
  falseKey={{ ns: 'energyCalculation', key: 'booleanLabels.notHeated' }} // optional
/>
```

Renders two radio buttons (Yes / No by default). When value is `undefined` but a placeholder exists, a subtle dot and italic label indicate the calculated default.

---

## Step Forms

### Pattern

Each step is an Astro component (`*Step.astro`) that imports a React form (`*StepForm.tsx`):

```astro
<EnergyCalculationPage step={4}>
  <ContentContainer>
    <Typography as="h1" variant="h2">{i18next.t('energyCalculation:heat.title')}</Typography>
    <BuildingAddress client:only="react" />
  </ContentContainer>
  <StickyContainer compactWhenStuck>
    <CurrentStats client:only="react" />
    <Fragment slot="compact">
      <CurrentStats compact client:only="react" />
    </Fragment>
  </StickyContainer>
  <ContentContainer>
    <HeatStepForm client:only="react" />
    <HeatButtonBar className="mt-8" client:load />
  </ContentContainer>
</EnergyCalculationPage>
```

- `client:only="react"` — forms, stats and other store-driven components are rendered on the client only.
- `client:load` — hydrated immediately (ButtonBars, dialogs).
- `StickyContainer` keeps the KPI cards visible; with `compactWhenStuck`, the `compact` slot is shown once the container sticks.
- Stats per step: `CurrentStats` on the outer parts, heat and electricity steps; `RenovationStats` on the renovation and result steps. The general data step shows no stats.

### GeneralDataStepForm

Fields in a 2-column grid:

| Field | Type | Notes |
|---|---|---|
| `buildingYearField` | RangeBand | resettable |
| `buildingTypeField` | Selection (SINGLE_FAMILY / MULTI_FAMILY) | resettable |
| `hasAtticField` | Boolean | from `top-floor.ts` |
| `isAtticHeatedField` | Boolean (heated / not heated) | from `top-floor.ts`; only when `hasAttic` |
| `hasBasementField` | Boolean | from `bottom-floor.ts` |
| `isBasementHeatedField` | Boolean (heated / not heated) | from `bottom-floor.ts`; only when `hasBasement` |
| `numberOfStoriesField` | Number (integer, ≥ 1) | resettable |
| `livingAreaField` | Number (1 decimal, m²) | resettable; must be > 0 (`$isLivingAreaInvalid`) |

Two additional field stores exist in `general.ts` but are **not rendered**: `buildingHeightField` and `buildingBaseAreaField`. These are populated from LOD2 geometry and are used internally by the calculation pipeline.

### OuterPartsStepForm

Composed of 6 "Paper" sub-sections stacked vertically. `OuterSectionNav` (in the sticky container, from `md`) scrolls to the papers and highlights the active one.

1. **RoofPaper** — year, area, constructionType, hasInsulation → insulation thickness and insulation type
2. **RoofWindowsPaper** — year, area, windowType, uValue; hidden when `hasAttic && !isAtticHeated`
3. **TopFloorPaper** — rendered only when `hasAttic && !isAtticHeated`; year, area, topFloorType, hasInsulation → insulation thickness
4. **OuterWallPaper** — year, area, adjacent wall area, constructionType, optional additional insulation
5. **WindowsPaper** — year, area, windowType, uValue (exterior wall windows)
6. **BottomFloorPaper** — area, year, constructionType, hasInsulation → insulation thickness; labels depend on `hasBasement` + `isBasementHeated`

Conditional visibility inside papers follows the pattern: render the field only if the controlling boolean field store value (or its placeholder) is truthy.
For outer walls, the additional-insulation fields are only shown when the resolved
`allowsAdditionalInsulation` value is true. Both user overrides are cleared when it
becomes false.

`$canProgressOuterPartsStep` blocks Continue while the roof window, top floor, exterior wall window or adjacent wall area is invalid.

### HeatStepForm

Three sections:

**Versorgung** (supply booleans, first Paper):

| Field | Type | Notes |
|---|---|---|
| `hasGasSupplyField` | Boolean | resettable; filters the carrier options |
| `hasStorageField` | Boolean | resettable; filters the carrier options |

**Heizung** (main fields, second Paper):

| Field | Type | Notes |
|---|---|---|
| `heatingSystemConstructionYearField` | RangeBand | resettable; uses `buildingOrNewerYearOptions` from `general.ts` |
| `primaryEnergyCarrierField` | Selection | resettable; options from `primaryEnergyCarrierOptions` |
| `heatingSystemTypeField` | Selection | resettable; options filtered by carrier and geothermal availability |
| `heatingSurfaceTypeField` | Selection | resettable |

**Kosten** (heating bill, third Paper — hidden when `$isSystemOnlyElectrical`):

| Field | Type | Notes |
|---|---|---|
| `userThermalTotalCostField` | Number (€/a) | resettable |
| `userThermalUnitRateField` | Number (€/unit of the carrier) | resettable; must be > 0 if a total cost is given |
| `userThermalBaseRateField` | Number (€/a) | resettable; must not exceed the total cost |

When the heating system becomes purely electrical, the three cost fields are cleared. `$canProgressHeatStep` blocks Continue while the unit or base rate is invalid.

### ElectricityStepForm

| Field | Type | Notes |
|---|---|---|
| `electricityTypeField` | Selection | resettable |
| `userElectricityConsumptionField` | Number (kWh/a) | resettable |
| `electricityUnitRateField` | Number (€/kWh) | resettable |
| `electricityBaseRateField` | Number (€/a) | resettable |

### RenovationStepForm

Three category sections, rendered in this order:

1. **Dämmung** — `RenovationMultiSelectTable`; the heading row also contains the global `RenovationRecommendedToggle`.
2. **Heizung** — `RenovationSingleSelectTable`; only rendered if heating renovations exist.
3. **Heizfläche** — `RenovationSingleSelectTable`; only rendered if heating surface renovations exist.

Categories influence each other in a chain (Dämmung → Heizung → Heizfläche). Both the offered options and the row deltas are calculated on top of the previous categories:

| Table | Options generated from | `baseInput` for the row deltas |
|---|---|---|
| Dämmung | `$resolvedInput` | `$baseInputForCost` (`$calculationInput` + `preRenovationValues`) |
| Heizung | resolved input + selected insulation | `$insulationPatchedInputForCost` |
| Heizfläche | resolved input + selected insulation + selected heating | `$heatingPatchedInputForCost` |

Selection atoms (`$selectedInsulationRenovations`, `$selectedHeatingSurfaceRenovations`, `$selectedHeatingRenovations`) are defined in `src/lib/state/inputs/atoms.ts` and re-exported from `src/lib/state/inputs/renovation.ts`. The computed `$renovations` atom concatenates all three.

`RenovationStats` (in the sticky container of `RenovationStep.astro`) reads `$currentEnergyState` and `$renovatedEnergyState` to show before/after cards. `BuildingDataDialog` in the step header shows the entered building data.

#### Recommended selection (`recommendedSelection.ts`)

- `applyRecommendedRenovations()` selects all recommended insulation renovations, then — in chain order — the recommended heating renovation and the recommended heating surface renovation. If several renovations in a single-select table are recommended, the one with the lowest yearly cost wins (`bestBySavings`).
- `clearRenovationSelections()` empties all three selections.
- `useRecommendedSelectionState()` provides `{ hasRecommendation, checked }`. The switch has no state of its own: it is on exactly when the current selection equals the recommendation, and disabled when nothing is recommended.

### RenovationMultiSelectTable / RenovationSingleSelectTable

Both share the same prop shape (Single additionally accepts `noMeasureTooltip`):

```ts
{
  renovations: Renovation[];
  value: Renovation[];                           // controlled selection
  onSelectionChange: (selected: Renovation[]) => void;
  baseInput: DETInput;
  config: DETConfig;
  noMeasureTooltip?: string;                     // Single only
}
```

- Per row, two deltas relative to `baseInput` are calculated via `calculate()` inside `useMemo`, keyed by renovation `id`: energy (`annualTotalEnergyDemand`, kWh/a) and cost (`yearlyCost`, €/a). Negative values are improvements.
- Columns (measure, energy potential, savings) are sortable via `RenovationTableHead`; `renovationColumns.ts` defines them for TanStack sorting only (signed numeric sort for the deltas, locale sort for the label).
- Recommended renovations get a "recommended" badge. Tooltips are looked up per row under `renovation.tooltips.<renovation id>`.
- **Multi** uses `Checkbox`; the TanStack `RowSelectionState` is derived from `value` via id matching. A footer shows the combined deltas of the selected set (only when `renovations.length > 1`).
- **Single** uses `RadioGroup`; `value[0].id` drives the controlled radio. A hardcoded "Keine Maßnahme" row is always appended at the bottom (`id = '__none__'`). No footer.

`RenovationRow` is the shared `<tr>` — renders the selection cell, label with optional info, badge and the colour-coded deltas (`green-600` / `red-600` / `text-muted-foreground`).

### Result

`Result.astro` shows:

- `RenovationSummaryDialog` — selected measures per category.
- `RenovationStats` — before/after cards.
- `EnergyClassDisplay` — energy efficiency class before and after renovation.
- `SubsidySection` — subsidies from `$subsidies`, with an error notice if the config could not be loaded.
- `NextStepsSection` — next steps (incl. municipal energy advice) and PDF report download. The report contains the recovery link. With the consent checkbox ticked, the calculation input is additionally submitted to the backend (`submitEnergyData`, incl. `$versionName`).
- `ButtonBar` with `backTextKey="backFromResults"` (no Continue button) and `FeedbackBubble`.

---

## Renovation State (`src/lib/state/inputs/atoms.ts`, `renovation.ts`)

```ts
// atoms.ts
export const $selectedInsulationRenovations = atom<Renovation[]>([]);
export const $selectedHeatingSurfaceRenovations = atom<Renovation[]>([]);
export const $selectedHeatingRenovations = atom<Renovation[]>([]);

// renovation.ts
export const $renovations = computed(
  [$selectedInsulationRenovations, $selectedHeatingSurfaceRenovations, $selectedHeatingRenovations],
  (insulation, heatingSurface, heating) => [...insulation, ...heatingSurface, ...heating],
);
```

`$renovations` is consumed by `$renovatedEnergyState` in `computed/renovated-energy-state.ts`. The selections are part of the saved session.

## Renovation Options (`src/lib/state/computed/renovation-options.ts`)

Three computed atoms generate `Renovation[]` from `$config`, chained via the selected renovations of the previous category:

```ts
export const $insulationRenovations = computed([$config, $resolvedInput], (config, resolvedInput) =>
  generateInsulationRenovations(config, resolvedInput, translateInsulationKey));

export const $heatingRenovations = computed([$config, $resolvedInsulationPatchedInput], (config, patchedInput) =>
  generateHeatingRenovations(config, patchedInput, i18next.language, i18next.t('energyCalculation:renovation.heating.renewal')));

export const $heatingSurfaceRenovations = computed([$config, $resolvedHeatingPatchedInput], (config, patchedInput) =>
  generateHeatingSurfaceRenovations(config, patchedInput, i18next.language));
```

The same file exports the inputs used for the row deltas: `$baseInputForCost`, `$insulationPatchedInputForCost` and `$heatingPatchedInputForCost`.

Labels are resolved via i18next at computation time. Language changes do not trigger recomputation (known limitation of using i18next inside nanostores computed).

Each `Renovation` has a stable `id` generated by the core library from its functional parameters (`envelope_<key>`, `heat_renew`, `heat_<carrier>_<system>`, `surface_<surfaceType>`). This makes id-based selection stable across recomputations. Which renovations are offered and recommended is defined in `config.renovation` and evaluated by the core library.

---

## Adding a New Field — Checklist

1. **Extend the input type** in the energy calculation core types if needed (new fields on an existing `DET*Input` section are picked up automatically via `Partial<>`).
2. **Add a field store** in the relevant `src/lib/state/inputs/*.ts` file using `makeFieldStore(...)`. Point `store` at `$inputState` and navigate to the correct section in `getValue`/`setValue`.
3. **Options**: for a select field, add an option store (`makeSelectionStore`, `makeRangeBandStore` or a `computed`) and call `bindFieldToOptions(field, options)` if the options can change.
4. **Export** the new field store (and any associated options store) from that file.
5. **Wire placeholder**: if the core `calculate()` already resolves this field it will appear in `$resolvedInputState` automatically — no change needed. If a new `DETInput` section is ever added, extend `InputState` and `emptyInputState()` in `atoms.ts`, the mapping in `$resolvedInputState` in `resolved-input.ts`, the merge in `calculation-input.ts` and the section check in `session/restore-codec.ts`.
6. **Validate** if needed: add a `$is*Invalid` computed atom, pass it as `error` and include it in the step's `$canProgress*Step` atom.
7. **Render** in the appropriate `*StepForm.tsx` or `*Paper.tsx` using `<EnergyNumberInput>`, `<EnergySelectInput>`, or `<EnergyBooleanInput>`. Consider adding the field to the matching section in `buildingData/`.
8. **Translate**: add the label key to `src/i18n/locales/de/energyCalculation.json` and `src/i18n/locales/en/energyCalculation.json`.

---

## Key External Dependency

The calculation engine is `@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore` (workspace package `packages/energy-core`). The frontend mainly uses:

- `calculate(config: DETConfig, input: DETInput, options?: { debug?: boolean }): CalculationResult`
- `applyRenovation(input: DETInput, renovations: Renovation | Renovation[]): DETInput`
- `generateInsulationRenovations(config, input, translateKey): Renovation[]`
- `generateHeatingRenovations(config, input, locale, systemRenewalLabel?): Renovation[]`
- `generateHeatingSurfaceRenovations(config, input, locale): Renovation[]`
- `isCarrierCompatible(carrier, input)`, `isHeatingSystemCompatible(system, input)`
- `validateConfig(config)`, `DEFAULT_CONFIG`, `resolveKeyedValue(...)`
- Type definitions: `DETInput`, `DETConfig`, `CalculationResult`, `Renovation`, `EnergyEfficiencyClass`, `Selection`, `RangeKey`, `Subsidy`, and sub-types per section
