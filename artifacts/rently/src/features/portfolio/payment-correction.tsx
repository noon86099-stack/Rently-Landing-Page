import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCorrectRentlyPayment, useListRentlyPaymentCorrections } from '@workspace/api-client-react';
import type { Payment } from '@/lib/rently-data';
import { message, useI18n, useLocalizedFormats, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, errorMessage, ghostBtn, inputCls, invalidatePortfolio, labelCls } from './shared';

type Props = {
  payment: Payment;
  ctx: { token: string; userId: string; propertyId: string; today: string };
};

export function PaymentCorrection({ payment, ctx }: Props) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { formatDate, formatDateTime } = useLocalizedFormats();
  const [open, setOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(payment.paid_at ?? '');
  const [expectedPaidAt, setExpectedPaidAt] = useState(payment.paid_at ?? '');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<UiMessage>('');
  const [success, setSuccess] = useState<UiMessage>('');
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
    if (!confirmed || !reason.trim()) { setError(message('Confirm the correction and enter a reason.', 'أكّد التصحيح واكتب السبب.')); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || paidAt > ctx.today || paidAt === expectedPaidAt) {
      setError(message('Choose a different, valid paid date that is not in the future.', 'اختر تاريخ دفع مختلفًا وصالحًا وليس في المستقبل.')); return;
    }
    try {
      await correction.mutateAsync({
        paymentId: payment.id, data: { paidAt, expectedPaidAt, reason: reason.trim(), confirmed: true },
      });
      setOpen(false);
      setSuccess(message('Payment date corrected. Change history saved.', 'تم تصحيح تاريخ الدفع وحُفظ سجل التغيير.'));
      await Promise.all([
        invalidatePortfolio(qc, ctx.userId, ctx.propertyId),
        qc.invalidateQueries({ queryKey: ['rently-payment-corrections', ctx.userId, payment.id] }),
      ]);
    } catch (err) {
      setError(errorMessage(err, message('Correction failed. Reload the portfolio if this payment has changed.', 'فشل التصحيح. أعد تحميل المحفظة إذا تغيّرت هذه الدفعة.')));
    }
  }

  return <div className="grid gap-1">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[8px] text-[#3d6324]">{t('Paid', 'مدفوع')} <bdi dir="ltr">{payment.paid_at && formatDate(payment.paid_at)}</bdi></span>
      {!open && <button type="button" className={ghostBtn} onClick={start}>{t('Correct date / history', 'تصحيح التاريخ / السجل')}</button>}
    </div>
    <FormNotice success={success} />
    {open && <div className="grid gap-2 border border-[#cbd7e1] bg-[#f8fafb] p-2">
      <form onSubmit={submit} className="grid gap-2">
        <p className="text-[10px]">{t('Correct paid date:', 'تصحيح تاريخ الدفع:')} <bdi dir="ltr">{formatDate(expectedPaidAt)} → {paidAt ? formatDate(paidAt) : t('Select date', 'اختر التاريخ')}</bdi>. {t('The due date and amount will not change.', 'لن يتغيّر تاريخ الاستحقاق ولا المبلغ.')}</p>
        <label className={labelCls}>{t('New paid date', 'تاريخ الدفع الجديد')}
          <input type="date" dir="ltr" required max={ctx.today} value={paidAt} disabled={correction.isPending} onChange={(e) => { setPaidAt(e.target.value); setConfirmed(false); }} className={inputCls} />
        </label>
        <label className={labelCls}>{t('Reason for correction', 'سبب التصحيح')}
          <textarea dir="auto" required maxLength={1000} value={reason} disabled={correction.isPending} onChange={(e) => { setReason(e.target.value); setConfirmed(false); }} className={inputCls} />
        </label>
        <label className="flex items-start gap-2 text-[10px]">
          <input type="checkbox" checked={confirmed} disabled={correction.isPending} onChange={(e) => setConfirmed(e.target.checked)} />
          {t('I confirm this date correction. My identity, reason, previous date and new date will be saved permanently.', 'أؤكد تصحيح هذا التاريخ. ستُحفظ هويتي والسبب والتاريخ السابق والجديد بشكل دائم.')}
        </label>
        <div className="flex gap-2">
          <button disabled={correction.isPending || !confirmed} className={ghostBtn}>{correction.isPending ? t('Saving…', 'جارٍ الحفظ…') : t('Confirm correction', 'تأكيد التصحيح')}</button>
          <button type="button" disabled={correction.isPending} className={ghostBtn} onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء')}</button>
        </div>
        <FormNotice error={error} />
      </form>
      <section aria-label={t('Payment correction history', 'سجل تصحيح الدفعة')} className="grid gap-1 border-t pt-2 text-[10px]">
        <h4 className="font-semibold">{t('Correction history', 'سجل التصحيحات')}</h4>
        {history.isLoading && <p>{t('Loading history…', 'جارٍ تحميل السجل…')}</p>}
        {history.isError && <FormNotice error={message('History could not be loaded.', 'تعذّر تحميل السجل.')} />}
        {history.data?.length === 0 && <p>{t('No corrections recorded.', 'لا توجد تصحيحات مسجّلة.')}</p>}
        {history.data?.map((item) => <div key={item.id} className="grid gap-0.5 border-t pt-1">
          <p dir="ltr" className="text-start">{formatDate(item.previousPaidAt)} → {formatDate(item.newPaidAt)}</p>
          <p dir="auto" className="whitespace-pre-wrap break-words">{item.reason}</p>
          <p className="break-all">{t('By', 'بواسطة')} <bdi dir="ltr">{item.actorId}</bdi> · <bdi>{formatDateTime(item.correctedAt)}</bdi></p>
        </div>)}
      </section>
    </div>}
  </div>;
}
