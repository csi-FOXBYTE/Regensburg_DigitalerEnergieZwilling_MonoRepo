import { $config } from '@/lib/state/calculation-config';
import { $resolvedElectricityInput } from '@/lib/state/computed/resolved-input';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import {
  BuildingDataGroup,
  BuildingDataSection,
  BuildingDataValue,
} from './BuildingDataSection';
import { useBuildingDataFormat } from './useBuildingDataFormat';

/** Step 5: electricity tariff and household consumption. */
export default function ElectricitySection() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const electricity = useStore($resolvedElectricityInput);

  return (
    <BuildingDataSection step={5}>
      <BuildingDataGroup title={t('electricity.electricity')}>
        <BuildingDataValue
          label={t('export.labels.electricity.type')}
          value={format.option(
            config.heat.electricityTypes,
            electricity.electricityType,
          )}
        />
        <BuildingDataValue
          label={t('export.labels.electricity.consumption')}
          value={format.number(
            electricity.userElectricityConsumption,
            0,
            'kWh/Jahr',
          )}
        />
        <BuildingDataValue
          label={t('export.labels.electricity.unitRate')}
          value={format.number(electricity.electricityUnitRate, 2, '€/kWh')}
        />
        <BuildingDataValue
          label={t('export.labels.electricity.baseRate')}
          value={format.number(
            electricity.userElectricityBaseRate,
            2,
            '€/Jahr',
          )}
        />
      </BuildingDataGroup>
    </BuildingDataSection>
  );
}
