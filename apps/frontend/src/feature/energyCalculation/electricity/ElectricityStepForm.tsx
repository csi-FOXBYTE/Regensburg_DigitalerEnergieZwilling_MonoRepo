import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  electricityBaseRateField,
  electricityTypeField,
  electricityTypeOptions,
  electricityUnitRateField,
  userElectricityConsumptionField,
} from '@/lib/state/inputs/electricity';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';

export default function ElectricityStepForm() {
  const { t } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  return (
    <TooltipProvider>
      <FieldGroup>
        <Paper variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
          <FieldSet className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FieldLegend className="col-span-full">
              <Typography as="span" variant="h4">
                {t('electricity.electricity')}
              </Typography>
            </FieldLegend>
            <Separator className="col-span-full" />
            <EnergySelectInput
              field={electricityTypeField}
              labelKey="electricity.type"
              selectionStore={electricityTypeOptions}
              info={
                <InfoTooltipButton
                  content={t('electricity.tooltips.type')}
                ></InfoTooltipButton>
              }
            />
            <EnergyNumberInput
              field={userElectricityConsumptionField}
              labelKey="electricity.consumption"
              suffix={` ${tCommon('units.kilowattHoursPerYear')}`}
              decimalScale={0}
              allowNegative={false}
              info={
                <InfoTooltipButton
                  content={t('electricity.tooltips.consumption')}
                ></InfoTooltipButton>
              }
            />
            <EnergyNumberInput
              field={electricityUnitRateField}
              labelKey="electricity.unitRate"
              suffix={` ${tCommon('units.eurosPerUnit', { unit: 'kWh' })}`}
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              info={
                <InfoTooltipButton
                  content={t('electricity.tooltips.unitRate')}
                ></InfoTooltipButton>
              }
            />
            <EnergyNumberInput
              field={electricityBaseRateField}
              labelKey="electricity.baseRate"
              suffix={` ${tCommon('units.eurosPerYear')}`}
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              info={
                <InfoTooltipButton
                  content={t('electricity.tooltips.baseRate')}
                ></InfoTooltipButton>
              }
            />
          </FieldSet>
        </Paper>
      </FieldGroup>
    </TooltipProvider>
  );
}
