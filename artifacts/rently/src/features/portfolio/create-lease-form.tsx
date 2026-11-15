import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useCreateRentlyLease, type RentlyLease } from '@workspace/api-client-react';
import type { Unit } from '@/lib/rently-data';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';
import { setupErrorMessage, setupRequestId } from './setup-request';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateLeaseForm({ token, userId, propertyId, units, initialUnitId, defaultUnitLabel, onCreated, onSavingChange }: {
  token: string; userId: string; propertyId: string; units: Unit[]; initialUnitId?: string; defaultUnitLabel?: string; onCreated?: (leaseId: string, lease: RentlyLease) => void; onSavingChange?: (saving: boolean) => void;
}) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const addressUnit = units.find((u) => defaultUnitLabel && u.unit_label.trim().toLocaleLowerCase() === defaultUnitLabel.trim().toLocaleLowerCase());
  const preferredUnitId = addressUnit?.id ?? units[0]?.id ?? '';
  const [unitId, setUnitId] = useState(initialUnitId ?? preferredUnitId);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rent, setRent] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [dueTouched, setDueTouched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<UiMessage>('');
  const [success, setSuccess] = useState<UiMessage>('');
  const create = useCreateRentlyLease({ request: authRequest(token) });

  const effectiveUnit = units.some((u) => u.id === unitId) ? unitId : preferredUnitId;
  const rentNum = Number(rent);
  const dayNum = Number(dueDay);
  const errs = {
    unit: !effectiveUnit ? t('Select a unit.', 'اختر وحدة.') : '',
    name: !fullName.trim() ? t('Tenant name required.', 'اسم المستأجر مطلوب.') : '',
    email: email.trim() && !EMAIL_RE.test(email.trim()) ? t('Invalid email.', 'بريد إلكتروني غير صالح.') : '',
    start: !DATE_RE.test(startDate) ? t('Start date required.', 'تاريخ البداية مطلوب.') : '',
    end: !DATE_RE.test(endDate) ? t('End date required.', 'تاريخ النهاية مطلوب.') : endDate <= startDate ? t('Must be after start.', 'يجب أن يكون بعد البداية.') : '',
    rent: !rent.trim() || !Number.isFinite(rentNum) || Math.round(rentNum * 100) < 1 ? t('Enter rent of at least 0.01.', 'أدخل إيجارًا لا يقل عن 0.01.') : rentNum > 100_000_000 ? t('Too large.', 'القيمة كبيرة جدًا.') : '',
    due: !Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31 ? t('Day 1 to 31.', 'يوم من 1 إلى 31.') : '',
  };
  const show = (k: keyof typeof errs) => (touched && errs[k] ? <span className="normal-case tracking-normal text-red-700">{errs[k]}</span> : null);

  function onStart(v: string) {
    setStartDate(v);
    if (!dueTouched && DATE_RE.test(v)) setDueDay(String(Number(v.slice(8, 10))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setTouched(true); setError(''); setSuccess('');
    if (Object.values(errs).some(Boolean)) return;
    busy.current = true; setSaving(true); onSavingChange?.(true);
    let lease: RentlyLease | null = null;
    try {
      const data = {
          unitId: effectiveUnit,
          tenantFullName: fullName.trim(),
          tenantEmail: email.trim() || null,
          tenantPhone: phone.trim() || null,
          startDate, endDate,
          monthlyRent: Math.round(rentNum * 100) / 100,
          dueDay: dayNum,
      };
      lease = await create.mutateAsync({ data: { ...data, requestId: await setupRequestId(userId, 'lease', data) } });
    } catch (err) {
      setError(message(
        setupErrorMessage(err, 'Could not confirm the lease was saved.', 'en'),
        setupErrorMessage(err, 'تعذّر تأكيد حفظ العقد. حاول مرة أخرى.'),
      ));
    }
    if (lease) {
      try { await invalidatePortfolio(qc, userId, propertyId); } catch { /* saved; refresh can retry later */ }
      setSuccess(message(`Lease saved for ${lease.tenant.fullName}. ${lease.payments.length} dues generated.`, `تم حفظ عقد ${lease.tenant.fullName}. أُنشئت ${lease.payments.length} مستحقات شهرية.`));
      setFullName(''); setEmail(''); setPhone(''); setStartDate(''); setEndDate(''); setRent(''); setDueDay('1'); setDueTouched(false); setTouched(false);
      onCreated?.(lease.id, lease);
    }
    busy.current = false; setSaving(false); onSavingChange?.(false);
  }

  if (units.length === 0) return <p className="text-[11px] leading-5 text-[#718398]">{t('Save a unit first using the guided setup.', 'احفظ وحدة أولًا من الإعداد الموجّه.')} <a href="#setup" className="text-[#315b91] underline">{t('Open guided setup', 'فتح الإعداد الموجّه')}</a></p>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label={t('New lease', 'عقد جديد')}>
      <fieldset disabled={saving} className="grid gap-2 sm:grid-cols-2">
        <label className={labelCls}>{t('Unit', 'الوحدة')} *<select dir="auto" data-testid="select-lease-unit" value={effectiveUnit} onChange={(e) => setUnitId(e.target.value)} className={inputCls}>{units.map((u) => <option key={u.id} value={u.id}>{u.unit_label}</option>)}</select>{show('unit')}</label>
        <label className={labelCls}>{t('Tenant name', 'اسم المستأجر')} *<input dir="auto" data-testid="input-tenant-name" value={fullName} maxLength={160} aria-invalid={touched && !!errs.name} onChange={(e) => setFullName(e.target.value)} className={inputCls} />{show('name')}</label>
        <label className={labelCls}>{t('Email', 'البريد الإلكتروني')}<input dir="ltr" data-testid="input-tenant-email" type="email" value={email} aria-invalid={touched && !!errs.email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />{show('email')}</label>
        <label className={labelCls}>{t('Phone', 'الهاتف')}<input dir="ltr" data-testid="input-tenant-phone" type="tel" value={phone} maxLength={80} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>{t('Start', 'البداية')} *<input dir="ltr" data-testid="input-lease-start" type="date" value={startDate} aria-invalid={touched && !!errs.start} onChange={(e) => onStart(e.target.value)} className={inputCls} />{show('start')}</label>
        <label className={labelCls}>{t('End', 'النهاية')} *<input dir="ltr" data-testid="input-lease-end" type="date" value={endDate} min={startDate || undefined} aria-invalid={touched && !!errs.end} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />{show('end')}</label>
        <label className={labelCls}>{t('Monthly rent', 'الإيجار الشهري')} *<input dir="ltr" data-testid="input-lease-rent" type="number" inputMode="decimal" min="0.01" step="0.01" value={rent} aria-invalid={touched && !!errs.rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />{show('rent')}</label>
        <label className={labelCls}>{t('Due day', 'يوم الاستحقاق')} *<input dir="ltr" data-testid="input-lease-due-day" type="number" min={1} max={31} step={1} value={dueDay} aria-invalid={touched && !!errs.due} onChange={(e) => { setDueDay(e.target.value); setDueTouched(true); }} className={inputCls} />{show('due')}<span className="normal-case tracking-normal text-[#8192a3]">{t('Days 29-31 clamp to month end.', 'الأيام 29-31 تُضبط على آخر الشهر.')}</span></label>
      </fieldset>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-lease" disabled={saving} className={primaryBtn}>{saving && <LoaderCircle size={12} className="animate-spin" />}{saving ? t('Saving…', 'جارٍ الحفظ…') : t('Save tenant and lease', 'حفظ المستأجر والعقد')}</button></div>
    </form>
  );
}
