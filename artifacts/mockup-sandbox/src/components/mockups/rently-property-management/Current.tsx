import { useState, type FormEvent, type ReactNode } from 'react';
import { FileText, Home, MapPin, Plus, X } from 'lucide-react';
import './_group.css';

type Payment = { id: string; due_date: string; amount: number; paid_at: string | null };
type Lease = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  monthly_rent: number | null;
  due_day: number | null;
  payments: Payment[];
  tenants: { full_name: string; email: string | null; phone: string | null } | null;
};
type Unit = { id: string; unit_label: string; leases: Lease[] };
type Property = {
  id: string;
  name: string;
  street_address: string | null;
  city: string | null;
  region: string | null;
  property_type: string;
  units: Unit[];
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  Apartment: 'Apartment',
  House: 'House',
  Duplex: 'Duplex',
  Townhouse: 'Townhouse',
  Condo: 'Condo',
  'Mixed-use': 'Mixed-use',
};
const labelCls = 'grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]';
const inputCls = 'min-h-9 w-full min-w-0 border border-[#cbd7e1] bg-white px-2.5 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff] aria-[invalid=true]:border-red-500';
const primaryBtn = 'inline-flex min-h-9 items-center justify-center gap-2 bg-[#102238] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-white transition-colors hover:bg-[#1c3757] disabled:opacity-60';
const ghostBtn = 'inline-flex min-h-8 items-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91] transition-colors hover:border-[#3f7cff] disabled:opacity-60';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addMonths(value: Date, count: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + count);
  return date;
}

function addDays(value: Date, count: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + count);
  return date;
}

function makeDemoProperties(): Property[] {
  const today = new Date();
  const priorDue = addMonths(today, -1);
  const nextDue = addMonths(today, 1);
  const dueDay = today.getDate();
  const dueDate = (date: Date) => {
    date.setDate(Math.min(dueDay, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    return toIso(date);
  };
  const start = toIso(addDays(today, -150));
  const end = toIso(addDays(today, 215));

  return [
    {
      id: 'property-willow',
      name: 'Willow Court · Apt 2B',
      street_address: '1842 Willow Ave, Apt 2B',
      city: 'Portland',
      region: 'OR',
      property_type: 'Apartment',
      units: [{
        id: 'unit-willow-2b',
        unit_label: '1842 Willow Ave, Apt 2B',
        leases: [{
          id: 'lease-willow',
          start_date: start,
          end_date: end,
          status: 'active',
          monthly_rent: 1850,
          due_day: dueDay,
          tenants: { full_name: 'Maya Chen', email: 'maya.chen@example.com', phone: '(503) 555-0148' },
          payments: [
            { id: 'payment-willow-prior', due_date: dueDate(priorDue), amount: 1850, paid_at: toIso(addDays(priorDue, 1)) },
            { id: 'payment-willow-current', due_date: toIso(today), amount: 1850, paid_at: null },
            { id: 'payment-willow-next', due_date: dueDate(nextDue), amount: 1850, paid_at: null },
          ],
        }],
      }],
    },
    {
      id: 'property-cedar',
      name: 'Cedar House · Unit 1',
      street_address: '725 Cedar Street, Unit 1',
      city: 'Portland',
      region: 'OR',
      property_type: 'House',
      units: [{
        id: 'unit-cedar-1',
        unit_label: '725 Cedar Street, Unit 1',
        leases: [{
          id: 'lease-cedar',
          start_date: toIso(addDays(today, -72)),
          end_date: toIso(addDays(today, 293)),
          status: 'active',
          monthly_rent: 2200,
          due_day: 14,
          tenants: { full_name: 'Jordan Rivera', email: 'jordan.rivera@example.com', phone: '(503) 555-0186' },
          payments: [
            { id: 'payment-cedar-current', due_date: toIso(addDays(today, 8)), amount: 2200, paid_at: null },
            { id: 'payment-cedar-next', due_date: dueDate(nextDue), amount: 2200, paid_at: null },
          ],
        }],
      }],
    },
    {
      id: 'property-maple',
      name: 'Maple Row Townhomes',
      street_address: '3021 SE Maple Road',
      city: 'Beaverton',
      region: 'OR',
      property_type: 'Townhouse',
      units: [
        { id: 'unit-maple-a', unit_label: '3021 SE Maple Road · A', leases: [] },
        { id: 'unit-maple-b', unit_label: '3021 SE Maple Road · B', leases: [] },
      ],
    },
  ];
}

function propertyLocation(property: Pick<Property, 'street_address' | 'city' | 'region'>) {
  return [property.street_address, property.city, property.region].filter(Boolean).join(' · ') || 'Location not added';
}

function RentlyMark({ size = 40, inverse = false }: { size?: number; inverse?: boolean }) {
  const stroke = inverse ? '#f0f5f8' : '#102238';
  const bright = inverse ? '#b5f06b' : '#3f7cff';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M11 4.75h19.4L43.25 17.6v19.15L30.4 43.25H11L4.75 37V11L11 4.75Z" stroke={stroke} strokeWidth="2.5" />
      <path d="M15.5 33V15h10.1c4.15 0 6.4 2.1 6.4 5.55 0 3.3-2.25 5.35-6.4 5.35h-5.45" stroke={bright} strokeWidth="3.4" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="m24.4 25.8 8.1 8.1" stroke={stroke} strokeWidth="2.7" strokeLinecap="square" />
      <path d="M31 5v8h8" stroke={bright} strokeWidth="2.5" />
    </svg>
  );
}

function Wordmark() {
  return <a href="#top" dir="ltr" className="inline-flex items-center gap-2.5" aria-label="Rently home"><RentlyMark size={34} /><span className="text-[20px] font-bold tracking-[-.07em] text-[#102238]">rently<span className="text-[#3f7cff]">/</span></span></a>;
}

function PropertyButton({ property, index, selected, onSelect }: {
  property: Property;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const accents = ['bg-[#dce8f3]', 'bg-[#e6e8df]', 'bg-[#e8e1d8]', 'bg-[#e3e4f0]'];
  const glyph = property.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Show tenant and lease details for ${property.name}`}
      className={`grid w-full grid-cols-[42px_minmax(0,1fr)] items-center gap-3 bg-[#f7f9fb] p-2.5 text-start transition-colors hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] md:grid-cols-[48px_minmax(0,1fr)_auto] md:gap-4 md:p-3 ${selected ? 'border-[#3f7cff] ring-1 ring-[#3f7cff]' : 'border border-[#d7e0e7]'}`}
    >
      <div className={`grid h-[42px] w-[42px] place-items-center ${accents[index % accents.length]} font-mono text-[10px] font-medium tracking-[.08em] text-[#344f68] md:h-12 md:w-12`}>{glyph || 'RE'}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p dir="auto" className="truncate text-[11px] font-semibold tracking-[-.02em]">{property.name}</p>
          <span className="border border-[#bfcfdd] px-1 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] text-[#526c83]">Owned</span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate font-mono text-[8px] text-[#7b8da0]"><MapPin size={9} /><bdi>{propertyLocation(property)}</bdi></p>
      </div>
      <span className="hidden font-mono text-[8px] text-[#61768b] md:block">{PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}</span>
    </button>
  );
}

function FormNotice({ error, success }: { error?: string; success?: string }) {
  if (error) return <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-2 py-1 text-[10px] text-red-800">{error}</p>;
  if (success) return <p role="status" className="border-s-2 border-[#6aa83a] bg-[#eef6e6] px-2 py-1 text-[10px] text-[#3d6324]">{success}</p>;
  return null;
}

function CreatePropertyForm({ onCreated }: { onCreated: (property: Property) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Apartment');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [touched, setTouched] = useState(false);
  const [success, setSuccess] = useState('');
  const nameError = !name.trim() ? 'Name required.' : '';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setSuccess('');
    if (nameError) return;
    const property: Property = {
      id: `property-${Date.now()}`,
      name: name.trim(),
      street_address: street.trim() || null,
      city: city.trim() || null,
      region: region.trim() || null,
      property_type: type,
      units: [],
    };
    onCreated(property);
    setName('');
    setStreet('');
    setCity('');
    setRegion('');
    setTouched(false);
    setOpen(false);
    setSuccess(`Property "${property.name}" saved.`);
  }

  if (!open) return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" data-testid="button-open-create-property" onClick={() => { setOpen(true); setSuccess(''); }} className={`${ghostBtn} min-h-10 text-[10px]`}><Plus size={13} /> Add property</button>
      <FormNotice success={success} />
    </div>
  );
  return (
    <form onSubmit={submit} noValidate className="mt-2 grid w-full basis-full gap-2 border border-[#cdd9e3] bg-[#f7f9fb] p-3" aria-label="New property">
      <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#47617a]">New property</p><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-[#61768b]"><X size={13} /></button></div>
      <fieldset className="grid gap-2">
        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
          <label className={labelCls}>Name *<input autoFocus dir="auto" data-testid="input-property-name" value={name} maxLength={160} aria-invalid={touched && !!nameError} onChange={(e) => setName(e.target.value)} className={inputCls} />{touched && nameError && <span className="normal-case text-red-700">{nameError}</span>}</label>
          <label className={labelCls}>Type *<select data-testid="select-property-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>{Object.keys(PROPERTY_TYPE_LABELS).map((value) => <option key={value} value={value}>{PROPERTY_TYPE_LABELS[value]}</option>)}</select></label>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_.8fr]">
          <label className={labelCls}>Address (include apartment number)<input dir="auto" data-testid="input-property-street" value={street} maxLength={240} placeholder="Street, building, apartment" onChange={(e) => setStreet(e.target.value)} className={inputCls} /></label>
          <label className={labelCls}>City<input dir="auto" data-testid="input-property-city" value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} className={inputCls} /></label>
          <label className={labelCls}>Region<input dir="auto" data-testid="input-property-region" value={region} maxLength={120} onChange={(e) => setRegion(e.target.value)} className={inputCls} /></label>
        </div>
      </fieldset>
      <div><button data-testid="button-create-property" className={primaryBtn}>Save property</button></div>
    </form>
  );
}

function Panel({ code, title, children }: { code: string; title: string; children: ReactNode }) {
  return <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3"><div className="mb-2.5 flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-[10px] font-bold"><span className="font-mono text-[7px] font-normal tracking-[.1em] text-[#3f7cff]">{code}</span>{title}</p></div>{children}</div>;
}

function CreateLeaseForm({ property, onCreated }: { property: Property; onCreated: (lease: Lease, unitId: string) => void }) {
  const [unitId, setUnitId] = useState(property.units[0]?.id ?? '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rent, setRent] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const rentNum = Number(rent);
  const errors = {
    unit: !unitId ? 'Select a unit.' : '',
    name: !fullName.trim() ? 'Tenant name required.' : '',
    email: email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Invalid email.' : '',
    start: !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ? 'Start date required.' : '',
    end: !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ? 'End date required.' : endDate <= startDate ? 'Must be after start.' : '',
    rent: !rent.trim() || !Number.isFinite(rentNum) || rentNum < 0.01 ? 'Enter rent of at least 0.01.' : '',
    due: !Number.isInteger(Number(dueDay)) || Number(dueDay) < 1 || Number(dueDay) > 31 ? 'Day 1 to 31.' : '',
  };
  const show = (key: keyof typeof errors) => touched && errors[key] ? <span className="normal-case tracking-normal text-red-700">{errors[key]}</span> : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError('');
    setSuccess('');
    if (Object.values(errors).some(Boolean)) return;
    const lease: Lease = {
      id: `lease-${Date.now()}`,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      monthly_rent: Math.round(rentNum * 100) / 100,
      due_day: Number(dueDay),
      tenants: { full_name: fullName.trim(), email: email.trim() || null, phone: phone.trim() || null },
      payments: [],
    };
    onCreated(lease, unitId);
    setFullName(''); setEmail(''); setPhone(''); setStartDate(''); setEndDate(''); setRent(''); setDueDay('1'); setTouched(false);
    setSuccess(`Lease saved for ${lease.tenants?.full_name}. 0 dues generated.`);
  }

  if (!property.units.length) return <p className="text-[11px] leading-5 text-[#718398]">Save a unit first using the guided setup. <button type="button" onClick={() => document.getElementById('guided-setup-disclosure')?.scrollIntoView({ behavior: 'smooth' })} className="text-[#315b91] underline">Open guided setup</button></p>;
  return (
    <form onSubmit={submit} noValidate className="grid gap-2" aria-label="New lease">
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <label className={labelCls}>Unit *<select dir="auto" data-testid="select-lease-unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputCls}>{property.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_label}</option>)}</select>{show('unit')}</label>
        <label className={labelCls}>Tenant name *<input dir="auto" data-testid="input-tenant-name" value={fullName} maxLength={160} aria-invalid={touched && !!errors.name} onChange={(e) => setFullName(e.target.value)} className={inputCls} />{show('name')}</label>
        <label className={labelCls}>Email<input dir="ltr" data-testid="input-tenant-email" type="email" value={email} aria-invalid={touched && !!errors.email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />{show('email')}</label>
        <label className={labelCls}>Phone<input dir="ltr" data-testid="input-tenant-phone" type="tel" value={phone} maxLength={80} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></label>
        <label className={labelCls}>Start date *<input type="date" data-testid="input-lease-start" value={startDate} aria-invalid={touched && !!errors.start} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />{show('start')}</label>
        <label className={labelCls}>End date *<input type="date" data-testid="input-lease-end" value={endDate} min={startDate || undefined} aria-invalid={touched && !!errors.end} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />{show('end')}</label>
        <label className={labelCls}>Monthly rent *<input dir="ltr" data-testid="input-lease-rent" type="number" inputMode="decimal" min="0.01" step="0.01" value={rent} aria-invalid={touched && !!errors.rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />{show('rent')}</label>
        <label className={labelCls}>Due day *<input dir="ltr" data-testid="input-lease-due-day" type="number" min={1} max={31} step={1} value={dueDay} aria-invalid={touched && !!errors.due} onChange={(e) => setDueDay(e.target.value)} className={inputCls} />{show('due')}<span className="normal-case tracking-normal text-[#8192a3]">Days 29-31 clamp to month end.</span></label>
      </fieldset>
      <FormNotice error={error} success={success} />
      <div><button data-testid="button-create-lease" className={primaryBtn}>Save tenant and lease</button></div>
    </form>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function statusOf(payment: Payment, today: string) {
  if (payment.paid_at) return { label: 'Paid', cls: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]' };
  if (payment.due_date < today) return { label: 'Overdue', cls: 'border-red-300 bg-red-50 text-red-800' };
  if (payment.due_date === today) return { label: 'Due today', cls: 'border-[#3f7cff] bg-[#e6eeff] text-[#214a83]' };
  return { label: 'Upcoming', cls: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]' };
}

function LeaseRecord({ lease, today, onMarkPaid }: { lease: Lease; today: string; onMarkPaid: (paymentId: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const payments = [...lease.payments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const open = payments.filter((payment) => !payment.paid_at);
  const overdue = open.filter((payment) => payment.due_date < today).length;
  const visible = showAll ? payments : payments.filter((payment) => !payment.paid_at).slice(0, 4);
  const hasTerms = lease.monthly_rent != null && lease.due_day != null;
  const dt = 'font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]';

  return (
    <article data-testid={`card-lease-${lease.id}`} className="border border-[#e1e7ec] bg-white/60 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p data-testid={`text-tenant-${lease.id}`} dir="auto" className="truncate text-[11px] font-semibold">{lease.tenants?.full_name ?? 'Tenant unavailable'}</p>
          <p className="mt-0.5 font-mono text-[8px] text-[#778a9c]">{formatDate(lease.start_date)} / {formatDate(lease.end_date)} <span className="uppercase text-[#47617a]">[{lease.status === 'active' ? 'Active' : lease.status}]</span></p>
        </div>
        {hasTerms && <button type="button" className={ghostBtn}><FileText size={10} /> Lease PDF (English draft)</button>}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <div><dt className={dt}>Email</dt><dd dir="ltr" className="break-all text-start text-[9px] font-semibold">{lease.tenants?.email ?? '--'}</dd></div>
        <div><dt className={dt}>Phone</dt><dd dir="ltr" className="text-start text-[9px] font-semibold">{lease.tenants?.phone ?? '--'}</dd></div>
        <div><dt className={dt}>Rent / mo</dt><dd className="font-mono text-[9px] font-semibold">{lease.monthly_rent != null ? <bdi dir="ltr">{formatMoney(lease.monthly_rent)}</bdi> : <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
        <div><dt className={dt}>Due day</dt><dd className="font-mono text-[9px] font-semibold">{lease.due_day ?? <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
      </dl>
      <div className="mt-2.5">
        <div className="flex items-center justify-between gap-2 pb-1">
          <p className="font-mono text-[7px] uppercase tracking-[.1em] text-[#64798d]">Dues <bdi dir="ltr">{payments.length - open.length}/{payments.length}</bdi> paid{overdue > 0 && <span className="ms-1.5 text-red-700">{overdue} overdue</span>}</p>
          {payments.length > 0 && <button type="button" data-testid={`button-toggle-dues-${lease.id}`} onClick={() => setShowAll((value) => !value)} className="font-mono text-[7px] uppercase tracking-[.06em] text-[#315b91] underline underline-offset-2">{showAll ? 'Open only' : 'All dues'}</button>}
        </div>
        {payments.length === 0 ? <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#718398]">{hasTerms ? 'No dues generated.' : 'Lease terms missing. No dues.'}</p> : visible.length === 0 ? <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#3d6324]">All dues paid.</p> : (
          <ul>{visible.map((payment) => {
            const status = statusOf(payment, today);
            return (
              <li key={payment.id} data-testid={`row-payment-${payment.id}`} className="grid gap-1.5 border-t border-[#e4e9ee] py-1.5 sm:grid-cols-[88px_76px_74px_minmax(0,1fr)] sm:items-center">
                <span className="text-start font-mono text-[9px] text-[#102238]">{formatDate(payment.due_date)}</span>
                <span dir="ltr" className="text-start font-mono text-[9px] tabular-nums text-[#47617a]">{formatMoney(payment.amount)}</span>
                <span data-testid={`status-payment-${payment.id}`} className={`w-fit border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] ${status.cls}`}>{status.label}</span>
                {payment.paid_at ? <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[8px] text-[#3d6324]">Paid {formatDate(payment.paid_at)}</span><button type="button" className={ghostBtn}>Correct date / history</button></div> : (
                  <button type="button" data-testid={`button-record-payment-${payment.id}`} onClick={() => onMarkPaid(payment.id)} className={ghostBtn}>Mark paid today</button>
                )}
              </li>
            );
          })}</ul>
        )}
      </div>
      <details className="mt-2.5 border-t border-[#e4e9ee] pt-2 text-[10px]">
        <summary className="cursor-pointer font-semibold text-[#315b91]">Signed lease file</summary>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#718398]"><FileText size={13} /><span>No signed file uploaded.</span><label className={ghostBtn}>Upload signed lease<input type="file" accept="application/pdf" className="sr-only" /></label></div>
      </details>
    </article>
  );
}

export function Current() {
  const [properties, setProperties] = useState<Property[]>(makeDemoProperties);
  const [selectedPropertyId, setSelectedPropertyId] = useState('property-willow');
  const [signedOut, setSignedOut] = useState(false);
  const [email, setEmail] = useState('alex.morgan@example.com');
  const today = toIso(new Date());
  const selectedProperty = properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null;
  const dateStamp = today;

  function addProperty(property: Property) {
    setProperties((current) => [...current, property].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedPropertyId(property.id);
  }

  function addLease(lease: Lease, unitId: string) {
    if (!selectedProperty) return;
    setProperties((current) => current.map((property) => property.id !== selectedProperty.id ? property : ({
      ...property,
      units: property.units.map((unit) => unit.id === unitId ? { ...unit, leases: [...unit.leases, lease] } : unit),
    })));
  }

  function markPaid(paymentId: string) {
    setProperties((current) => current.map((property) => ({
      ...property,
      units: property.units.map((unit) => ({
        ...unit,
        leases: unit.leases.map((lease) => ({
          ...lease,
          payments: lease.payments.map((payment) => payment.id === paymentId ? { ...payment, paid_at: today } : payment),
        })),
      })),
    })));
  }

  return (
    <main id="top" className="rently-property-management min-h-[100dvh] overflow-hidden bg-[#e9eef3] text-[#102238]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between gap-2 border-b border-[#d1dbe4] px-2 py-3 sm:gap-3 sm:px-5 sm:py-4 md:px-12 lg:px-[7.4%]">
        <Wordmark />
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          {signedOut ? (
            <div className="flex items-center gap-2 font-mono text-[9px] text-[#61758a]"><input aria-label="Signed-in email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-40 border border-[#cbd7e1] bg-white px-2 py-1.5 text-[#102238]" /><button type="button" onClick={() => setSignedOut(false)} className="rounded-sm bg-[#102238] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[.06em] text-white">Sign in</button></div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span dir="ltr" className="hidden truncate font-mono text-[9px] text-[#61758a] sm:inline">{email}</span>
              <button type="button" aria-label="Sign out" onClick={() => setSignedOut(true)} className="shrink-0 whitespace-nowrap rounded-sm bg-[#102238] px-2 py-2 font-mono text-[8px] uppercase tracking-[.04em] text-white sm:px-3 sm:py-2.5 sm:text-[9px] sm:tracking-[.06em]"><span className="sm:hidden">Exit</span><span className="hidden sm:inline">Sign out</span></button>
            </div>
          )}
        </div>
      </header>
      <section className="mx-auto grid max-w-[1440px] px-4 pb-10 pt-5 md:px-8 md:pt-6 lg:px-10">
        <div className="relative w-full">
          <div className="relative border border-[#c6d2dd] bg-[#f4f7f9] p-3 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1e8] px-2 pb-3 pt-1">
              <div className="flex items-center gap-2.5"><RentlyMark size={28} /><div><p className="text-[13px] font-bold tracking-[-.02em]">Property portfolio</p></div></div>
            </div>
            <details id="guided-setup-disclosure" data-testid="disclosure-guided-setup" className="mb-3 mt-3 border border-[#cdd9e3] bg-[#f8fafb]">
              <summary className="cursor-pointer px-3 py-2.5 text-[11px] font-semibold text-[#315b91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7cff]">Add property, unit, tenant or lease</summary>
              <div className="grid gap-2 px-3 pb-3 pt-2">
                <div className="border border-[#d8e1e8] bg-white p-3"><p className="text-[13px] font-semibold">Guided setup: property → unit → tenant and lease</p><p className="mt-1 text-[11px] text-[#667b8e]">Choose a property, add a unit, then save tenant and lease details.</p><p className="mt-2 font-mono text-[9px] text-[#3f7cff]">Next: Choose a saved property or add a new one.</p></div>
                <button type="button" onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })} className={ghostBtn}>Open portfolio records</button>
              </div>
            </details>
            <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(300px,.42fr)_1fr] xl:items-start">
              <div id="portfolio" className="mt-3 border border-[#cdd9e3] bg-[#e7eef4] p-3 md:p-4">
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
                  <div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#536c83]">Owned properties</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-.045em]">Your portfolio <span className="font-mono text-[10px] font-normal text-[#6f8295]">/ {String(properties.length).padStart(2, '0')}</span></h2></div>
                  <CreatePropertyForm onCreated={addProperty} />
                </div>
                <div className="space-y-2">
                  {properties.map((property, index) => <PropertyButton key={property.id} property={property} index={index} selected={selectedPropertyId === property.id} onSelect={() => setSelectedPropertyId(property.id)} />)}
                </div>
              </div>
              <div id="records" className="mt-3 xl:mt-0">
                {!selectedProperty ? null : (
                  <div className="grid gap-2.5 md:grid-cols-[.72fr_1.28fr] xl:grid-cols-[minmax(260px,.6fr)_1.4fr]">
                    <div className="grid content-start gap-2.5">
                      <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3 md:p-4">
                        <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#64798d]">Selected property</p><Home size={14} className="text-[#3f7cff]" /></div>
                        <p data-testid="text-selected-property" dir="auto" className="mt-2 text-[12px] font-semibold tracking-[-.025em]">{selectedProperty.name}</p>
                        <p className="mt-1 font-mono text-[8px] text-[#778a9c]"><bdi>{propertyLocation(selectedProperty)}</bdi></p>
                        <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[7px] uppercase tracking-[.05em]"><span className="border border-[#cbd8e2] bg-[#e8eef3] px-1.5 py-1 text-[#47617a]">{PROPERTY_TYPE_LABELS[selectedProperty.property_type] ?? selectedProperty.property_type}</span></div>
                      </div>
                      <Panel code="L+" title="Tenant & lease"><CreateLeaseForm key={selectedProperty.id} property={selectedProperty} onCreated={addLease} /></Panel>
                    </div>
                    <div className="border border-[#d8e1e8] bg-[#f8fafb] px-3 py-3 md:px-4" aria-live="polite">
                      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-bold">Leases / dues</p><span className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]" dir="ltr">{dateStamp}</span></div>
                      <div className="space-y-3 border-t border-[#dce3e9] pt-2">
                        {selectedProperty.units.length === 0 ? <p className="text-[9px] text-[#718398]">No tenant or lease yet. Create the first lease below; it will use this property address.</p> : selectedProperty.units.map((unit) => (
                          <section key={unit.id} data-testid={`section-unit-${unit.id}`} className="border-b border-[#e4e9ee] pb-3 last:border-0 last:pb-0">
                            <p className="mb-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.06em] text-[#47617a]"><bdi dir="auto">{unit.unit_label}</bdi><span className="text-[#8192a3]">{unit.leases.length} {unit.leases.length === 1 ? 'lease' : 'leases'}</span></p>
                            {unit.leases.length === 0 ? <p className="text-[9px] text-[#718398]">Vacant. No lease.</p> : <div className="space-y-2">{[...unit.leases].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((lease) => <LeaseRecord key={lease.id} lease={lease} today={today} onMarkPaid={markPaid} />)}</div>}
                          </section>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#cbd6df] bg-[#dde6ed]"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-12 lg:px-[7.4%]"><Wordmark /><p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#8092a3]" dir="ltr">© 2025 Rently</p></div></footer>
    </main>
  );
}
