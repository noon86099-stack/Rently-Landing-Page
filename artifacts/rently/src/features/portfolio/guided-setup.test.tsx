import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/lib/i18n';
import type { Lease } from '@/lib/rently-data';
import type { RentlyLease } from '@workspace/api-client-react';
import { GuidedSetup, GuidedSetupDisclosure, SetupCompletion } from './guided-setup';
import { AddUnitForm } from './add-unit-form';
import { CreateLeaseForm } from './create-lease-form';
import { LeaseDetailsPage } from './lease-details-page';
import { LeaseRecord } from './lease-record';
import { PROPERTY_TYPE_LABELS } from './create-property-form';
import { setupErrorMessage } from './setup-request';
import { trackGuidedSetupEvent } from './setup-analytics';

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

function inputTag(markup: string, testId: string) {
  const tag = markup.match(new RegExp(`<input\\b[^>]*data-testid="${testId}"[^>]*>`))?.[0];
  assert.ok(tag, `Expected input ${testId} to render.`);
  return tag;
}

test('guided setup is collapsed by default behind an accessible disclosure', () => {
  const disclosure = createElement(GuidedSetupDisclosure, {
    children: createElement('p', null, 'Setup content'),
  });
  const en = render('en', disclosure);
  const ar = render('ar', disclosure);
  const detailsTag = en.match(/<details\b[^>]*>/)?.[0];
  assert.ok(detailsTag, 'Expected the guided setup disclosure to render.');
  assert.doesNotMatch(detailsTag, /\sopen(?:="")?(?:\s|>)/);
  assert.match(en, /Add property, unit, tenant or lease/);
  assert.match(ar, /إضافة عقار أو وحدة أو مستأجر وعقد/);
  assert.match(en, /Setup content/);
});

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
  const guidedUnit = createElement(AddUnitForm, { userId: 'owner-a', propertyId: 'property-a', token: 'unused', trackGuidedSetup: true });
  const lease = createElement(CreateLeaseForm, {
    userId: 'owner-a', propertyId: 'property-a', token: 'unused',
    units: [{ id: 'unit-a', unit_label: 'User supplied name', leases: [] }],
  });
  assert.match(render('en', unit), /Save unit/);
  assert.match(render('ar', unit), /حفظ الوحدة/);
  assert.match(render('en', guidedUnit), /Save and continue/);
  assert.match(render('ar', guidedUnit), /حفظ ومتابعة/);
  assert.doesNotMatch(render('en', unit), /Type the name in the field/);
  const enLease = render('en', lease);
  const arLease = render('ar', lease);
  assert.match(enLease, /Save tenant and lease/);
  assert.match(arLease, /حفظ المستأجر والعقد/);
  const enStartDay = inputTag(enLease, 'input-lease-start-day');
  const arStartDay = inputTag(arLease, 'input-lease-start-day');
  const arDatePicker = inputTag(arLease, 'input-lease-start-picker');
  assert.match(enStartDay, /aria-label="Day"/);
  assert.match(enStartDay, /dir="ltr"/);
  assert.match(arStartDay, /aria-label="اليوم"/);
  assert.match(arStartDay, /dir="ltr"/);
  assert.match(arDatePicker, /type="date"/);
  assert.match(arDatePicker, /aria-label="اختر التاريخ من التقويم"/);
  assert.doesNotMatch(arDatePicker, /aria-hidden|tabindex="-1"/i);
  assert.match(enLease, /placeholder="DD"/);
  assert.match(enLease, /placeholder="MM"/);
  assert.match(enLease, /placeholder="YYYY"/);
  assert.match(arLease, /اليوم.*الشهر.*السنة/s);
  assert.match(arLease, /اختر التاريخ من التقويم/);
  assert.doesNotMatch(inputTag(arLease, 'input-tenant-name'), /\sdisabled(?:="")?(?:\s|>)/);
  assert.doesNotMatch(arStartDay, /\sdisabled(?:="")?(?:\s|>)/);
  assert.match(arLease, /User supplied name/);
});

test('completion screen confirms the saved file and displays scheduled due dates', () => {
  const payments = [
    { id: 'due-june', dueDate: '2026-06-05', amount: 1200, paidAt: null },
    { id: 'due-may', dueDate: '2026-05-05', amount: 1200, paidAt: null },
    { id: 'due-july', dueDate: '2026-07-05', amount: 1200, paidAt: null },
    { id: 'due-august', dueDate: '2026-08-05', amount: 1200, paidAt: null },
  ];
  const complete = (hasDocument: boolean) => createElement(SetupCompletion, {
    hasDocument,
    dueDay: 5,
    payments,
    onOpenRecords() {},
    onGoHome() {},
    onStartAnother() {},
  });

  const en = render('en', complete(true));
  assert.match(en, /Setup complete/);
  assert.match(en, /signed file are saved/);
  assert.match(en, /data-testid="button-go-home"/);
  assert.match(en, /Go to homepage/);
  assert.match(en, /Monthly due day/);
  assert.match(en, /Generated due dates/);
  assert.match(en, /May 05, 2026/);
  assert.match(en, /Jun 05, 2026/);
  assert.match(en, /\+1 more/);
  assert.ok(en.indexOf('May 05, 2026') < en.indexOf('Jun 05, 2026'));

  const ar = render('ar', complete(false));
  assert.match(ar, /اكتملت الخطوات/);
  assert.match(ar, /الصفحة الرئيسية/);
  assert.match(ar, /يمكنك رفع الملف الموقّع لاحقًا/);
  assert.match(ar, /يوم الاستحقاق الشهري/);
  assert.match(ar, /مواعيد الاستحقاق المحفوظة/);
  assert.match(ar, /05 مايو 2026/);
});

test('lease details confirms creation, shows tenant and lease terms, and offers dashboard navigation', () => {
  const lease: RentlyLease = {
    id: 'lease-a',
    unitId: 'unit-a',
    tenantId: 'tenant-a',
    startDate: '2026-02-01',
    endDate: '2027-01-31',
    status: 'active',
    monthlyRent: 12000,
    dueDay: 5,
    tenant: { id: 'tenant-a', fullName: 'Jordan Tenant', email: 'jordan@example.test', phone: '+1 555 0100' },
    payments: [{ id: 'payment-a', dueDate: '2026-06-05', amount: 12000, paidAt: null }],
  };
  const page = createElement(LeaseDetailsPage, {
    lease,
    propertyId: 'property-a',
    propertyName: 'Cedar House',
    unitLabel: 'Unit 02',
    token: 'test-token',
    onGoToDashboard() {},
  });

  const en = render('en', page);
  assert.match(en, /Lease created successfully/);
  assert.match(en, /Jordan Tenant/);
  assert.match(en, /jordan@example\.test/);
  assert.match(en, /12,000/);
  assert.match(en, /Feb 01, 2026/);
  assert.match(en, /Jan 31, 2027/);
  assert.match(en, /Jun 05, 2026/);
  assert.match(en, /button-lease-details-dashboard/);
  assert.match(en, /Back to dashboard/);

  const ar = render('ar', page);
  assert.match(ar, /تم إنشاء عقد الإيجار بنجاح/);
  assert.match(ar, /العودة إلى لوحة التحكم/);
});

test('payment recording uses today and no longer asks for a paid date', () => {
  const lease: Lease = {
    id: 'lease-a',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'active',
    monthly_rent: 12000,
    due_day: 5,
    payments: [{ id: 'payment-a', due_date: '2026-11-01', amount: 12000, paid_at: null }],
    tenants: { full_name: 'Sample Tenant', email: null, phone: null },
  };
  const row = createElement(LeaseRecord, {
    lease,
    ctx: { token: 'unused', userId: 'owner-a', propertyId: 'property-a', today: '2026-11-16' },
  });

  const en = render('en', row);
  const ar = render('ar', row);
  assert.match(en, /Mark paid today/);
  assert.match(ar, /تسجيل كمدفوع اليوم/);
  assert.doesNotMatch(en, /input-paid-at-/);
  assert.doesNotMatch(ar, /input-paid-at-/);
});

test('safe retry errors are available in both languages without leaking upstream details', () => {
  assert.match(setupErrorMessage({ status: 503 }, '', 'en'), /database update/);
  assert.match(setupErrorMessage({ status: 503 }, '', 'ar'), /قاعدة البيانات/);
  assert.match(setupErrorMessage({ status: 409 }, '', 'en'), /overlapping leases/);
  const storageError = new Error('تعذّر حفظ معرّف المحاولة في المتصفح.');
  assert.match(setupErrorMessage(storageError, '', 'en'), /no data was sent/);
  assert.doesNotMatch(setupErrorMessage(new Error('Private upstream detail'), 'Could not save.', 'en'), /Private upstream/);
});

test('guided setup analytics sends only fixed stage values and ignores tracker errors', () => {
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

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { umami: { track() { throw new Error('tracker unavailable'); } } },
  });
  assert.doesNotThrow(() => trackGuidedSetupEvent('guided_setup_stage_completed', 'unit'));
});

test('management prefers the saved address and directs missing units to an explicit setup step', () => {
  const props = { userId: 'owner-a', propertyId: 'property-a', token: 'unused', defaultUnitLabel: 'Address 2' };
  const lease = createElement(CreateLeaseForm, { ...props, units: [
    { id: 'unit-a', unit_label: 'Address 1', leases: [] },
    { id: 'unit-b', unit_label: 'Address 2', leases: [] },
  ] });
  assert.match(render('en', lease), /value="unit-b" selected=""/);
  const missingUnit = createElement(CreateLeaseForm, { ...props, units: [] });
  assert.match(render('en', missingUnit), /data-testid="button-open-guided-setup"/);
  assert.match(render('en', missingUnit), /Open guided setup/);
  assert.match(render('ar', missingUnit), /احفظ وحدة أولًا/);
  assert.doesNotMatch(render('en', missingUnit), /data-testid="button-create-lease"/);
});
