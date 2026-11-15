import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { useCreateRentlyProperty, type RentlyProperty } from '@workspace/api-client-react';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, ghostBtn, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';
import { setupErrorMessage, setupRequestId } from './setup-request';
import { cacheSavedProperty } from './setup-cache';
import { trackGuidedSetupEvent } from './setup-analytics';

const TYPES = ['Apartment', 'House', 'Duplex', 'Townhouse', 'Condo', 'Mixed-use'];
// Display labels only; the stored propertyType value stays the English key.
export const PROPERTY_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  Apartment: message('Apartment', 'شقة'),
  House: message('House', 'منزل'),
  Duplex: message('Duplex', 'دوبلكس'),
  Townhouse: message('Townhouse', 'تاون هاوس'),
  Condo: message('Condo', 'شقة تمليك'),
  'Mixed-use': message('Mixed-use', 'متعدد الاستخدام'),
};

export function CreatePropertyForm({ token, userId, onCreated, embedded = false, initiallyOpen = false, trackGuidedSetup = false, onSavingChange }: {
  token: string; userId: string; onCreated: (id: string) => void; embedded?: boolean; initiallyOpen?: boolean; trackGuidedSetup?: boolean; onSavingChange?: (saving: boolean) => void;
}) {
  const qc = useQueryClient();
  const { t, text } = useI18n();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(initiallyOpen || embedded);
  const [name, setName] = useState('');
  const [type, setType] = useState('Apartment');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<UiMessage>('');
  const [success, setSuccess] = useState<UiMessage>('');
  const create = useCreateRentlyProperty({ request: authRequest(token) });

  const nameErr = !name.trim() ? t('Name required.', 'الاسم مطلوب.') : '';
  const typeErr = !type.trim() ? t('Type required.', 'النوع مطلوب.') : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setTouched(true);
    setError('');
    setSuccess('');
    if (nameErr || typeErr) {
      if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'property');
      return;
    }
    busy.current = true; setSaving(true); onSavingChange?.(true);
    try {
      let created: RentlyProperty | null = null;
      try {
        const data = { name: name.trim(), propertyType: type.trim(), streetAddress: street.trim() || null, city: city.trim() || null, region: region.trim() || null };
        created = await create.mutateAsync({ data: { ...data, requestId: await setupRequestId(userId, 'property', data) } });
      } catch (err) {
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'property');
        setError(message(
          setupErrorMessage(err, 'Could not confirm the property was saved.', 'en'),
          setupErrorMessage(err, 'تعذّر تأكيد حفظ العقار. حاول مرة أخرى.'),
        ));
      }
      if (created) {
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_completed', 'property');
        cacheSavedProperty(qc, userId, created);
        try { await invalidatePortfolio(qc, userId, created.id); } catch { /* saved; refresh can retry later */ }
        setSuccess(message(`Property "${created.name}" saved.`, `تم حفظ العقار «${created.name}».`));
        setName(''); setStreet(''); setCity(''); setRegion(''); setTouched(false);
        if (!embedded) setOpen(false);
        onCreated(created.id);
      }
    } finally {
      busy.current = false; setSaving(false); onSavingChange?.(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" data-testid="button-open-create-property" onClick={() => { setOpen(true); setSuccess(''); }} className={`${ghostBtn} min-h-10 text-[10px]`}><Plus size={13} /> {t('Add property', 'إضافة عقار')}</button>
        <FormNotice error={error} success={success} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={`grid w-full basis-full gap-2 ${embedded ? '' : 'mt-2 border border-[#cdd9e3] bg-[#f7f9fb] p-3'}`} aria-label={t('New property', 'عقار جديد')}>
      {!embedded && <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#47617a]">{t('New property', 'عقار جديد')}</p><button type="button" disabled={saving} aria-label={t('Close', 'إغلاق')} onClick={() => setOpen(false)} className="text-[#61768b]"><X size={13} /></button></div>}
      <fieldset disabled={saving} className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
        <label className={labelCls}>{t('Name', 'الاسم')} *<input autoFocus dir="auto" data-testid="input-property-name" value={name} maxLength={160} aria-invalid={touched && !!nameErr} onChange={(e) => setName(e.target.value)} className={inputCls} />{touched && nameErr && <span className="normal-case text-red-700">{nameErr}</span>}</label>
        <label className={labelCls}>{t('Type', 'النوع')} *<select data-testid="select-property-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>{TYPES.map((value) => <option key={value} value={value}>{text(PROPERTY_TYPE_LABELS[value])}</option>)}</select></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_.8fr]">
        <label className={labelCls}>{t('Address (include apartment number)', 'العنوان (يتضمن رقم الشقة)')}<input dir="auto" data-testid="input-property-street" value={street} maxLength={240} placeholder={t('Street, building, apartment', 'الشارع، المبنى، رقم الشقة')} onChange={(e) => setStreet(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>{t('City', 'المدينة')}<input dir="auto" data-testid="input-property-city" value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>{t('Region', 'المنطقة')}<input dir="auto" data-testid="input-property-region" value={region} maxLength={120} onChange={(e) => setRegion(e.target.value)} className={inputCls} /></label>
      </div>
      </fieldset>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-property" disabled={saving} className={primaryBtn}>{saving && <LoaderCircle size={12} className="animate-spin" />}{saving ? t('Saving…', 'جارٍ الحفظ…') : t('Save property', 'حفظ العقار')}</button></div>
    </form>
  );
}
