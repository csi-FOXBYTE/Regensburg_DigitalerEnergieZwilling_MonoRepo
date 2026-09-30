import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function RenovationPotentialInfoDialog({
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation('map');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle>{t('renovationPotentialInfoDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('renovationPotentialInfoDialog.description')}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
