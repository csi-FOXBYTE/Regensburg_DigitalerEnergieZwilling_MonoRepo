import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyRecommendedRenovations,
  clearRenovationSelections,
  useRecommendedSelectionState,
} from './recommendedSelection';

/**
 * Ein globaler Schalter fuer alle drei Massnahmen-Tabellen.
 */
export function RenovationRecommendedToggle() {
  const { t } = useTranslation('energyCalculation');
  const switchId = useId();
  const { checked, hasRecommendation } = useRecommendedSelectionState();

  return (
    <Label
      htmlFor={switchId}
      className={`text-muted-foreground shrink-0 gap-2 font-normal ${
        hasRecommendation ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
      }`}
    >
      <span className="whitespace-nowrap">
        {t('renovation.selectRecommended')}
      </span>
      <Switch
        id={switchId}
        checked={checked}
        disabled={!hasRecommendation}
        onCheckedChange={(on) =>
          on ? applyRecommendedRenovations() : clearRenovationSelections()
        }
      />
    </Label>
  );
}
