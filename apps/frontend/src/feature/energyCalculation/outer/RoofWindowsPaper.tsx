import { FieldLegend, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import {
  $isRoofWindowsAreaInvalid,
  roofWindowsAreaField,
  roofWindowsUValueField,
  roofWindowsWindowTypeField,
  roofWindowsWindowTypeOptions,
  roofWindowsYearField,
} from '@/lib/state/inputs/roof-windows';
import {
  hasAtticField,
  isAtticHeatedField,
} from '@/lib/state/inputs/top-floor';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function RoofWindowsPaper() {
  const { t } = useTranslation('energyCalculation');
  const roofWindowsAreaInvalid = useStore($isRoofWindowsAreaInvalid);
  const hasAtticValue = useStore(hasAtticField.$store);
  const hasAtticPlaceholder = useStore(hasAtticField.$placeholder);
  const hasAttic = hasAtticValue ?? hasAtticPlaceholder;

  const isAtticHeatedValue = useStore(isAtticHeatedField.$store);
  const isAtticHeatedPlaceholder = useStore(isAtticHeatedField.$placeholder);
  const isAtticHeated = isAtticHeatedValue ?? isAtticHeatedPlaceholder;

  if (hasAttic && !isAtticHeated) return null;

  return (
    <Paper id="roofWindows" variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.roofWindows.roofWindows')}
          </Typography>
          <BuildingPartInfoButton part="roofWindows" />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergySelectInput
          field={roofWindowsYearField}
          labelKey="outerParts.roofWindows.year"
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.roofWindows.tooltips.year')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={roofWindowsAreaField}
          labelKey="outerParts.roofWindows.area"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          error={
            roofWindowsAreaInvalid
              ? t('outerParts.roofWindows.errors.areaExceedsRoofArea')
              : undefined
          }
          info={
            <InfoTooltipButton
              content={t('outerParts.roofWindows.tooltips.area')}
            ></InfoTooltipButton>
          }
        />
        <EnergySelectInput
          field={roofWindowsWindowTypeField}
          labelKey="outerParts.roofWindows.windowType"
          selectionStore={roofWindowsWindowTypeOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.roofWindows.tooltips.windowType')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={roofWindowsUValueField}
          labelKey="outerParts.roofWindows.uValue"
          suffix=" W/m²K"
          decimalScale={2}
          allowNegative={false}
          info={
            <InfoTooltipButton
              content={t('outerParts.roofWindows.tooltips.uValue')}
            ></InfoTooltipButton>
          }
        />
      </FieldSet>
    </Paper>
  );
}
