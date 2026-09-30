import { FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import {
  $isTopFloorAreaInvalid,
  hasAtticField,
  isAtticHeatedField,
  topFloorAreaField,
  topFloorHasInsulationField,
  topFloorInsulationThicknessField,
  topFloorTypeField,
  topFloorTypeOptions,
  topFloorYearField,
} from '@/lib/state/inputs/top-floor';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function TopFloorPaper() {
  const { t } = useTranslation('energyCalculation');
  const topFloorAreaInvalid = useStore($isTopFloorAreaInvalid);
  const hasAtticValue = useStore(hasAtticField.$store);
  const hasAtticPlaceholder = useStore(hasAtticField.$placeholder);
  const hasAttic = hasAtticValue ?? hasAtticPlaceholder;

  const isAtticHeatedValue = useStore(isAtticHeatedField.$store);
  const isAtticHeatedPlaceholder = useStore(isAtticHeatedField.$placeholder);
  const isAtticHeated = isAtticHeatedValue ?? isAtticHeatedPlaceholder;

  const topFloorHasInsulationValue = useStore(
    topFloorHasInsulationField.$store,
  );
  const topFloorHasInsulationPlaceholder = useStore(
    topFloorHasInsulationField.$placeholder,
  );
  const topFloorHasInsulation =
    topFloorHasInsulationValue ?? topFloorHasInsulationPlaceholder;

  if (!hasAttic || isAtticHeated) return null;

  return (
    <Paper
      id="topFloor"
      variant="outlined"
      className="flex flex-col gap-6 pt-4 pr-5 pb-5 pl-5"
    >
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.topFloor.topFloor')}
          </Typography>
          <BuildingPartInfoButton part="topFloor" />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergySelectInput
          field={topFloorYearField}
          labelKey="outerParts.topFloor.year"
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton
              content={t('outerParts.topFloor.tooltips.year')}
            ></InfoTooltipButton>
          }
        />
        <EnergyNumberInput
          field={topFloorAreaField}
          labelKey="outerParts.topFloor.area"
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          error={
            topFloorAreaInvalid
              ? t('outerParts.topFloor.errors.areaExceedsRoofArea')
              : undefined
          }
          info={
            <InfoTooltipButton
              content={t('outerParts.topFloor.tooltips.area')}
            ></InfoTooltipButton>
          }
        />
        <EnergySelectInput
          field={topFloorTypeField}
          labelKey="outerParts.topFloor.type"
          selectionStore={topFloorTypeOptions}
          sortAlphabetically
          info={
            <InfoTooltipButton
              content={t('outerParts.topFloor.tooltips.type')}
            ></InfoTooltipButton>
          }
        />
      </FieldSet>
      <FieldSeparator />
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend variant="label" className="col-span-full font-bold">
          {t('outerParts.insulation')}
        </FieldLegend>
        <EnergyBooleanInput
          field={topFloorHasInsulationField}
          labelKey="outerParts.topFloor.hasInsulation"
          trueKey={{ ns: 'energyCalculation', key: 'booleanLabels.insulated' }}
          falseKey={{
            ns: 'energyCalculation',
            key: 'booleanLabels.notInsulated',
          }}
          info={
            <InfoTooltipButton
              content={t('outerParts.topFloor.tooltips.hasInsulation')}
            ></InfoTooltipButton>
          }
        />
        {topFloorHasInsulation && (
          <EnergyNumberInput
            field={topFloorInsulationThicknessField}
            labelKey="outerParts.topFloor.insulationThickness"
            displayFactor={100}
            suffix=" cm"
            decimalScale={0}
            allowNegative={false}
            className="col-start-1"
            info={
              <InfoTooltipButton
                content={t('outerParts.topFloor.tooltips.insulationThickness')}
              ></InfoTooltipButton>
            }
          />
        )}
      </FieldSet>
    </Paper>
  );
}
