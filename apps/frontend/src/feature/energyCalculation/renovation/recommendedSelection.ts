import { $config } from '@/lib/state/calculation-config';
import {
  $heatingPatchedInputForCost,
  $heatingRenovations,
  $heatingSurfaceRenovations,
  $insulationPatchedInputForCost,
  $insulationRenovations,
} from '@/lib/state/computed/renovation-options';
import {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '@/lib/state/inputs/renovation';
import {
  applyRenovation,
  calculate,
  type DETConfig,
  type DETInput,
  type Renovation,
} from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';

function recommendedOf(renovations: Renovation[]) {
  return renovations.filter((r) => r.recommended);
}

function sameIds(a: Renovation[], b: Renovation[]) {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((r) => r.id));
  return b.every((r) => ids.has(r.id));
}

/**
 * Single-Select-Tabellen nehmen nur eine Massnahme auf. Sparpotential ist ein
 * Delta auf die Jahreskosten - je negativer, desto mehr spart die Massnahme.
 * "Hoechstes Sparpotential" ist deshalb das Minimum, nicht das Maximum.
 */
function bestBySavings(
  candidates: Renovation[],
  config: DETConfig,
  baseInput: DETInput,
): Renovation[] {
  if (candidates.length <= 1) return candidates;

  const baseCost = calculate(config, baseInput).yearlyCost;
  let best = candidates[0];
  let bestSavings = Infinity;

  for (const candidate of candidates) {
    const savings =
      calculate(config, applyRenovation(baseInput, candidate)).yearlyCost -
      baseCost;
    if (savings < bestSavings) {
      bestSavings = savings;
      best = candidate;
    }
  }

  return [best];
}

/**
 * Waehlt in allen drei Tabellen die empfohlenen Massnahmen aus.
 *
 * Die Stores haengen kaskadierend voneinander ab: die Daemmung bestimmt, welche
 * Heizungen ueberhaupt angeboten werden, die Heizung wiederum die Heizflaechen.
 * nanostores rechnet synchron nach, deshalb wird jede Stufe erst gesetzt und
 * dann die naechste gelesen - sonst wuerde gegen eine veraltete Liste gewaehlt.
 */
export function applyRecommendedRenovations() {
  const config = $config.get();

  $selectedInsulationRenovations.set(recommendedOf($insulationRenovations.get()));

  $selectedHeatingRenovations.set(
    bestBySavings(
      recommendedOf($heatingRenovations.get()),
      config,
      $insulationPatchedInputForCost.get(),
    ),
  );

  $selectedHeatingSurfaceRenovations.set(
    bestBySavings(
      recommendedOf($heatingSurfaceRenovations.get()),
      config,
      $heatingPatchedInputForCost.get(),
    ),
  );
}

export function clearRenovationSelections() {
  $selectedInsulationRenovations.set([]);
  $selectedHeatingRenovations.set([]);
  $selectedHeatingSurfaceRenovations.set([]);
}

/**
 * Zustand des globalen Schalters. Kein eigener State: der Schalter zeigt an,
 * ob die aktuelle Auswahl genau der Empfehlung entspricht. Aendert der Nutzer
 * danach eine Zeile von Hand, springt er von selbst auf aus.
 */
export function useRecommendedSelectionState() {
  const config = useStore($config);
  const insulationRenovations = useStore($insulationRenovations);
  const heatingRenovations = useStore($heatingRenovations);
  const heatingSurfaceRenovations = useStore($heatingSurfaceRenovations);
  const selectedInsulation = useStore($selectedInsulationRenovations);
  const selectedHeating = useStore($selectedHeatingRenovations);
  const selectedHeatingSurface = useStore($selectedHeatingSurfaceRenovations);
  const insulationPatchedInput = useStore($insulationPatchedInputForCost);
  const heatingPatchedInput = useStore($heatingPatchedInputForCost);

  return useMemo(() => {
    const recommendedInsulation = recommendedOf(insulationRenovations);
    const recommendedHeating = recommendedOf(heatingRenovations);
    const recommendedHeatingSurface = recommendedOf(heatingSurfaceRenovations);

    const hasRecommendation =
      recommendedInsulation.length > 0 ||
      recommendedHeating.length > 0 ||
      recommendedHeatingSurface.length > 0;

    // Frueh raus, bevor bestBySavings das Kostenmodell anwirft - und weil eine
    // abweichende Daemmung die Heizungsliste ohnehin veraendert haette.
    if (!hasRecommendation || !sameIds(selectedInsulation, recommendedInsulation)) {
      return { hasRecommendation, checked: false };
    }

    const checked =
      sameIds(
        selectedHeating,
        bestBySavings(recommendedHeating, config, insulationPatchedInput),
      ) &&
      sameIds(
        selectedHeatingSurface,
        bestBySavings(recommendedHeatingSurface, config, heatingPatchedInput),
      );

    return { hasRecommendation, checked };
  }, [
    config,
    insulationRenovations,
    heatingRenovations,
    heatingSurfaceRenovations,
    selectedInsulation,
    selectedHeating,
    selectedHeatingSurface,
    insulationPatchedInput,
    heatingPatchedInput,
  ]);
}
