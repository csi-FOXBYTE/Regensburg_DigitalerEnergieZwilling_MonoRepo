import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeedbackDialogContent } from './FeedbackButton';

const OBSERVED_SECTION_ID = 'next-steps-section';

export default function FeedbackBubble() {
  const { t } = useTranslation('common');
  const [intersecting, setIntersecting] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let cancelled = false;

    const attach = (element: Element) => {
      const observer = new IntersectionObserver(
        ([entry]) => setIntersecting(entry.isIntersecting),
        { threshold: 0.15 },
      );
      observer.observe(element);
      observerRef.current = observer;
    };

    // Result.astro hydrates this island independently from the section it
    // watches, so the target element may not exist in the DOM yet.
    const findSection = () => {
      const element = document.getElementById(OBSERVED_SECTION_ID);
      if (element) {
        attach(element);
        return true;
      }
      return false;
    };

    if (!findSection()) {
      const retry = window.setInterval(() => {
        if (cancelled || findSection()) window.clearInterval(retry);
      }, 250);
      return () => {
        cancelled = true;
        window.clearInterval(retry);
        observerRef.current?.disconnect();
      };
    }

    return () => observerRef.current?.disconnect();
  }, []);

  const visible = intersecting && !clicked;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="feedback-bubble"
            initial={{ x: 96, opacity: 0 }}
            animate={{
              x: 0,
              opacity: 1,
              transition: { type: 'spring', stiffness: 320, damping: 22 },
            }}
            exit={{
              x: 64,
              opacity: 0,
              transition: { duration: 0.2, ease: 'easeIn' },
            }}
            className="fixed right-6 bottom-24 z-40"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 2.4,
                ease: 'easeInOut',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setClicked(true);
                  setDialogOpen(true);
                }}
                className="text-primary hover:text-primary-hover rounded-floating-control bg-background flex items-center gap-2 border border-neutral-200 py-3 pr-5 pl-4 shadow-[0_4px_12px_0px_rgba(0,0,0,0.22)] transition-colors hover:bg-white hover:shadow-[0_0_12px_4px_rgba(0,0,0,0.15)]"
              >
                <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {t('feedback.bubble.cta')}
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <FeedbackDialogContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
