import type { FeedbackCategory } from '@/lib/api/public';
import { submitFeedback } from '@/lib/api/public';
import { Check, LoaderCircle, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Callout } from '../ui/callout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Typography } from '../ui/typography';

const CATEGORIES = [
  'bug',
  'suggestion',
  'feedback',
] as const satisfies readonly FeedbackCategory[];

export function FeedbackDialogContent() {
  const { t } = useTranslation('common');

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Empty until the user picks one, so the select shows its placeholder.
  const [category, setCategory] = useState<FeedbackCategory | ''>('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!category || !message.trim() || submitting) return;

    setSubmitting(true);
    try {
      await submitFeedback({ category, message, emailAddress: email });
      setSubmitted(true);
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader className="flex-row items-center gap-3">
        <span className="bg-muted text-primary rounded-badge flex size-10 shrink-0 items-center justify-center">
          <MessageCircle className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <DialogTitle>{t('feedback.title')}</DialogTitle>
          <DialogDescription>{t('feedback.subtitle')}</DialogDescription>
        </div>
      </DialogHeader>
      {submitted ? (
        <div
          className="flex flex-col items-center gap-4 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <span className="rounded-badge flex size-16 shrink-0 items-center justify-center bg-green-100 text-green-600">
            <Check className="size-8" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <Typography as="h3" variant="h4">
              {t('feedback.success.title')}
            </Typography>
            <Typography variant="muted">
              {t('feedback.success.message')}
            </Typography>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="feedback-category">
                {t('feedback.category.label')}{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Select
                required
                value={category}
                onValueChange={(value) =>
                  setCategory(value as FeedbackCategory)
                }
              >
                <SelectTrigger id="feedback-category">
                  <SelectValue
                    placeholder={t('feedback.category.placeholder')}
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  avoidCollisions={false}
                >
                  {CATEGORIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`feedback.category.options.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="feedback-message">
                {t('feedback.message.label')}{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <Textarea
                id="feedback-message"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t('feedback.message.placeholder')}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="feedback-email">
                {t('feedback.email.label')}{' '}
                <Typography as="span" variant="muted">
                  {t('feedback.email.optional')}
                </Typography>
              </FieldLabel>
              <Input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('feedback.email.placeholder')}
              />
              <FieldDescription>{t('feedback.email.hint')}</FieldDescription>
            </Field>

            <Callout variant="info">
              <Typography variant="small">
                {t('feedback.privacyNotice')}
              </Typography>
            </Callout>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={!category || !message.trim() || submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <LoaderCircle
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send className="size-5" aria-hidden="true" />
              )}{' '}
              {t('feedback.submit')}
            </Button>
          </FieldGroup>
        </form>
      )}
    </>
  );
}

export default function FeedbackButton() {
  const { t } = useTranslation('common');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="border-footer-foreground text-footer-foreground hover:bg-footer-foreground hover:text-footer w-full cursor-pointer border bg-transparent transition-colors md:w-67.5">
          {t('footer.feedback')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <FeedbackDialogContent />
      </DialogContent>
    </Dialog>
  );
}
