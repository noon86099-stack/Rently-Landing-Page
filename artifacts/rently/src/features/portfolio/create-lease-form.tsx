import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useCreateRentlyLease, useCreateRentlyUnit } from '@workspace/api-client-react';
import type { Unit } from '@/lib/rently-data';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, errorMessage, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateLeaseForm({ token, userId, propertyId, units, defaultUnitLabel }: { token: string; userId: string; propertyId: string; units: Unit[]; defaultUnitLabel: string }) {
  const qc = useQueryClient();
  const { t } = useI18n();
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
  const createUnit = useCreateRentlyUnit({ request: authRequest(token) });

  const addressUnit = units.find((u) =>
    u.unit_label.trim().toLocaleLowerCase() === defaultUnitLabel.trim().toLocaleLowerCase(),
  );
  const effectiveUnit = units.length === 1 ? units[0].id : addressUnit?.id ?? '';
  const rentNum = Number(rent);
  const dayNum = Number(dueDay);
  const errs = {
    address: units.length > 1 && !effectiveUnit
      ? t('This property has multiple saved addresses. Create a separate property for each apartment.', 'لهذا العقار عدة عناوين محفوظة. أنشئ عقارًا مستقلًا لكل شقة.')
      : '',
    name: !fullName.trim() ? t('Tenant name required.', 'اسم المستأجر مطلوب.') : '',
    email: email.trim() && !EMAIL_RE.test(email.trim()) ? t('Invalid email.', 'بريد إلكتروني غير صالح.') : '',
    start: !DATE_RE.test(startDate) ? t('Start date required.', 'تاريخ البداية مطلوب.') : '',
    end: !DATE_RE.test(endDate) ? t('End date required.', 'تاريخ النهاية مطلوب.') : endDate <= startDate ? t('Must be after start.', 'يجب أن يكون بعد البداية.') : '',
    rent: !rent.trim() || !Number.isFinite(rentNum) || rentNum <= 0 ? t('Enter rent > 0.', 'أدخل إيجارًا أكبر من صفر.') : rentNum > 100_000_000 ? t('Too large.', 'القيمة كبيرة جدًا.') : '',
    due: !Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31 ? t('Day 1 to 31.', 'يوم من 1 إلى 31.') : '',
  };
  const show = (k: keyof typeof errs) => (touched && errs[k] ? <span className="normal-case tracking-normal text-red-700">{errs[k]}</span> : null);

  function onStart(v: string) {
    setStartDate(v);
    if (!dueTouched && DATE_RE.test(v)) setDueDay(String(Number(v.slice(8, 10))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true); setError(''); setSuccess('');
    if (Object.values(errs).some(Boolean)) return;
    let leaseUnitId = effectiveUnit;
    let createdLocation = false;
    try {
      if (!leaseUnitId) {
        const location = await createUnit.mutateAsync({
          propertyId,
          data: { unitLabel: defaultUnitLabel.trim() || propertyId },
        });
        leaseUnitId = location.id;
        createdLocation = true;
      }
      const lease = await create.mutateAsync({
        data: {
          unitId: leaseUnitId,
          tenantFullName: fullName.trim(),
          tenantEmail: email.trim() || null,
          tenantPhone: phone.trim() || null,
          startDate, endDate,
          monthlyRent: Math.round(rentNum * 100) / 100,
          dueDay: dayNum,
        },
      });
      await invalidatePortfolio(qc, userId, propertyId);
      setSuccess(message(`Lease created for ${lease.tenant.fullName}. ${lease.payments.length} dues generated.`, `تم إنشاء عقد ${lease.tenant.fullName}. تم توليد ${lease.payments.length} مستحقات.`));
      setFullName(''); setEmail(''); setPhone(''); setStartDate(''); setEndDate(''); setRent(''); setDueDay('1'); setDueTouched(false); setTouched(false);
    } catch (err) {
      if (createdLocation) await invalidatePortfolio(qc, userId, propertyId);
      setError(errorMessage(err, message('Lease could not be created.', 'تعذّر إنشاء العقد.')));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label={t('New lease', 'عقد جديد')}>
      {touched && errs.address && <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-2 py-1 text-[10px] text-red-800">{errs.address}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={labelCls}>{t('Tenant name', 'اسم المستأجر')} *<input dir="auto" data-testid="input-tenant-name" value={fullName} maxLength={160} aria-invalid={touched && !!errs.name} onChange={(e) => setFullName(e.target.value)} className={inputCls} />{show('name')}</label>
        <label className={labelCls}>{t('Email', 'البريد الإلكتروني')}<input dir="ltr" data-testid="input-tenant-email" type="email" value={email} aria-invalid={touched && !!errs.email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />{show('email')}</label>
        <label className={labelCls}>{t('Phone', 'الهاتف')}<input dir="ltr" data-testid="input-tenant-phone" type="tel" value={phone} maxLength={80} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>{t('Start', 'البداية')} *<input dir="ltr" data-testid="input-lease-start" type="date" value={startDate} aria-invalid={touched && !!errs.start} onChange={(e) => onStart(e.target.value)} className={inputCls} />{show('start')}</label>
        <label className={labelCls}>{t('End', 'النهاية')} *<input dir="ltr" data-testid="input-lease-end" type="date" value={endDate} min={startDate || undefined} aria-invalid={touched && !!errs.end} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />{show('end')}</label>
        <label className={labelCls}>{t('Monthly rent', 'الإيجار الشهري')} *<input dir="ltr" data-testid="input-lease-rent" type="number" inputMode="decimal" min="0.01" step="0.01" value={rent} aria-invalid={touched && !!errs.rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />{show('rent')}</label>
        <label className={labelCls}>{t('Due day', 'يوم الاستحقاق')} *<input dir="ltr" data-testid="input-lease-due-day" type="number" min={1} max={31} step={1} value={dueDay} aria-invalid={touched && !!errs.due} onChange={(e) => { setDueDay(e.target.value); setDueTouched(true); }} className={inputCls} />{show('due')}<span className="normal-case tracking-normal text-[#8192a3]">{t('Days 29-31 clamp to month end.', 'الأيام 29-31 تُضبط على آخر الشهر.')}</span></label>
      </div>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-lease" disabled={create.isPending || createUnit.isPending} className={primaryBtn}>{(create.isPending || createUnit.isPending) && <LoaderCircle size={12} className="animate-spin" />}{createUnit.isPending ? t('Saving address…', 'جارٍ حفظ العنوان…') : t('Create lease', 'إنشاء العقد')}</button></div>
    </form>
  );
}
