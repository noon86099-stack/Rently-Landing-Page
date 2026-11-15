import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useCreateRentlyLease } from '@workspace/api-client-react';
import type { Unit } from '@/lib/rently-data';
import { FormNotice, authRequest, errorMessage, inputCls, invalidatePortfolio, labelCls, primaryBtn } from './shared';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateLeaseForm({ token, userId, propertyId, units }: { token: string; userId: string; propertyId: string; units: Unit[] }) {
  const qc = useQueryClient();
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rent, setRent] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [dueTouched, setDueTouched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const create = useCreateRentlyLease({ request: authRequest(token) });

  const effectiveUnit = units.some((u) => u.id === unitId) ? unitId : units[0]?.id ?? '';
  const rentNum = Number(rent);
  const dayNum = Number(dueDay);
  const errs = {
    unit: !effectiveUnit ? 'Select a unit.' : '',
    name: !fullName.trim() ? 'Tenant name required.' : '',
    email: email.trim() && !EMAIL_RE.test(email.trim()) ? 'Invalid email.' : '',
    start: !DATE_RE.test(startDate) ? 'Start date required.' : '',
    end: !DATE_RE.test(endDate) ? 'End date required.' : endDate <= startDate ? 'Must be after start.' : '',
    rent: !rent.trim() || !Number.isFinite(rentNum) || rentNum <= 0 ? 'Enter rent > 0.' : rentNum > 100_000_000 ? 'Too large.' : '',
    due: !Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31 ? 'Day 1 to 31.' : '',
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
    try {
      const lease = await create.mutateAsync({
        data: {
          unitId: effectiveUnit,
          tenantFullName: fullName.trim(),
          tenantEmail: email.trim() || null,
          tenantPhone: phone.trim() || null,
          startDate, endDate,
          monthlyRent: Math.round(rentNum * 100) / 100,
          dueDay: dayNum,
        },
      });
      await invalidatePortfolio(qc, userId, propertyId);
      setSuccess(`Lease created for ${lease.tenant.fullName}. ${lease.payments.length} dues generated.`);
      setFullName(''); setEmail(''); setPhone(''); setStartDate(''); setEndDate(''); setRent(''); setDueDay('1'); setDueTouched(false); setTouched(false);
    } catch (err) {
      setError(errorMessage(err, 'Lease could not be created.'));
    }
  }

  if (units.length === 0) return <p className="text-[9px] text-[#718398]">Add a unit first.</p>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label="New lease">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={labelCls}>Unit *<select data-testid="select-lease-unit" value={effectiveUnit} onChange={(e) => setUnitId(e.target.value)} className={inputCls}>{units.map((u) => <option key={u.id} value={u.id}>{u.unit_label}</option>)}</select>{show('unit')}</label>
        <label className={labelCls}>Tenant name *<input data-testid="input-tenant-name" value={fullName} maxLength={160} aria-invalid={touched && !!errs.name} onChange={(e) => setFullName(e.target.value)} className={inputCls} />{show('name')}</label>
        <label className={labelCls}>Email<input data-testid="input-tenant-email" type="email" value={email} aria-invalid={touched && !!errs.email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />{show('email')}</label>
        <label className={labelCls}>Phone<input data-testid="input-tenant-phone" type="tel" value={phone} maxLength={80} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>Start *<input data-testid="input-lease-start" type="date" value={startDate} aria-invalid={touched && !!errs.start} onChange={(e) => onStart(e.target.value)} className={inputCls} />{show('start')}</label>
        <label className={labelCls}>End *<input data-testid="input-lease-end" type="date" value={endDate} min={startDate || undefined} aria-invalid={touched && !!errs.end} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />{show('end')}</label>
        <label className={labelCls}>Monthly rent *<input data-testid="input-lease-rent" type="number" inputMode="decimal" min="0.01" step="0.01" value={rent} aria-invalid={touched && !!errs.rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />{show('rent')}</label>
        <label className={labelCls}>Due day *<input data-testid="input-lease-due-day" type="number" min={1} max={31} step={1} value={dueDay} aria-invalid={touched && !!errs.due} onChange={(e) => { setDueDay(e.target.value); setDueTouched(true); }} className={inputCls} />{show('due')}<span className="normal-case tracking-normal text-[#8192a3]">Days 29-31 clamp to month end.</span></label>
      </div>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-lease" disabled={create.isPending} className={primaryBtn}>{create.isPending && <LoaderCircle size={12} className="animate-spin" />}Create lease</button></div>
    </form>
  );
}
