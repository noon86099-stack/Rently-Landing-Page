import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import { GuidedSetup } from './guided-setup';
import { AddUnitForm } from './add-unit-form';
import { CreateLeaseForm } from './create-lease-form';
import { PROPERTY_TYPE_LABELS } from './create-property-form';
import { setupErrorMessage } from './setup-request';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function render(language: 'ar' | 'en', child: React.ReactNode) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true, value: { localStorage: { getItem: () => language } },
  });
  const client = new QueryClient();
  client.setQueryData(['rently-properties', 'owner-a'], []);
  try {
    return renderToStaticMarkup(createElement(I18nProvider, {
      children: createElement(QueryClientProvider, { client, children: child }),
    }));
  } finally { client.clear(); }
}

test('guided setup and its property form follow the chosen language and direction', () => {
  const child = createElement(GuidedSetup, { userId: 'owner-a', token: 'unused', onOpenRecords() {} });
  const en = render('en', child);
  assert.match(en, /dir="ltr"/);
  assert.match(en, /Guided setup/);
  assert.match(en, /Save property/);
  assert.doesNotMatch(en, /إعداد موجّه|حفظ العقار/);
  const ar = render('ar', child);
  assert.match(ar, /dir="rtl"/);
  assert.match(ar, /إعداد موجّه/);
  assert.match(ar, /حفظ العقار/);
  assert.doesNotMatch(ar, /Guided setup|Save property/);
  assert.deepEqual(PROPERTY_TYPE_LABELS.Apartment, { en: 'Apartment', ar: 'شقة' });
});

test('unit and lease forms retain both languages after merging retry protection', () => {
  const unit = createElement(AddUnitForm, { userId: 'owner-a', propertyId: 'property-a', token: 'unused' });
  const lease = createElement(CreateLeaseForm, {
    userId: 'owner-a', propertyId: 'property-a', token: 'unused',
    units: [{ id: 'unit-a', unit_label: 'User supplied name', leases: [] }],
  });
  assert.match(render('en', unit), /Save unit/);
  assert.match(render('ar', unit), /حفظ الوحدة/);
  assert.match(render('en', lease), /Save tenant and lease/);
  assert.match(render('ar', lease), /حفظ المستأجر والعقد/);
  assert.match(render('ar', lease), /User supplied name/);
});

test('safe retry errors are available in both languages without leaking upstream details', () => {
  assert.match(setupErrorMessage({ status: 503 }, '', 'en'), /database update/);
  assert.match(setupErrorMessage({ status: 503 }, '', 'ar'), /قاعدة البيانات/);
  assert.match(setupErrorMessage({ status: 409 }, '', 'en'), /overlapping leases/);
  const storageError = new Error('تعذّر حفظ معرّف المحاولة في المتصفح.');
  assert.match(setupErrorMessage(storageError, '', 'en'), /no data was sent/);
  assert.doesNotMatch(setupErrorMessage(new Error('Private upstream detail'), 'Could not save.', 'en'), /Private upstream/);
});

test('management prefers the saved address and directs missing units to an explicit setup step', () => {
  const props = { userId: 'owner-a', propertyId: 'property-a', token: 'unused', defaultUnitLabel: 'Address 2' };
  const lease = createElement(CreateLeaseForm, { ...props, units: [
    { id: 'unit-a', unit_label: 'Address 1', leases: [] },
    { id: 'unit-b', unit_label: 'Address 2', leases: [] },
  ] });
  assert.match(render('en', lease), /value="unit-b" selected=""/);
  const missingUnit = createElement(CreateLeaseForm, { ...props, units: [] });
  assert.match(render('en', missingUnit), /href="#setup"/);
  assert.match(render('ar', missingUnit), /احفظ وحدة أولًا/);
  assert.doesNotMatch(render('en', missingUnit), /data-testid="button-create-lease"/);
});
