import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, FileText, Home, LayoutDashboard, LoaderCircle, Plus, UsersRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Link, useLocation } from 'wouter';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AddUnitForm } from '@/features/portfolio/add-unit-form';
import { CreateLeaseForm } from '@/features/portfolio/create-lease-form';
import { CreatePropertyForm, PROPERTY_TYPE_LABELS } from '@/features/portfolio/create-property-form';
import { LeaseDetailsPage, type CreatedLeaseDetails, type LeaseDetailsData } from '@/features/portfolio/lease-details-page';
import { LeaseRegister } from '@/features/portfolio/lease-register';
import { useToday } from '@/features/portfolio/shared';
import {
  loadOwnerProperties,
  loadPropertyDetails,
  propertyLocation,
  type Lease,
  type Property,
  type PropertyDetails,
  type Unit,
} from '@/lib/rently-data';
import { supabaseConfigured } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { RentlyWordmark } from '@/components/rently-brand';

type Props = {
  user: User;
  token: string;
  onSignOut: () => void;
};

type LeaseEntry = {
  property: PropertyDetails;
  unit: Unit;
  lease: Lease;
};

const OwnerDashboard = lazy(() =>
  import('@/features/portfolio/owner-dashboard').then((module) => ({ default: module.OwnerDashboard })),
);

function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-[#cbd7e1] bg-white p-6 text-center">
      <p className="text-sm font-semibold text-[#102238]">{title}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

function PropertyRow({
  property,
  unitCount,
  leaseCount,
  onOpen,
}: {
  property: Property;
  unitCount: number;
  leaseCount: number;
  onOpen: () => void;
}) {
  const { t, text } = useI18n();
  const type = PROPERTY_TYPE_LABELS[property.property_type];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-[#d7e0e7] bg-white p-4 text-start transition hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
      aria-label={t(`Open ${property.name}`, `فتح ${property.name}`)}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#e8f0f6] text-[#315b91]">
          <Home size={18} />
        </span>
        <span className="min-w-0">
          <span dir="auto" className="block truncate text-sm font-semibold text-[#102238]">{property.name}</span>
          <span className="mt-1 block truncate text-xs text-[#718398]"><bdi>{propertyLocation(property)}</bdi></span>
        </span>
      </span>
      <span className="text-end">
        <span className="block text-xs font-semibold text-[#102238]">{unitCount}</span>
        <span className="text-[10px] text-[#718398]">{t('Units', 'وحدات')}</span>
      </span>
      <span className="hidden text-end sm:block">
        <span className="block text-xs font-semibold text-[#102238]">{leaseCount}</span>
        <span className="text-[10px] text-[#718398]">{t('Leases', 'عقود')}</span>
      </span>
      <span className="hidden text-end text-[11px] text-[#61768b] md:block">{type ? text(type) : property.property_type}</span>
      <ChevronRight size={16} className="hidden text-[#8192a3] rtl:rotate-180 sm:block" />
    </button>
  );
}

function PropertyDetailPanel({
  property,
  details,
  loading,
  error,
  created,
  token,
  user,
  onRetry,
}: {
  property: Property;
  details?: PropertyDetails;
  loading: boolean;
  error: boolean;
  created: boolean;
  token: string;
  user: User;
  onRetry: () => void;
}) {
  const { t, text } = useI18n();
  const queryClient = useQueryClient();
  const propertyType = PROPERTY_TYPE_LABELS[property.property_type];
  return (
    <div className="space-y-4">
      {created && (
        <div role="status" data-testid="property-created-confirmation" className="flex items-center gap-2 border border-[#cfe0bb] bg-[#f3f9ec] px-4 py-3 text-sm font-semibold text-[#3d6324]">
          <Check size={17} /> {t('Property saved successfully', 'تم حفظ العقار بنجاح')}
        </div>
      )}
      <section className="border border-[#d1dbe4] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[.1em] text-[#64798d]">{t('Property details', 'تفاصيل العقار')}</p>
            <h1 dir="auto" className="mt-2 break-words text-2xl font-semibold tracking-[-.04em] text-[#102238]">{property.name}</h1>
            <p className="mt-2 text-sm text-[#718398]"><bdi>{propertyLocation(property)}</bdi></p>
            <p className="mt-2 text-xs text-[#61768b]">{propertyType ? text(propertyType) : property.property_type}</p>
          </div>
          <Link href={`/tenants/${encodeURIComponent(property.id)}`} className="inline-flex min-h-10 items-center gap-2 bg-[#3f7cff] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2f68e0]">
            <Plus size={14} /> {t('Add tenant and lease', 'إضافة مستأجر وعقد')}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
        <div className="border border-[#d1dbe4] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#102238]">{t('Units', 'الوحدات')}</h2>
            {details && <span className="font-mono text-xs text-[#718398]">{details.units.length}</span>}
          </div>
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-xs text-[#718398]"><LoaderCircle size={14} className="animate-spin" />{t('Loading units…', 'جارٍ تحميل الوحدات…')}</p>
          ) : error ? (
            <div role="alert" className="text-sm text-red-700">
              <p>{t('Property details could not be loaded.', 'تعذّر تحميل تفاصيل العقار.')}</p>
              <button type="button" onClick={onRetry} className="mt-2 underline">{t('Try again', 'حاول مجددًا')}</button>
            </div>
          ) : details?.units.length ? (
            <ul className="divide-y divide-[#e4e9ee]">
              {details.units.map((unit) => (
                <li key={unit.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <span dir="auto" className="text-sm font-medium text-[#102238]">{unit.unit_label}</span>
                  <span className="text-xs text-[#718398]">{unit.leases.length} {unit.leases.length === 1 ? t('lease', 'عقد') : t('leases', 'عقود')}</span>
                  {unit.leases.some((lease) => lease.tenants?.full_name) && (
                    <span className="w-full text-xs text-[#61768b]">
                      {unit.leases.map((lease) => lease.tenants?.full_name).filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#718398]">{t('No units yet. Add the apartment or house unit here.', 'لا توجد وحدات بعد. أضف رقم الشقة أو المنزل هنا.')}</p>
          )}
        </div>
        <div className="border border-[#d1dbe4] bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold text-[#102238]">{t('Add a unit', 'إضافة وحدة')}</h2>
          <AddUnitForm
            token={token}
            userId={user.id}
            propertyId={property.id}
            onCreated={() => {
              void queryClient.invalidateQueries({ queryKey: ['rently-property-details', user.id, property.id] });
              void queryClient.invalidateQueries({ queryKey: ['rently-properties', user.id] });
            }}
          />
        </div>
      </section>
    </div>
  );
}

export function PropertyManagementWorkspace({ user, token, onSignOut }: Props) {
  const { t, text, direction } = useI18n();
  const [location, setLocation] = useLocation();
  const today = useToday();
  const appliedTenantRouteId = useRef<string | null>(null);
  const [tenantPropertyId, setTenantPropertyId] = useState('');
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [openPropertyFormFromDashboard, setOpenPropertyFormFromDashboard] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [createdLeaseDetails, setCreatedLeaseDetails] = useState<CreatedLeaseDetails | null>(null);

  const propertiesQuery = useQuery({
    queryKey: ['rently-properties', user.id],
    queryFn: () => loadOwnerProperties(user.id),
    enabled: supabaseConfigured && Boolean(token),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const properties = propertiesQuery.data ?? [];
  const detailQueries = useQueries({
    queries: properties.map((property) => ({
      queryKey: ['rently-property-details', user.id, property.id],
      queryFn: () => loadPropertyDetails(user.id, property.id),
      enabled: Boolean(token),
      staleTime: 0,
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    })),
  });
  const detailData = detailQueries
    .map((query) => query.data)
    .filter((details): details is PropertyDetails => Boolean(details));
  const leaseEntries: LeaseEntry[] = detailData.flatMap((property) =>
    property.units.flatMap((unit) =>
      unit.leases.map((lease) => ({ property, unit, lease })),
    ),
  );

  const propertyMatch = location.match(/^\/properties\/([^/]+)\/?$/);
  const tenantPropertyMatch = location.match(/^\/tenants\/([^/]+)\/?$/);
  const leaseMatch = location.match(/^\/leases\/([^/]+)\/?$/);
  const propertyId = propertyMatch ? decodeURIComponent(propertyMatch[1]) : null;
  const tenantRoutePropertyId = tenantPropertyMatch ? decodeURIComponent(tenantPropertyMatch[1]) : null;
  const leaseId = leaseMatch ? decodeURIComponent(leaseMatch[1]) : null;
  const routeProperty = properties.find((property) => property.id === propertyId) ?? null;
  const routePropertyIndex = properties.findIndex((property) => property.id === propertyId);
  const routeDetailsQuery = routePropertyIndex >= 0 ? detailQueries[routePropertyIndex] : undefined;
  const routeDetails = routeDetailsQuery?.data;

  useEffect(() => {
    if (location === '/') setLocation('/dashboard');
  }, [location, setLocation]);

  useEffect(() => {
    if (location === '/properties' && openPropertyFormFromDashboard) {
      setOpenPropertyFormFromDashboard(false);
    }
  }, [location, openPropertyFormFromDashboard]);

  useEffect(() => {
    if (!properties.length) {
      setTenantPropertyId('');
    } else if (!properties.some((property) => property.id === tenantPropertyId)) {
      setTenantPropertyId(properties[0].id);
    }
  }, [properties, tenantPropertyId]);

  useEffect(() => {
    if (!tenantRoutePropertyId) {
      appliedTenantRouteId.current = null;
      return;
    }
    if (
      appliedTenantRouteId.current !== tenantRoutePropertyId
      && properties.some((property) => property.id === tenantRoutePropertyId)
    ) {
      appliedTenantRouteId.current = tenantRoutePropertyId;
      setTenantPropertyId(tenantRoutePropertyId);
      setShowLeaseForm(true);
    }
  }, [properties, tenantRoutePropertyId]);

  useEffect(() => {
    if (createdPropertyId && propertyId !== createdPropertyId) setCreatedPropertyId(null);
  }, [createdPropertyId, propertyId]);

  useEffect(() => {
    if (createdLeaseDetails && leaseId !== createdLeaseDetails.lease.id) setCreatedLeaseDetails(null);
  }, [createdLeaseDetails, leaseId]);

  const currentView = propertyId ? 'properties' : leaseId ? 'leases' : location.startsWith('/tenants') ? 'tenants' : location.startsWith('/leases') ? 'leases' : location.startsWith('/dashboard') ? 'dashboard' : 'properties';
  const tabs = [
    { href: '/dashboard', label: t('Dashboard', 'الرئيسية'), icon: LayoutDashboard, active: currentView === 'dashboard' },
    { href: '/properties', label: t('Properties', 'العقارات'), icon: Home, active: currentView === 'properties' },
    { href: '/tenants', label: t('Tenants', 'المستأجرون'), icon: UsersRound, active: currentView === 'tenants' },
    { href: '/leases', label: t('Leases', 'العقود'), icon: FileText, active: currentView === 'leases' },
  ];

  function detailLease(entry: LeaseEntry): LeaseDetailsData {
    return {
      id: entry.lease.id,
      tenant: {
        fullName: entry.lease.tenants?.full_name ?? t('Tenant unavailable', 'المستأجر غير متاح'),
        email: entry.lease.tenants?.email ?? null,
        phone: entry.lease.tenants?.phone ?? null,
      },
      monthlyRent: entry.lease.monthly_rent,
      startDate: entry.lease.start_date,
      endDate: entry.lease.end_date,
      dueDay: entry.lease.due_day,
      payments: entry.lease.payments.map((payment) => ({
        dueDate: payment.due_date,
        paidAt: payment.paid_at,
      })),
    };
  }

  function pageTitle() {
    if (propertyId) return routeProperty?.name ?? t('Property details', 'تفاصيل العقار');
    if (leaseId) return t('Lease details', 'تفاصيل العقد');
    if (currentView === 'dashboard') return t('Dashboard', 'الرئيسية');
    if (currentView === 'tenants') return t('Tenants', 'المستأجرون');
    if (currentView === 'leases') return t('Leases', 'العقود');
    return t('Properties', 'العقارات');
  }

  const selectedTenantProperty = properties.find((property) => property.id === tenantPropertyId) ?? null;
  const selectedTenantPropertyIndex = properties.findIndex((property) => property.id === tenantPropertyId);
  const selectedTenantDetailsQuery = selectedTenantPropertyIndex >= 0 ? detailQueries[selectedTenantPropertyIndex] : undefined;
  const selectedTenantDetails = selectedTenantDetailsQuery?.data;

  const savedLeaseEntry = leaseId
    ? leaseEntries.find((entry) => entry.lease.id === leaseId)
    : undefined;
  const recentLease = createdLeaseDetails?.lease.id === leaseId ? createdLeaseDetails : null;

  return (
    <main dir={direction} className="min-h-screen bg-[#eef3f7] text-[#102238]">
      <header className="sticky top-0 z-20 border-b border-[#d1dbe4] bg-[#f8fafb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/properties" className="flex items-center gap-2.5" aria-label={t('Rently dashboard', 'لوحة تحكم Rently')}>
            <RentlyWordmark size={34} />
          </Link>
          <nav aria-label={t('Property management', 'إدارة العقارات')} className="order-3 flex w-full gap-2 overflow-x-auto pb-0.5 sm:order-2 sm:w-auto">
            {tabs.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] ${active ? 'border-[#3f7cff] bg-[#3f7cff] text-white' : 'border-transparent text-[#61768b] hover:border-[#cbd7e1] hover:bg-white'}`}
              >
                <Icon size={14} /> {label}
              </Link>
            ))}
          </nav>
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <LanguageSwitcher />
            <span dir="ltr" className="hidden max-w-40 truncate text-[11px] text-[#718398] lg:block">{user.email}</span>
            <button type="button" onClick={onSignOut} className="min-h-9 border border-[#cbd7e1] px-3 text-[11px] font-semibold text-[#425b72] hover:bg-white">
              {t('Sign out', 'تسجيل الخروج')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#3f7cff]">{t('Owner workspace', 'مساحة المالك')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-.05em] sm:text-3xl">{pageTitle()}</h1>
          </div>
          {propertyId && (
            <Link href="/properties" className="inline-flex min-h-10 items-center gap-2 border border-[#cbd7e1] bg-white px-3 text-xs font-semibold text-[#425b72]">
              <Home size={14} /> {t('All properties', 'كل العقارات')}
            </Link>
          )}
        </div>

        {propertiesQuery.isPending ? (
          <p role="status" className="flex items-center gap-2 border border-[#d1dbe4] bg-white p-5 text-sm text-[#718398]">
            <LoaderCircle size={16} className="animate-spin" /> {t('Loading your properties…', 'جارٍ تحميل عقاراتك…')}
          </p>
        ) : propertiesQuery.isError ? (
          <div role="alert" className="border border-red-200 bg-white p-5 text-sm text-red-800">
            <p className="font-semibold">{t('Your properties could not be loaded.', 'تعذّر تحميل عقاراتك.')}</p>
            <p className="mt-1 break-words text-xs">{text(propertiesQuery.error.message)}</p>
            <button type="button" onClick={() => void propertiesQuery.refetch()} className="mt-3 underline">{t('Try again', 'حاول مجددًا')}</button>
          </div>
        ) : leaseId ? (
          recentLease ? (
            <LeaseDetailsPage
              {...recentLease}
              token={token}
              showCreatedConfirmation
              onGoToDashboard={() => setLocation('/dashboard')}
            />
          ) : savedLeaseEntry ? (
            <LeaseDetailsPage
              lease={detailLease(savedLeaseEntry)}
              propertyId={savedLeaseEntry.property.id}
              propertyName={savedLeaseEntry.property.name}
              unitLabel={savedLeaseEntry.unit.unit_label}
              token={token}
              showCreatedConfirmation={false}
              onGoToDashboard={() => setLocation('/dashboard')}
            />
          ) : detailQueries.some((query) => query.isPending) ? (
            <p role="status" className="flex items-center gap-2 border border-[#d1dbe4] bg-white p-5 text-sm text-[#718398]">
              <LoaderCircle size={16} className="animate-spin" /> {t('Loading lease details…', 'جارٍ تحميل تفاصيل العقد…')}
            </p>
          ) : (
            <EmptyState title={t('This lease could not be found in your properties.', 'لم يتم العثور على هذا العقد ضمن عقاراتك.')} action={<Link href="/leases" className="text-xs font-semibold text-[#315b91] underline">{t('Back to leases', 'العودة إلى العقود')}</Link>} />
          )
        ) : propertyId ? (
          routeProperty ? (
            <PropertyDetailPanel
              property={routeProperty}
              details={routeDetails}
              loading={Boolean(routeDetailsQuery?.isPending)}
              error={Boolean(routeDetailsQuery?.isError)}
              created={createdPropertyId === propertyId}
              token={token}
              user={user}
              onRetry={() => void routeDetailsQuery?.refetch()}
            />
          ) : propertiesQuery.isFetching ? (
            <p role="status" className="flex items-center gap-2 border border-[#d1dbe4] bg-white p-5 text-sm text-[#718398]">
              <LoaderCircle size={16} className="animate-spin" /> {t('Loading property details…', 'جارٍ تحميل تفاصيل العقار…')}
            </p>
          ) : (
            <EmptyState title={t('This property could not be found.', 'لم يتم العثور على هذا العقار.')} action={<Link href="/properties" className="text-xs font-semibold text-[#315b91] underline">{t('Back to properties', 'العودة إلى العقارات')}</Link>} />
          )
        ) : currentView === 'dashboard' && detailQueries.some((query) => query.isError) ? (
          <div role="alert" className="border border-red-200 bg-white p-5 text-sm text-red-800">
            <p className="font-semibold">
              {t('Urgent notices may be incomplete because some property details could not be loaded.', 'قد تكون التنبيهات العاجلة غير مكتملة لتعذّر تحميل تفاصيل بعض العقارات.')}
            </p>
            <button
              type="button"
              onClick={() => {
                void Promise.all(
                  detailQueries
                    .filter((query) => query.isError)
                    .map((query) => query.refetch()),
                );
              }}
              className="mt-3 inline-flex min-h-10 items-center rounded-lg px-3 text-xs font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]"
            >
              {t('Try again', 'حاول مجددًا')}
            </button>
          </div>
        ) : currentView === 'dashboard' ? (
          <Suspense fallback={<p role="status" className="border border-[#d1dbe4] bg-white p-5 text-sm text-[#718398]">{t('Loading dashboard…', 'جارٍ تحميل لوحة التحكم…')}</p>}>
            <OwnerDashboard
              properties={properties}
              leaseEntries={leaseEntries}
              today={today}
              loading={detailQueries.some((query) => query.isPending)}
              onOpenProperties={() => setLocation('/properties')}
              onOpenTenants={() => setLocation('/tenants')}
              onOpenLeases={() => setLocation('/leases')}
              onAddProperty={() => {
                setOpenPropertyFormFromDashboard(true);
                setLocation('/properties');
              }}
              onAddTenantLease={() => {
                setShowLeaseForm(true);
                setLocation('/tenants');
              }}
            />
          </Suspense>
        ) : currentView === 'properties' ? (
          <div className="space-y-4">
            <section className="flex flex-wrap items-end justify-between gap-3 border border-[#d1dbe4] bg-white p-4 sm:p-5">
              <div>
                <p className="text-sm font-semibold">{t('Your properties', 'عقاراتك')}</p>
                <p className="mt-1 text-xs text-[#718398]">{t('Property details are entered once, then reused for tenants and leases.', 'أدخل بيانات العقار مرة واحدة، ثم اربطه بالمستأجرين والعقود.')}</p>
              </div>
              <CreatePropertyForm
                token={token}
                userId={user.id}
                initiallyOpen={openPropertyFormFromDashboard}
                onCreated={(id) => {
                  setCreatedPropertyId(id);
                  setLocation(`/properties/${encodeURIComponent(id)}`);
                }}
              />
            </section>
            {properties.length === 0 ? (
              <EmptyState title={t('No properties yet.', 'لا توجد عقارات بعد.')} action={<span className="text-xs text-[#718398]">{t('Use Add property above to create your first one.', 'استخدم «إضافة عقار» أعلاه لإنشاء أول عقار.')}</span>} />
            ) : (
              <section className="space-y-2" aria-label={t('All properties', 'كل العقارات')}>
                {properties.map((property) => {
                  const details = detailData.find((item) => item.id === property.id);
                  return (
                    <PropertyRow
                      key={property.id}
                      property={property}
                      unitCount={property.units.length}
                      leaseCount={details?.units.reduce((count, unit) => count + unit.leases.length, 0) ?? 0}
                      onOpen={() => setLocation(`/properties/${encodeURIComponent(property.id)}`)}
                    />
                  );
                })}
              </section>
            )}
          </div>
        ) : currentView === 'tenants' ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{t('Tenant records', 'سجلات المستأجرين')}</h2>
                <span className="font-mono text-xs text-[#718398]">{leaseEntries.filter((entry) => entry.lease.tenants).length}</span>
              </div>
              {leaseEntries.filter((entry) => entry.lease.tenants).length === 0 ? (
                <EmptyState title={t('No tenants yet.', 'لا يوجد مستأجرون بعد.')} />
              ) : (
                leaseEntries.filter((entry) => entry.lease.tenants).map((entry) => (
                  <Link key={entry.lease.id} href={`/leases/${encodeURIComponent(entry.lease.id)}`} className="block border border-[#d1dbe4] bg-white p-4 transition hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p dir="auto" className="truncate text-sm font-semibold">{entry.lease.tenants?.full_name}</p>
                        <p className="mt-1 text-xs text-[#718398]">{entry.property.name} · {entry.unit.unit_label}</p>
                      </div>
                      <span className="text-[11px] text-[#315b91]">{t('View lease', 'عرض العقد')} <ChevronRight size={13} className="inline rtl:rotate-180" /></span>
                    </div>
                    <div className="mt-3 grid gap-2 border-t border-[#e4e9ee] pt-3 text-xs sm:grid-cols-2">
                      <p dir="ltr" className="text-start text-[#61768b]">{entry.lease.tenants?.email ?? '—'}</p>
                      <p dir="ltr" className="text-start text-[#61768b]">{entry.lease.tenants?.phone ?? '—'}</p>
                    </div>
                  </Link>
                ))
              )}
            </section>
            <section className="h-fit border border-[#d1dbe4] bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{t('Add tenant and lease', 'إضافة مستأجر وعقد')}</h2>
                {!showLeaseForm && properties.length > 0 && (
                  <button type="button" onClick={() => setShowLeaseForm(true)} className="inline-flex min-h-9 items-center gap-2 bg-[#3f7cff] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#2f68e0]">
                    <Plus size={13} /> {t('Add', 'إضافة')}
                  </button>
                )}
              </div>
              {properties.length === 0 ? (
                <EmptyState title={t('Add a property first.', 'أضف عقارًا أولًا.')} action={<Link href="/properties" className="text-xs font-semibold text-[#315b91] underline">{t('Go to properties', 'الانتقال إلى العقارات')}</Link>} />
              ) : showLeaseForm ? (
                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <p className="text-xs font-semibold text-[#425b72]">{t('Choose a property', 'اختر العقار')}</p>
                    <div role="group" aria-label={t('Choose a property', 'اختر العقار')} className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                      {properties.map((property) => {
                        const selected = property.id === tenantPropertyId;
                        return (
                          <button
                            key={property.id}
                            type="button"
                            aria-pressed={selected}
                            data-testid={`button-tenant-property-${property.id}`}
                            onClick={() => setTenantPropertyId(property.id)}
                            className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] ${selected ? 'border-[#3f7cff] bg-[#eef4ff] text-[#102238]' : 'border-[#cbd7e1] bg-white text-[#425b72] hover:border-[#3f7cff]'}`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold"><bdi>{property.name}</bdi></span>
                              {property.street_address && <span className="mt-0.5 block truncate text-[10px] text-[#718398]"><bdi>{property.street_address}</bdi></span>}
                            </span>
                            {selected && <Check size={15} aria-hidden="true" className="shrink-0 text-[#315fdb]" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTenantProperty && (
                      <p role="status" data-testid="text-selected-tenant-property" className="text-[11px] text-[#61768b]">
                        {t('Selected:', 'المحدد:')} <bdi className="font-semibold text-[#102238]">{selectedTenantProperty.name}</bdi>
                      </p>
                    )}
                  </div>
                  {!selectedTenantProperty ? null : selectedTenantDetailsQuery?.isPending ? (
                    <p role="status" className="flex items-center gap-2 text-xs text-[#718398]"><LoaderCircle size={14} className="animate-spin" />{t('Loading units…', 'جارٍ تحميل الوحدات…')}</p>
                  ) : selectedTenantDetailsQuery?.isError ? (
                    <p role="alert" className="text-xs text-red-700">{t('Property units could not be loaded.', 'تعذّر تحميل وحدات العقار.')}</p>
                  ) : selectedTenantDetails?.rentSetupRequired ? (
                    <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{t('Rent setup is unavailable until the database update is applied.', 'إعداد الإيجار غير متاح حتى تطبيق تحديث قاعدة البيانات.')}</p>
                  ) : selectedTenantDetails?.units.length ? (
                    <CreateLeaseForm
                      key={selectedTenantProperty.id}
                      token={token}
                      userId={user.id}
                      propertyId={selectedTenantProperty.id}
                      units={selectedTenantDetails.units}
                      defaultUnitLabel={selectedTenantProperty.street_address?.trim() || selectedTenantProperty.name}
                      onCreated={(id, lease) => {
                        const unitLabel = selectedTenantDetails.units.find((unit) => unit.id === lease.unitId)?.unit_label ?? selectedTenantProperty.name;
                        setCreatedLeaseDetails({ lease, propertyId: selectedTenantProperty.id, propertyName: selectedTenantProperty.name, unitLabel });
                        setLocation(`/leases/${encodeURIComponent(id)}`);
                      }}
                    />
                  ) : (
                    <EmptyState title={t('Add a unit before creating a lease.', 'أضف وحدة قبل إنشاء العقد.')} action={<Link href={`/properties/${encodeURIComponent(selectedTenantProperty.id)}`} className="text-xs font-semibold text-[#315b91] underline">{t('Open property and add a unit', 'افتح العقار وأضف وحدة')}</Link>} />
                  )}
                  <button type="button" onClick={() => setShowLeaseForm(false)} className="text-xs text-[#61768b] underline">{t('Cancel', 'إلغاء')}</button>
                </div>
              ) : (
                <p className="text-xs text-[#718398]">{t('Select an existing property when you are ready to add a tenant and lease.', 'اختر عقارًا موجودًا عند الاستعداد لإضافة مستأجر وعقد.')}</p>
              )}
            </section>
          </div>
        ) : currentView === 'leases' ? (
          <LeaseRegister entries={leaseEntries} token={token} userId={user.id} today={today} />
        ) : null}
      </div>
    </main>
  );
}
