import { useState, type ChangeEvent } from 'react';
import { Building2, Check, ChevronDown, Download, FileText, Home, Languages, LoaderCircle, Plus, Upload, UsersRound } from 'lucide-react';
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
type LeaseEntry = { property: { id: string; name: string }; unit: { unit_label: string }; lease: Lease };
type Lang = 'en' | 'ar';

const words = {
  en: {
    portfolio: 'OWNER WORKSPACE', nav: ['Properties', 'Tenants', 'Leases'], eyebrow: 'PROPERTY OPERATIONS / LEASE REGISTER',
    title: 'Leases', subtitle: 'Every agreement, payment, and home in one verifiable record.',
    active: 'ACTIVE AGREEMENTS', rentRoll: 'MONTHLY RENT ROLL', attention: 'PAYMENTS TO REVIEW', period: 'CURRENT PERIOD',
    records: 'Lease register', add: 'Add tenant and lease', addNotice: 'Tenant and lease creation is available from the Tenants section.',
    tenant: 'TENANT', property: 'PROPERTY / UNIT', term: 'LEASE TERM', monthly: 'MONTHLY RENT', due: 'DUE DAY',
    dues: 'Payment activity', paid: 'Paid', overdue: 'Overdue', today: 'Due today', upcoming: 'Upcoming', markPaid: 'Mark paid today',
    correct: 'Correct date / history', newDate: 'New paid date', save: 'Save date', cancel: 'Cancel', corrected: 'Payment date corrected locally.',
    openOnly: 'Open only', allDues: 'All dues', paidCount: 'paid', overdueCount: 'overdue', noDues: 'No dues generated.',
    missing: 'Lease terms missing. No dues.', allPaid: 'All dues paid.', pdf: 'Download draft lease PDF',
    pdfNotice: 'PDF generation is not connected in this isolated preview.', signed: 'Signed lease file',
    agreement: 'Lease agreement file', noFile: 'No file saved for this lease yet.', upload: 'Upload lease file',
    replace: 'Replace file', fileNotice: 'File selection is local to this preview; it was not uploaded.',
    privacy: 'Private, owner access only · PDF up to 25 MB', activeStatus: 'Active', endedStatus: 'Ended', upcomingStatus: 'Upcoming',
    noTenant: 'Tenant unavailable', termsMissing: 'Terms missing', empty: 'No leases yet.', emptyAction: 'Create a tenant and lease',
    detail: 'Lease details', signedLabel: 'DOCUMENT', language: 'عربي', signOut: 'Sign out', owner: 'owner@example.com',
    none: '--', contact: 'CONTACT', status: 'STATUS',
  },
  ar: {
    portfolio: 'مساحة المالك', nav: ['العقارات', 'المستأجرون', 'عقود الإيجار'], eyebrow: 'عمليات العقارات / سجل العقود',
    title: 'عقود الإيجار', subtitle: 'اتفاقيات ومدفوعات ومنازل ضمن سجل واحد واضح.',
    active: 'العقود السارية', rentRoll: 'إجمالي الإيجار الشهري', attention: 'دفعات للمراجعة', period: 'الفترة الحالية',
    records: 'سجل العقود', add: 'إضافة مستأجر وعقد', addNotice: 'يمكن إنشاء المستأجر والعقد من قسم المستأجرين.',
    tenant: 'المستأجر', property: 'العقار / الوحدة', term: 'مدة العقد', monthly: 'الإيجار الشهري', due: 'يوم الاستحقاق',
    dues: 'حركة الدفعات', paid: 'مدفوع', overdue: 'متأخر', today: 'مستحق اليوم', upcoming: 'قادم', markPaid: 'تسجيل الدفع اليوم',
    correct: 'تصحيح التاريخ / السجل', newDate: 'تاريخ الدفع الجديد', save: 'حفظ التاريخ', cancel: 'إلغاء', corrected: 'تم تصحيح تاريخ الدفع محلياً.',
    openOnly: 'المفتوحة فقط', allDues: 'كل الدفعات', paidCount: 'مدفوعة', overdueCount: 'متأخرة', noDues: 'لم يتم إنشاء دفعات.',
    missing: 'شروط العقد غير مكتملة. لا توجد دفعات.', allPaid: 'تم دفع جميع المستحقات.', pdf: 'تنزيل مسودة عقد PDF',
    pdfNotice: 'إنشاء PDF غير متصل في هذه المعاينة المعزولة.', signed: 'ملف العقد الموقّع',
    agreement: 'ملف اتفاقية الإيجار', noFile: 'لا يوجد ملف محفوظ لهذا العقد بعد.', upload: 'رفع ملف العقد',
    replace: 'استبدال الملف', fileNotice: 'اختيار الملف محلي لهذه المعاينة ولم يتم رفعه.',
    privacy: 'خاص، للمالك فقط · PDF حتى 25 ميغابايت', activeStatus: 'ساري', endedStatus: 'منتهٍ', upcomingStatus: 'قادم',
    noTenant: 'المستأجر غير متاح', termsMissing: 'الشروط غير مكتملة', empty: 'لا توجد عقود بعد.', emptyAction: 'إنشاء مستأجر وعقد',
    detail: 'تفاصيل العقد', signedLabel: 'مستند', language: 'English', signOut: 'تسجيل الخروج', owner: 'owner@example.com',
    none: '—', contact: 'التواصل', status: 'الحالة',
  },
};

function addMonths(value: Date, count: number) { const date = new Date(value); date.setMonth(date.getMonth() + count); return date; }
function toIso(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function monthDue(value: Date, day: number) {
  const date = new Date(value);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return toIso(date);
}
function makeDemoLeases(): LeaseEntry[] {
  const today = new Date(); const todayIso = toIso(today); const prior = addMonths(today, -1);
  const next = addMonths(today, 1); const startOne = addMonths(today, -5); const endOne = addMonths(today, 7);
  const startTwo = addMonths(today, -2); const endTwo = addMonths(today, 10); const dueOne = today.getDate(); const dueTwo = 14;
  return [
    { property: { id: 'property-willow', name: 'Willow Court' }, unit: { unit_label: '1842 Willow Ave, Apt 2B' }, lease: {
      id: 'lease-willow', start_date: toIso(startOne), end_date: toIso(endOne), status: 'active', monthly_rent: 1850, due_day: dueOne,
      tenants: { full_name: 'Maya Chen', email: 'maya.chen@example.com', phone: '(503) 555-0148' },
      payments: [
        { id: 'payment-willow-prior', due_date: monthDue(prior, dueOne), amount: 1850, paid_at: toIso(new Date(prior.getFullYear(), prior.getMonth(), Math.min(dueOne + 1, 28))) },
        { id: 'payment-willow-current', due_date: todayIso, amount: 1850, paid_at: null },
        { id: 'payment-willow-next', due_date: monthDue(next, dueOne), amount: 1850, paid_at: null },
      ],
    } },
    { property: { id: 'property-cedar', name: 'Cedar House' }, unit: { unit_label: '725 Cedar Street, Unit 1' }, lease: {
      id: 'lease-cedar', start_date: toIso(startTwo), end_date: toIso(endTwo), status: 'active', monthly_rent: 2200, due_day: dueTwo,
      tenants: { full_name: 'Jordan Rivera', email: 'jordan.rivera@example.com', phone: '(503) 555-0186' },
      payments: [
        { id: 'payment-cedar-prior', due_date: monthDue(prior, dueTwo), amount: 2200, paid_at: toIso(new Date(prior.getFullYear(), prior.getMonth(), Math.min(dueTwo, 28))) },
        { id: 'payment-cedar-current', due_date: monthDue(today, dueTwo), amount: 2200, paid_at: null },
        { id: 'payment-cedar-next', due_date: monthDue(next, dueTwo), amount: 2200, paid_at: null },
      ],
    } },
  ];
}
function dateLabel(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
function money(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
function paymentState(payment: Payment, today: string, t: typeof words.en) {
  if (payment.paid_at) return { key: 'paid', label: t.paid };
  if (payment.due_date < today) return { key: 'overdue', label: t.overdue };
  if (payment.due_date === today) return { key: 'today', label: t.today };
  return { key: 'upcoming', label: t.upcoming };
}

function PaymentRow({ payment, today, lang, t, onChange }: {
  payment: Payment; today: string; lang: Lang; t: typeof words.en; onChange: (id: string, date: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(payment.paid_at ?? '');
  const [notice, setNotice] = useState('');
  const state = paymentState(payment, today, t);
  function markPaid() {
    setSaving(true);
    window.setTimeout(() => { onChange(payment.id, today); setSaving(false); }, 250);
  }
  return (
    <li className="grid gap-2 border-t border-[#e4e9ee] py-2 sm:grid-cols-[minmax(92px,.7fr)_minmax(70px,.5fr)_auto_minmax(0,1.4fr)] sm:items-center">
      <span className="font-mono text-[10px] text-[#30485c]">{dateLabel(payment.due_date, lang)}</span>
      <bdi dir="ltr" className="text-start font-mono text-[10px] tabular-nums text-[#47617a]">{money(payment.amount, lang)}</bdi>
      <span className={`w-fit border px-2 py-1 font-mono text-[8px] uppercase tracking-[.06em] ${state.key === 'paid' ? 'border-[#bfd2a9] bg-[#eef4e8] text-[#476832]' : state.key === 'overdue' ? 'border-[#e1b7ad] bg-[#f8ece8] text-[#9a473b]' : state.key === 'today' ? 'border-[#b4c9dc] bg-[#eaf1f6] text-[#315b7b]' : 'border-[#d4dfe5] bg-[#f2f6f7] text-[#61798a]'}`}>{state.label}</span>
      {payment.paid_at ? (
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[9px] text-[#496b35]">{t.paid} · {dateLabel(payment.paid_at, lang)}</span>
            <button type="button" onClick={() => { setPaidAt(payment.paid_at ?? ''); setCorrectionOpen((open) => !open); }} className="min-h-8 border border-[#d1dce1] bg-[#f5f7f6] px-2.5 font-mono text-[8px] uppercase tracking-[.04em] text-[#315b75] hover:border-[#678ba0]">{t.correct}</button>
          </div>
          {correctionOpen && <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
            event.preventDefault(); onChange(payment.id, paidAt); setCorrectionOpen(false); setNotice(t.corrected);
          }}>
            <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.06em] text-[#667b8e]">{t.newDate}
              <input aria-label={t.newDate} type="date" max={today} value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="min-h-9 border border-[#cbd7e1] bg-white px-2 text-[10px] normal-case tracking-normal text-[#102238]" />
            </label>
            <button className="min-h-9 border border-[#c5d4e0] bg-[#f2f6f9] px-3 font-mono text-[8px] uppercase text-[#315b91]">{t.save}</button>
            <button type="button" onClick={() => setCorrectionOpen(false)} className="min-h-9 px-2 text-[9px] text-[#61768b] underline">{t.cancel}</button>
          </form>}
          {notice && <p role="status" className="text-[9px] text-[#496b35]">{notice}</p>}
        </div>
      ) : <button type="button" disabled={saving} onClick={markPaid} className="inline-flex min-h-9 w-fit items-center justify-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-3 font-mono text-[8px] uppercase tracking-[.04em] text-[#315b91] hover:border-[#6d91a6] disabled:opacity-60">
        {saving && <LoaderCircle size={11} className="animate-spin" />}{t.markPaid}
      </button>}
    </li>
  );
}

function SignedFile({ leaseId, lang, t }: { leaseId: string; lang: Lang; t: typeof words.en }) {
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState('');
  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setFileName(file.name); setNotice(t.fileNotice);
  }
  return <section data-testid={`lease-document-${leaseId}`} className="border border-[#d8e1e8] bg-[#f7f9f8] p-3" aria-live="polite">
    <div className="flex items-start gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#d2ddd9] bg-[#eaf0ec] text-[#426e60]"><FileText size={16} /></span>
      <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">{t.agreement}</p>
        {fileName ? <p className="mt-1 truncate text-[11px] text-[#536c83]">{fileName}</p> : <p className="mt-1 text-[11px] text-[#6b8094]">{t.noFile}</p>}
      </div>
    </div>
    <label className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-2 border border-[#c6d3df] bg-[#f4f7f5] px-3 text-[10px] font-semibold text-[#304a41] hover:border-[#789588]">
      <Upload size={13} />{fileName ? t.replace : t.upload}
      <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={selectFile} />
    </label>
    {notice && <p role="status" className="mt-2 text-[10px] text-[#496b35]">{notice}</p>}
    <p className="mt-2 font-mono text-[8px] text-[#8192a3]">{t.privacy}</p>
  </section>;
}

function LeaseCard({ entry, today, lang, t, onPaymentChange }: {
  entry: LeaseEntry; today: string; lang: Lang; t: typeof words.en; onPaymentChange: (id: string, date: string | null) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');
  const payments = [...entry.lease.payments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const open = payments.filter((payment) => !payment.paid_at);
  const overdue = open.filter((payment) => payment.due_date < today).length;
  const visible = showAll ? payments : open.slice(0, 4);
  const lease = entry.lease;
  const hasTerms = lease.monthly_rent != null && lease.due_day != null;
  const statusLabel = lease.status === 'active' ? t.activeStatus : lease.status === 'ended' ? t.endedStatus : lease.status === 'upcoming' ? t.upcomingStatus : lease.status;
  const dt = 'font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]';
  return <article data-testid={`card-lease-${lease.id}`} className="overflow-hidden border border-[#dce4df] bg-[#fffefa]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e9e5] bg-[#f6f8f5] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#dce4df] bg-[#e8efeb] text-[#466d5e]"><Building2 size={16} /></span>
        <div className="min-w-0">
          <p dir="auto" className="truncate text-[12px] font-semibold">{entry.property.name}</p>
          <p dir="auto" className="mt-0.5 truncate font-mono text-[9px] text-[#718398]">{entry.unit.unit_label}</p>
        </div>
      </div>
      <a href={`#${encodeURIComponent(lease.id)}`} className="min-h-8 inline-flex items-center gap-1.5 px-2 text-[10px] font-semibold text-[#486b5c] underline underline-offset-2">{t.detail}</a>
    </header>

    <div className="grid lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.35fr)]">
      <section className="border-b border-[#e4e9e5] p-4 sm:p-5 lg:border-b-0 lg:border-e">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={dt}>{t.tenant}</p>
            <p data-testid={`text-tenant-${lease.id}`} dir="auto" className="mt-1 text-[17px] font-semibold tracking-[-.035em]">{lease.tenants?.full_name ?? t.noTenant}</p>
          </div>
          <span className="border border-[#c9d7c0] bg-[#eff4eb] px-2 py-1 font-mono text-[8px] uppercase tracking-[.06em] text-[#536e42]">{statusLabel}</span>
        </div>
        <div className="mt-4 border-y border-[#e5eae6] py-3">
          <p className={`${dt} mb-2`}>{t.contact}</p>
          <div className="grid gap-1.5 text-[10px]">
            <a dir="ltr" className="w-fit text-[#496b80] underline decoration-[#c5d2ce] underline-offset-2" href={lease.tenants?.email ? `mailto:${lease.tenants.email}` : undefined}>{lease.tenants?.email ?? t.none}</a>
            <a dir="ltr" className="w-fit text-[#496b80] underline decoration-[#c5d2ce] underline-offset-2" href={lease.tenants?.phone ? `tel:${lease.tenants.phone}` : undefined}>{lease.tenants?.phone ?? t.none}</a>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <div><dt className={dt}>{t.term}</dt><dd className="mt-1 font-mono text-[9px] text-[#30485c]"><bdi>{dateLabel(lease.start_date, lang)} – {dateLabel(lease.end_date, lang)}</bdi></dd></div>
          <div><dt className={dt}>{t.due}</dt><dd className="mt-1 font-mono text-[11px] font-semibold">{lease.due_day ?? <span className="text-[#a36636]">{t.termsMissing}</span>}</dd></div>
          <div className="col-span-2"><dt className={dt}>{t.monthly}</dt><dd className="mt-1 font-mono text-[16px] font-semibold tracking-[-.03em]">{lease.monthly_rent != null ? <bdi dir="ltr">{money(lease.monthly_rent, lang)}</bdi> : <span className="text-[10px] text-[#a36636]">{t.termsMissing}</span>}</dd></div>
        </dl>
        {hasTerms && <div className="mt-4">
          <button type="button" onClick={() => setPdfNotice(t.pdfNotice)} className="inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#cad7d1] bg-[#f5f8f5] px-3 text-[9px] font-semibold text-[#466b5b] transition-colors hover:border-[#819e90]">
            <Download size={13} />{t.pdf}
          </button>
          {pdfNotice && <p role="status" className="mt-1.5 text-[9px] text-[#718398]">{pdfNotice}</p>}
        </div>}
      </section>

      <section className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#789184]">{t.period}</p><h3 className="mt-1 text-[13px] font-semibold">{t.dues}</h3></div>
          <div className="text-end">
            <p className="font-mono text-[9px] text-[#718398]"><bdi dir="ltr">{payments.length - open.length}/{payments.length}</bdi> {t.paidCount}</p>
            {overdue > 0 && <p className="mt-1 font-mono text-[8px] text-[#9a473b]">{overdue} {t.overdueCount}</p>}
          </div>
        </div>
        {payments.length > 0 && <div className="mt-2 grid grid-cols-[minmax(92px,.7fr)_minmax(70px,.5fr)_auto_minmax(0,1.4fr)] gap-2 border-y border-[#e4e9e5] bg-[#f6f8f6] px-2 py-1.5 font-mono text-[7px] uppercase tracking-[.07em] text-[#8a9a91]">
          <span>{t.period}</span><span>{t.monthly}</span><span>{t.status}</span><span aria-hidden="true" />
        </div>}
        {payments.length === 0 ? <p className="mt-3 border-t border-[#e4e9ee] pt-3 text-[10px] text-[#718398]">{hasTerms ? t.noDues : t.missing}</p> : visible.length === 0
          ? <p className="mt-3 border-t border-[#e4e9ee] pt-3 text-[10px] text-[#496b35]">{t.allPaid}</p>
          : <ul>{visible.map((payment) => <PaymentRow key={payment.id} payment={payment} today={today} lang={lang} t={t} onChange={onPaymentChange} />)}</ul>}
        {payments.length > 0 && <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-2 inline-flex min-h-8 items-center gap-1 text-[9px] font-semibold text-[#496b5c] underline underline-offset-2">
          {showAll ? t.openOnly : t.allDues}<ChevronDown size={12} className={showAll ? 'rotate-180' : ''} />
        </button>}
        <details className="mt-4 border-t border-[#e4e9e5] pt-3">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-[10px] font-semibold text-[#486b5c] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2"><FileText size={13} />{t.signed}</span>
            <span className="font-mono text-[7px] uppercase tracking-[.08em] text-[#94a39a]">{t.signedLabel}</span>
          </summary>
          <div className="mt-2"><SignedFile key={lease.id} leaseId={lease.id} lang={lang} t={t} /></div>
        </details>
      </section>
    </div>
  </article>;
}

function BrandMark() {
  return <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M11 4.75h19.4L43.25 17.6v19.15L30.4 43.25H11L4.75 37V11L11 4.75Z" stroke="#173b32" strokeWidth="2.5" />
    <path d="M15.5 33V15h10.1c4.15 0 6.4 2.1 6.4 5.55 0 3.3-2.25 5.35-6.4 5.35h-5.45" stroke="#789b83" strokeWidth="3.4" strokeLinecap="square" />
    <path d="m24.4 25.8 8.1 8.1M31 5v8h8" stroke="#173b32" strokeWidth="2.5" strokeLinecap="square" />
  </svg>;
}

export function OrganizedLeases() {
  const [entries, setEntries] = useState(makeDemoLeases);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const t = words[lang]; const isArabic = lang === 'ar'; const today = toIso(new Date());
  const paidAttention = entries.reduce((count, entry) => count + entry.lease.payments.filter((payment) => !payment.paid_at && payment.due_date <= today).length, 0);
  const rentRoll = entries.reduce((sum, entry) => sum + (entry.lease.monthly_rent ?? 0), 0);
  function updatePayment(paymentId: string, paidAt: string | null) {
    setEntries((current) => current.map((entry) => ({
      ...entry, lease: { ...entry.lease, payments: entry.lease.payments.map((payment) => payment.id === paymentId ? { ...payment, paid_at: paidAt } : payment) },
    })));
  }
  const metrics = [
    { label: t.active, value: String(entries.filter((entry) => entry.lease.status === 'active').length).padStart(2, '0'), icon: FileText },
    { label: t.rentRoll, value: money(rentRoll, lang), icon: Building2 },
    { label: t.attention, value: String(paidAttention).padStart(2, '0'), icon: Check },
  ];
  return <main dir={isArabic ? 'rtl' : 'ltr'} className="rently-property-management min-h-[100dvh] bg-[#edf2ed] text-[#173b32]">
    <header className="sticky top-0 z-20 border-b border-[#d4dfd8] bg-[#f7f8f4]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <a href="#leases" aria-label="Rently dashboard" className="flex items-center gap-2.5">
          <BrandMark /><span className="text-[19px] font-bold tracking-[-.07em]">rently<span className="text-[#789b83]">/</span></span>
        </a>
        <nav aria-label={t.portfolio} className="order-3 flex w-full gap-1 overflow-x-auto pb-0.5 sm:order-2 sm:w-auto">
          <a href="#properties" className="inline-flex min-h-10 shrink-0 items-center gap-2 px-3 text-[10px] font-semibold text-[#718398] hover:bg-[#edf2ed]"><Home size={14} />{t.nav[0]}</a>
          <a href="#tenants" className="inline-flex min-h-10 shrink-0 items-center gap-2 px-3 text-[10px] font-semibold text-[#718398] hover:bg-[#edf2ed]"><UsersRound size={14} />{t.nav[1]}</a>
          <a href="#leases" aria-current="page" className="inline-flex min-h-10 shrink-0 items-center gap-2 border-b-2 border-[#426d5d] bg-[#eaf0eb] px-3 text-[10px] font-semibold text-[#264c3e]"><FileText size={14} />{t.nav[2]}</a>
        </nav>
        <div className="order-2 flex items-center gap-2 sm:order-3">
          <button type="button" onClick={() => setLang(isArabic ? 'en' : 'ar')} className="inline-flex min-h-9 items-center gap-1.5 border border-[#cbd7d1] px-2.5 text-[10px] font-semibold text-[#425b50] hover:bg-white" aria-label="Toggle language"><Languages size={13} />{t.language}</button>
          <span dir="ltr" className="hidden max-w-40 truncate font-mono text-[9px] text-[#718398] lg:block">{words.en.owner}</span>
          <button type="button" onClick={() => setShowAddNotice(false)} className="min-h-9 border border-[#cbd7d1] px-3 text-[10px] font-semibold text-[#425b50] hover:bg-white">{t.signOut}</button>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[.13em] text-[#789b83]">{t.eyebrow}</p>
          <h1 className="mt-1 text-[27px] font-semibold tracking-[-.05em] sm:text-[32px]">{t.title}</h1>
          <p className="mt-1 max-w-xl text-[11px] text-[#718398]">{t.subtitle}</p>
        </div>
        <p className="inline-flex items-center gap-2 border border-[#d5ded8] bg-[#f6f8f5] px-3 py-2 font-mono text-[8px] uppercase tracking-[.08em] text-[#81938a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#789b83]" />{t.portfolio}
        </p>
      </div>

      <section aria-label={t.period} className="mb-6 grid border border-[#d2ddd6] bg-[#f7f8f4] sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }, index) => <div key={label} className={`flex min-h-[72px] items-center gap-3 px-4 py-3 ${index ? 'border-t border-[#dce4df] sm:border-t-0 sm:border-s' : ''}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#e8efea] text-[#668777]"><Icon size={15} /></span>
          <div className="min-w-0"><p className="font-mono text-[7px] uppercase tracking-[.1em] text-[#81938a]">{label}</p><p className="mt-1 truncate text-[16px] font-semibold tracking-[-.035em]">{value}</p></div>
        </div>)}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5"><h2 className="text-[13px] font-semibold">{t.records}</h2><span className="font-mono text-[8px] text-[#8b9a91]">{String(entries.length).padStart(2, '0')} {t.nav[2]}</span></div>
          <button type="button" onClick={() => setShowAddNotice((value) => !value)} className="inline-flex min-h-9 items-center gap-2 bg-[#173b32] px-3 text-[10px] font-semibold text-[#f7f8f4] hover:bg-[#2a5648]">
            <Plus size={13} />{t.add}
          </button>
        </div>
        {showAddNotice && <p role="status" className="mb-3 border-s-2 border-[#789b83] bg-[#f7f8f4] px-4 py-3 text-[11px] text-[#718398]">{t.addNotice}</p>}
        {entries.length === 0 ? <div className="border border-dashed border-[#cbd7d1] bg-[#f8f9f6] p-8 text-center">
          <p className="text-[13px] font-semibold">{t.empty}</p><a href="#tenants" className="mt-3 inline-block text-[10px] font-semibold text-[#496b5c] underline">{t.emptyAction}</a>
        </div> : <div className="grid gap-4">{entries.map((entry) => <LeaseCard key={entry.lease.id} entry={entry} today={today} lang={lang} t={t} onPaymentChange={updatePayment} />)}</div>}
      </section>
    </div>
  </main>;
}
