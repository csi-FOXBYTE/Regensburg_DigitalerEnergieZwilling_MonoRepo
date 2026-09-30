import {
  DEFAULT_CONFIG,
  resolveKeyedValue,
  validateConfig,
  type DETConfig,
  type RangeKey,
  type Subsidy,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { atom, computed } from 'nanostores';

export type SubsidyFinancing = 'loan' | 'grant';

/**
 * Der Rechenkern kennt `financing` noch nicht. Bis die neue Version deployt
 * ist, wird das Feld händisch in der Förder-Config gepflegt und hier
 * ergänzt. Sobald der Kern es mitliefert, kann diese Erweiterung entfallen.
 */
export type SubsidyWithFinancing = Subsidy & { financing: SubsidyFinancing };

type ActiveConfig = {
  versionName: string;
  calculationConfig: DETConfig;
  subsidies: Array<{ subsidy: SubsidyWithFinancing; isActive: boolean }>;
};

const $activeConfig = atom<ActiveConfig | null>(null);

export const $versionName = computed(
  $activeConfig,
  (c) => c?.versionName ?? 'DEFAULT',
);
export const $config = computed(
  $activeConfig,
  (c) => c?.calculationConfig ?? DEFAULT_CONFIG,
);
export const $subsidies = computed($activeConfig, (c) => c?.subsidies ?? []);
export const $configLoadFailed = atom(false);

function parseField(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function parseSubsidies(value: unknown): ActiveConfig['subsidies'] {
  const wrapped =
    Array.isArray(value) && typeof value[0] === 'string' ? value[0] : value;
  const parsed = parseField(wrapped);
  return Array.isArray(parsed) ? (parsed as ActiveConfig['subsidies']) : [];
}

async function loadActiveConfig() {
  try {
    const res = await fetch('/api/public/config/active');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = validateConfig(parseField(data.calculationConfig));
    if (!result.success) {
      console.error('Invalid calculation config, using defaults', result);
    }
    $activeConfig.set({
      versionName: result.success ? data.versionName : 'DEFAULT',
      calculationConfig: result.success ? result.data : DEFAULT_CONFIG,
      subsidies: parseSubsidies(data.subsidies),
    });
  } catch (error) {
    console.error('Loading the active config failed', error);
    $configLoadFailed.set(true);
  }
}

if (typeof window !== 'undefined') void loadActiveConfig();

export type EnergyEfficiencyClassData = Map<
  string,
  { threshhold: RangeKey; color: string }
>;

export const $energyEfficiencyClasses = computed($config, (config) => {
  const classData: EnergyEfficiencyClassData = new Map();

  for (const effClass of config.general.energyEfficiencyClasses) {
    const color = resolveKeyedValue(
      config.general.energyEfficiencyClassColors,
      effClass.value,
    );
    const threshhold: RangeKey = {
      from: (effClass as RangeKey).from,
      to: (effClass as RangeKey).to,
    };
    classData.set(effClass.value, { threshhold, color });
  }
  return classData;
});
