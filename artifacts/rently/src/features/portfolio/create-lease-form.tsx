import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LoaderCircle } from 'lucide-react';
import { useCreateRentlyLease, type RentlyLease } from '@workspace/api-client-react';
import type { Unit } from '@/lib/rently-data';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { FormNotice, authRequest, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';
import { setupErrorMessage, setupRequestId } from './setup-request';
import { trackGuidedSetupEvent } from './setup-analytics';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DateParts = { day: string; month: string; year: string };
type DatePart = keyof DateParts;

function datePartsFromIso(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { year: match[1], month: match[2], day: match[3] } : { day: '', month: '', year: '' };
}

function normalizeDateDigits(value: string) {
  return value
    .replace(/[٠-٩۰-۹]/g, (digit) => {
      const code = digit.charCodeAt(0);
      return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
    })
    .replace(/\D/g, '');
}

function isoFromDateParts(parts: DateParts) {
  if (!/^\d{1,2}$/.test(parts.day) || !/^\d{1,2}$/.test(parts.month) || !/^\d{4}$/.test(parts.year)) return '';
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const iso = `${parts.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? '' : iso;
}

function DatePartsInput({ testId, value, min, invalid, label, onChange }: {
  testId: string;
  value: string;
  min?: string;
  invalid: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  const { t, direction } = useI18n();
  const [parts, setParts] = useState(() => datePartsFromIso(value));
  const pickerRef = useRef<HTMLInputElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      setParts(datePartsFromIso(value));
    }
  }, [value]);

  function updatePart(part: DatePart, input: string) {
    const maxLength = part === 'year' ? 4 : 2;
    const next = { ...parts, [part]: normalizeDateDigits(input).slice(0, maxLength) };
    const iso = isoFromDateParts(next);
    if (iso) {
      const normalized = datePartsFromIso(iso);
      setParts(normalized);
      lastValue.current = iso;
      onChange(iso);
    } else {
      setParts(next);
      lastValue.current = '';
      onChange('');
    }
  }

  function selectFromCalendar(nextValue: string) {
    lastValue.current = nextValue;
    setParts(datePartsFromIso(nextValue));
    onChange(nextValue);
  }

  return (
    <div role="group" aria-label={label} aria-invalid={invalid} dir={direction} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_36px] items-end gap-1.5">
      {([
        ['day', t('Day', 'اليوم'), 2],
        ['month', t('Month', 'الشهر'), 2],
        ['year', t('Year', 'السنة'), 4],
      ] as const).map(([part, partLabel, maxLength]) => (
        <label key={part} className="grid min-w-0 gap-1 text-[9px] normal-case tracking-normal text-[#667b8e]">
          <span>{partLabel}</span>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            aria-label={partLabel}
            aria-invalid={invalid}
            data-testid={`${testId}-${part}`}
            maxLength={maxLength}
            placeholder={part === 'day' ? 'DD' : part === 'month' ? 'MM' : 'YYYY'}
            value={parts[part]}
            onChange={(event) => updatePart(part, event.target.value)}
            className={`${inputCls} min-h-9 px-1.5 text-center tabular-nums`}
          />
        </label>
      ))}
      <button
        type="button"
        aria-label={t('Choose date from calendar', 'اختر التاريخ من التقويم')}
        onClick={() => {
          const picker = pickerRef.current;
          if (!picker) return;
          if (typeof picker.showPicker === 'function') picker.showPicker();
          else picker.click();
        }}
        className="grid h-9 w-9 place-items-center border border-[#cbd7e1] bg-white text-[#315b91] hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]"
      >
        <CalendarDays size={14} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        data-testid={`${testId}-picker`}
        className="sr-only"
        dir="ltr"
        lang="en-GB"
        value={value}
        min={min}
        onChange={(event) => selectFromCalendar(event.target.value)}
      />
    </div>
  );
}

export function CreateLeaseForm({ token, userId, propertyId, units, initialUnitId, defaultUnitLabel, onCreated, trackGuidedSetup = false, onSavingChange }: {
  token: string; userId: string; propertyId: string; units: Unit[]; initialUnitId?: string; defaultUnitLabel?: string; onCreated?: (leaseId: string, lease: RentlyLease) => void; trackGuidedSetup?: boolean; onSavingChange?: (saving: boolean) => void;
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

  function openGuidedSetup() {
    const disclosure = document.getElementById('guided-setup-disclosure') as HTMLDetailsElement | null;
    if (!disclosure) return;
    disclosure.open = true;
    window.setTimeout(() => disclosure.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

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
    if (Object.values(errs).some(Boolean)) {
      if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'lease');
      return;
    }
    busy.current = true; setSaving(true); onSavingChange?.(true);
    let lease: RentlyLease | null = null;
    try {
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
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_failed', 'lease');
        setError(message(
          setupErrorMessage(err, 'Could not confirm the lease was saved.', 'en'),
          setupErrorMessage(err, 'تعذّر تأكيد حفظ العقد. حاول مرة أخرى.'),
        ));
      }
      if (lease) {
        if (trackGuidedSetup) trackGuidedSetupEvent('guided_setup_stage_completed', 'lease');
        try { await invalidatePortfolio(qc, userId, propertyId); } catch { /* saved; refresh can retry later */ }
        setSuccess(message(`Lease saved for ${lease.tenant.fullName}. ${lease.payments.length} dues generated.`, `تم حفظ عقد ${lease.tenant.fullName}. أُنشئت ${lease.payments.length} مستحقات شهرية.`));
        setFullName(''); setEmail(''); setPhone(''); setStartDate(''); setEndDate(''); setRent(''); setDueDay('1'); setDueTouched(false); setTouched(false);
        onCreated?.(lease.id, lease);
      }
    } finally {
      busy.current = false; setSaving(false); onSavingChange?.(false);
    }
  }

  if (units.length === 0) return <p className="text-[11px] leading-5 text-[#718398]">{t('Save a unit first using the guided setup.', 'احفظ وحدة أولًا من الإعداد الموجّه.')} <button type="button" data-testid="button-open-guided-setup" onClick={openGuidedSetup} className="text-[#315b91] underline">{t('Open guided setup', 'فتح الإعداد الموجّه')}</button></p>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label={t('New lease', 'عقد جديد')}>
      <fieldset disabled={saving} className="grid gap-2 sm:grid-cols-2">
        <label className={labelCls}>{t('Unit', 'الوحدة')} *<select dir="auto" data-testid="select-lease-unit" value={effectiveUnit} onChange={(e) => setUnitId(e.target.value)} className={inputCls}>{units.map((u) => <option key={u.id} value={u.id}>{u.unit_label}</option>)}</select>{show('unit')}</label>
        <label className={labelCls}>{t('Tenant name', 'اسم المستأجر')} *<input dir="auto" data-testid="input-tenant-name" value={fullName} maxLength={160} aria-invalid={touched && !!errs.name} onChange={(e) => setFullName(e.target.value)} className={inputCls} />{show('name')}</label>
        <label className={labelCls}>{t('Email', 'البريد الإلكتروني')}<input dir="ltr" data-testid="input-tenant-email" type="email" value={email} aria-invalid={touched && !!errs.email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />{show('email')}</label>
        <label className={labelCls}>{t('Phone', 'الهاتف')}<input dir="ltr" data-testid="input-tenant-phone" type="tel" value={phone} maxLength={80} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></label>
        <div className={labelCls}>
          <span>{t('Start date', 'تاريخ البداية')} *</span>
          <DatePartsInput testId="input-lease-start" label={t('Start date', 'تاريخ البداية')} value={startDate} invalid={touched && !!errs.start} onChange={onStart} />
          {show('start')}
        </div>
        <div className={labelCls}>
          <span>{t('End date', 'تاريخ النهاية')} *</span>
          <DatePartsInput testId="input-lease-end" label={t('End date', 'تاريخ النهاية')} value={endDate} min={startDate || undefined} invalid={touched && !!errs.end} onChange={setEndDate} />
          {show('end')}
        </div>
        <label className={labelCls}>{t('Monthly rent ($)', 'الإيجار الشهري ($)')} *<input dir="ltr" data-testid="input-lease-rent" type="number" inputMode="decimal" min="0.01" step="0.01" value={rent} aria-invalid={touched && !!errs.rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />{show('rent')}</label>
        <label className={labelCls}>{t('Due day', 'يوم الاستحقاق')} *<input dir="ltr" data-testid="input-lease-due-day" type="number" min={1} max={31} step={1} value={dueDay} aria-invalid={touched && !!errs.due} onChange={(e) => { setDueDay(e.target.value); setDueTouched(true); }} className={inputCls} />{show('due')}<span className="normal-case tracking-normal text-[#8192a3]">{t('Days 29-31 clamp to month end.', 'الأيام 29-31 تُضبط على آخر الشهر.')}</span></label>
      </fieldset>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-lease" disabled={saving} className={primaryBtn}>{saving && <LoaderCircle size={12} className="animate-spin" />}{saving ? t('Saving…', 'جارٍ الحفظ…') : t('Save tenant and lease', 'حفظ المستأجر والعقد')}</button></div>
    </form>
  );
}
