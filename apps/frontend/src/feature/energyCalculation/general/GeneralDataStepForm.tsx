import { FieldGroup, FieldSet } from '@/components/ui/field';
import { Paper } from '@/components/ui/paper';
import type { SelectOption } from '@/components/ui/select';
import {
  hasAtticField,
  isAtticHeatedField,
} from '@/lib/state/inputs/top-floor';
import {
  hasBasementField,
  isBasementHeatedField,
} from '@/lib/state/inputs/bottom-floor';
import { BuildingType } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '../../../components/ui/tooltip';
import {
  $isLivingAreaInvalid,
  buildingTypeField,
  buildingYearField,
  buildingYearOptions,
  livingAreaField,
  numberOfStoriesField,
} from '../../../lib/state/inputs/general';

import EnergyBooleanInput from '../EnergyBooleanInput';
import EnergyNumberInput from '../EnergyNumberInput';
import EnergySelectInput from '../EnergySelectInput';
import { InfoTooltipButton } from '../InfoButton';

export default function GeneralDataStepForm() {
  const { t } = useTranslation('energyCalculation');
  const livingAreaInvalid = useStore($isLivingAreaInvalid);
  const hasAtticValue = useStore(hasAtticField.$store);
  const hasAtticPlaceholder = useStore(hasAtticField.$placeholder);
  const hasAttic = hasAtticValue ?? hasAtticPlaceholder;
  const hasBasementValue = useStore(hasBasementField.$store);
  const hasBasementPlaceholder = useStore(hasBasementField.$placeholder);
  const hasBasement = hasBasementValue ?? hasBasementPlaceholder;

  const buildingTypeOptions = useMemo<SelectOption<BuildingType>[]>(
    () => [
      {
        value: BuildingType.SINGLE_FAMILY,
        label: t('generalData.buildingType.singleFamily'),
      },
      {
        value: BuildingType.MULTI_FAMILY,
        label: t('generalData.buildingType.multiFamily'),
      },
    ],
    [t],
  );

  return (
    <TooltipProvider>
      <FieldGroup>
        <Paper variant="outlined" className="pt-4 pr-5 pb-5 pl-5">
          <FieldSet className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EnergySelectInput
              field={buildingYearField}
              labelKey="generalData.fields.constructionYear"
              rangeBandStore={buildingYearOptions}
              info={
                <InfoTooltipButton
                  content={t('generalData.tooltips.constructionYear')}
                />
              }
            />
            <EnergySelectInput
              field={buildingTypeField}
              labelKey="generalData.fields.buildingType"
              options={buildingTypeOptions}
              sortAlphabetically
              info={
                <InfoTooltipButton
                  content={t('generalData.tooltips.buildingType')}
                />
              }
            />
            <FieldSet className="col-span-full grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EnergyBooleanInput
                field={hasAtticField}
                labelKey="outerParts.roof.hasAttic"
                info={
                  <InfoTooltipButton
                    content={t('outerParts.roof.tooltips.hasAttic')}
                  />
                }
              />
              {hasAttic && (
                <EnergyBooleanInput
                  field={isAtticHeatedField}
                  labelKey="outerParts.roof.isAtticHeated"
                  trueKey={{
                    ns: 'energyCalculation',
                    key: 'booleanLabels.heated',
                  }}
                  falseKey={{
                    ns: 'energyCalculation',
                    key: 'booleanLabels.notHeated',
                  }}
                  info={
                    <InfoTooltipButton
                      content={t('outerParts.roof.tooltips.isAtticHeated')}
                    />
                  }
                />
              )}
            </FieldSet>
            <FieldSet className="col-span-full grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EnergyBooleanInput
                field={hasBasementField}
                labelKey="outerParts.bottomFloor.hasBasement"
                info={
                  <InfoTooltipButton
                    content={t('outerParts.bottomFloor.tooltips.hasBasement')}
                  />
                }
              />
              {hasBasement && (
                <EnergyBooleanInput
                  field={isBasementHeatedField}
                  labelKey="outerParts.bottomFloor.isBasementHeated"
                  trueKey={{
                    ns: 'energyCalculation',
                    key: 'booleanLabels.heated',
                  }}
                  falseKey={{
                    ns: 'energyCalculation',
                    key: 'booleanLabels.notHeated',
                  }}
                  info={
                    <InfoTooltipButton
                      content={t(
                        'outerParts.bottomFloor.tooltips.isBasementHeated',
                      )}
                    />
                  }
                />
              )}
            </FieldSet>
            <EnergyNumberInput
              className="col-span-1"
              field={numberOfStoriesField}
              labelKey="generalData.fields.numberOfFloors"
              decimalScale={0}
              allowNegative={false}
              isAllowed={({ floatValue }) =>
                floatValue == null || floatValue >= 1
              }
              info={
                <InfoTooltipButton
                  content={t('generalData.tooltips.numberOfFloors')}
                />
              }
            />
            <EnergyNumberInput
              className="col-span-1"
              field={livingAreaField}
              labelKey="generalData.fields.livingArea"
              suffix=" m²"
              decimalScale={1}
              allowNegative={false}
              error={
                livingAreaInvalid
                  ? t('generalData.errors.livingAreaMustBePositive')
                  : undefined
              }
              info={
                <InfoTooltipButton
                  content={t('generalData.tooltips.livingArea')}
                />
              }
            />
          </FieldSet>
        </Paper>
      </FieldGroup>
    </TooltipProvider>
  );
}
