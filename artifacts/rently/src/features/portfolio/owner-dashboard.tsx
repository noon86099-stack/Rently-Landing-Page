import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Plus,
  UsersRound,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'wouter';
import type { Lease, Property, PropertyDetails, Unit } from '@/lib/rently-data';
import { formatUsd, useI18n, useLocalizedFormats } from '@/lib/i18n';
import { leaseStatusOnDate } from './lease-status';

type LeaseEntry = {
  property: PropertyDetails;
  unit: Unit;
  lease: Lease;
};

type OwnerDashboardProps = {
  properties: Property[];
  leaseEntries: LeaseEntry[];
  today: string;
  loading: boolean;
  onOpenProperties: () => void;
  onOpenTenants: () => void;
  onOpenLeases: () => void;
  onAddProperty: () => void;
  onAddTenantLease: () => void;
};

type Notice = {
  key: string;
  leaseId: string;
  title: string;
  detail: string;
  kind: 'overdue' | 'ending';
};

function parseDate(value: string) {
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatShortMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Building2;
  tone?: 'blue' | 'navy' | 'amber';
}) {
  const iconColors = {
    blue: 'bg-[#eaf1ff] text-[#3f7cff]',
    navy: 'bg-[#e8eef3] text-[#315b91]',
    amber: 'bg-[#fff4df] text-[#a66b15]',
  };
  return (
    <article className="border border-[#d4dee7] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#63778b]">{label}</p>
          <p className="mt-3 font-mono text-[1.7rem] font-medium leading-none tracking-[-.06em] text-[#102238] sm:text-3xl" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center ${iconColors[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-[11px] text-[#8191a0]">{detail}</p>
    </article>
  );
}

export function OwnerDashboard({
  properties,
  leaseEntries,
  today,
  loading,
  onOpenProperties,
  onOpenTenants,
  onOpenLeases,
  onAddProperty,
  onAddTenantLease,
}: OwnerDashboardProps) {
  const { t, locale } = useI18n();
  const { formatMoney, formatDate } = useLocalizedFormats();
  const todayDate = parseDate(today) ?? new Date();
  const todayKey = today.slice(0, 10);
  const soonLimit = new Date(todayDate);
  soonLimit.setDate(soonLimit.getDate() + 30);
  const liveLeases = leaseEntries.filter(({ lease }) => leaseStatusOnDate(lease, todayKey) === 'active');
  const tenantCount = new Set(
    liveLeases
      .map(({ lease }) => {
        const tenant = lease.tenants;
        return tenant?.email?.trim().toLowerCase() || tenant?.phone?.trim() || tenant?.full_name?.trim() || null;
      })
      .filter((identity): identity is string => Boolean(identity)),
  ).size;

  const monthDates = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(todayDate.getFullYear(), todayDate.getMonth() - 5 + index, 1);
    return { date, key: monthKey(date) };
  });
  const chartData = monthDates.map(({ date, key }) => ({
    month: formatShortMonth(date, locale),
    scheduled: 0,
    collected: 0,
    key,
  }));
  const chartByMonth = new Map(chartData.map((item) => [item.key, item]));
  let hasRecentPaymentRecords = false;
  let currentScheduled = 0;
  let currentCollected = 0;

  leaseEntries.forEach(({ lease }) => {
    lease.payments.forEach((payment) => {
      const dueDate = parseDate(payment.due_date);
      const paidDate = payment.paid_at ? parseDate(payment.paid_at) : null;
      if (dueDate) {
        const item = chartByMonth.get(monthKey(dueDate));
        if (item) {
          hasRecentPaymentRecords = true;
          item.scheduled += payment.amount;
        }
        if (monthKey(dueDate) === monthKey(todayDate)) currentScheduled += payment.amount;
      }
      if (paidDate && !Number.isNaN(paidDate.getTime())) {
        const item = chartByMonth.get(monthKey(paidDate));
        if (item) {
          hasRecentPaymentRecords = true;
          item.collected += payment.amount;
        }
        if (monthKey(paidDate) === monthKey(todayDate)) currentCollected += payment.amount;
      }
    });
  });

  const overdueNotices: Notice[] = [];
  const endingNotices: Notice[] = [];
  leaseEntries.forEach(({ property, unit, lease }) => {
    const tenantName = lease.tenants?.full_name?.trim() || t('Tenant not listed', 'لم يُحدّد المستأجر');
    const location = `${property.name} · ${unit.unit_label}`;
    const overdue = lease.payments.filter((payment) => {
      const due = payment.due_date.slice(0, 10);
      return !payment.paid_at && due < todayKey;
    });
    if (overdue.length) {
      const total = overdue.reduce((sum, payment) => sum + payment.amount, 0);
      overdueNotices.push({
        key: `overdue-${lease.id}`,
        leaseId: lease.id,
        title: t('Overdue rent', 'إيجار متأخر'),
        detail: `${tenantName} · ${location} · ${formatMoney(total)}`,
        kind: 'overdue',
      });
    }

    const endDate = parseDate(lease.end_date);
    if (
      leaseStatusOnDate(lease, todayKey) === 'active'
      && endDate
      && endDate >= todayDate
      && endDate <= soonLimit
    ) {
      endingNotices.push({
        key: `ending-${lease.id}`,
        leaseId: lease.id,
        title: t('Lease ending soon', 'عقد ينتهي قريبًا'),
        detail: `${tenantName} · ${location} · ${formatDate(lease.end_date)}`,
        kind: 'ending',
      });
    }
  });
  const allNotices = [...overdueNotices, ...endingNotices];
  const notices = allNotices.slice(0, 5);

  const quickActions = [
    {
      label: t('View properties', 'عرض العقارات'),
      detail: t('Buildings and units', 'المباني والوحدات'),
      icon: Building2,
      onClick: onOpenProperties,
      testId: 'action-view-properties',
    },
    {
      label: t('View tenants', 'عرض المستأجرين'),
      detail: t('People linked to leases', 'الأشخاص المرتبطون بالعقود'),
      icon: UsersRound,
      onClick: onOpenTenants,
      testId: 'action-view-tenants',
    },
    {
      label: t('View leases', 'عرض العقود'),
      detail: t('Terms and payment records', 'الشروط وسجلات الدفع'),
      icon: FileText,
      onClick: onOpenLeases,
      testId: 'action-view-leases',
    },
  ];

  return (
    <section aria-label={t('Dashboard overview', 'نظرة عامة')} className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onAddProperty} data-testid="action-add-property" className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#3f7cff] bg-[#3f7cff] px-4 text-xs font-semibold text-white transition hover:border-[#2f68e0] hover:bg-[#2f68e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]">
              <Plus size={15} /> {t('Add property', 'إضافة عقار')}
            </button>
            <button type="button" onClick={onAddTenantLease} data-testid="action-add-tenant-lease" className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#3f7cff] px-4 text-xs font-semibold text-white transition hover:bg-[#2f68e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]">
              <Plus size={15} /> {t('Add tenant & lease', 'إضافة مستأجر وعقد')}
            </button>
      </div>

        {loading ? (
          <section aria-label={t('Loading dashboard', 'جارٍ تحميل لوحة التحكم')} role="status" className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse border border-[#d4dee7] bg-[#f8fafb]" />)}
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]">
              <div className="h-[330px] animate-pulse border border-[#d4dee7] bg-[#f8fafb]" />
              <div className="h-[330px] animate-pulse border border-[#d4dee7] bg-[#f8fafb]" />
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t('Portfolio summary', 'ملخص المحفظة')}>
              <Metric label={t('Properties', 'العقارات')} value={String(properties.length)} detail={t('In your portfolio', 'ضمن محفظتك')} icon={Building2} />
               <Metric label={t('Active leases', 'العقود النشطة')} value={String(liveLeases.length)} detail={t('Active by today’s lease dates', 'نشطة حسب تواريخ العقد اليوم')} icon={FileText} tone="navy" />
              <Metric label={t('Tenants', 'المستأجرون')} value={String(tenantCount)} detail={t('On active leases', 'ضمن العقود النشطة')} icon={UsersRound} />
              <Metric label={t('Collected this month', 'المحصّل هذا الشهر')} value={formatMoney(currentCollected)} detail={t(`Scheduled: ${formatMoney(currentScheduled)}`, `المجدول: ${formatMoney(currentScheduled)}`)} icon={ArrowDownLeft} tone="amber" />
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]">
              <article className="min-w-0 border border-[#d4dee7] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7890a5]">{t('Rent activity', 'حركة الإيجار')}</p>
                    <h2 className="mt-1 text-base font-semibold">{t('Scheduled vs collected', 'المجدول مقابل المحصّل')}</h2>
                    <p className="mt-1 text-[11px] text-[#8191a0]">{t('Last six months · saved payment records', 'آخر ستة أشهر · سجلات الدفع المحفوظة')}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-medium text-[#61768b]">
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 bg-[#b9c8d8]" />{t('Scheduled', 'مجدول')}</span>
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 bg-[#3f7cff]" />{t('Collected', 'محصّل')}</span>
                  </div>
                </div>
                {hasRecentPaymentRecords ? (
                   <div className="mt-5 h-[240px] w-full" dir="ltr" role="img" aria-label={t('Scheduled and collected rent over the last six months', 'الإيجار المجدول والمحصّل خلال الأشهر الستة الماضية')} data-testid="chart-rent-monthly">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={5}>
                        <CartesianGrid vertical={false} stroke="#e7edf2" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8191a0', fontSize: 11 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8191a0', fontSize: 10 }} width={64} tickFormatter={(value: number) => formatUsd(value, locale, true)} />
                        <Tooltip
                          cursor={{ fill: '#f3f6f9' }}
                          formatter={(value: number, name: string) => [
                            formatMoney(Number(value)),
                            name === 'scheduled' ? t('Scheduled', 'مجدول') : t('Collected', 'محصّل'),
                          ]}
                          labelStyle={{ color: '#102238', fontWeight: 600, fontSize: 12 }}
                          contentStyle={{ border: '1px solid #d4dee7', borderRadius: 0, fontSize: 11 }}
                        />
                        <Bar dataKey="scheduled" name="scheduled" fill="#b9c8d8" radius={[2, 2, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="collected" name="collected" fill="#315fdb" radius={[2, 2, 0, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-5 grid min-h-[240px] place-items-center border border-dashed border-[#d4dee7] bg-[#fafcfd] px-5 text-center">
                    <div>
                      <div className="mx-auto grid h-10 w-10 place-items-center bg-[#eaf1ff] text-[#3f7cff]"><ArrowUpRight size={18} /></div>
                      <p className="mt-3 text-sm font-semibold">{t('No payment records in the last six months', 'لا توجد سجلات دفع خلال الأشهر الستة الماضية')}</p>
                      <p className="mt-1 max-w-xs text-xs leading-5 text-[#8191a0]">{t('The chart uses only saved due dates and payment dates.', 'يعتمد المخطط على تواريخ الاستحقاق والدفع المحفوظة فقط.')}</p>
                    </div>
                  </div>
                )}
              </article>

              <article className="border border-[#d4dee7] bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7890a5]">{t('Needs attention', 'بحاجة إلى متابعة')}</p>
                    <h2 className="mt-1 text-base font-semibold">{t('Urgent notices', 'تنبيهات عاجلة')}</h2>
                  </div>
                  {allNotices.length > 0 && <span className="grid min-h-6 min-w-6 place-items-center bg-[#fff1e8] px-1.5 font-mono text-[11px] font-semibold text-[#a44d25]">{allNotices.length}</span>}
                </div>
                {notices.length ? (
                  <ul className="mt-4 divide-y divide-[#e6ebef]">
                    {notices.map((notice) => (
                      <li key={notice.key}>
                        <Link href={`/leases/${encodeURIComponent(notice.leaseId)}`} data-testid={`notice-${notice.key}`} className="flex w-full items-start gap-3 py-3 text-start transition hover:bg-[#fafcfd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f7cff]">
                          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center ${notice.kind === 'overdue' ? 'bg-[#fff1e8] text-[#a44d25]' : 'bg-[#fff7e6] text-[#a66b15]'}`}>
                            {notice.kind === 'overdue' ? <AlertTriangle size={15} /> : <CalendarClock size={15} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-[#243c53]">{notice.title}</span>
                            <span className="mt-1 block text-[10px] leading-4 text-[#8191a0]">{notice.detail}</span>
                          </span>
                          <ChevronRight size={14} className="mt-2 shrink-0 text-[#9aabb9] rtl:rotate-180" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 flex min-h-[190px] flex-col items-center justify-center border border-dashed border-[#d4dee7] bg-[#fafcfd] px-4 text-center">
                    <span className="grid h-10 w-10 place-items-center bg-[#edf5ee] text-[#4c8462]"><CheckCircle2 size={18} /></span>
                    <p className="mt-3 text-sm font-semibold">{t('Nothing urgent right now', 'لا توجد أمور عاجلة الآن')}</p>
                    <p className="mt-1 text-[11px] text-[#8191a0]">{t('Overdue payments and leases ending within 30 days will show here.', 'ستظهر هنا الدفعات المتأخرة والعقود التي تنتهي خلال 30 يومًا.')}</p>
                  </div>
                )}
                {allNotices.length > notices.length && (
                  <p className="mt-2 text-[10px] text-[#8191a0]">
                    {t(`${allNotices.length - notices.length} more alerts`, `${allNotices.length - notices.length} تنبيهات أخرى`)}
                  </p>
                )}
                {notices.length > 0 && (
                  <button type="button" onClick={onOpenLeases} className="mt-2 inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[#315b91] hover:text-[#3f7cff]">
                    {t('Open lease records', 'فتح سجلات العقود')} <ChevronRight size={13} className="rtl:rotate-180" />
                  </button>
                )}
              </article>
            </section>

            <section className="mt-5 border border-[#d4dee7] bg-[#f8fafb] p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#7890a5]">{t('Workspace', 'مساحة العمل')}</p>
                  <h2 className="mt-1 text-base font-semibold">{t('Go to a record', 'انتقل إلى السجلات')}</h2>
                </div>
                <p className="text-[11px] text-[#8191a0]">{t('Open existing portfolio pages', 'افتح صفحات المحفظة الحالية')}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {quickActions.map(({ label, detail, icon: Icon, onClick, testId }) => (
                  <button key={testId} type="button" onClick={onClick} data-testid={testId} className="group flex min-h-[76px] items-center gap-3 border border-[#d4dee7] bg-white px-3 py-3 text-start transition hover:border-[#3f7cff] hover:bg-[#fbfdff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] sm:px-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#eaf1ff] text-[#315b91]"><Icon size={17} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[#243c53]">{label}</span>
                      <span className="mt-1 block text-[10px] text-[#8191a0]">{detail}</span>
                    </span>
                    <ChevronRight size={15} className="shrink-0 text-[#9aabb9] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
    </section>
  );
}
