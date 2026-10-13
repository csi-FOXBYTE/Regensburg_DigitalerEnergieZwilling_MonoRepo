import type { BuildingType } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';

/**
 * Approved event catalog (apps/backend/docs/system/06-matomo-trackingkonzept.md).
 * Changes require the concept's change process and a version bump.
 */
export const ANALYTICS_CATALOG_VERSION = 1;
export const EVENT_CATEGORY = 'Sanierungstool';

export const STEP_IDS = [
  'landing',
  'building_selection',
  'initial_assessment',
  'building_data',
  'building_envelope',
  'heating',
  'electricity_renewables',
  'renovation_measures',
  'results',
  'pdf_export',
  'consulting_contact',
  'data_donation',
] as const;
export type StepId = (typeof STEP_IDS)[number];

const BUILDING_TYPE_KEYS = {
  singleFamily: 'single_family',
  multiFamily: 'multi_family',
} as const satisfies Record<BuildingType, string>;

/** Renovation IDs from energy-core and the default config; unmapped IDs are never sent. */
const MEASURE_KEYS = {
  envelope_roof: 'envelope_roof',
  envelope_topFloor: 'envelope_top_floor',
  envelope_bottomFloor: 'envelope_bottom_floor',
  envelope_outerWalls: 'envelope_outer_walls',
  envelope_outerWindows: 'envelope_windows',
  envelope_roofWindows: 'envelope_roof_windows',
  heat_renew: 'heating_system_renewal',
  heat_none_air_source_heat_pump_lt_40: 'heating_air_source_heat_pump',
  heat_none_ground_source_heat_pump_lt_40: 'heating_ground_source_heat_pump',
  heat_wood_pellets_standard_boiler_70_55: 'heating_wood_pellet_boiler',
  heat_bio_gas_improved_condensing_boiler_55_45:
    'heating_biogas_condensing_boiler',
  heat_district_heating_district_heating_all_temperatures:
    'heating_district_heating',
  surface_radiant_surface_heating: 'heating_surface_radiant',
} as const;

export const DOCUMENT_TYPES = ['energy_report_pdf'] as const;
export const CONTACT_CHANNELS = ['energy_advice_link'] as const;

/** Allowed parameter values per event code; `null` means the event has no parameter. */
export const EVENT_PARAMETERS = {
  tool_started: null,
  step_completed: STEP_IDS,
  building_type_confirmed: Object.values(BUILDING_TYPE_KEYS),
  renovation_measure_confirmed: Object.values(MEASURE_KEYS),
  tool_completed: null,
  pdf_downloaded: DOCUMENT_TYPES,
  contact_requested: CONTACT_CHANNELS,
  donation_started: null,
  donation_completed: null,
} as const satisfies Record<string, readonly string[] | null>;

export type EventCode = keyof typeof EVENT_PARAMETERS;
export type EventValue<C extends EventCode> =
  (typeof EVENT_PARAMETERS)[C] extends readonly (infer V)[] ? V : undefined;
export type AnalyticsEvent = {
  [C in EventCode]: { code: C; value: EventValue<C> };
}[EventCode];

const has = (values: readonly string[], value: unknown) =>
  typeof value === 'string' && values.includes(value);

export function isAllowedEvent(code: unknown, value: unknown): boolean {
  if (typeof code !== 'string' || !Object.hasOwn(EVENT_PARAMETERS, code))
    return false;
  const allowed = EVENT_PARAMETERS[code as EventCode];
  return allowed === null ? value === undefined : has(allowed, value);
}

export function buildingTypeKey(type: unknown) {
  return typeof type === 'string' && Object.hasOwn(BUILDING_TYPE_KEYS, type)
    ? BUILDING_TYPE_KEYS[type as BuildingType]
    : undefined;
}

export function measureKey(renovationId: unknown) {
  return typeof renovationId === 'string' &&
    Object.hasOwn(MEASURE_KEYS, renovationId)
    ? MEASURE_KEYS[renovationId as keyof typeof MEASURE_KEYS]
    : undefined;
}
