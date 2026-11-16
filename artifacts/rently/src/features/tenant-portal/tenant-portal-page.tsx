import { useState } from 'react';
import { Home } from 'lucide-react';
import {
  useLookupRentlyTenantPortal,
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
  const lookup = useLookupRentlyTenantPortal();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState<RentlyTenantPortalLookup | null>(null);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(null);
    setError('');
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
                <button
                  type="button"
                  disabled
                  title={t('Online payments will be available later.', 'الدفع الإلكتروني سيتاح لاحقًا.')}
                  aria-label={t('Pay Now (not available yet)', 'ادفع الآن (غير متاح بعد)')}
                  className="mt-5 min-h-11 w-full bg-[#3f7cff] px-4 text-sm font-semibold text-white opacity-60"
                >
                  {t('Pay Now', 'ادفع الآن')}
                </button>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
