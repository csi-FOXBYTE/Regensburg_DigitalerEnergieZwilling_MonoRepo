import { Callout } from '@/components/ui/callout';
import { Typography } from '@/components/ui/typography';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import {
  $configLoadFailed,
  $subsidies,
} from '../../../lib/state/calculation-config';
import { SubsidyCard } from './SubsidyCard';

export function SubsidySection() {
  const { t } = useTranslation('energyCalculation');
  const subsidies = useStore($subsidies);
  const loadFailed = useStore($configLoadFailed);

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div>
        <Typography as="h2" variant="h3">
          {t('subsidy.sectionTitle')}
        </Typography>
        <Typography variant="muted">{t('subsidy.disclaimer')}</Typography>
      </div>
      {loadFailed ? (
        <Callout role="alert" variant="warning">
          <span>{t('subsidy.loadError')}</span>
        </Callout>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {subsidies
            .filter(({ isActive }) => isActive)
            .map(({ subsidy }) => (
              <SubsidyCard key={subsidy.title} {...subsidy} />
            ))}
        </div>
      )}
    </div>
  );
}
