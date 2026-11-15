import { useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, Building2, Check, ChevronRight, CirclePlus, FileText, Home, Languages, MapPin, Menu, Search, Users, X } from 'lucide-react';
import './_group.css';

type Lease = {
  id: string;
  tenant: string;
  email: string;
  phone: string;
  unit: string;
  start: string;
  end: string;
  rent: number;
  status: 'Active' | 'Ending soon';
};
type Property = {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  region: string;
  units: string[];
  leases: Lease[];
};
type View = 'properties' | 'tenants' | 'leases';

const copy = {
  en: {
    portfolio: 'Owner workspace',
    eyebrow: 'PROPERTY MANAGEMENT / DEMO DATA',
    properties: 'Properties',
    tenants: 'Tenants',
    leases: 'Leases',
    add: 'Add property',
    title: { properties: 'Your properties', tenants: 'Tenants', leases: 'Leases' },
    subtitle: {
      properties: 'One clear view of every address, unit, and occupancy.',
      tenants: 'People connected to the homes they rent.',
      leases: 'Lease terms, status, and the property unit they belong to.',
    },
    search: 'Search properties',
    units: 'units',
    occupied: 'occupied',
    vacant: 'vacant',
    allProperties: 'All properties',
    linkedHome: 'PROPERTY / UNIT',
    tenant: 'TENANT',
    monthlyRent: 'MONTHLY RENT',
    term: 'LEASE TERM',
    active: 'ACTIVE',
    ending: 'ENDING SOON',
    noRecords: 'No matching records',
    noRecordsSub: 'Try another search or add a property to your portfolio.',
    details: 'Property details',
    address: 'Address',
    type: 'Property type',
    unitCount: 'Units',
    people: 'People & leases',
    noTenants: 'No tenants or leases linked yet.',
    addAnother: 'Add a tenant and lease',
    propertyName: 'Property name',
    propertyType: 'Type',
    street: 'Street address',
    city: 'City',
    region: 'State / region',
    unitLabel: 'First unit (optional)',
    save: 'Save property',
    cancel: 'Cancel',
    close: 'Close',
    required: 'Enter a property name.',
    saved: 'Property added to your portfolio.',
    savedDetail: 'Your new property is ready. Add a tenant and lease when you are.',
    demo: 'DEMO DATA',
    demoNote: 'This sample workspace is not connected to a live account.',
    portfolioValue: 'PORTFOLIO SNAPSHOT',
    addressCount: 'PROPERTIES',
    unitTotal: 'TOTAL UNITS',
    activeLeases: 'ACTIVE LEASES',
    rentRoll: 'MONTHLY RENT ROLL',
    selected: 'SELECTED PROPERTY',
    newLease: 'Add tenant & lease',
    saveLease: 'Save tenant and lease',
    tenantName: 'Tenant name',
    tenantEmail: 'Email',
    tenantPhone: 'Phone',
    unit: 'Unit',
    startDate: 'Start date',
    endDate: 'End date',
    rent: 'Monthly rent',
    addTenant: 'Add tenant & lease',
    leaseSaved: 'Tenant and lease saved.',
    noUnits: 'Add a unit to this property first.',
    all: 'All properties',
    noLease: 'No lease',
    selectedProperty: 'VIEW PROPERTY',
    signIn: 'Owner account',
  },
  ar: {
    portfolio: 'مساحة المالك',
    eyebrow: 'إدارة العقارات / بيانات تجريبية',
    properties: 'العقارات',
    tenants: 'المستأجرون',
    leases: 'عقود الإيجار',
    add: 'إضافة عقار',
    title: { properties: 'عقاراتك', tenants: 'المستأجرون', leases: 'عقود الإيجار' },
    subtitle: {
      properties: 'عرض موحّد لكل عنوان ووحدة وحالة إشغال.',
      tenants: 'الأشخاص المرتبطون بالمنازل التي يستأجرونها.',
      leases: 'شروط العقد وحالته والعقار والوحدة المرتبطان به.',
    },
    search: 'ابحث عن عقار',
    units: 'وحدات',
    occupied: 'مشغولة',
    vacant: 'شاغرة',
    allProperties: 'كل العقارات',
    linkedHome: 'العقار / الوحدة',
    tenant: 'المستأجر',
    monthlyRent: 'الإيجار الشهري',
    term: 'مدة العقد',
    active: 'ساري',
    ending: 'ينتهي قريباً',
    noRecords: 'لا توجد سجلات مطابقة',
    noRecordsSub: 'جرّب بحثاً آخر أو أضف عقاراً إلى محفظتك.',
    details: 'تفاصيل العقار',
    address: 'العنوان',
    type: 'نوع العقار',
    unitCount: 'الوحدات',
    people: 'الأشخاص والعقود',
    noTenants: 'لا يوجد مستأجرون أو عقود مرتبطة بعد.',
    addAnother: 'إضافة مستأجر وعقد',
    propertyName: 'اسم العقار',
    propertyType: 'النوع',
    street: 'عنوان الشارع',
    city: 'المدينة',
    region: 'الولاية / المنطقة',
    unitLabel: 'الوحدة الأولى (اختياري)',
    save: 'حفظ العقار',
    cancel: 'إلغاء',
    close: 'إغلاق',
    required: 'أدخل اسم العقار.',
    saved: 'تمت إضافة العقار إلى محفظتك.',
    savedDetail: 'عقارك الجديد جاهز. يمكنك إضافة مستأجر وعقد في أي وقت.',
    demo: 'بيانات تجريبية',
    demoNote: 'مساحة العمل هذه نموذجية وغير مرتبطة بحساب مباشر.',
    portfolioValue: 'ملخص المحفظة',
    addressCount: 'العقارات',
    unitTotal: 'إجمالي الوحدات',
    activeLeases: 'العقود السارية',
    rentRoll: 'إجمالي الإيجار الشهري',
    selected: 'العقار المحدد',
    newLease: 'إضافة مستأجر وعقد',
    saveLease: 'حفظ المستأجر والعقد',
    tenantName: 'اسم المستأجر',
    tenantEmail: 'البريد الإلكتروني',
    tenantPhone: 'الهاتف',
    unit: 'الوحدة',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    rent: 'الإيجار الشهري',
    addTenant: 'إضافة مستأجر وعقد',
    leaseSaved: 'تم حفظ المستأجر والعقد.',
    noUnits: 'أضف وحدة إلى هذا العقار أولاً.',
    all: 'كل العقارات',
    noLease: 'لا يوجد عقد',
    selectedProperty: 'عرض العقار',
    signIn: 'حساب المالك',
  },
};

function demoProperties(): Property[] {
  return [
    {
      id: 'willow', name: 'Willow Court', type: 'Apartment', address: '1842 Willow Avenue', city: 'Portland', region: 'OR',
      units: ['Apt 2B'],
      leases: [{ id: 'lease-1', tenant: 'Maya Chen', email: 'maya.chen@example.com', phone: '(503) 555-0148', unit: 'Apt 2B', start: '2025-01-01', end: '2026-01-01', rent: 1850, status: 'Active' }],
    },
    {
      id: 'cedar', name: 'Cedar House', type: 'House', address: '725 Cedar Street', city: 'Portland', region: 'OR',
      units: ['Unit 1'],
      leases: [{ id: 'lease-2', tenant: 'Jordan Rivera', email: 'jordan.rivera@example.com', phone: '(503) 555-0186', unit: 'Unit 1', start: '2025-03-01', end: '2026-03-01', rent: 2200, status: 'Ending soon' }],
    },
    {
      id: 'maple', name: 'Maple Row Townhomes', type: 'Townhouse', address: '3021 SE Maple Road', city: 'Beaverton', region: 'OR',
      units: ['Unit A', 'Unit B'], leases: [],
    },
  ];
}

const labelClass = 'mb-1 block font-mono text-[9px] uppercase tracking-[.08em] text-[#667b8e]';
const inputClass = 'min-h-10 w-full border border-[#cbd7e1] bg-white px-3 text-[12px] text-[#102238] outline-none placeholder:text-[#9aa9b7] focus:border-[#3f7cff] focus:ring-2 focus:ring-[#3f7cff]/15';
const primaryClass = 'inline-flex min-h-10 items-center justify-center gap-2 bg-[#102238] px-4 font-mono text-[10px] font-semibold uppercase tracking-[.06em] text-white transition-colors hover:bg-[#234362] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]';
const secondaryClass = 'inline-flex min-h-9 items-center justify-center gap-2 border border-[#c5d4e0] bg-[#f6f8fa] px-3 font-mono text-[9px] font-semibold uppercase tracking-[.05em] text-[#315b91] transition-colors hover:border-[#3f7cff]';

function RentlyMark({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M11 4.75h19.4L43.25 17.6v19.15L30.4 43.25H11L4.75 37V11L11 4.75Z" stroke="#102238" strokeWidth="2.5" /><path d="M15.5 33V15h10.1c4.15 0 6.4 2.1 6.4 5.55 0 3.3-2.25 5.35-6.4 5.35h-5.45" stroke="#3f7cff" strokeWidth="3.4" strokeLinecap="square" strokeLinejoin="miter" /><path d="m24.4 25.8 8.1 8.1" stroke="#102238" strokeWidth="2.7" strokeLinecap="square" /><path d="M31 5v8h8" stroke="#3f7cff" strokeWidth="2.5" /></svg>;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

export function UnifiedWorkspace() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = copy[lang];
  const isArabic = lang === 'ar';
  const [properties, setProperties] = useState<Property[]>(demoProperties);
  const [view, setView] = useState<View>('properties');
  const [selectedId, setSelectedId] = useState('willow');
  const [query, setQuery] = useState('');
  const [filterId, setFilterId] = useState('all');
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [savedProperty, setSavedProperty] = useState(false);
  const [savedLease, setSavedLease] = useState(false);
  const [formError, setFormError] = useState('');
  const selected = properties.find((property) => property.id === selectedId) ?? properties[0];
  const totalUnits = properties.reduce((sum, property) => sum + property.units.length, 0);
  const allLeases = properties.flatMap((property) => property.leases.map((lease) => ({ ...lease, property })));
  const rentTotal = allLeases.reduce((sum, lease) => sum + lease.rent, 0);
  const filteredProperties = properties.filter((property) =>
    `${property.name} ${property.address} ${property.city}`.toLowerCase().includes(query.toLowerCase()),
  );
  const visibleLeases = useMemo(() => allLeases.filter((entry) =>
    filterId === 'all' || entry.property.id === filterId,
  ), [allLeases, filterId]);
  const visiblePeople = visibleLeases.filter((entry) =>
    `${entry.tenant} ${entry.email} ${entry.property.name} ${entry.unit}`.toLowerCase().includes(query.toLowerCase()),
  );

  function addProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) {
      setFormError(t.required);
      return;
    }
    const unit = String(form.get('unit') || '').trim();
    const property: Property = {
      id: `property-${Date.now()}`,
      name,
      type: String(form.get('type') || 'Apartment'),
      address: String(form.get('address') || '').trim(),
      city: String(form.get('city') || '').trim(),
      region: String(form.get('region') || '').trim(),
      units: unit ? [unit] : [],
      leases: [],
    };
    setProperties((current) => [...current, property]);
    setSelectedId(property.id);
    setView('properties');
    setShowPropertyForm(false);
    setSavedProperty(true);
    setFormError('');
  }

  function addLease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const tenant = String(form.get('tenant') || '').trim();
    const unit = String(form.get('unit') || '');
    if (!tenant || !unit) {
      setFormError(!unit ? t.noUnits : t.required);
      return;
    }
    const lease: Lease = {
      id: `lease-${Date.now()}`,
      tenant,
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      unit,
      start: String(form.get('start') || ''),
      end: String(form.get('end') || ''),
      rent: Number(form.get('rent') || 0),
      status: 'Active',
    };
    setProperties((current) => current.map((property) => property.id === selected.id
      ? { ...property, leases: [...property.leases, lease] }
      : property));
    setShowLeaseForm(false);
    setSavedLease(true);
    setFormError('');
  }

  const navItems: { id: View; label: string; icon: typeof Building2 }[] = [
    { id: 'properties', label: t.properties, icon: Building2 },
    { id: 'tenants', label: t.tenants, icon: Users },
    { id: 'leases', label: t.leases, icon: FileText },
  ];

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className="rently-property-management min-h-[100dvh] bg-[#e9eef3] text-[#102238]">
      <header className="border-b border-[#d1dbe4] bg-[#eef2f5]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <RentlyMark />
            <div className="leading-tight">
              <p className="text-[19px] font-bold tracking-[-.07em]">rently<span className="text-[#3f7cff]">/</span></p>
              <p className="hidden font-mono text-[8px] uppercase tracking-[.11em] text-[#718398] sm:block">{t.portfolio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden font-mono text-[9px] text-[#61758a] sm:block" dir="ltr">alex.morgan@example.com</span>
            <button type="button" onClick={() => setLang(isArabic ? 'en' : 'ar')} className={secondaryClass} aria-label="Toggle language"><Languages size={13} />{isArabic ? 'English' : 'عربي'}</button>
            <div className="hidden h-8 w-8 place-items-center border border-[#bfcfdd] bg-[#dce8f3] font-mono text-[9px] font-bold sm:grid">AM</div>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-0 px-0 md:min-h-[calc(100dvh-61px)] md:grid-cols-[220px_minmax(0,1fr)] md:px-5 lg:px-8">
        <aside className="border-b border-[#d4dee6] bg-[#e5ebf0] px-3 py-3 md:border-b-0 md:border-e md:px-3 md:py-7">
          <div className="mb-3 flex items-center justify-between px-2 md:mb-6">
            <p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#8192a3]">{t.eyebrow}</p>
            <Menu size={13} className="text-[#8192a3] md:hidden" />
          </div>
          <nav aria-label="Owner workspace navigation" className="flex gap-1 md:grid">
            {navItems.map(({ id, label, icon: Icon }, index) => (
              <button key={id} type="button" onClick={() => { setView(id); setQuery(''); setSavedProperty(false); setSavedLease(false); }}
                aria-current={view === id ? 'page' : undefined}
                className={`flex min-h-10 flex-1 items-center gap-2.5 border-s-2 px-2.5 text-start text-[11px] font-semibold transition-colors md:flex-none ${view === id ? 'border-[#3f7cff] bg-[#f4f7f9] text-[#102238]' : 'border-transparent text-[#61758a] hover:bg-[#edf2f5]'}`}>
                <Icon size={14} className={view === id ? 'text-[#3f7cff]' : 'text-[#8293a3]'} />
                <span>{label}</span>
                <span className="ms-auto hidden font-mono text-[8px] text-[#9aa9b7] md:inline">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </nav>
          <div className="mt-7 hidden border-t border-[#d1dbe4] pt-5 md:block">
            <p className="px-2 font-mono text-[8px] uppercase tracking-[.1em] text-[#8192a3]">{t.demo}</p>
            <p className="mt-2 px-2 text-[10px] leading-5 text-[#74879a]">{t.demoNote}</p>
          </div>
        </aside>
        <section className="min-w-0 px-4 pb-10 pt-5 sm:px-6 md:px-7 md:pt-8 lg:px-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#3f7cff]">{t.eyebrow}</p>
              <h1 className="mt-1 text-[25px] font-semibold tracking-[-.045em] sm:text-[30px]">{t.title[view]}</h1>
              <p className="mt-1 max-w-xl text-[11px] text-[#6f8295]">{t.subtitle[view]}</p>
            </div>
            {view === 'properties' && (
              <button type="button" onClick={() => { setShowPropertyForm(true); setSavedProperty(false); setFormError(''); }} className={primaryClass}>
                <CirclePlus size={14} />{t.add}
              </button>
            )}
          </div>

          <section className="mb-5 grid grid-cols-2 border border-[#d2dce4] bg-[#f5f8fa] sm:grid-cols-4">
            {[
              { label: t.addressCount, value: String(properties.length).padStart(2, '0'), Icon: Building2 },
              { label: t.unitTotal, value: String(totalUnits).padStart(2, '0'), Icon: Home },
              { label: t.activeLeases, value: String(allLeases.length).padStart(2, '0'), Icon: Users },
              { label: t.rentRoll, value: formatMoney(rentTotal), Icon: ArrowUpRight },
            ].map(({ label, value, Icon }, index) => (
              <div key={label} className={`flex min-h-[76px] items-center gap-3 px-3 py-3 sm:px-4 ${index > 0 ? 'border-s border-[#d9e1e8]' : ''} ${index > 1 ? 'border-t border-[#d9e1e8] sm:border-t-0' : ''}`}>
                <div className="hidden h-8 w-8 place-items-center bg-[#e6edf3] text-[#3f7cff] sm:grid"><Icon size={15} /></div>
                <div className="min-w-0"><p className="truncate font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">{label}</p><p className="mt-1 truncate text-[16px] font-semibold tracking-[-.035em]">{value}</p></div>
              </div>
            ))}
          </section>

          {savedProperty && selected && (
            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border-s-2 border-[#77a94e] bg-[#eff6e8] px-4 py-3">
              <div className="flex items-start gap-2"><span className="mt-0.5 grid h-5 w-5 place-items-center bg-[#dceccf] text-[#4c742f]"><Check size={12} /></span><div><p className="text-[11px] font-semibold">{t.saved}</p><p className="mt-0.5 text-[10px] text-[#617c4f]">{t.savedDetail}</p></div></div>
              <button type="button" onClick={() => { setSavedProperty(false); setShowLeaseForm(true); }} className={secondaryClass}>{t.addAnother}<ChevronRight size={12} /></button>
            </div>
          )}
          {savedLease && <div role="status" className="mb-4 flex items-center gap-2 border-s-2 border-[#77a94e] bg-[#eff6e8] px-4 py-3 text-[11px] font-semibold text-[#476f2c]"><Check size={14} />{t.leaseSaved}<button type="button" onClick={() => setSavedLease(false)} className="ms-auto" aria-label={t.close}><X size={14} /></button></div>}

          {showPropertyForm && (
            <div className="fixed inset-0 z-50 grid items-end bg-[#102238]/35 p-0 sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPropertyForm(false); }}>
              <form onSubmit={addProperty} className="w-full max-w-[620px] border border-[#cbd7e1] bg-[#f5f8fa] p-5 shadow-xl sm:p-7" aria-label={t.add}>
                <div className="mb-5 flex items-start justify-between border-b border-[#d8e1e8] pb-4">
                  <div><p className="font-mono text-[8px] uppercase tracking-[.11em] text-[#3f7cff]">{t.selected}</p><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em]">{t.add}</h2></div>
                  <button type="button" onClick={() => setShowPropertyForm(false)} className="grid h-8 w-8 place-items-center text-[#718398] hover:bg-[#e7edf2]" aria-label={t.close}><X size={16} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className={labelClass}>{t.propertyName} *</span><input autoFocus name="name" className={inputClass} placeholder="e.g. Alder Street Flats" /></label>
                  <label><span className={labelClass}>{t.propertyType}</span><select name="type" className={inputClass}><option>Apartment</option><option>House</option><option>Duplex</option><option>Townhouse</option><option>Condo</option></select></label>
                  <label><span className={labelClass}>{t.unitLabel}</span><input name="unit" className={inputClass} placeholder="e.g. Unit 1" /></label>
                  <label className="sm:col-span-2"><span className={labelClass}>{t.street}</span><input name="address" className={inputClass} placeholder="Street, building, apartment" /></label>
                  <label><span className={labelClass}>{t.city}</span><input name="city" className={inputClass} /></label>
                  <label><span className={labelClass}>{t.region}</span><input name="region" className={inputClass} /></label>
                </div>
                {formError && <p role="alert" className="mt-3 border-s-2 border-red-500 bg-red-50 px-3 py-2 text-[10px] text-red-800">{formError}</p>}
                <div className="mt-5 flex justify-end gap-2 border-t border-[#d8e1e8] pt-4">
                  <button type="button" onClick={() => setShowPropertyForm(false)} className={secondaryClass}>{t.cancel}</button>
                  <button className={primaryClass}><Check size={13} />{t.save}</button>
                </div>
              </form>
            </div>
          )}

          {view === 'properties' && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.72fr)]">
              <section className="min-w-0 border border-[#d3dde5] bg-[#f5f8fa]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1e8] px-4 py-3">
                  <div><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8192a3]">{t.allProperties}</p><p className="mt-1 text-[12px] font-semibold">{String(properties.length).padStart(2, '0')} locations</p></div>
                  <label className="relative w-full sm:w-56"><Search size={13} className="absolute start-3 top-3 text-[#8395a6]" /><input aria-label={t.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className={`${inputClass} ps-9`} /></label>
                </div>
                <div className="hidden grid-cols-[minmax(0,1.4fr)_100px_100px_110px] gap-3 border-b border-[#dce4ea] bg-[#edf2f5] px-4 py-2 font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3] sm:grid"><span>Property</span><span>{t.unitCount}</span><span>Occupancy</span><span>{t.tenant}</span></div>
                <div>
                  {filteredProperties.length === 0 ? <div className="px-5 py-12 text-center"><p className="text-[13px] font-semibold">{t.noRecords}</p><p className="mt-1 text-[10px] text-[#7c8d9d]">{t.noRecordsSub}</p></div> : filteredProperties.map((property, index) => {
                    const occupiedUnits = new Set(property.leases.map((lease) => lease.unit)).size;
                    return <button type="button" key={property.id} onClick={() => { setSelectedId(property.id); setSavedProperty(false); setShowLeaseForm(false); }} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-[#e1e7ec] px-4 py-3 text-start transition-colors last:border-b-0 hover:bg-[#edf3f7] sm:grid-cols-[minmax(0,1.4fr)_100px_100px_110px] sm:items-center sm:gap-3 ${selected?.id === property.id ? 'border-s-2 border-s-[#3f7cff] bg-[#eaf1f7]' : ''}`}>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center font-mono text-[9px] font-semibold ${index % 2 ? 'bg-[#e7e7df] text-[#596151]' : 'bg-[#dce8f3] text-[#375b7d]'}`}>{property.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</span>
                        <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{property.name}</span><span className="mt-1 flex items-center gap-1 truncate font-mono text-[8px] text-[#8192a3]"><MapPin size={9} />{[property.address, property.city, property.region].filter(Boolean).join(', ') || 'Address not added'}</span></span>
                      </span>
                      <span className="font-mono text-[10px] text-[#455d74]">{property.units.length} <span className="text-[8px] text-[#8192a3]">{t.units}</span></span>
                      <span className="font-mono text-[9px] text-[#455d74]">{occupiedUnits}/{property.units.length || 0} <span className="hidden text-[8px] text-[#8192a3] lg:inline">{t.occupied}</span></span>
                      <span className="hidden truncate text-[10px] text-[#536c83] sm:block">{property.leases[0]?.tenant || '—'}</span>
                    </button>;
                  })}
                </div>
              </section>
              {selected && <aside className="border border-[#d3dde5] bg-[#f5f8fa]">
                <div className="flex items-center justify-between border-b border-[#d8e1e8] px-4 py-3"><div><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8192a3]">{t.details}</p><p className="mt-1 text-[12px] font-semibold">{t.selected}</p></div><Home size={15} className="text-[#3f7cff]" /></div>
                <div className="p-4">
                  <h2 dir="auto" className="text-[17px] font-semibold tracking-[-.03em]">{selected.name}</h2>
                  <p className="mt-1 flex items-start gap-1.5 text-[10px] text-[#708398]"><MapPin size={12} className="mt-0.5 shrink-0" />{[selected.address, selected.city, selected.region].filter(Boolean).join(', ') || 'Address not added'}</p>
                  <dl className="mt-4 grid grid-cols-2 border-y border-[#dce4ea] py-3">
                    <div><dt className={labelClass}>{t.type}</dt><dd className="text-[10px] font-semibold">{selected.type}</dd></div>
                    <div><dt className={labelClass}>{t.unitCount}</dt><dd className="text-[10px] font-semibold">{selected.units.length}</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t.people}</p><button type="button" onClick={() => { setShowLeaseForm((current) => !current); setSavedLease(false); setFormError(''); }} className="text-[9px] font-semibold text-[#315b91] underline underline-offset-2">{showLeaseForm ? t.cancel : t.newLease}</button></div>
                  {selected.leases.length ? selected.leases.map((lease) => <div key={lease.id} className="mt-2 border border-[#dce4ea] bg-white p-3"><div className="flex justify-between gap-2"><p className="text-[11px] font-semibold">{lease.tenant}</p><span className="h-fit border border-[#b6d09d] bg-[#eff6e8] px-1.5 py-0.5 font-mono text-[7px] uppercase text-[#53753c]">{t.active}</span></div><p className="mt-1 text-[9px] text-[#718398]">{selected.name} <span className="text-[#a3b0bb]">/</span> {lease.unit}</p><div className="mt-2 flex justify-between border-t border-[#e8edf0] pt-2 font-mono text-[8px] text-[#718398]"><span>{formatMoney(lease.rent)} / mo</span><span>{formatDate(lease.end)}</span></div></div>) : <p className="mt-2 border border-dashed border-[#cbd7e1] px-3 py-4 text-center text-[10px] text-[#8192a3]">{t.noTenants}</p>}
                  {showLeaseForm && <form onSubmit={addLease} className="mt-3 grid gap-2 border-t border-[#dce4ea] pt-3">
                    {selected.units.length ? <>
                      <label><span className={labelClass}>{t.unit}</span><select name="unit" className={inputClass}>{selected.units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                      <label><span className={labelClass}>{t.tenantName} *</span><input name="tenant" required className={inputClass} /></label>
                      <label><span className={labelClass}>{t.tenantEmail}</span><input name="email" type="email" className={inputClass} /></label>
                      <label><span className={labelClass}>{t.tenantPhone}</span><input name="phone" className={inputClass} /></label>
                      <div className="grid grid-cols-2 gap-2"><label><span className={labelClass}>{t.startDate}</span><input name="start" required type="date" className={inputClass} /></label><label><span className={labelClass}>{t.endDate}</span><input name="end" required type="date" className={inputClass} /></label></div>
                      <label><span className={labelClass}>{t.rent}</span><input name="rent" type="number" min="1" required className={inputClass} /></label>
                      {formError && <p role="alert" className="text-[9px] text-red-700">{formError}</p>}
                      <button className={`${primaryClass} w-full`}>{t.saveLease}</button>
                    </> : <p className="text-[10px] text-[#718398]">{t.noUnits}</p>}
                  </form>}
                </div>
              </aside>}
            </div>
          )}

          {(view === 'tenants' || view === 'leases') && (
            <section className="border border-[#d3dde5] bg-[#f5f8fa]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1e8] px-4 py-3">
                <div><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8192a3]">{t.linkedHome}</p><p className="mt-1 text-[12px] font-semibold">{view === 'tenants' ? `${visiblePeople.length} tenants` : `${visiblePeople.length} leases`}</p></div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <label className="relative min-w-0 flex-1 sm:w-52"><Search size={13} className="absolute start-3 top-3 text-[#8395a6]" /><input aria-label={t.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className={`${inputClass} ps-9`} /></label>
                  <select aria-label={t.all} value={filterId} onChange={(event) => setFilterId(event.target.value)} className={`${inputClass} w-full sm:w-48`}><option value="all">{t.all}</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
                </div>
              </div>
              <div className="hidden grid-cols-[minmax(150px,1.1fr)_minmax(150px,1fr)_minmax(100px,.8fr)_110px_110px] gap-3 border-b border-[#dce4ea] bg-[#edf2f5] px-4 py-2 font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3] sm:grid">
                <span>{t.tenant}</span><span>{t.linkedHome}</span><span>{t.monthlyRent}</span><span>{t.term}</span><span>Status</span>
              </div>
              {visiblePeople.length === 0 ? <div className="px-5 py-14 text-center"><p className="text-[13px] font-semibold">{t.noRecords}</p><p className="mt-1 text-[10px] text-[#7c8d9d]">{t.noRecordsSub}</p></div> : visiblePeople.map(({ property, ...lease }) => (
                <button type="button" key={lease.id} onClick={() => { setSelectedId(property.id); setView('properties'); }} className="grid w-full gap-3 border-b border-[#e1e7ec] px-4 py-3 text-start transition-colors last:border-0 hover:bg-[#edf3f7] sm:grid-cols-[minmax(150px,1.1fr)_minmax(150px,1fr)_minmax(100px,.8fr)_110px_110px] sm:items-center">
                  <span className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center bg-[#dce8f3] font-mono text-[8px] font-semibold text-[#375b7d]">{lease.tenant.split(' ').map((word) => word[0]).join('')}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{lease.tenant}</span><span dir="ltr" className="block truncate text-[9px] text-[#8393a2]">{lease.email}</span></span></span>
                  <span className="text-[10px]"><span className="block font-semibold">{property.name}</span><span className="mt-0.5 block font-mono text-[8px] text-[#8192a3]">{lease.unit} <span className="px-1 text-[#bbc5cd]">/</span>{property.city}</span></span>
                  <span className="font-mono text-[10px]">{formatMoney(lease.rent)}</span>
                  <span className="font-mono text-[9px] text-[#64798d]">{formatDate(lease.end)}</span>
                  <span className={`w-fit border px-1.5 py-1 font-mono text-[7px] uppercase tracking-[.05em] ${lease.status === 'Ending soon' ? 'border-[#e1c59c] bg-[#f9f1e5] text-[#986522]' : 'border-[#b6d09d] bg-[#eff6e8] text-[#53753c]'}`}>{lease.status === 'Ending soon' ? t.ending : t.active}</span>
                </button>
              ))}
            </section>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-[#d2dce4] pt-3 font-mono text-[8px] uppercase tracking-[.08em] text-[#94a2af]"><span>Rently owner workspace</span><span>{t.demo}</span></div>
        </section>
      </div>
    </main>
  );
}
