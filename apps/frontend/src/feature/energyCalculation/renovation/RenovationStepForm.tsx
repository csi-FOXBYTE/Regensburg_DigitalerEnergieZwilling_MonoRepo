import { Typography } from '@/components/ui/typography';
import { $config } from '@/lib/state/calculation-config';
import {
  $baseInputForCost,
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
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { RenovationMultiSelectTable } from './RenovationMultiSelectTable';
import { RenovationRecommendedToggle } from './RenovationRecommendedToggle';
import { RenovationSingleSelectTable } from './RenovationSingleSelectTable';

export default function RenovationStepForm() {
  const { t } = useTranslation('energyCalculation');
  const config = useStore($config);

  const baseInput = useStore($baseInputForCost);
  const insulationPatchedInput = useStore($insulationPatchedInputForCost);
  const heatingPatchedInput = useStore($heatingPatchedInputForCost);

  const insulationRenovations = useStore($insulationRenovations);
  const heatingSurfaceRenovations = useStore($heatingSurfaceRenovations);
  const heatingRenovations = useStore($heatingRenovations);

  const selectedInsulation = useStore($selectedInsulationRenovations);
  const selectedHeatingSurface = useStore($selectedHeatingSurfaceRenovations);
  const selectedHeating = useStore($selectedHeatingRenovations);

  return (
    <div className="flex flex-col gap-4">
      <Typography as="h2" variant="h3" className="mb-2">
        {t('renovation.subtitle')}
      </Typography>
      <div>
        {/* Der Schalter gilt global fuer alle drei Tabellen, sitzt aber in der
            Ueberschriftenzeile der ersten. */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Typography as="h3" variant="h4">
            {t('renovation.insulation.title')}
          </Typography>
          <RenovationRecommendedToggle />
        </div>
        <RenovationMultiSelectTable
          renovations={insulationRenovations}
          value={selectedInsulation}
          onSelectionChange={(v) => $selectedInsulationRenovations.set(v)}
          baseInput={baseInput}
          config={config}
        />
      </div>
      {heatingRenovations.length > 0 && (
        <div>
          <Typography as="h3" variant="h4" className="mb-2">
            {t('renovation.heating.title')}
          </Typography>
          <RenovationSingleSelectTable
            renovations={heatingRenovations}
            value={selectedHeating}
            onSelectionChange={(v) => $selectedHeatingRenovations.set(v)}
            baseInput={insulationPatchedInput}
            config={config}
            noMeasureTooltip={t('renovation.tooltips.noMeasureHeating')}
          />
        </div>
      )}
      {heatingSurfaceRenovations.length > 0 && (
        <div>
          <Typography as="h3" variant="h4" className="mb-2">
            {t('renovation.heatingSurface.title')}
          </Typography>
          <RenovationSingleSelectTable
            renovations={heatingSurfaceRenovations}
            value={selectedHeatingSurface}
            onSelectionChange={(v) => $selectedHeatingSurfaceRenovations.set(v)}
            baseInput={heatingPatchedInput}
            config={config}
            noMeasureTooltip={t('renovation.tooltips.noMeasureHeating')}
          />
        </div>
      )}
    </div>
  );
}
