import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, LoaderCircle } from 'lucide-react';
import { getDownloadRentlyLeasePdfQueryKey, useDownloadRentlyLeasePdf, useRecordRentlyPayment } from '@workspace/api-client-react';
import type { Lease, Payment } from '@/lib/rently-data';
import { LeaseDocumentControl } from '@/features/leases/lease-document-control';
import { PaymentCorrection } from './payment-correction';
import { FormNotice, authRequest, errorMessage, formatDate, formatMoney, ghostBtn, inputCls, invalidatePortfolio } from './shared';

type Ctx = { token: string; userId: string; propertyId: string; today: string };

function statusOf(p: Payment, today: string) {
  if (p.paid_at) return { key: 'paid', label: 'Paid', cls: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]' };
  if (p.due_date < today) return { key: 'overdue', label: 'Overdue', cls: 'border-red-300 bg-red-50 text-red-800' };
  if (p.due_date === today) return { key: 'today', label: 'Due today', cls: 'border-[#3f7cff] bg-[#e6eeff] text-[#214a83]' };
  return { key: 'upcoming', label: 'Upcoming', cls: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]' };
}

function PaymentRow({ payment, ctx }: { payment: Payment; ctx: Ctx }) {
  const qc = useQueryClient();
  const [paidAt, setPaidAt] = useState(ctx.today);
  const [error, setError] = useState('');
  const record = useRecordRentlyPayment({ request: authRequest(ctx.token) });
  const s = statusOf(payment, ctx.today);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) { setError('Pick a date.'); return; }
    if (paidAt > ctx.today) { setError('Paid date cannot be in the future.'); return; }
    try {
      await record.mutateAsync({ paymentId: payment.id, data: { paidAt } });
      await invalidatePortfolio(qc, ctx.userId, ctx.propertyId);
    } catch (err) {
      setError(errorMessage(err, 'Payment could not be recorded.'));
    }
  }

  return (
    <li data-testid={`row-payment-${payment.id}`} className="grid gap-1.5 border-t border-[#e4e9ee] py-1.5 sm:grid-cols-[88px_76px_74px_minmax(0,1fr)] sm:items-center">
      <span className="font-mono text-[9px] text-[#102238]">{formatDate(payment.due_date)}</span>
      <span className="font-mono text-[9px] tabular-nums text-[#47617a]">{formatMoney(payment.amount)}</span>
      <span data-testid={`status-payment-${payment.id}`} className={`w-fit border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] ${s.cls}`}>{s.label}</span>
      {payment.paid_at ? (
        <PaymentCorrection payment={payment} ctx={ctx} />
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-1">
          <div className="flex gap-1">
            <input data-testid={`input-paid-at-${payment.id}`} aria-label="Paid date" type="date" max={ctx.today} value={paidAt} aria-invalid={!!error} onChange={(e) => setPaidAt(e.target.value)} className={`${inputCls} min-h-7 text-[11px]`} />
            <button data-testid={`button-record-payment-${payment.id}`} disabled={record.isPending} className={ghostBtn}>{record.isPending && <LoaderCircle size={10} className="animate-spin" />}Record</button>
          </div>
          <FormNotice error={error} />
        </form>
      )}
    </li>
  );
}

function PdfButton({ leaseId, token }: { leaseId: string; token: string }) {
  const [error, setError] = useState('');
  const pdf = useDownloadRentlyLeasePdf(leaseId, {
    query: { enabled: false, gcTime: 0, queryKey: getDownloadRentlyLeasePdfQueryKey(leaseId) },
    request: { ...authRequest(token), responseType: 'blob' },
  });

  async function download() {
    setError('');
    const res = await pdf.refetch();
    if (res.error || !(res.data instanceof Blob)) { setError(errorMessage(res.error, 'PDF could not be generated.')); return; }
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
      <button type="button" data-testid={`button-download-pdf-${leaseId}`} disabled={pdf.isFetching} onClick={() => void download()} className={ghostBtn}>{pdf.isFetching ? <LoaderCircle size={10} className="animate-spin" /> : <Download size={10} />}Lease PDF</button>
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
  const t = lease.tenants;

  return (
    <article data-testid={`card-lease-${lease.id}`} className="border border-[#e1e7ec] bg-white/60 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p data-testid={`text-tenant-${lease.id}`} className="truncate text-[11px] font-semibold">{t?.full_name ?? 'Tenant unavailable'}</p>
          <p className="mt-0.5 font-mono text-[8px] text-[#778a9c]">{formatDate(lease.start_date)} / {formatDate(lease.end_date)} <span className="uppercase text-[#47617a]">[{lease.status}]</span></p>
        </div>
        {hasTerms && <PdfButton leaseId={lease.id} token={ctx.token} />}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Email</dt><dd className="break-all text-[9px] font-semibold">{t?.email ?? '--'}</dd></div>
        <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Phone</dt><dd className="text-[9px] font-semibold">{t?.phone ?? '--'}</dd></div>
        <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Rent / mo</dt><dd className="font-mono text-[9px] font-semibold">{lease.monthly_rent != null ? formatMoney(lease.monthly_rent) : <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
        <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Due day</dt><dd className="font-mono text-[9px] font-semibold">{lease.due_day ?? <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
      </dl>
      <div className="mt-2.5">
        <div className="flex items-center justify-between gap-2 pb-1">
          <p className="font-mono text-[7px] uppercase tracking-[.1em] text-[#64798d]">Dues {payments.length - open.length}/{payments.length} paid{overdue > 0 && <span className="ml-1.5 text-red-700">{overdue} overdue</span>}</p>
          {payments.length > 0 && <button type="button" data-testid={`button-toggle-dues-${lease.id}`} onClick={() => setShowAll((v) => !v)} className="font-mono text-[7px] uppercase tracking-[.06em] text-[#315b91] underline underline-offset-2">{showAll ? 'Open only' : 'All dues'}</button>}
        </div>
        {payments.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#718398]">{hasTerms ? 'No dues generated.' : 'Lease terms missing. No dues.'}</p>
        ) : visible.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#3d6324]">All dues paid.</p>
        ) : (
          <ul>{visible.map((p) => <PaymentRow key={p.id} payment={p} ctx={ctx} />)}</ul>
        )}
      </div>
      <details className="mt-2.5 border-t border-[#e4e9ee] pt-2 text-[10px]">
        <summary className="cursor-pointer font-semibold text-[#315b91]">Signed lease file</summary>
        <div className="mt-2"><LeaseDocumentControl key={lease.id} leaseId={lease.id} /></div>
      </details>
    </article>
  );
}
