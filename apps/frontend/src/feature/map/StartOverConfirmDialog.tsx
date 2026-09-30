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

export default function StartOverConfirmDialog({ open, onOpenChange, onConfirm }: Props) {
  const { t } = useTranslation('map');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('startOverConfirmDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('startOverConfirmDialog.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('startOverConfirmDialog.cancelButton')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('startOverConfirmDialog.confirmButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
