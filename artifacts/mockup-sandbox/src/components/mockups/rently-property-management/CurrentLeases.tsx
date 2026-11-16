import { useState, type ChangeEvent } from 'react';
import { Download, FileText, Home, LoaderCircle, Plus, Upload, UsersRound } from 'lucide-react';
import './_group.css';

type Payment = {
  id: string;
  due_date: string;
  amount: number;
  paid_at: string | null;
};

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

type LeaseEntry = {
  property: { id: string; name: string };
  unit: { unit_label: string };
  lease: Lease;
};

function addMonths(value: Date, count: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + count);
  return date;
}

function toIso(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function makeDemoLeases(): LeaseEntry[] {
  const today = new Date();
  const todayIso = toIso(today);
  const priorDate = addMonths(today, -1);
  const nextDate = addMonths(today, 1);
  const dueDate = (date: Date, day: number) => {
    date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
    return toIso(date);
  };
  const startOne = addMonths(today, -5);
  const endOne = addMonths(today, 7);
  const startTwo = addMonths(today, -2);
  const endTwo = addMonths(today, 10);
  const dueDayOne = today.getDate();
  const dueDayTwo = 14;

  return [
    {
      property: { id: 'property-willow', name: 'Willow Court' },
      unit: { unit_label: '1842 Willow Ave, Apt 2B' },
      lease: {
        id: 'lease-willow',
        start_date: toIso(startOne),
        end_date: toIso(endOne),
        status: 'active',
        monthly_rent: 1850,
        due_day: dueDayOne,
        tenants: { full_name: 'Maya Chen', email: 'maya.chen@example.com', phone: '(503) 555-0148' },
        payments: [
          { id: 'payment-willow-prior', due_date: dueDate(priorDate, dueDayOne), amount: 1850, paid_at: toIso(new Date(priorDate.getFullYear(), priorDate.getMonth(), Math.min(dueDayOne + 1, 28))) },
          { id: 'payment-willow-current', due_date: todayIso, amount: 1850, paid_at: null },
          { id: 'payment-willow-next', due_date: dueDate(nextDate, dueDayOne), amount: 1850, paid_at: null },
        ],
      },
    },
    {
      property: { id: 'property-cedar', name: 'Cedar House' },
      unit: { unit_label: '725 Cedar Street, Unit 1' },
      lease: {
        id: 'lease-cedar',
        start_date: toIso(startTwo),
        end_date: toIso(endTwo),
        status: 'active',
        monthly_rent: 2200,
        due_day: dueDayTwo,
        tenants: { full_name: 'Jordan Rivera', email: 'jordan.rivera@example.com', phone: '(503) 555-0186' },
        payments: [
          { id: 'payment-cedar-prior', due_date: dueDate(addMonths(today, -1), dueDayTwo), amount: 2200, paid_at: toIso(new Date(addMonths(today, -1).getFullYear(), addMonths(today, -1).getMonth(), Math.min(dueDayTwo, 28))) },
          { id: 'payment-cedar-current', due_date: dueDate(new Date(today), dueDayTwo), amount: 2200, paid_at: null },
          { id: 'payment-cedar-next', due_date: dueDate(addMonths(today, 1), dueDayTwo), amount: 2200, paid_at: null },
        ],
      },
    },
  ];
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function statusOf(payment: Payment, today: string) {
  if (payment.paid_at) return { key: 'paid', label: 'Paid', cls: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]' };
  if (payment.due_date < today) return { key: 'overdue', label: 'Overdue', cls: 'border-red-300 bg-red-50 text-red-800' };
  if (payment.due_date === today) return { key: 'today', label: 'Due today', cls: 'border-[#3f7cff] bg-[#e6eeff] text-[#214a83]' };
  return { key: 'upcoming', label: 'Upcoming', cls: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]' };
}

function PaymentRow({ payment, today, onMarkPaid, onCorrectPaidDate }: {
  payment: Payment;
  today: string;
  onMarkPaid: () => void;
  onCorrectPaidDate: (paidAt: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [paidAt, setPaidAt] = useState(payment.paid_at ?? '');
  const [notice, setNotice] = useState('');
  const status = statusOf(payment, today);

  function markPaid() {
    setSaving(true);
    window.setTimeout(() => {
      onMarkPaid();
      setSaving(false);
    }, 250);
  }

  return (
    <li data-testid={`row-payment-${payment.id}`} className="grid gap-1.5 border-t border-[#e4e9ee] py-1.5 sm:grid-cols-[88px_76px_74px_minmax(0,1fr)] sm:items-center">
      <span className="text-start font-mono text-[9px] text-[#102238]">{formatDate(payment.due_date)}</span>
      <span dir="ltr" className="text-start font-mono text-[9px] tabular-nums text-[#47617a]">{formatMoney(payment.amount)}</span>
      <span data-testid={`status-payment-${payment.id}`} className={`w-fit border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] ${status.cls}`}>{status.label}</span>
      {payment.paid_at ? (
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[8px] text-[#3d6324]">Paid {formatDate(payment.paid_at)}</span>
            <button type="button" className="inline-flex min-h-8 items-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91]" onClick={() => { setPaidAt(payment.paid_at ?? ''); setCorrectionOpen((open) => !open); }}>
              Correct date / history
            </button>
          </div>
          {correctionOpen && (
            <form className="flex flex-wrap items-end gap-1.5" onSubmit={(event) => {
              event.preventDefault();
              onCorrectPaidDate(paidAt);
              setCorrectionOpen(false);
              setNotice('Payment date corrected locally.');
            }}>
              <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]">New paid date
                <input type="date" max={today} value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="min-h-8 border border-[#cbd7e1] bg-white px-2 text-[10px] normal-case tracking-normal text-[#102238]" />
              </label>
              <button className="inline-flex min-h-8 items-center border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 text-[8px] uppercase text-[#315b91]">Save</button>
              <button type="button" onClick={() => setCorrectionOpen(false)} className="text-[9px] text-[#61768b] underline">Cancel</button>
            </form>
          )}
          {notice && <p role="status" className="text-[9px] text-[#3d6324]">{notice}</p>}
        </div>
      ) : (
        <div className="grid gap-1">
          <button type="button" data-testid={`button-record-payment-${payment.id}`} disabled={saving} onClick={markPaid} className="inline-flex min-h-8 items-center justify-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91] transition-colors hover:border-[#3f7cff] disabled:opacity-60">
            {saving && <LoaderCircle size={10} className="animate-spin" />}
            Mark paid today
          </button>
        </div>
      )}
    </li>
  );
}

function LeasePdfDownloadButton({ leaseId }: { leaseId: string }) {
  const [notice, setNotice] = useState('');
  return (
    <div className="grid gap-1">
      <button type="button" data-testid={`button-download-pdf-${leaseId}`} onClick={() => setNotice('PDF generation is not connected in this isolated preview.')} className="inline-flex min-h-8 items-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91] transition-colors hover:border-[#3f7cff]">
        <Download size={10} /> Download draft lease PDF
      </button>
      {notice && <p role="status" className="text-[9px] text-[#718398]">{notice}</p>}
    </div>
  );
}

function LeaseDocumentControl({ leaseId }: { leaseId: string }) {
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState('');

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setNotice('File selection is local to this preview; it was not uploaded.');
  }

  return (
    <section data-testid={`lease-document-${leaseId}`} className="border border-[#d8e1e8] bg-[#f8fafb] p-3" aria-live="polite">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-[#cbd8e2] bg-[#e8eef3] text-[#3f7cff]"><FileText size={15} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold">Lease agreement file</p>
          {fileName ? <p className="mt-1 truncate text-[11px] text-[#536c83]">{fileName}</p> : <p className="mt-1 text-[11px] text-[#6b8094]">No file saved for this lease yet.</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 border border-[#c6d3df] bg-[#f4f7f9] px-3 text-[11px] font-semibold text-[#102238] hover:border-[#3f7cff]">
          <Upload size={13} /> {fileName ? 'Replace file' : 'Upload lease file'}
          <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={selectFile} />
        </label>
      </div>
      {notice && <p role="status" className="mt-2 text-[11px] text-[#1d6b45]">{notice}</p>}
      <p className="mt-2 font-mono text-[9px] text-[#8192a3]">Private, owner access only · PDF up to 25 MB</p>
    </section>
  );
}

function LeaseRecord({ lease, today, onPaymentChange }: {
  lease: Lease;
  today: string;
  onPaymentChange: (paymentId: string, paidAt: string | null) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const payments = [...(lease.payments ?? [])].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const open = payments.filter((payment) => !payment.paid_at);
  const overdue = open.filter((payment) => payment.due_date < today).length;
  const visible = showAll ? payments : open.slice(0, 4);
  const hasTerms = lease.monthly_rent != null && lease.due_day != null;
  const tenant = lease.tenants;
  const statusLabel: Record<string, string> = { active: 'Active', ended: 'Ended', upcoming: 'Upcoming' };
  const dt = 'font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]';

  return (
    <article data-testid={`card-lease-${lease.id}`} className="border border-[#e1e7ec] bg-white/60 p-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p data-testid={`text-tenant-${lease.id}`} dir="auto" className="truncate text-[11px] font-semibold">{tenant?.full_name ?? 'Tenant unavailable'}</p>
          <p className="mt-0.5 font-mono text-[8px] text-[#778a9c]"><bdi>{formatDate(lease.start_date)} / {formatDate(lease.end_date)}</bdi> <span className="uppercase text-[#47617a]">[{statusLabel[lease.status] ?? lease.status}]</span></p>
        </div>
        {hasTerms && <LeasePdfDownloadButton leaseId={lease.id} />}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <div><dt className={dt}>Email</dt><dd dir="ltr" className="break-all text-start text-[9px] font-semibold">{tenant?.email ?? '--'}</dd></div>
        <div><dt className={dt}>Phone</dt><dd dir="ltr" className="text-start text-[9px] font-semibold">{tenant?.phone ?? '--'}</dd></div>
        <div><dt className={dt}>Rent / mo</dt><dd className="font-mono text-[9px] font-semibold">{lease.monthly_rent != null ? <bdi dir="ltr">{formatMoney(lease.monthly_rent)}</bdi> : <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
        <div><dt className={dt}>Due day</dt><dd className="font-mono text-[9px] font-semibold">{lease.due_day ?? <span className="text-[#b0651f]">Terms missing</span>}</dd></div>
      </dl>
      <div className="mt-2.5">
        <div className="flex items-center justify-between gap-2 pb-1">
          <p className="font-mono text-[7px] uppercase tracking-[.1em] text-[#64798d]">Dues <bdi dir="ltr">{payments.length - open.length}/{payments.length}</bdi> paid{overdue > 0 && <span className="ms-1.5 text-red-700">{overdue} overdue</span>}</p>
          {payments.length > 0 && <button type="button" data-testid={`button-toggle-dues-${lease.id}`} onClick={() => setShowAll((value) => !value)} className="font-mono text-[7px] uppercase tracking-[.06em] text-[#315b91] underline underline-offset-2">{showAll ? 'Open only' : 'All dues'}</button>}
        </div>
        {payments.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#718398]">{hasTerms ? 'No dues generated.' : 'Lease terms missing. No dues.'}</p>
        ) : visible.length === 0 ? (
          <p className="border-t border-[#e4e9ee] pt-1.5 text-[9px] text-[#3d6324]">All dues paid.</p>
        ) : (
          <ul>{visible.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              today={today}
              onMarkPaid={() => onPaymentChange(payment.id, today)}
              onCorrectPaidDate={(paidAt) => onPaymentChange(payment.id, paidAt)}
            />
          ))}</ul>
        )}
      </div>
      <details className="mt-2.5 border-t border-[#e4e9ee] pt-2 text-[10px]">
        <summary className="cursor-pointer font-semibold text-[#315b91]">Signed lease file</summary>
        <div className="mt-2"><LeaseDocumentControl key={lease.id} leaseId={lease.id} /></div>
      </details>
    </article>
  );
}

function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M11 4.75h19.4L43.25 17.6v19.15L30.4 43.25H11L4.75 37V11L11 4.75Z" stroke="#102238" strokeWidth="2.5" />
      <path d="M15.5 33V15h10.1c4.15 0 6.4 2.1 6.4 5.55 0 3.3-2.25 5.35-6.4 5.35h-5.45" stroke="#3f7cff" strokeWidth="3.4" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="m24.4 25.8 8.1 8.1" stroke="#102238" strokeWidth="2.7" strokeLinecap="square" />
      <path d="M31 5v8h8" stroke="#3f7cff" strokeWidth="2.5" />
    </svg>
  );
}

export function CurrentLeases() {
  const [entries, setEntries] = useState(makeDemoLeases);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const today = toIso(new Date());

  function updatePayment(paymentId: string, paidAt: string | null) {
    setEntries((current) => current.map((entry) => ({
      ...entry,
      lease: {
        ...entry.lease,
        payments: entry.lease.payments.map((payment) => payment.id === paymentId ? { ...payment, paid_at: paidAt } : payment),
      },
    })));
  }

  return (
    <main dir="ltr" className="rently-property-management min-h-screen bg-[#eef3f7] text-[#102238]">
      <header className="sticky top-0 z-20 border-b border-[#d1dbe4] bg-[#f8fafb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#leases" className="flex items-center gap-2.5" aria-label="Rently dashboard">
            <BrandMark />
            <span className="text-lg font-bold tracking-[-.07em]">rently<span className="text-[#3f7cff]">/</span></span>
          </a>
          <nav aria-label="Property management" className="order-3 flex w-full gap-2 overflow-x-auto pb-0.5 sm:order-2 sm:w-auto">
            <a href="#properties" className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-transparent px-3 text-xs font-semibold text-[#61768b] hover:border-[#cbd7e1] hover:bg-white"><Home size={14} /> Properties</a>
            <a href="#tenants" className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-transparent px-3 text-xs font-semibold text-[#61768b] hover:border-[#cbd7e1] hover:bg-white"><UsersRound size={14} /> Tenants</a>
            <a href="#leases" aria-current="page" className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-[#102238] bg-[#102238] px-3 text-xs font-semibold text-white"><FileText size={14} /> Leases</a>
          </nav>
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <button type="button" className="min-h-9 border border-[#cbd7e1] px-2.5 text-[11px] font-semibold text-[#425b72]" aria-label="Language">EN</button>
            <span dir="ltr" className="hidden max-w-40 truncate text-[11px] text-[#718398] lg:block">owner@example.com</span>
            <button type="button" onClick={() => setShowAddNotice(false)} className="min-h-9 border border-[#cbd7e1] px-3 text-[11px] font-semibold text-[#425b72] hover:bg-white">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#3f7cff]">Owner workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-.05em] sm:text-3xl">Leases</h1>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Lease records</h2>
            <button type="button" onClick={() => setShowAddNotice((value) => !value)} className="inline-flex min-h-9 items-center gap-2 bg-[#102238] px-3 text-xs font-semibold text-white">
              <Plus size={13} /> Add tenant and lease
            </button>
          </div>
          {showAddNotice && <p role="status" className="border border-[#d1dbe4] bg-white px-4 py-3 text-xs text-[#718398]">Tenant and lease creation is available from the Tenants section.</p>}
          {entries.length === 0 ? (
            <div className="border border-dashed border-[#cbd7e1] bg-white p-6 text-center">
              <p className="text-sm font-semibold text-[#102238]">No leases yet.</p>
              <div className="mt-3 flex justify-center"><a href="#tenants" className="text-xs font-semibold text-[#315b91] underline">Create a tenant and lease</a></div>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.lease.id} className="border border-[#d1dbe4] bg-white p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p dir="auto" className="text-sm font-semibold">{entry.property.name} · {entry.unit.unit_label}</p>
                  <a href={`#${encodeURIComponent(entry.lease.id)}`} className="text-xs font-semibold text-[#315b91] underline">Lease details</a>
                </div>
                <LeaseRecord
                  lease={entry.lease}
                  today={today}
                  onPaymentChange={updatePayment}
                />
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
