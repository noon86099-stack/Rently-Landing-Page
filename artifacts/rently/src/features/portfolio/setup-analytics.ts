type SetupStage = 'property' | 'unit' | 'lease';
type SetupEvent = 'guided_setup_started' | 'guided_setup_stage_completed' | 'guided_setup_stage_failed';

type AnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: AnalyticsData): void;
    };
  }
}

export function trackGuidedSetupEvent(event: 'guided_setup_started'): void;
export function trackGuidedSetupEvent(event: Exclude<SetupEvent, 'guided_setup_started'>, stage: SetupStage): void;
export function trackGuidedSetupEvent(event: SetupEvent, stage?: SetupStage): void {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(event, stage ? { stage } : undefined);
  } catch {
    // Analytics is optional and must never interrupt saving.
  }
}
