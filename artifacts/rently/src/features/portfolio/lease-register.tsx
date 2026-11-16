import { AlertTriangle, Building2, ChevronDown, FileText, Plus, Wallet } from 'lucide-react';
import { Link } from 'wouter';
import { useI18n, useLocalizedFormats } from '@/lib/i18n';
import { propertyLocation, type Lease, type PropertyDetails, type Unit } from '@/lib/rently-data';
import { LeaseRecord } from './lease-record';
import { leaseStatusOnDate } from './lease-status';

type LeaseEntry = {
  property: PropertyDetails;
  unit: Unit;
  lease: Lease;
};

type Props = {
  entries: LeaseEntry[];
  token: string;
  userId: string;
  today: string;
};

function paymentSummary(entry: LeaseEntry, today: string, t: (en: string, ar: string) => string) {
  const payments = [...entry.lease.payments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const nextPayment = payments.find((payment) => !payment.paid_at);
  if (!payments.length) {
    return {
      date: null,
      label: entry.lease.monthly_rent != null && entry.lease.due_day != null
        ? t('No dues generated', 'لم تُنشأ دفعات بعد')
        : t('Lease terms missing', 'شروط العقد ناقصة'),
      tone: 'neutral',
      attentionCount: 0,
    };
  }
  if (!nextPayment) {
    return { date: null, label: t('All paid', 'مدفوع بالكامل'), tone: 'paid', attentionCount: 0 };
  }
  const attentionCount = payments.filter((payment) => !payment.paid_at && payment.due_date <= today).length;
  if (nextPayment.due_date < today) {
    return { date: nextPayment.due_date, label: t('Overdue', 'متأخر'), tone: 'overdue', attentionCount };
  }
  if (nextPayment.due_date === today) {
    return { date: nextPayment.due_date, label: t('Due today', 'مستحق اليوم'), tone: 'today', attentionCount };
  }
  return { date: nextPayment.due_date, label: t('Upcoming', 'قادم'), tone: 'upcoming', attentionCount };
}

function LeaseSummaryCard({ entry, token, userId, today }: Omit<Props, 'entries'> & { entry: LeaseEntry }) {
  const { t, direction } = useI18n();
  const { formatDate, formatMoney } = useLocalizedFormats();
  const lease = entry.lease;
  const tenantName = lease.tenants?.full_name ?? t('Tenant unavailable', 'المستأجر غير متاح');
  const payment = paymentSummary(entry, today, t);
  const effectiveStatus = leaseStatusOnDate(lease, today);
  const leaseStatus = effectiveStatus === 'active'
    ? t('Active', 'ساري')
    : effectiveStatus === 'ended'
      ? t('Ended', 'منتهٍ')
      : effectiveStatus === 'upcoming'
        ? t('Upcoming', 'قادم')
        : effectiveStatus;
  const statusTone = {
    paid: 'border-[#a9cf86] bg-[#eef6e6] text-[#3d6324]',
    overdue: 'border-red-300 bg-red-50 text-red-800',
    today: 'border-[#3f7cff] bg-[#e6eeff] text-[#214a83]',
    upcoming: 'border-[#cbd8e2] bg-[#f2f6f9] text-[#526c83]',
    neutral: 'border-[#d1dbe4] bg-[#f4f7f9] text-[#64788c]',
  }[payment.tone];

  return (
    <article data-testid={`lease-summary-${lease.id}`} className="overflow-hidden border border-[#d1dbe4] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe3e9] bg-[#f5f8fa] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center bg-[#e8f0f6] text-[#315b91]">
            <Building2 size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p dir="auto" className="truncate text-xs font-semibold text-[#102238]">{entry.property.name} · {entry.unit.unit_label}</p>
            <p dir="auto" className="mt-0.5 truncate text-[10px] text-[#718398]">{tenantName}</p>
          </div>
        </div>
        <span className="border border-[#cbd8e2] bg-white px-2.5 py-1 font-mono text-[8px] uppercase tracking-[.06em] text-[#526c83]">
          {leaseStatus}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-4 sm:px-5">
        <div className="min-w-0">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Lease term', 'مدة العقد')}</dt>
          <dd className="mt-1 text-[10px] font-medium text-[#30485c]">
            <bdi dir={direction}>{formatDate(lease.start_date)} – {formatDate(lease.end_date)}</bdi>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Monthly rent', 'الإيجار الشهري')}</dt>
          <dd className="mt-1 text-[11px] font-semibold text-[#102238]">
            {lease.monthly_rent != null ? <bdi dir="ltr">{formatMoney(lease.monthly_rent)}</bdi> : t('Terms missing', 'الشروط ناقصة')}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Due day', 'يوم الاستحقاق')}</dt>
          <dd className="mt-1 text-[11px] font-semibold text-[#102238]">{lease.due_day ?? t('Not set', 'غير محدد')}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">{t('Next payment', 'الدفعة القادمة')}</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-1.5">
            {payment.date && <bdi dir={direction} className="text-[10px] font-medium text-[#30485c]">{formatDate(payment.date)}</bdi>}
            <span className={`border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[.05em] ${statusTone}`}>{payment.label}</span>
          </dd>
        </div>
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e7ec] px-4 py-3 sm:px-5">
        <Link href={`/leases/${encodeURIComponent(lease.id)}`} className="inline-flex min-h-9 items-center gap-2 text-[10px] font-semibold text-[#315b91] underline underline-offset-2">
          <FileText size={13} aria-hidden="true" /> {t('Lease details', 'تفاصيل العقد')}
        </Link>
        <details className="group min-w-0 flex-1 sm:flex-none">
          <summary className="ms-auto flex min-h-9 w-fit cursor-pointer list-none items-center gap-2 border border-[#cbd8e2] bg-[#f6f8fa] px-3 text-[10px] font-semibold text-[#315b91] [&::-webkit-details-marker]:hidden">
            <Wallet size={13} aria-hidden="true" />
            {t('Payments and files', 'الدفعات والملفات')}
            <ChevronDown size={13} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 min-w-full sm:min-w-[36rem]">
            <LeaseRecord lease={lease} ctx={{ token, userId, propertyId: entry.property.id, today }} />
          </div>
        </details>
      </footer>
    </article>
  );
}

export function LeaseRegister({ entries, token, userId, today }: Props) {
  const { t, direction } = useI18n();
  const { formatMoney } = useLocalizedFormats();
  const groups = new Map<string, LeaseEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.property.id) ?? [];
    group.push(entry);
    groups.set(entry.property.id, group);
  }
  const sortedGroups = [...groups.values()].sort((a, b) => a[0].property.name.localeCompare(b[0].property.name));
  const activeEntries = entries.filter((entry) => leaseStatusOnDate(entry.lease, today) === 'active');
  const activeRent = activeEntries.reduce((sum, entry) => sum + (entry.lease.monthly_rent ?? 0), 0);
  const paymentsNeedingAttention = entries.reduce(
    (sum, entry) => sum + paymentSummary(entry, today, t).attentionCount,
    0,
  );
  const metrics = [
    { label: t('Lease agreements', 'عقود الإيجار'), value: String(entries.length), icon: FileText },
    { label: t('Active monthly rent', 'الإيجار الشهري للعقود السارية'), value: formatMoney(activeRent), icon: Wallet },
    { label: t('Payments due or overdue', 'دفعات مستحقة أو متأخرة'), value: String(paymentsNeedingAttention), icon: AlertTriangle },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#102238]">{t('Lease register', 'سجل العقود')}</h2>
          <p className="mt-1 text-[10px] text-[#718398]">{t('Grouped by property with payment status at a glance.', 'مرتبة حسب العقار مع حالة الدفعات بوضوح.')}</p>
        </div>
        <Link href="/tenants" className="inline-flex min-h-9 items-center gap-2 bg-[#3f7cff] px-3 text-xs font-semibold text-white transition hover:bg-[#2f68e0]">
          <Plus size={13} aria-hidden="true" /> {t('Add tenant and lease', 'إضافة مستأجر وعقد')}
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="border border-dashed border-[#cbd7e1] bg-white p-6 text-center">
          <p className="text-sm font-semibold text-[#102238]">{t('No leases yet.', 'لا توجد عقود بعد.')}</p>
          <div className="mt-3 flex justify-center">
            <Link href="/tenants" className="text-xs font-semibold text-[#315b91] underline">{t('Create a tenant and lease', 'إنشاء مستأجر وعقد')}</Link>
          </div>
        </div>
      ) : (
        <>
          <section aria-label={t('Lease summary', 'ملخص العقود')} className="grid border border-[#d1dbe4] bg-white sm:grid-cols-3">
            {metrics.map(({ label, value, icon: Icon }, index) => (
              <div key={label} className={`flex min-h-[68px] items-center gap-3 px-4 py-3 ${index ? 'border-t border-[#dbe3e9] sm:border-t-0 sm:border-s' : ''}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#e8f0f6] text-[#315b91]"><Icon size={15} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="font-mono text-[7px] uppercase tracking-[.09em] text-[#8192a3]">{label}</p>
                  <p className="mt-1 truncate text-[14px] font-semibold text-[#102238]" dir="auto">{value}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="space-y-5">
            {sortedGroups.map((group) => (
              <section key={group[0].property.id} aria-label={group[0].property.name}>
                <header className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[#d1dbe4] pb-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building2 size={14} className="shrink-0 text-[#315b91]" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 dir="auto" className="truncate text-xs font-semibold text-[#102238]">{group[0].property.name}</h3>
                      <p dir="auto" className="truncate text-[9px] text-[#718398]">{propertyLocation(group[0].property)}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[.06em] text-[#8192a3]">
                    {group.length} {t('leases', 'عقود')}
                  </span>
                </header>
                <div className="grid gap-3">
                  {group.map((entry) => (
                    <LeaseSummaryCard key={entry.lease.id} entry={entry} token={token} userId={userId} today={today} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
