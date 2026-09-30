import { $config } from '@/lib/state/calculation-config';
import { $resolvedHeatInput } from '@/lib/state/computed/resolved-input';
import { $isSystemOnlyElectrical } from '@/lib/state/inputs/heat';
import type { RangeKey } from '@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import {
  BuildingDataGroup,
  BuildingDataSection,
  BuildingDataValue,
} from './BuildingDataSection';
import { useBuildingDataFormat } from './useBuildingDataFormat';

/** Step 4: heat supply, heating system and the heating bill. */
export default function HeatSection() {
  const { t } = useTranslation('energyCalculation');
  const format = useBuildingDataFormat();
  const config = useStore($config);
  const heat = useStore($resolvedHeatInput);
  const isSystemOnlyElectrical = useStore($isSystemOnlyElectrical);

  // Electrically heated buildings have no fuel bill, so the form hides it.
  const showBills = !isSystemOnlyElectrical;
  const carrierUnit = heat.primaryEnergyCarrier
    ? (config.heat.primaryEnergyCarrierData.find(
        (d) => d.key === heat.primaryEnergyCarrier,
      )?.value.unit ?? '')
    : '';

  return (
    <BuildingDataSection step={4}>
      <BuildingDataGroup title={t('heat.supply.title')}>
        <BuildingDataValue
          label={t('export.labels.heat.hasGasSupply')}
          value={format.boolean(heat.hasGasSupply)}
        />
        <BuildingDataValue
          label={t('export.labels.heat.hasStorage')}
          value={format.boolean(heat.hasStorage)}
        />
        {heat.hasGeothermalAvailability != null && (
          <BuildingDataValue
            label={t('export.labels.heat.hasGeothermalAvailability')}
            value={format.boolean(heat.hasGeothermalAvailability)}
          />
        )}
      </BuildingDataGroup>

      <BuildingDataGroup title={t('heat.heating.title')}>
        <BuildingDataValue
          label={t('export.labels.heat.constructionYear')}
          value={format.range(heat.heatingSystemConstructionYear as RangeKey)}
        />
        <BuildingDataValue
          label={t('export.labels.heat.primaryEnergyCarrier')}
          value={format.option(
            config.heat.primaryEnergyCarriers,
            heat.primaryEnergyCarrier,
          )}
        />
        <BuildingDataValue
          label={t('export.labels.heat.heatingSystemType')}
          value={format.option(
            config.heat.heatingSystemTypes,
            heat.heatingSystemType,
          )}
        />
        <BuildingDataValue
          label={t('export.labels.heat.heatingSurfaceType')}
          value={format.option(
            config.heat.heatingSurfaceTypes,
            heat.heatingSurfaceType,
          )}
        />
      </BuildingDataGroup>

      {showBills && (
        <BuildingDataGroup title={t('heat.bills.title')}>
          <BuildingDataValue
            label={t('export.labels.heat.totalCost')}
            value={format.number(heat.userThermalTotalCost, 2, '€/Jahr')}
          />
          <BuildingDataValue
            label={t('export.labels.heat.unitRate')}
            value={format.number(
              heat.userThermalUnitRate,
              2,
              carrierUnit ? `€/${carrierUnit}` : '€',
            )}
          />
          <BuildingDataValue
            label={t('export.labels.heat.baseRate')}
            value={format.number(heat.userThermalBaseRate, 2, '€/Jahr')}
          />
        </BuildingDataGroup>
      )}
    </BuildingDataSection>
  );
}
