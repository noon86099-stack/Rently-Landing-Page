import { useState } from 'react';
import { Home } from 'lucide-react';
import {
  useLookupRentlyTenantPortal,
  useCreateRentlyTenantPortalCheckout,
  type RentlyTenantPortalLookup,
} from '@workspace/api-client-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n, useLocalizedFormats } from '@/lib/i18n';

function httpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

export function TenantPortalPage() {
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const isPublishedDemo = import.meta.env.PROD;
  const lookup = useLookupRentlyTenantPortal();
  const checkout = useCreateRentlyTenantPortalCheckout();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState<RentlyTenantPortalLookup | null>(null);
  const [error, setError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [checkoutNotice] = useState<'success' | 'pending' | 'cancelled' | null>(() => {
    if (isPublishedDemo) return null;
    const payment = new URLSearchParams(window.location.search).get('payment');
    return payment === 'success' || payment === 'pending' || payment === 'cancelled' ? payment : null;
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(null);
    setError('');
    setCheckoutUrl(null);
    setSimulationComplete(false);
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
    if (isPublishedDemo) {
      setSimulationComplete(true);
      return;
    }
    setCheckoutError('');
    setCheckoutUrl(null);
    // Open synchronously from the click so browsers do not treat the external
    // Stripe navigation as an unsolicited popup after the API request finishes.
    const checkoutWindow = window.open('about:blank', '_blank');
    if (checkoutWindow) checkoutWindow.opener = null;
    try {
      const result = await checkout.mutateAsync({
        data: { email: email.trim(), phone: phone.trim() },
      });
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.assign(result.checkoutUrl);
      } else {
        setCheckoutUrl(result.checkoutUrl);
      }
    } catch (cause) {
      checkoutWindow?.close();
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
            <span className="grid h-9 w-9 place-items-center border-2 border-[#102238] text-lg leading-none">
              <span className="text-[#3f7cff]">R</span>
            </span>
            <span className="text-lg">rently<span className="text-[#3f7cff]">/</span></span>
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex min-h-9 items-center gap-1.5 border border-[#cbd7e1] bg-white px-2.5 text-xs font-semibold text-[#315b91] transition-colors hover:bg-[#eef3f7] sm:px-3"
            >
              <Home size={14} aria-hidden="true" />
              {t('Back to home', 'العودة للرئيسية')}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="border border-[#d1dbe4] bg-white p-5 sm:p-7">
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#3f7cff]">{t('Tenant access', 'دخول المستأجر')}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-.05em]">{t('Tenant Portal', 'بوابة المستأجر')}</h1>
          <p className="mt-2 text-sm text-[#61768b]">{t('Enter the email and phone number registered with your landlord.', 'أدخل البريد الإلكتروني ورقم الهاتف المسجلين لدى المالك.')}</p>
          {isPublishedDemo && (
            <p role="note" className="mt-4 border-s-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t('Demo mode: payment is simulated only. No card or rent record is charged or changed.', 'وضع العرض: الدفع محاكاة فقط؛ لا تُستخدم بطاقة ولا يُخصم مبلغ أو يتغير سجل الإيجار.')}
            </p>
          )}
          {checkoutNotice && (
            <p
              role="status"
              className={`mt-4 border-s-2 px-3 py-2 text-sm ${
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
            <label className="grid gap-1.5 text-xs font-semibold text-[#425b72]">
              {t('Registered email address', 'البريد الإلكتروني المسجل')}
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pointer-events-auto min-h-11 w-full border border-[#cbd7e1] bg-white px-3 text-sm text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#425b72]">
              {t('Registered phone number', 'رقم الهاتف المسجل')}
              <input
                type="tel"
                autoComplete="tel"
                required
                maxLength={40}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="pointer-events-auto min-h-11 w-full border border-[#cbd7e1] bg-white px-3 text-sm text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
              />
            </label>
            {error && <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
            <button
              type="submit"
              disabled={lookup.isPending}
              className="inline-flex min-h-11 items-center justify-center bg-[#3f7cff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2f68e0] disabled:cursor-wait disabled:opacity-60"
            >
              {lookup.isPending ? t('Checking…', 'جارٍ التحقق…') : t('View rent status', 'عرض حالة الإيجار')}
            </button>
          </form>

          {lookup.isPending && <p role="status" className="sr-only">{t('Checking tenant details', 'جارٍ التحقق من بيانات المستأجر')}</p>}

          {summary && status && (
            <section aria-label={t('Rent summary', 'ملخص الإيجار')} aria-live="polite" className="mt-6 border-t border-[#dbe3e9] pt-5">
              <h2 className="text-base font-semibold">{t('Tenant', 'المستأجر')}</h2>
              <p className="mt-1 text-lg font-semibold"><bdi>{summary.tenantName}</bdi></p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-[#718398]">{t('Rent amount due', 'مبلغ الإيجار المستحق')}</dt>
                  <dd className="mt-1 font-mono text-base font-semibold" dir="ltr">{formatMoney(summary.rentAmount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#718398]">{t('Payment due date', 'تاريخ الاستحقاق')}</dt>
                  <dd className="mt-1 text-sm font-semibold"><bdi>{formatDate(summary.dueDate)}</bdi></dd>
                </div>
                <div>
                  <dt className="text-xs text-[#718398]">{t('Payment status', 'حالة الدفع')}</dt>
                  <dd className={`mt-1 inline-flex border px-2 py-1 text-xs font-semibold ${status.style}`}>{status.label}</dd>
                </div>
              </dl>
              {summary.paymentStatus !== 'paid' && (
                <>
                  {simulationComplete && (
                    <p role="status" className="mt-4 border-s-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {t('Simulation complete. No money was charged and the actual rent status was not changed.', 'اكتملت المحاكاة. لم يُخصم أي مبلغ ولم تتغير حالة الإيجار الفعلية.')}
                    </p>
                  )}
                  {checkoutError && (
                    <p role="alert" className="mt-4 border-s-2 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {checkoutError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={checkout.isPending}
                    aria-busy={checkout.isPending}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#3f7cff] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2f68e0] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isPublishedDemo
                      ? t('Simulate payment', 'محاكاة الدفع')
                      : checkout.isPending
                        ? t('Opening secure checkout…', 'جارٍ فتح صفحة الدفع الآمنة…')
                        : t('Pay Now', 'ادفع الآن')}
                  </button>
                  {!isPublishedDemo && checkoutUrl && (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#3f7cff] bg-white px-4 text-sm font-semibold text-[#315b91] transition-colors hover:bg-[#eef3ff]"
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
