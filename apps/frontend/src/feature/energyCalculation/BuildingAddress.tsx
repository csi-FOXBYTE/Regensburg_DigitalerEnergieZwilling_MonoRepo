import { Typography } from '@/components/ui/typography';
import { $building } from '@/lib/state/building';
import { useStore } from '@nanostores/react';
import { MapPin } from 'lucide-react';

/**
 * Shows the address of the currently selected building so the user always sees
 * which building they are working on. Renders nothing until a building with an
 * address is selected.
 */
export default function BuildingAddress() {
  const building = useStore($building);
  const address = building?.properties.address;
  if (!address) return null;

  const line = [
    address.street,
    [address.postcode, address.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="text-muted-foreground mt-2 flex items-center gap-2">
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      <Typography variant="small">{line}</Typography>
    </div>
  );
}
