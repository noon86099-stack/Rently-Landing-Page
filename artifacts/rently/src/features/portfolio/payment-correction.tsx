import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCorrectRentlyPayment, useListRentlyPaymentCorrections } from '@workspace/api-client-react';
import type { Payment } from '@/lib/rently-data';
import { FormNotice, authRequest, errorMessage, formatDate, ghostBtn, inputCls, invalidatePortfolio, labelCls } from './shared';

type Props = {
  payment: Payment;
  ctx: { token: string; userId: string; propertyId: string; today: string };
};

export function PaymentCorrection({ payment, ctx }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(payment.paid_at ?? '');
  const [expectedPaidAt, setExpectedPaidAt] = useState(payment.paid_at ?? '');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const history = useListRentlyPaymentCorrections(payment.id, {
    request: authRequest(ctx.token),
    query: { enabled: open, queryKey: ['rently-payment-corrections', ctx.userId, payment.id], staleTime: 0 },
  });
  const correction = useCorrectRentlyPayment({ request: authRequest(ctx.token) });

  function start() {
    setPaidAt(payment.paid_at ?? '');
    setExpectedPaidAt(payment.paid_at ?? '');
    setReason('');
    setConfirmed(false);
    setError('');
    setSuccess('');
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!confirmed || !reason.trim()) { setError('Confirm the correction and enter a reason.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || paidAt > ctx.today || paidAt === expectedPaidAt) {
      setError('Choose a different, valid paid date that is not in the future.'); return;
    }
    try {
      await correction.mutateAsync({
        paymentId: payment.id, data: { paidAt, expectedPaidAt, reason: reason.trim(), confirmed: true },
      });
      setOpen(false);
      setSuccess('Payment date corrected. Change history saved.');
      await Promise.all([
        invalidatePortfolio(qc, ctx.userId, ctx.propertyId),
        qc.invalidateQueries({ queryKey: ['rently-payment-corrections', ctx.userId, payment.id] }),
      ]);
    } catch (err) {
      setError(errorMessage(err, 'Correction failed. Reload the portfolio if this payment has changed.'));
    }
  }

  return <div className="grid gap-1">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[8px] text-[#3d6324]">Paid {payment.paid_at && formatDate(payment.paid_at)}</span>
      {!open && <button type="button" className={ghostBtn} onClick={start}>Correct date / history</button>}
    </div>
    <FormNotice success={success} />
    {open && <div className="grid gap-2 border border-[#cbd7e1] bg-[#f8fafb] p-2">
      <form onSubmit={submit} className="grid gap-2">
        <p className="text-[10px]">Correct paid date: {formatDate(expectedPaidAt)} → {paidAt ? formatDate(paidAt) : 'Select date'}. The due date and amount will not change.</p>
        <label className={labelCls}>New paid date
          <input type="date" required max={ctx.today} value={paidAt} disabled={correction.isPending} onChange={(e) => { setPaidAt(e.target.value); setConfirmed(false); }} className={inputCls} />
        </label>
        <label className={labelCls}>Reason for correction
          <textarea required maxLength={1000} value={reason} disabled={correction.isPending} onChange={(e) => { setReason(e.target.value); setConfirmed(false); }} className={inputCls} />
        </label>
        <label className="flex items-start gap-2 text-[10px]">
          <input type="checkbox" checked={confirmed} disabled={correction.isPending} onChange={(e) => setConfirmed(e.target.checked)} />
          I confirm this date correction. My identity, reason, previous date and new date will be saved permanently.
        </label>
        <div className="flex gap-2">
          <button disabled={correction.isPending || !confirmed} className={ghostBtn}>{correction.isPending ? 'Saving…' : 'Confirm correction'}</button>
          <button type="button" disabled={correction.isPending} className={ghostBtn} onClick={() => setOpen(false)}>Cancel</button>
        </div>
        <FormNotice error={error} />
      </form>
      <section aria-label="Payment correction history" className="grid gap-1 border-t pt-2 text-[10px]">
        <h4 className="font-semibold">Correction history</h4>
        {history.isLoading && <p>Loading history…</p>}
        {history.isError && <FormNotice error="History could not be loaded." />}
        {history.data?.length === 0 && <p>No corrections recorded.</p>}
        {history.data?.map((item) => <div key={item.id} className="grid gap-0.5 border-t pt-1">
          <p>{formatDate(item.previousPaidAt)} → {formatDate(item.newPaidAt)}</p>
          <p className="whitespace-pre-wrap break-words">{item.reason}</p>
          <p className="break-all">By {item.actorId} · {new Date(item.correctedAt).toLocaleString()}</p>
        </div>)}
      </section>
    </div>}
  </div>;
}
