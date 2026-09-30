import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { $config } from '@/lib/state/calculation-config';
import { buildingOrNewerYearOptions } from '@/lib/state/inputs/general';
import {
  $isSystemOnlyElectrical,
  $isThermalBaseRateInvalid,
  $isThermalUnitRateInvalid,
  hasGasSupplyField,
  hasStorageField,
  heatingSurfaceTypeField,
  heatingSurfaceTypeOptions,
  heatingSystemConstructionYearField,
  heatingSystemTypeField,
  heatingSystemTypeOptions,
  primaryEnergyCarrierField,
  primaryEnergyCarrierOptions,
  userThermalBaseRateField,
  userThermalTotalCostField,
  userThermalUnitRateField,
} from '@/lib/state/inputs/heat';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../../components/ui/typography';
import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';

export default function HeatStepForm() {
  const { t } = useTranslation('energyCalculation');
  const { t: tCommon } = useTranslation('common');
  const isSystemOnlyElectrical = useStore($isSystemOnlyElectrical);
  const config = useStore($config);
  const carrierValue = useStore(primaryEnergyCarrierField.$store);
  const carrierPlaceholder = useStore(primaryEnergyCarrierField.$placeholder);
  const carrier = carrierValue ?? carrierPlaceholder;
  const thermalUnit = carrier
    ? (config.heat.primaryEnergyCarrierData.find((d) => d.key === carrier)
        ?.value.unit ?? '')
    : '';

  const baseRateExceedsTotal = useStore($isThermalBaseRateInvalid);
  const unitRateInvalid = useStore($isThermalUnitRateInvalid);

  return (
    <TooltipProvider>
      <FieldGroup>
        <Paper variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
          <FieldSet className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FieldLegend className="col-span-full">
              <Typography as="span" variant="h4">
                {t('heat.supply.title')}
              </Typography>
            </FieldLegend>
            <Separator className="col-span-full" />
            <EnergyBooleanInput
              field={hasGasSupplyField}
              labelKey="heat.supply.hasGasSupply"
              info={
                <InfoTooltipButton
                  content={t('heat.supply.tooltips.hasGasSupply')}
                ></InfoTooltipButton>
              }
            />
            <EnergyBooleanInput
              field={hasStorageField}
              labelKey="heat.supply.hasStorage"
              info={
                <InfoTooltipButton
                  content={t('heat.supply.tooltips.hasStorage')}
                ></InfoTooltipButton>
              }
            />
          </FieldSet>
        </Paper>
        <Paper variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
          <FieldSet className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FieldLegend className="col-span-full">
              <Typography as="span" variant="h4">
                {t('heat.heating.title')}
              </Typography>
            </FieldLegend>
            <Separator className="col-span-full" />
            <EnergySelectInput
              field={heatingSystemConstructionYearField}
              labelKey="heat.heating.constructionYear"
              rangeBandStore={buildingOrNewerYearOptions}
              info={
                <InfoTooltipButton
                  content={t('heat.heating.tooltips.constructionYear')}
                ></InfoTooltipButton>
              }
            />
            <EnergySelectInput
              field={primaryEnergyCarrierField}
              labelKey="heat.heating.primaryEnergyCarrier"
              selectionStore={primaryEnergyCarrierOptions}
              sortAlphabetically
              info={
                <InfoTooltipButton
                  content={t('heat.heating.tooltips.primaryEnergyCarrier')}
                ></InfoTooltipButton>
              }
            />
            <EnergySelectInput
              field={heatingSystemTypeField}
              labelKey="heat.heating.heatingSystemType"
              selectionStore={heatingSystemTypeOptions}
              info={
                <InfoTooltipButton
                  content={t('heat.heating.tooltips.heatingSystemType')}
                ></InfoTooltipButton>
              }
            />
            <EnergySelectInput
              field={heatingSurfaceTypeField}
              labelKey="heat.heating.heatingSurfaceType"
              selectionStore={heatingSurfaceTypeOptions}
              info={
                <InfoTooltipButton
                  content={t('heat.heating.tooltips.heatingSurfaceType')}
                ></InfoTooltipButton>
              }
            />
          </FieldSet>
        </Paper>
        {!isSystemOnlyElectrical && (
          <Paper variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
            <FieldSet className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FieldLegend className="col-span-full">
                <Typography as="span" variant="h4">
                  {t('heat.bills.title')}
                </Typography>
              </FieldLegend>
              <Separator className="col-span-full" />
              <EnergyNumberInput
                field={userThermalTotalCostField}
                labelKey="heat.bills.consumption"
                suffix={` ${tCommon('units.eurosPerYear')}`}
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                info={
                  <InfoTooltipButton
                    content={t('heat.bills.tooltips.consumption')}
                  ></InfoTooltipButton>
                }
              />
              <EnergyNumberInput
                field={userThermalUnitRateField}
                labelKey="heat.bills.unitRate"
                suffix={
                  thermalUnit
                    ? ` ${tCommon('units.eurosPerUnit', { unit: thermalUnit })}`
                    : ' €'
                }
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                error={
                  unitRateInvalid
                    ? t('heat.bills.errors.unitRateMustBePositive')
                    : undefined
                }
                info={
                  <InfoTooltipButton
                    content={t('heat.bills.tooltips.unitRate')}
                  ></InfoTooltipButton>
                }
              />
              <EnergyNumberInput
                field={userThermalBaseRateField}
                labelKey="heat.bills.baseRate"
                suffix={` ${tCommon('units.eurosPerYear')}`}
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                error={
                  baseRateExceedsTotal
                    ? t('heat.bills.errors.baseRateExceedsTotal')
                    : undefined
                }
                info={
                  <InfoTooltipButton
                    content={t('heat.bills.tooltips.baseRate')}
                  ></InfoTooltipButton>
                }
              />
            </FieldSet>
          </Paper>
        )}
      </FieldGroup>
    </TooltipProvider>
  );
}
