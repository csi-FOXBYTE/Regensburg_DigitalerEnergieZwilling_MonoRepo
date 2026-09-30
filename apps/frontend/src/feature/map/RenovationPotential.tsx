import { Badge } from '@/components/ui/badge';
import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RenovationPotentialInfoDialog from './RenovationPotentialInfoDialog';

const HIGH_POTENTIAL_MAX_YEAR = 1983;
const MODERATE_POTENTIAL_MAX_YEAR = 1994;
const HERITAGE_CHECK_MAX_YEAR = 1948;

export type RenovationPotentialLevel =
  | 'high'
  | 'moderate'
  | 'lower'
  | 'unknown';

export function classifyRenovationPotential(
  constructionYear: number | undefined,
): {
  level: RenovationPotentialLevel;
  constructionYear: number | undefined;
  showHeritageWarning: boolean;
} {
  const year =
    constructionYear != null && Number.isFinite(constructionYear)
      ? constructionYear
      : undefined;

  if (year == null) {
    return {
      level: 'unknown',
      constructionYear: undefined,
      showHeritageWarning: true,
    };
  }

  const level =
    year <= HIGH_POTENTIAL_MAX_YEAR
      ? 'high'
      : year <= MODERATE_POTENTIAL_MAX_YEAR
        ? 'moderate'
        : 'lower';

  return {
    level,
    constructionYear: year,
    showHeritageWarning: year <= HERITAGE_CHECK_MAX_YEAR,
  };
}

export default function RenovationPotential({
  constructionYear,
}: {
  constructionYear: number | undefined;
}) {
  const { t } = useTranslation('map');
  const [infoOpen, setInfoOpen] = useState(false);
  const potential = classifyRenovationPotential(constructionYear);

  const label = {
    high: t('renovationPotential.levels.high'),
    moderate: t('renovationPotential.levels.moderate'),
    lower: t('renovationPotential.levels.lower'),
    unknown: t('renovationPotential.levels.unknown'),
  }[potential.level];

  const description = {
    high: t('renovationPotential.descriptions.high'),
    moderate: t('renovationPotential.descriptions.moderate'),
    lower: t('renovationPotential.descriptions.lower'),
    unknown: t('renovationPotential.descriptions.unknown'),
  }[potential.level];

  return (
    <>
      <div>
        <div className="flex flex-col items-start gap-2">
          <Typography as="h3" variant="h4">
            {t('renovationPotential.title')}
          </Typography>
          <Badge
            variant="outline"
            className={
              potential.level === 'high'
                ? 'border-green-700 bg-green-50 text-green-800'
                : potential.level === 'moderate'
                  ? 'border-amber-600 bg-amber-50 text-amber-800'
                  : 'border-neutral-400 bg-white text-neutral-700'
            }
          >
            {label}
          </Badge>
        </div>
        <Typography variant="small" className="mt-2">
          {description}
        </Typography>
        {potential.constructionYear != null && (
          <div className="mt-1 flex flex-col gap-1">
            <Typography variant="verySmall">
              {t('renovationPotential.basis', {
                year: potential.constructionYear,
              })}
            </Typography>
            <Typography variant="verySmall">
              {t('renovationPotential.assumption')}
            </Typography>
          </div>
        )}

        {potential.showHeritageWarning && (
          <Callout
            variant="warning"
            className="mt-3"
            title={t('renovationPotential.heritageWarning.title')}
          >
            <Typography variant="verySmall">
              {t('renovationPotential.heritageWarning.description')}
            </Typography>
          </Callout>
        )}

        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="text-primary hover:text-primary-hover mt-3 flex items-center gap-1.5 text-sm underline underline-offset-2"
        >
          <HelpCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {t('renovationPotential.infoLink')}
        </button>
      </div>

      <RenovationPotentialInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}
