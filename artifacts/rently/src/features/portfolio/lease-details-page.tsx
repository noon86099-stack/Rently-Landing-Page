import { Check, Home } from 'lucide-react';
import type { RentlyLease } from '@workspace/api-client-react';
import { LeaseDocumentControl } from '@/features/leases/lease-document-control';
import { useI18n, useLocalizedFormats } from '@/lib/i18n';

export type CreatedLeaseDetails = {
  lease: RentlyLease;
  propertyId: string;
  propertyName: string;
  unitLabel: string;
};

export function LeaseDetailsPage({
  lease,
  propertyName,
  unitLabel,
  onGoToDashboard,
}: CreatedLeaseDetails & { onGoToDashboard: () => void }) {
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const nextPayment = [...lease.payments]
    .filter((payment) => !payment.paidAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <section
      data-testid="page-lease-details"
      dir={direction}
      className="mx-auto my-5 w-full max-w-3xl border border-[#cbd6df] bg-[#f8fafb]"
    >
      <div role="status" data-testid="lease-created-confirmation" className="flex items-center gap-2 border-b border-[#cfe0bb] bg-[#f3f9ec] px-4 py-3 text-[#3d6324]">
        <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#b5f06b] text-[#102238]"><Check size={15} /></span>
        <p className="text-[13px] font-semibold">{t('Lease created successfully', 'تم إنشاء عقد الإيجار بنجاح')}</p>
      </div>

      <div className="border-b border-[#d8e1e8] px-4 py-4 md:px-6">
        <p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#64798d]">{t('Lease details', 'تفاصيل العقد')}</p>
        <h1 className="mt-1 text-[20px] font-semibold tracking-[-.04em]">{lease.tenant.fullName}</h1>
        <p className="mt-1 text-[11px] text-[#718398]"><bdi>{propertyName}</bdi> / <bdi>{unitLabel}</bdi></p>
      </div>

      <dl className="grid gap-px bg-[#dce3e9] sm:grid-cols-2">
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Tenant', 'المستأجر')}</dt>
          <dd className="mt-1 text-[12px] font-semibold">{lease.tenant.fullName}</dd>
        </div>
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Email', 'البريد الإلكتروني')}</dt>
          <dd dir="ltr" className="mt-1 break-all text-start text-[11px] font-semibold">{lease.tenant.email || '—'}</dd>
        </div>
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Phone', 'الهاتف')}</dt>
          <dd dir="ltr" className="mt-1 text-start text-[11px] font-semibold">{lease.tenant.phone || '—'}</dd>
        </div>
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Monthly rent', 'الإيجار الشهري')}</dt>
          <dd dir="ltr" className="mt-1 text-start font-mono text-[12px] font-semibold">{formatMoney(lease.monthlyRent)}</dd>
        </div>
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Start date', 'تاريخ البداية')}</dt>
          <dd dir="ltr" className="mt-1 text-start text-[11px] font-semibold">{formatDate(lease.startDate)}</dd>
        </div>
        <div className="bg-white p-4">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('End date', 'تاريخ النهاية')}</dt>
          <dd dir="ltr" className="mt-1 text-start text-[11px] font-semibold">{formatDate(lease.endDate)}</dd>
        </div>
        <div className="bg-white p-4 sm:col-span-2">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Payment due date', 'تاريخ استحقاق الدفعة')}</dt>
          <dd dir="ltr" className="mt-1 text-start text-[11px] font-semibold">
            {nextPayment
              ? formatDate(nextPayment.dueDate)
              : t(`Day ${lease.dueDay} of each month`, `يوم ${lease.dueDay} من كل شهر`)}
          </dd>
          <p className="mt-1 text-[10px] text-[#718398]">{t(`Monthly due day: ${lease.dueDay}`, `يوم الاستحقاق الشهري: ${lease.dueDay}`)}</p>
        </div>
      </dl>

      <div className="border-t border-[#d8e1e8] bg-white px-4 py-4 md:px-6">
        <h2 className="mb-2 text-[11px] font-semibold">{t('Signed lease file', 'ملف العقد الموقّع')}</h2>
        <LeaseDocumentControl leaseId={lease.id} />
      </div>

      <div className="border-t border-[#d8e1e8] p-4 md:px-6">
        <button
          type="button"
          data-testid="button-lease-details-dashboard"
          onClick={onGoToDashboard}
          className="inline-flex min-h-10 items-center gap-2 bg-[#102238] px-4 py-2 text-[11px] font-semibold text-white"
        >
          <Home size={13} />
          {t('Back to dashboard', 'العودة إلى لوحة التحكم')}
        </button>
      </div>
    </section>
  );
}
