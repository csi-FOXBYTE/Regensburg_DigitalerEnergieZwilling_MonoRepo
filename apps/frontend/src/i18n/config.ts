export const locales = ['de', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const defaultNamespace = 'common';

export const namespaces = [
  'common',
  'landingPage',
  'progressBar',
  'energyCalculation',
  'map',
  'methodology',
  'municipality',
] as const;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (locales as readonly string[]).includes(value)
  );
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
