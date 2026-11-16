import { useId, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle, Plus } from 'lucide-react';
import { useCreateRentlyUnit, type RentlyUnit } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, inputCls, invalidatePortfolio, primaryBtn } from './shared';
import { setupErrorMessage, setupRequestId } from './setup-request';
import { cacheSavedUnit } from './setup-cache';
import { trackGuidedSetupEvent } from './setup-analytics';

export function AddUnitForm({ token, userId, propertyId, onCreated, trackGuidedSetup = false, onSavingChange }: {
  token: string; userId: string; propertyId: string; onCreated?: (unitId: string) => void; trackGuidedSetup?: boolean; onSavingChange?: (saving: boolean) => void;
}) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<UiMessage>('');
  const [success, setSuccess] = useState<UiMessage>('');
  const create = useCreateRentlyUnit({ request: authRequest(token) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setError(''); setSuccess('');
    if (!label.trim()) {
      if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'unit');
      setError(message('Enter a unit name or number first, e.g. Apartment 1.', 'اكتب اسمًا أو رقمًا للوحدة أولًا، مثل: شقة 1.'));
      inputRef.current?.focus();
      return;
    }
    busy.current = true; setSaving(true); onSavingChange?.(true);
    let created: RentlyUnit | null = null;
    try {
      try {
        const data = { unitLabel: label.trim() };
        created = await create.mutateAsync({ propertyId, data: { ...data, requestId: await setupRequestId(userId, 'unit:' + propertyId, data) } });
      } catch (err) {
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'unit');
        setError(message(
          setupErrorMessage(err, 'Could not confirm the unit was saved.', 'en'),
          setupErrorMessage(err, 'تعذّر تأكيد حفظ الوحدة. حاول مرة أخرى.'),
        ));
      }
      if (created) {
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_completed', 'unit');
        cacheSavedUnit(qc, userId, created);
        try { await invalidatePortfolio(qc, userId, propertyId); } catch { /* saved; refresh can retry later */ }
        setSuccess(message(`Unit "${created.unitLabel}" saved. Next: tenant and lease.`, `تم حفظ الوحدة «${created.unitLabel}». الخطوة التالية: إضافة المستأجر والعقد.`));
        setLabel('');
        onCreated?.(created.id);
      }
    } finally {
      busy.current = false; setSaving(false); onSavingChange?.(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label={t('Add unit', 'إضافة وحدة')}>
      <label htmlFor={inputId} className="text-[12px] font-semibold text-[#102238]">{t('Unit name or number', 'اسم أو رقم الوحدة')}</label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input ref={inputRef} id={inputId} dir="auto" data-testid="input-unit-label" placeholder={t('e.g. Apartment 1 or Whole house', 'مثال: شقة 1 أو المنزل بالكامل')} value={label} maxLength={80} aria-invalid={!!error} disabled={saving} onChange={(e) => { setLabel(e.target.value); setError(''); setSuccess(''); }} className={inputCls} />
        <button type="submit" data-testid="button-add-unit" disabled={saving} className={`${primaryBtn} min-h-10 rounded-lg text-[12px]`}>
          {saving ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />}
          {saving ? t('Saving…', 'جارٍ الحفظ…') : trackGuidedSetup ? t('Save and continue', 'حفظ ومتابعة') : t('Save unit', 'حفظ الوحدة')}
        </button>
      </div>
      <FormNotice error={error} success={success} />
      {success && !trackGuidedSetup && (
        <Link
          href={`/tenants/${encodeURIComponent(propertyId)}`}
          className="inline-flex min-h-9 w-fit items-center gap-2 rounded-lg bg-[#3f7cff] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2f68e0]"
        >
          {t('Next: add tenant and lease', 'التالي: إضافة المستأجر والعقد')}
          <ArrowLeft size={13} className="ltr:rotate-180" />
        </Link>
      )}
    </form>
  );
}
