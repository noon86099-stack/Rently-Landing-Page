import { useState } from 'react';
import { CheckCircle2, Home } from 'lucide-react';
import {
  useLookupRentlyTenantPortal,
  useCreateRentlyTenantPortalCheckout,
  type RentlyTenantPortalLookup,
} from '@workspace/api-client-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { RentlyWordmark } from '@/components/rently-brand';
import { useI18n, useLocalizedFormats } from '@/lib/i18n';

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

export function TenantPortalPage() {
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const lookup = useLookupRentlyTenantPortal();
  const checkout = useCreateRentlyTenantPortalCheckout();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState<RentlyTenantPortalLookup | null>(null);
  const [error, setError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutNotice] = useState<'success' | 'pending' | 'cancelled' | null>(() => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    return payment === 'success' || payment === 'pending' || payment === 'cancelled' ? payment : null;
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(null);
    setError('');
    setCheckoutUrl(null);
    try {
      const result = await lookup.mutateAsync({ data: { email: email.trim(), phone: phone.trim() } });
      setSummary(result);
    } catch (cause) {
      const status = httpStatus(cause);
      setError(status === 404
        ? t('No tenant matched those details. Check your registered email and phone.', 'لم نجد مستأجرًا بهذه البيانات. تحقق من البريد والهاتف المسجلين.')
        : status === 429
          ? t('Too many attempts. Please try again later.', 'محاولات كثيرة. يرجى المحاولة لاحقًا.')
          : status === 400
            ? t('Enter a valid email address and phone number.', 'أدخل بريدًا إلكترونيًا ورقم هاتف صحيحين.')
            : t('The tenant details could not be checked right now.', 'تعذّر التحقق من بيانات المستأجر الآن.'));
    }
  }

  async function startCheckout() {
    setCheckoutError('');
    setCheckoutUrl(null);
    try {
      const result = await checkout.mutateAsync({
        data: { email: email.trim(), phone: phone.trim() },
      });
      setCheckoutUrl(result.checkoutUrl);
      // Navigate in the current tab; mobile and in-app browsers often block
      // newly opened tabs after an asynchronous checkout request.
      window.location.assign(result.checkoutUrl);
    } catch (cause) {
      const status = httpStatus(cause);
      setCheckoutError(status === 404
        ? t('No outstanding rent payment matched those details.', 'لم نجد دفعة إيجار مستحقة بهذه البيانات.')
        : status === 409
          ? t('This rent payment is already marked as paid. Check the status again.', 'تم تسجيل هذه الدفعة كمدفوعة. تحقق من الحالة مجددًا.')
          : status === 429
            ? t('Too many checkout attempts. Please try again later.', 'محاولات دفع كثيرة. يرجى المحاولة لاحقًا.')
            : t('Test checkout is temporarily unavailable.', 'الدفع التجريبي غير متاح مؤقتًا.'));
    }
  }

  const status = summary
    ? {
        paid: { label: t('Paid', 'مدفوع'), style: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]' },
        pending: { label: t('Pending', 'قيد الانتظار'), style: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]' },
        overdue: { label: t('Overdue', 'متأخر'), style: 'border-red-300 bg-red-50 text-red-800' },
      }[summary.paymentStatus]
    : null;

  return (
    <main dir={direction} className="min-h-screen bg-[#eef3f7] text-[#102238]">
      <header className="border-b border-[#d1dbe4] bg-[#f8fafb]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-bold tracking-[-.05em]" aria-label="Rently">
            <RentlyWordmark size={34} />
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#cbd7e1] bg-white px-2.5 text-xs font-semibold text-[#315b91] transition-colors hover:bg-[#eef3f7] sm:px-3"
            >
              <Home size={14} aria-hidden="true" />
              {t('Back to home', 'العودة للرئيسية')}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-[#d1dbe4] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef3ff] font-mono text-sm font-bold text-[#315b91]">01</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#3f7cff]">{t('Step 1 · Verify your details', 'الخطوة ١ · تحقق من بياناتك')}</p>
              <h1 data-testid="text-tenant-portal-title" className="mt-1 text-2xl font-semibold tracking-[-.05em]">{t('Tenant Portal', 'بوابة المستأجر')}</h1>
              <p className="mt-2 text-sm leading-6 text-[#61768b]">{t('View your rent amount, due date, and payment status using the contact details registered with your landlord.', 'اعرض مبلغ الإيجار وتاريخ الاستحقاق وحالة الدفع باستخدام بيانات الاتصال المسجلة لدى المالك.')}</p>
            </div>
          </div>
          {import.meta.env.PROD && (
            <p role="note" className="mt-4 rounded-lg border-s-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              {t('Stripe Test Mode only: no real money is charged. Successful test payments update the rent status shown to your landlord.', 'وضع Stripe الاختباري فقط: لا تُخصم أموال حقيقية. نجاح الدفع التجريبي يحدّث حالة الإيجار الظاهرة للمالك.')}
            </p>
          )}
          {checkoutNotice && (
            <p
              role="status"
              className={`mt-4 rounded-lg border-s-2 px-3 py-2 text-sm leading-6 ${
                checkoutNotice === 'success'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : checkoutNotice === 'pending'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-[#cbd7e1] bg-[#f2f6f9] text-[#526c83]'
              }`}
            >
              {checkoutNotice === 'success'
                ? t('Payment confirmed. The paid status is now visible to your landlord.', 'تم تأكيد الدفع، وأصبحت الحالة المدفوعة ظاهرة للمالك.')
                : checkoutNotice === 'pending'
                  ? t('Payment confirmation is still processing. Check the rent status again shortly.', 'ما زال تأكيد الدفع قيد المعالجة. تحقق من حالة الإيجار بعد قليل.')
                  : t('Payment was cancelled. No payment was recorded.', 'تم إلغاء الدفع، ولم تُسجل أي دفعة.')}
            </p>
          )}

          <form onSubmit={submit} className="mt-6 grid gap-4" aria-label={t('Tenant details lookup', 'التحقق من بيانات المستأجر')}>
            <label className="grid gap-2 text-sm font-semibold text-[#425b72]">
              {t('Registered email address', 'البريد الإلكتروني المسجل')}
              <input
                data-testid="input-tenant-email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                dir="ltr"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pointer-events-auto min-h-12 w-full rounded-lg border border-[#cbd7e1] bg-white px-3 text-sm text-[#102238] outline-none transition-shadow focus:border-[#3f7cff] focus:ring-2 focus:ring-[#3f7cff]/20"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#425b72]">
              {t('Registered phone number', 'رقم الهاتف المسجل')}
              <input
                data-testid="input-tenant-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                required
                maxLength={40}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="pointer-events-auto min-h-12 w-full rounded-lg border border-[#cbd7e1] bg-white px-3 text-sm text-[#102238] outline-none transition-shadow focus:border-[#3f7cff] focus:ring-2 focus:ring-[#3f7cff]/20"
              />
            </label>
            {error && <p role="alert" data-testid="alert-tenant-lookup" className="rounded-lg border-s-2 border-red-500 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">{error}</p>}
            <button
              data-testid="button-tenant-lookup"
              type="submit"
              disabled={lookup.isPending}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#3f7cff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2f68e0] disabled:cursor-wait disabled:opacity-60"
            >
              {lookup.isPending ? t('Checking…', 'جارٍ التحقق…') : t('Show my rent details', 'عرض تفاصيل الإيجار')}
            </button>
          </form>

          {lookup.isPending && <p role="status" className="sr-only">{t('Checking tenant details', 'جارٍ التحقق من بيانات المستأجر')}</p>}

          {summary && status && (
            <section data-testid="section-tenant-rent-summary" aria-label={t('Rent summary', 'ملخص الإيجار')} aria-live="polite" className="mt-6 rounded-xl border border-[#dbe3e9] bg-[#fbfcfe] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{t('Details found', 'تم العثور على البيانات')}</p>
                  <h2 className="text-base font-semibold">{t('Your rent summary', 'ملخص الإيجار')}</h2>
                </div>
              </div>
              <div className="mt-4 border-t border-[#dbe3e9] pt-4">
                <p className="text-xs font-medium text-[#718398]">{t('Tenant', 'المستأجر')}</p>
                <p data-testid="text-tenant-name" className="mt-1 text-lg font-semibold"><bdi>{summary.tenantName}</bdi></p>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#dbe3e9] bg-white p-4 sm:col-span-2">
                  <dt className="text-xs text-[#718398]">{t('Rent amount due', 'مبلغ الإيجار المستحق')}</dt>
                  <dd data-testid="text-tenant-rent-amount" className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[#102238]" dir="ltr">{formatMoney(summary.rentAmount)}</dd>
                </div>
                <div className="rounded-lg border border-[#dbe3e9] bg-white p-4">
                  <dt className="text-xs text-[#718398]">{t('Payment due date', 'تاريخ الاستحقاق')}</dt>
                  <dd data-testid="text-tenant-due-date" className="mt-1.5 text-sm font-semibold"><bdi>{formatDate(summary.dueDate)}</bdi></dd>
                </div>
                <div className="rounded-lg border border-[#dbe3e9] bg-white p-4">
                  <dt className="text-xs text-[#718398]">{t('Payment status', 'حالة الدفع')}</dt>
                  <dd data-testid="status-tenant-payment" className={`mt-1.5 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.style}`}>{status.label}</dd>
                </div>
              </dl>
              {summary.paymentStatus !== 'paid' && (
                <>
                  {checkoutError && (
                    <p role="alert" className="mt-4 rounded-lg border-s-2 border-red-500 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">
                      {checkoutError}
                    </p>
                  )}
                  <button
                    data-testid="button-tenant-pay"
                    type="button"
                    onClick={startCheckout}
                    disabled={checkout.isPending}
                    aria-busy={checkout.isPending}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#3f7cff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2f68e0] disabled:cursor-wait disabled:opacity-60"
                  >
                    {checkout.isPending
                      ? t('Opening secure checkout…', 'جارٍ فتح صفحة الدفع الآمنة…')
                      : t('Pay Now', 'ادفع الآن')}
                  </button>
                  {checkoutUrl && (
                    <a
                      data-testid="link-tenant-stripe-checkout"
                      href={checkoutUrl}
                      className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#3f7cff] bg-white px-4 text-sm font-semibold text-[#315b91] transition-colors hover:bg-[#eef3ff]"
                    >
                      {t('Open secure Stripe checkout', 'فتح صفحة الدفع الآمنة من Stripe')}
                    </a>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
