import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, LoaderCircle } from 'lucide-react';
import { getDownloadRentlyLeasePdfQueryKey, useDownloadRentlyLeasePdf, useRecordRentlyPayment } from '@workspace/api-client-react';
import type { Lease, Payment } from '@/lib/rently-data';
import { LeaseDocumentControl } from '@/features/leases/lease-document-control';
import { PaymentCorrection } from './payment-correction';
import { message, useI18n, useLocalizedFormats, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, errorMessage, ghostBtn, invalidatePortfolio } from './shared';

type Ctx = { token: string; userId: string; propertyId: string; today: string };

function statusOf(p: Payment, today: string) {
  if (p.paid_at) return { key: 'paid', label: message('Paid', 'مدفوع'), cls: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]' };
  if (p.due_date < today) return { key: 'overdue', label: message('Overdue', 'متأخر'), cls: 'border-red-300 bg-red-50 text-red-800' };
  if (p.due_date === today) return { key: 'today', label: message('Due today', 'مستحق اليوم'), cls: 'border-[#3f7cff] bg-[#e6eeff] text-[#214a83]' };
  return { key: 'upcoming', label: message('Upcoming', 'قادم'), cls: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]' };
}

function PaymentRow({ payment, ctx }: { payment: Payment; ctx: Ctx }) {
  const qc = useQueryClient();
  const { t, text, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const [error, setError] = useState<UiMessage>('');
  const record = useRecordRentlyPayment({ request: authRequest(ctx.token) });
  const s = statusOf(payment, ctx.today);

  async function recordPayment() {
    setError('');
    try {
      await record.mutateAsync({ paymentId: payment.id, data: { paidAt: ctx.today } });
      await invalidatePortfolio(qc, ctx.userId, ctx.propertyId);
    } catch (err) {
      setError(errorMessage(err, message('Payment could not be recorded.', 'تعذّر تسجيل الدفعة.')));
    }
  }

  return (
    <li data-testid={`row-payment-${payment.id}`} className="grid gap-1.5 border-t border-[#e4e9ee] py-1.5 sm:grid-cols-[88px_76px_74px_minmax(0,1fr)] sm:items-center">
      <span dir={direction} className="text-start font-mono text-[9px] text-[#102238]">{formatDate(payment.due_date)}</span>
      <span dir="ltr" className="text-start font-mono text-[9px] tabular-nums text-[#47617a]">{formatMoney(payment.amount)}</span>
      <span data-testid={`status-payment-${payment.id}`} className={`w-fit border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] ${s.cls}`}>{text(s.label)}</span>
      {payment.paid_at ? (
        <PaymentCorrection payment={payment} ctx={ctx} />
      ) : (
        <div className="grid gap-1">
          <button
            type="button"
            data-testid={`button-record-payment-${payment.id}`}
            disabled={record.isPending}
            onClick={() => void recordPayment()}
            className={ghostBtn}
          >
            {record.isPending && <LoaderCircle size={10} className="animate-spin" />}
            {t('Mark paid today', 'تسجيل كمدفوع اليوم')}
          </button>
          <FormNotice error={error} />
        </div>
      )}
    </li>
  );
}

export function LeasePdfDownloadButton({ leaseId, token }: { leaseId: string; token: string }) {
  const { t, direction } = useI18n();
  const [error, setError] = useState<UiMessage>('');
  const pdf = useDownloadRentlyLeasePdf(leaseId, {
    query: { enabled: false, gcTime: 0, queryKey: getDownloadRentlyLeasePdfQueryKey(leaseId) },
    request: { ...authRequest(token), responseType: 'blob' },
  });

  async function download() {
    setError('');
    const res = await pdf.refetch();
    if (res.error || !(res.data instanceof Blob)) { setError(errorMessage(res.error, message('PDF could not be generated.', 'تعذّر إنشاء ملف PDF.'))); return; }
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rently-lease-${leaseId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="grid gap-1">
      <button type="button" data-testid={`button-download-pdf-${leaseId}`} disabled={pdf.isFetching} onClick={() => void download()} className={ghostBtn}>{pdf.isFetching ? <LoaderCircle size={10} className="animate-spin" /> : <Download size={10} />}{t('Download draft lease PDF', 'تنزيل مسودة العقد PDF (بالإنجليزية)')}</button>
      <FormNotice error={error} />
    </div>
  );
}

export function LeaseRecord({ lease, ctx }: { lease: Lease; ctx: Ctx }) {
  const [showAll, setShowAll] = useState(false);
  const payments = [...(lease.payments ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const open = payments.filter((p) => !p.paid_at);
  const overdue = open.filter((p) => p.due_date < ctx.today).length;
  const visible = showAll ? payments : payments.filter((p) => !p.paid_at).slice(0, 4);
  const hasTerms = lease.monthly_rent != null && lease.due_day != null;
  const tenant = lease.tenants;
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const statusLabel: Record<string, string> = { active: t('Active', 'نشط'), ended: t('Ended', 'منتهٍ'), upcoming: t('Upcoming', 'قادم') };
  const dt = 'font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]';

  return (
    <article data-testid={`card-lease-${lease.id}`} className="border border-[#e1e7ec] bg-white/60 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p data-testid={`text-tenant-${lease.id}`} dir="auto" className="truncate text-[11px] font-semibold">{tenant?.full_name ?? t('Tenant unavailable', 'المستأجر غير متاح')}</p>
          <p className="mt-0.5 font-mono text-[8px] text-[#778a9c]"><bdi dir={direction}>{formatDate(lease.start_date)} / {formatDate(lease.end_date)}</bdi> <span className="uppercase text-[#47617a]">[{statusLabel[lease.status] ?? lease.status}]</span></p>
        </div>
        {hasTerms && <LeasePdfDownloadButton leaseId={lease.id} token={ctx.token} />}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <div><dt className={dt}>{t('Email', 'البريد')}</dt><dd dir="ltr" className="break-all text-start text-[9px] font-semibold">{tenant?.email ?? '--'}</dd></div>
        <div><dt className={dt}>{t('Phone', 'الهاتف')}</dt><dd dir="ltr" className="text-start text-[9px] font-semibold">{tenant?.phone ?? '--'}</dd></div>
        <div><dt className={dt}>{t('Rent / mo', 'الإيجار / شهر')}</dt><dd className="font-mono text-[9px] font-semibold">{lease.monthly_rent != null ? <bdi dir="ltr">{formatMoney(lease.monthly_rent)}</bdi> : <span className="text-[#b0651f]">{t('Terms missing', 'الشروط ناقصة')}</span>}</dd></div>
        <div><dt className={dt}>{t('Due day', 'يوم الاستحقاق')}</dt><dd className="font-mono text-[9px] font-semibold">{lease.due_day ?? <span className="text-[#b0651f]">{t('Terms missing', 'الشروط ناقصة')}</span>}</dd></div>
      </dl>
      <div className="mt-2.5">
        <div className="flex items-center justify-between gap-2 pb-1">
          <p className="font-mono text-[7px] uppercase tracking-[.1em] text-[#64798d]">{t('Dues', 'المستحقات')} <bdi dir="ltr">{payments.length - open.length}/{payments.length}</bdi> {t('paid', 'مدفوعة')}{overdue > 0 && <span className="ms-1.5 text-red-700">{overdue} {t('overdue', 'متأخرة')}</span>}</p>
          {payments.length > 0 && <button type="button" data-testid={`button-toggle-dues-${lease.id}`} onClick={() => setShowAll((v) => !v)} className="font-mono text-[7px] uppercase tracking-[.06em] text-[#315b91] underline underline-offset-2">{showAll ? t('Open only', 'غير المدفوعة فقط') : t('All dues', 'كل المستحقات')}</button>}
        </div>
        {payments.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#718398]">{hasTerms ? t('No dues generated.', 'لم تُولَّد مستحقات.') : t('Lease terms missing. No dues.', 'شروط العقد ناقصة. لا توجد مستحقات.')}</p>
        ) : visible.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#3d6324]">{t('All dues paid.', 'كل المستحقات مدفوعة.')}</p>
        ) : (
          <ul>{visible.map((p) => <PaymentRow key={p.id} payment={p} ctx={ctx} />)}</ul>
        )}
      </div>
      <details className="mt-2.5 border-t border-[#e4e9ee] pt-2 text-[10px]">
        <summary className="cursor-pointer font-semibold text-[#315b91]">{t('Signed lease file', 'ملف العقد الموقّع')}</summary>
        <div className="mt-2"><LeaseDocumentControl key={lease.id} leaseId={lease.id} /></div>
      </details>
    </article>
  );
}
