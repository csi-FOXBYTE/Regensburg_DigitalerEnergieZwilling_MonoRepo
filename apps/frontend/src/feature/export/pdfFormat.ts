/**
 * Number formatting rules for the PDF report. Kept in one place so the
 * decimals follow the quantity instead of the call site.
 */

type Options = { signed?: boolean };

function format(value: number, decimals: number, signed = false): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(signed ? { signDisplay: 'always' as const } : {}),
  });
}

/** Energy demands and fuel quantities: no decimals. */
export function formatEnergy(value: number, options: Options = {}): string {
  return format(value, 0, options.signed);
}

/** Euro amounts: always exactly two decimals. */
export function formatEuro(value: number, options: Options = {}): string {
  return format(value, 2, options.signed);
}

/** Savings in percent: no decimals. */
export function formatPercent(value: number, options: Options = {}): string {
  return format(value, 0, options.signed);
}

/** Everything without its own rule: areas, U-values, CO₂ emissions. */
export function formatNumber(
  value: number,
  decimals: number,
  options: Options = {},
): string {
  return format(value, decimals, options.signed);
}
