import { FieldLegend, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import {
  $isExteriorWallWindowsAreaInvalid,
  exteriorWallWindowsAreaField,
  exteriorWallWindowsUValueField,
  exteriorWallWindowsWindowTypeField,
  exteriorWallWindowsWindowTypeOptions,
  exteriorWallWindowsYearField,
} from '@/lib/state/inputs/exterior-wall-windows';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function WindowsPaper() {
  const { t } = useTranslation('energyCalculation');
  const exteriorWallWindowsAreaInvalid = useStore(
    $isExteriorWallWindowsAreaInvalid,
  );

  return (
    <Paper id="windows" variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.windows.windows')}
          </Typography>
          <BuildingPartInfoButton part="windows" />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergySelectInput
          field={exteriorWallWindowsYearField}
          labelKey="outerParts.windows.year"
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.windows.tooltips.year')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={exteriorWallWindowsAreaField}
          labelKey="outerParts.windows.area"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          error={
            exteriorWallWindowsAreaInvalid
              ? t('outerParts.windows.errors.areaExceedsAvailableWallArea')
              : undefined
          }
          info={
            <InfoTooltipButton
              content={t('outerParts.windows.tooltips.area')}
            ></InfoTooltipButton>
          }
        />
        <EnergySelectInput
          field={exteriorWallWindowsWindowTypeField}
          labelKey="outerParts.windows.windowType"
          selectionStore={exteriorWallWindowsWindowTypeOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.windows.tooltips.windowType')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={exteriorWallWindowsUValueField}
          labelKey="outerParts.windows.uValue"
          suffix=" W/m²K"
          decimalScale={2}
          allowNegative={false}
          info={
            <InfoTooltipButton
              content={t('outerParts.windows.tooltips.uValue')}
            ></InfoTooltipButton>
          }
        />
      </FieldSet>
    </Paper>
  );
}
