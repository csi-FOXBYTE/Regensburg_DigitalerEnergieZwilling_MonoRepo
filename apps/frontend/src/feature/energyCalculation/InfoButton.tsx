import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

function InfoButton({
  onClick,
  iconClassName,
}: {
  onClick?: () => void;
  iconClassName?: string;
}) {
  const { t } = useTranslation('common');

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('showMoreInformation')}
      className="group text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center"
    >
      <Info
        className={cn(
          'group-hover:text-primary text-muted-foreground size-3.5',
          iconClassName,
        )}
        aria-hidden="true"
      />
    </button>
  );
}

export function InfoTooltipButton({ content }: { content: ReactNode }) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          ref={triggerRef}
          type="button"
          aria-label={t('showMoreInformation')}
          onClick={() => setOpen((v) => !v)}
          className="group text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center"
        >
          <Info
            className="group-hover:text-primary text-muted-foreground size-3.5"
            aria-hidden="true"
          />
        </TooltipTrigger>
        <TooltipContent
          className="bg-background text-foreground max-w-70 rounded px-4 py-3 text-sm leading-relaxed shadow-lg"
          onEscapeKeyDown={() => setOpen(false)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function InfoDialogButton({
  title,
  content,
  media,
  contentClassName,
  iconClassName,
}: {
  title: ReactNode;
  content: ReactNode;
  media?: ReactNode;
  contentClassName?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <InfoButton onClick={() => setOpen(true)} iconClassName={iconClassName} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={contentClassName}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {media}
            <DialogDescription>{content}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
