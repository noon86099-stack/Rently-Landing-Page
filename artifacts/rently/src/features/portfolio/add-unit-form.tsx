import { useId, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus } from 'lucide-react';
import { useCreateRentlyUnit } from '@workspace/api-client-react';
import { FormNotice, authRequest, errorMessage, inputCls, invalidatePortfolio, primaryBtn } from './shared';

export function AddUnitForm({ token, userId, propertyId }: { token: string; userId: string; propertyId: string }) {
  const qc = useQueryClient();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const create = useCreateRentlyUnit({ request: authRequest(token) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!label.trim()) {
      setError('اكتب اسمًا أو رقمًا للوحدة أولًا، مثل: شقة 1.');
      inputRef.current?.focus();
      return;
    }
    try {
      const u = await create.mutateAsync({ propertyId, data: { unitLabel: label.trim() } });
      await invalidatePortfolio(qc, userId, propertyId);
      setSuccess(`تم حفظ الوحدة «${u.unitLabel}». يمكنك الآن إضافة المستأجر والعقد من قسم New lease.`);
      setLabel('');
    } catch (err) {
      setError(errorMessage(err, 'تعذّر حفظ الوحدة. حاول مرة أخرى.'));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label="إضافة وحدة">
      <label htmlFor={inputId} dir="rtl" className="text-[12px] font-semibold text-[#102238]">اسم أو رقم الوحدة</label>
      <div className="grid gap-2">
        <input ref={inputRef} id={inputId} dir="auto" data-testid="input-unit-label" placeholder="مثال: شقة 1 أو المنزل بالكامل" value={label} maxLength={80} aria-describedby={`${inputId}-help`} aria-invalid={!!error} disabled={create.isPending} onChange={(e) => { setLabel(e.target.value); setError(''); setSuccess(''); }} className={inputCls} />
        <button type="submit" data-testid="button-add-unit" disabled={create.isPending} className={`${primaryBtn} min-h-10 text-[12px]`}>{create.isPending ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}{create.isPending ? 'جارٍ الحفظ…' : 'حفظ الوحدة'}</button>
      </div>
      <p id={`${inputId}-help`} dir="rtl" className="text-[11px] leading-5 text-[#667b8e]">اكتب الاسم في الحقل، ثم اضغط «حفظ الوحدة».</p>
      <FormNotice error={error} success={success} />
    </form>
  );
}
