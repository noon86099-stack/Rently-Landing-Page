import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { trackGuidedSetupEvent } from './setup-analytics';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('guided setup analytics sends only fixed stage values', () => {
  const events: Array<{ name: string; data?: Record<string, string | number | boolean> }> = [];
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { umami: { track: (name: string, data?: Record<string, string | number | boolean>) => events.push({ name, data }) } },
  });

  trackGuidedSetupEvent('guided_setup_started');
  trackGuidedSetupEvent('guided_setup_stage_completed', 'property');
  trackGuidedSetupEvent('guided_setup_stage_failed', 'lease');

  assert.deepEqual(events, [
    { name: 'guided_setup_started', data: undefined },
    { name: 'guided_setup_stage_completed', data: { stage: 'property' } },
    { name: 'guided_setup_stage_failed', data: { stage: 'lease' } },
  ]);
});

test('guided setup analytics is safe when tracking is absent or throws', () => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  assert.doesNotThrow(() => trackGuidedSetupEvent('guided_setup_started'));

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { umami: { track() { throw new Error('tracker unavailable'); } } },
  });
  assert.doesNotThrow(() => trackGuidedSetupEvent('guided_setup_stage_completed', 'unit'));
});
