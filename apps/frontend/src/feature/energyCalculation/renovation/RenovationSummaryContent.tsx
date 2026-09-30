import { Badge } from '@/components/ui/badge';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import {
  $selectedHeatingRenovations,
  $selectedHeatingSurfaceRenovations,
  $selectedInsulationRenovations,
} from '@/lib/state/inputs/renovation';
import { useStore } from '@nanostores/react';
import type { Renovation } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { Check } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

function RenovationSummaryGroup({
  title,
  renovations,
}: {
  title: string;
  renovations: Renovation[];
}) {
  const { t } = useTranslation('energyCalculation');
  const headingId = useId();

  return (
    <Paper asChild variant="outlined" className="flex flex-col gap-3 p-5">
      <section aria-labelledby={headingId}>
        <Typography id={headingId} as="h3" variant="h4">
          {title}
        </Typography>
        <Separator />
        {renovations.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {renovations.map((renovation) => (
              <li key={renovation.id} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-5 shrink-0 text-green-600"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Typography>{renovation.label}</Typography>
                  {renovation.recommended && (
                    <Badge className="border-green-600 bg-green-600/10 text-green-600">
                      {t('renovation.recommended')}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="muted">
            {t('renovation.summary.noMeasure')}
          </Typography>
        )}
      </section>
    </Paper>
  );
}

/** Read-only content showing the measures selected in the renovation step. */
export default function RenovationSummaryContent() {
  const { t } = useTranslation('energyCalculation');
  const selectedInsulation = useStore($selectedInsulationRenovations);
  const selectedHeating = useStore($selectedHeatingRenovations);
  const selectedHeatingSurface = useStore($selectedHeatingSurfaceRenovations);

  return (
    <div className="flex flex-col gap-4">
      <RenovationSummaryGroup
        title={t('renovation.insulation.title')}
        renovations={selectedInsulation}
      />
      <RenovationSummaryGroup
        title={t('renovation.heating.title')}
        renovations={selectedHeating}
      />
      <RenovationSummaryGroup
        title={t('renovation.heatingSurface.title')}
        renovations={selectedHeatingSurface}
      />
    </div>
  );
}
