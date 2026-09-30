import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/ui/typography';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

/** The steps of the energy calculation whose inputs the overview shows. */
export type BuildingDataStep = 1 | 2 | 3 | 4 | 5;

/**
 * One step of the calculation. The heading comes from the progress bar so the
 * overview is labelled exactly like the step the values were entered in.
 */
export function BuildingDataSection({
  step,
  children,
}: {
  step: BuildingDataStep;
  children: ReactNode;
}) {
  const { t } = useTranslation('progressBar');
  const headingId = `building-data-step-${step}`;

  return (
    <section className="flex flex-col gap-3" aria-labelledby={headingId}>
      <Typography id={headingId} as="h3" variant="h3">
        {t(`steps.${step}`)}
      </Typography>
      {children}
    </section>
  );
}

/**
 * A group of values inside a step. Each group gets its own Paper, mirroring the
 * Papers of the step's form (roof, outer wall, heating, …) so the parts stay
 * visually separated.
 */
export function BuildingDataGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      className="flex flex-col gap-3 pt-4 pr-5 pb-5 pl-5"
    >
      {title && (
        <>
          <Typography as="h4" variant="h4">
            {title}
          </Typography>
          <Separator />
        </>
      )}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </Paper>
  );
}

/** A single label/value pair. */
export function BuildingDataValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Typography as="dt" variant="small" className="text-neutral-550">
        {label}
      </Typography>
      <Typography as="dd" variant="body" className="font-bold">
        {value}
      </Typography>
    </div>
  );
}
