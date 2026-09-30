import { FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import {
  bottomFloorAreaField,
  bottomFloorConstructionTypeField,
  bottomFloorConstructionTypeOptions,
  bottomFloorHasInsulationField,
  bottomFloorInsulationThicknessField,
  bottomFloorYearField,
  hasBasementField,
  isBasementHeatedField,
} from '@/lib/state/inputs/bottom-floor';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';
import BuildingPartInfoButton from './BuildingPartInfoButton';

export default function BottomFloorPaper() {
  const { t } = useTranslation('energyCalculation');
  const hasBasementValue = useStore(hasBasementField.$store);
  const hasBasementPlaceholder = useStore(hasBasementField.$placeholder);
  const hasBasement = hasBasementValue ?? hasBasementPlaceholder;

  const isBasementHeatedValue = useStore(isBasementHeatedField.$store);
  const isBasementHeatedPlaceholder = useStore(
    isBasementHeatedField.$placeholder,
  );
  const isBasementHeated = isBasementHeatedValue ?? isBasementHeatedPlaceholder;

  const bottomFloorHasInsulationValue = useStore(
    bottomFloorHasInsulationField.$store,
  );
  const bottomFloorHasInsulationPlaceholder = useStore(
    bottomFloorHasInsulationField.$placeholder,
  );
  const bottomFloorHasInsulation =
    bottomFloorHasInsulationValue ?? bottomFloorHasInsulationPlaceholder;

  const context = !hasBasement
    ? 'noBasement'
    : isBasementHeated
      ? 'heated'
      : 'default';

  return (
    <Paper
      id="bottomFloor"
      variant="outlined"
      className="flex flex-col gap-6 pt-4 pr-5 pb-5 pl-5"
    >
      <FieldSet className="energy-field-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FieldLegend className="col-span-full flex items-center gap-2">
          <Typography as="span" variant="h4">
            {t('outerParts.bottomFloor.bottomFloor')}
          </Typography>
          <BuildingPartInfoButton part="bottomFloor" context={context} />
        </FieldLegend>
        <Separator className="col-span-full" />
        <EnergyNumberInput
          field={bottomFloorAreaField}
          labelKey={`outerParts.bottomFloor.area.${context}`}
          suffix=" m²"
          decimalScale={1}
          allowNegative={false}
          className="col-start-1"
          info={
            <InfoTooltipButton
              content={t(`outerParts.bottomFloor.tooltips.area.${context}`)}
            ></InfoTooltipButton>
          }
        />
        <EnergySelectInput
          field={bottomFloorYearField}
          labelKey={`outerParts.bottomFloor.year.${context}`}
          rangeBandStore={buildingOrNewerYearOptions}
          info={
            <InfoTooltipButton
              content={t(`outerParts.bottomFloor.tooltips.year.${context}`)}
            ></InfoTooltipButton>
          }
        />
        <EnergySelectInput
          field={bottomFloorConstructionTypeField}
          labelKey={`outerParts.bottomFloor.constructionType.${context}`}
          selectionStore={bottomFloorConstructionTypeOptions}
          sortAlphabetically
          info={
            <InfoTooltipButton
              content={t(
                `outerParts.bottomFloor.tooltips.constructionType.${context}`,
              )}
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
          field={bottomFloorHasInsulationField}
          labelKey={`outerParts.bottomFloor.hasInsulation.${context}`}
          trueKey={{ ns: 'energyCalculation', key: 'booleanLabels.insulated' }}
          falseKey={{
            ns: 'energyCalculation',
            key: 'booleanLabels.notInsulated',
          }}
          info={
            <InfoTooltipButton
              content={t(
                `outerParts.bottomFloor.tooltips.hasInsulation.${context}`,
              )}
            ></InfoTooltipButton>
          }
        />
        {bottomFloorHasInsulation && (
          <EnergyNumberInput
            field={bottomFloorInsulationThicknessField}
            labelKey="outerParts.bottomFloor.insulationThickness"
            displayFactor={100}
            suffix=" cm"
            decimalScale={0}
            allowNegative={false}
            className="col-start-1"
            info={
              <InfoTooltipButton
                content={t(
                  `outerParts.bottomFloor.tooltips.insulationThickness`,
                )}
              ></InfoTooltipButton>
            }
          />
        )}
      </FieldSet>
    </Paper>
  );
}
