import ClientHydration from '@/components/ClientHydration';
import { useStore } from '@nanostores/react';
import { requestCamera } from '@/lib/camera-state';
import { consumePendingExternalBuildingTarget } from '@/lib/state/external-building-target';
import { $step, Step } from '@/lib/state/ui/progress';
import { useEffect } from 'react';
import AddressSearch from './AddressSearch';
import BuildingWindow from './BuildingWindow';
import { Map3D } from './Map3D';
import { MapNav } from './MapNav';

function MapWithControls() {
  const currentStep = useStore($step);

  useEffect(() => {
    if (currentStep !== Step.Building) return;
    const target = consumePendingExternalBuildingTarget();
    if (!target) return;

    requestCamera({
      type: 'focus',
      target: {
        latitudeDegrees: target.latitudeDegrees,
        longitudeDegrees: target.longitudeDegrees,
      },
      reason: {
        type: 'externalBuilding',
        buildingId: target.buildingId,
      },
      accommodateMobileOverlay: true,
    });
  }, [currentStep]);

  return (
    <Map3D>
      <AddressSearch
        onAddressFound={(lat, lon, address) => {
          const result = requestCamera({
            type: 'focus',
            target: {
              latitudeDegrees: Number.parseFloat(lat),
              longitudeDegrees: Number.parseFloat(lon),
            },
            reason: { type: 'address', address },
            accommodateMobileOverlay: true,
          });
          return result !== 'ignored';
        }}
      />
      <MapNav />
      <BuildingWindow />
    </Map3D>
  );
}

export default function MapIsland() {
  return (
    <ClientHydration>
      <MapWithControls />
    </ClientHydration>
  );
}
