import { useId, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus } from 'lucide-react';
import { useCreateRentlyUnit } from '@workspace/api-client-react';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, errorMessage, inputCls, invalidatePortfolio, primaryBtn } from './shared';

export function AddUnitForm({ token, userId, propertyId }: { token: string; userId: string; propertyId: string }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<UiMessage>('');
  const [success, setSuccess] = useState<UiMessage>('');
  const create = useCreateRentlyUnit({ request: authRequest(token) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!label.trim()) {
      setError(message('Enter a unit name or number first, e.g. Apartment 1.', 'اكتب اسمًا أو رقمًا للوحدة أولًا، مثل: شقة 1.'));
      inputRef.current?.focus();
      return;
    }
    try {
      const u = await create.mutateAsync({ propertyId, data: { unitLabel: label.trim() } });
      await invalidatePortfolio(qc, userId, propertyId);
      setSuccess(message(`Unit "${u.unitLabel}" saved. You can now add the tenant and lease in New lease.`, `تم حفظ الوحدة «${u.unitLabel}». يمكنك الآن إضافة المستأجر والعقد من قسم عقد جديد.`));
      setLabel('');
    } catch (err) {
      setError(errorMessage(err, message('The unit could not be saved. Try again.', 'تعذّر حفظ الوحدة. حاول مرة أخرى.')));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label={t('Add unit', 'إضافة وحدة')}>
      <label htmlFor={inputId} className="text-[12px] font-semibold text-[#102238]">{t('Unit name or number', 'اسم أو رقم الوحدة')}</label>
      <div className="grid gap-2">
        <input ref={inputRef} id={inputId} dir="auto" data-testid="input-unit-label" placeholder={t('e.g. Apartment 1 or Whole house', 'مثال: شقة 1 أو المنزل بالكامل')} value={label} maxLength={80} aria-describedby={`${inputId}-help`} aria-invalid={!!error} disabled={create.isPending} onChange={(e) => { setLabel(e.target.value); setError(''); setSuccess(''); }} className={inputCls} />
        <button type="submit" data-testid="button-add-unit" disabled={create.isPending} className={`${primaryBtn} min-h-10 text-[12px]`}>{create.isPending ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}{create.isPending ? t('Saving…', 'جارٍ الحفظ…') : t('Save unit', 'حفظ الوحدة')}</button>
      </div>
      <p id={`${inputId}-help`} className="text-[11px] leading-5 text-[#667b8e]">{t('Type the name in the field, then press Save unit.', 'اكتب الاسم في الحقل، ثم اضغط «حفظ الوحدة».')}</p>
      <FormNotice error={error} success={success} />
    </form>
  );
}
