import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Typography } from '@/components/ui/typography';
import { $building } from '@/lib/state/building';
import { useStore } from '@nanostores/react';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BuildingSelectionSection from './BuildingSelectionSection';
import ElectricitySection from './ElectricitySection';
import GeneralDataSection from './GeneralDataSection';
import HeatSection from './HeatSection';
import OuterPartsSection from './OuterPartsSection';

function BuildingDataDialogContent() {
  const { t } = useTranslation('energyCalculation');
  const building = useStore($building);
  const address = building?.properties.address;
  const addressLine = address
    ? [
        address.street,
        [address.postcode, address.city].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ')
    : undefined;

  return (
    <DialogContent className="sm:rounded-dialog top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(88dvh,56rem)] sm:w-[calc(100%-3rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border">
      <DialogHeader className="shrink-0 border-b border-neutral-200 px-4 py-4 pr-16 sm:px-6 sm:py-6 sm:pr-16">
        <div className="flex items-center gap-3">
          <Building2
            className="text-primary size-7 shrink-0"
            aria-hidden="true"
          />
          <DialogTitle className="min-w-0 text-(length:--text-h2) leading-(--leading-h2)">
            {t('buildingData.title')}
          </DialogTitle>
        </div>
        <DialogDescription>
          {addressLine ?? t('buildingData.description')}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-8">
          <BuildingSelectionSection />
          <GeneralDataSection />
          <OuterPartsSection />
          <HeatSection />
          <ElectricitySection />
        </div>
      </div>

      <div className="bg-background shrink-0 border-t border-neutral-200 px-4 py-3 sm:px-6">
        <Typography variant="verySmall">{t('buildingData.hint')}</Typography>
      </div>
    </DialogContent>
  );
}

/**
 * Read-only overview of the building's current state: everything the user
 * entered or accepted in steps 1 to 5, grouped by step.
 */
export default function BuildingDataDialog() {
  const { t } = useTranslation('energyCalculation');
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="gap-2">
          <Building2 className="size-5" aria-hidden="true" />
          {t('buildingData.trigger')}
        </Button>
      </DialogTrigger>
      {open && <BuildingDataDialogContent />}
    </Dialog>
  );
}
