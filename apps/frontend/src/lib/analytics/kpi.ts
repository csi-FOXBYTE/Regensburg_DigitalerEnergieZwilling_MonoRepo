import type { AnalyticsEvent, EventCode, StepId } from './catalog';

/** Events of one consented session in the order they were recorded. */
export type AnalyticsSession = readonly AnalyticsEvent[];

export type AnalyticsKpis = {
  started: number;
  completed: number;
  completionRate: number | null;
  pdfDownloaded: number;
  pdfRate: number | null;
  contactRequested: number;
  contactRate: number | null;
  donationCompleted: number;
  donationRate: number | null;
  /** Last completed step of started sessions without `tool_completed`. */
  dropOffSteps: Partial<Record<StepId, number>>;
  /** Started, uncompleted sessions without any completed step. */
  dropOffWithoutStep: number;
  dropOffRate: number | null;
};

const rate = (count: number, base: number) => (base > 0 ? count / base : null);

/** Binding KPI definitions of the tracking concept, counted per session. */
export function computeKpis(
  sessions: readonly AnalyticsSession[],
): AnalyticsKpis {
  const withEvent = (code: EventCode) =>
    sessions.filter((events) => events.some((event) => event.code === code));
  const started = withEvent('tool_started');
  const completed = withEvent('tool_completed').length;
  const pdfDownloaded = withEvent('pdf_downloaded').length;
  const contactRequested = withEvent('contact_requested').length;
  const donationCompleted = withEvent('donation_completed').length;
  const completionRate = rate(completed, started.length);

  const dropOffSteps: Partial<Record<StepId, number>> = {};
  let dropOffWithoutStep = 0;
  for (const events of started) {
    if (events.some((event) => event.code === 'tool_completed')) continue;
    const last = events.findLast((event) => event.code === 'step_completed');
    if (last?.code === 'step_completed')
      dropOffSteps[last.value] = (dropOffSteps[last.value] ?? 0) + 1;
    else dropOffWithoutStep++;
  }

  return {
    started: started.length,
    completed,
    completionRate,
    pdfDownloaded,
    pdfRate: rate(pdfDownloaded, completed),
    contactRequested,
    contactRate: rate(contactRequested, completed),
    donationCompleted,
    donationRate: rate(donationCompleted, completed),
    dropOffSteps,
    dropOffWithoutStep,
    dropOffRate: completionRate === null ? null : 1 - completionRate,
  };
}
