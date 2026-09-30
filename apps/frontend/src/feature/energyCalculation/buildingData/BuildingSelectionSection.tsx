import { $building } from '@/lib/state/building';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'react-i18next';
import {
  BuildingDataGroup,
  BuildingDataSection,
  BuildingDataValue,
} from './BuildingDataSection';
import { MISSING_VALUE } from './useBuildingDataFormat';

/** Step 1: the building the user picked on the map. */
export default function BuildingSelectionSection() {
  const { t } = useTranslation('energyCalculation');
  const building = useStore($building);
  const address = building?.properties.address;
  const city = [address?.postcode, address?.city].filter(Boolean).join(' ');

  return (
    <BuildingDataSection step={1}>
      <BuildingDataGroup>
        <BuildingDataValue
          label={t('buildingData.labels.street')}
          value={address?.street ?? MISSING_VALUE}
        />
        <BuildingDataValue
          label={t('buildingData.labels.city')}
          value={city || MISSING_VALUE}
        />
      </BuildingDataGroup>
    </BuildingDataSection>
  );
}
