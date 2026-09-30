import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function InvalidBuildingConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const { t } = useTranslation('map');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('invalidBuildingConfirmDialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('invalidBuildingConfirmDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('invalidBuildingConfirmDialog.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('invalidBuildingConfirmDialog.confirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
