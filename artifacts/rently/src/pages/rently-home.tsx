import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, CalendarDays, Check, FileText, Home, LoaderCircle, MapPin, UsersRound } from 'lucide-react';
import type { Session, User } from '@supabase/supabase-js';
import type { RentlyLease } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { loadOwnerProperties, loadPropertyDetails, propertyLocation, type Property } from '@/lib/rently-data';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { CreatePropertyForm, PROPERTY_TYPE_LABELS } from '@/features/portfolio/create-property-form';
import { PropertyManagementWorkspace } from '@/features/portfolio/property-management-workspace';
import { LanguageSwitcher } from '@/components/language-switcher';
import { message, useI18n, type UiMessage } from '@/lib/i18n';
import { CreateLeaseForm } from '@/features/portfolio/create-lease-form';
import { LeaseRecord } from '@/features/portfolio/lease-record';
import { GuidedSetup, GuidedSetupDisclosure } from '@/features/portfolio/guided-setup';
import { LeaseDetailsPage, type CreatedLeaseDetails } from '@/features/portfolio/lease-details-page';
import { Panel, useToday } from '@/features/portfolio/shared';

function RentlyMark({ inverse = false, size = 40 }: { inverse?: boolean; size?: number }) {
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

function Wordmark({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <a href="#top" dir="ltr" className="inline-flex items-center gap-2.5" aria-label={t('Rently home', 'الصفحة الرئيسية لـ Rently')}>
      <RentlyMark size={compact ? 34 : 40} />
      <span className="text-[20px] font-bold tracking-[-.07em] text-[#102238]">rently<span className="text-[#3f7cff]">/</span></span>
    </a>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, text } = useI18n();
  const [notice, setMessage] = useState<UiMessage>('');
  const [error, setError] = useState<UiMessage>('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        if (!data.session) {
          setMessage(message('Check your email to confirm your account, then sign in.', 'راجع بريدك لتأكيد حسابك، ثم سجّل الدخول.'));
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError instanceof Error && authError.message ? authError.message : message('Unable to authenticate. Try again.', 'تعذّر تسجيل الدخول. حاول مجددًا.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-2.5" aria-label={mode === 'sign-in' ? t('Sign in', 'تسجيل الدخول') : t('Create an account', 'إنشاء حساب')}>
      <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]">
        {t('Email', 'البريد الإلكتروني')}
        <input
          dir="ltr"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-10 border border-[#cbd7e1] bg-white px-3 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
        />
      </label>
      <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]">
        {t('Password', 'كلمة المرور')}
        <input
          dir="ltr"
          required
          minLength={8}
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-10 border border-[#cbd7e1] bg-white px-3 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
        />
      </label>
      {error && <p role="alert" className="text-[10px] text-red-700">{text(error)}</p>}
      {notice && <p role="status" className="text-[10px] text-[#466a2d]">{text(notice)}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={submitting} className="inline-flex min-h-9 items-center gap-2 bg-[#3f7cff] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-white transition-colors hover:bg-[#2f68e0] disabled:opacity-60">
          {submitting && <LoaderCircle size={13} className="animate-spin" />}
          {mode === 'sign-in' ? t('Sign in', 'تسجيل الدخول') : t('Create account', 'إنشاء الحساب')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setMessage('');
            setError('');
          }}
          className="font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91] underline underline-offset-2"
        >
          {mode === 'sign-in' ? t('Create an account', 'إنشاء حساب') : t('Already registered? Sign in', 'لديك حساب؟ سجّل الدخول')}
        </button>
      </div>
    </form>
  );
}

function PropertyButton({
  property,
  index,
  selected,
  onSelect,
}: {
  property: Property;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, text } = useI18n();
  const accents = ['bg-[#dce8f3]', 'bg-[#e6e8df]', 'bg-[#e8e1d8]', 'bg-[#e3e4f0]'];
  const glyph = property.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={t(`Show tenant and lease details for ${property.name}`, `عرض تفاصيل المستأجر والعقد لـ ${property.name}`)}
      className={`grid w-full grid-cols-[42px_minmax(0,1fr)] items-center gap-3 bg-[#f7f9fb] p-2.5 text-start transition-colors hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] md:grid-cols-[48px_minmax(0,1fr)_auto] md:gap-4 md:p-3 ${selected ? 'border-[#3f7cff] ring-1 ring-[#3f7cff]' : 'border border-[#d7e0e7]'}`}
    >
      <div className={`grid h-[42px] w-[42px] place-items-center ${accents[index % accents.length]} font-mono text-[10px] font-medium tracking-[.08em] text-[#344f68] md:h-12 md:w-12`}>{glyph || 'RE'}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p dir="auto" className="truncate text-[11px] font-semibold tracking-[-.02em]">{property.name}</p>
          <span className="border border-[#bfcfdd] px-1 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] text-[#526c83]">{t('Owned', 'مملوك')}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate font-mono text-[8px] text-[#7b8da0]"><MapPin size={9} /><bdi>{propertyLocation(property)}</bdi></p>
      </div>
      <span className="hidden font-mono text-[8px] text-[#61768b] md:block">{PROPERTY_TYPE_LABELS[property.property_type] ? text(PROPERTY_TYPE_LABELS[property.property_type]) : property.property_type}</span>
    </button>
  );
}

export function RentlyHomepage() {
  const queryClient = useQueryClient();
  const { t, text } = useI18n();
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const today = useToday();
  const [authReady, setAuthReady] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [createdLeaseDetails, setCreatedLeaseDetails] = useState<CreatedLeaseDetails | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let active = true;
    let previousOwnerId: string | null = null;
    function applySession(nextSession: Session | null) {
      if (!active) return;
      const nextUser = nextSession?.user ?? null;
      if (previousOwnerId !== (nextUser?.id ?? null)) {
        queryClient.clear();
        setSelectedPropertyId(null);
        setCreatedLeaseDetails(null);
      }
      previousOwnerId = nextUser?.id ?? null;
      setSession(nextSession);
      setUser(nextUser);
      setAuthReady(true);
    }
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Unable to restore the Rently session', error);
      applySession(data.session);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!authReady) return;
    if (user && location === '/') setLocation('/dashboard');
    else if (!user && location !== '/') setLocation('/');
  }, [authReady, location, setLocation, user]);

  const propertiesQuery = useQuery({
    queryKey: ['rently-properties', user?.id],
    queryFn: () => loadOwnerProperties(user!.id),
    enabled: supabaseConfigured && authReady && Boolean(user),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!propertiesQuery.data) return;
    if (!propertiesQuery.data.some((property) => property.id === selectedPropertyId)) {
      setSelectedPropertyId(propertiesQuery.data[0]?.id ?? null);
    }
  }, [propertiesQuery.data, selectedPropertyId]);

  const selectedProperty = propertiesQuery.data?.find(
    (property) => property.id === selectedPropertyId,
  ) ?? null;
  const detailsQuery = useQuery({
    queryKey: ['rently-property-details', user?.id, selectedPropertyId],
    queryFn: () => loadPropertyDetails(user!.id, selectedPropertyId!),
    enabled: Boolean(user && selectedPropertyId),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const token = session?.access_token ?? '';

  async function signOut() {
    if (!supabase) return;
    queryClient.clear();
    setSelectedPropertyId(null);
    setCreatedLeaseDetails(null);
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Unable to sign out of Rently', error);
  }

  function showLeaseDetails(lease: RentlyLease, propertyId: string, propertyName: string, unitLabel: string) {
    setSelectedPropertyId(propertyId);
    setCreatedLeaseDetails({ lease, propertyId, propertyName, unitLabel });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToDashboard() {
    if (!createdLeaseDetails) return;
    const propertyId = createdLeaseDetails.propertyId;
    setCreatedLeaseDetails(null);
    setSelectedPropertyId(propertyId);
    window.setTimeout(() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  if (user && session) {
    return (
      <PropertyManagementWorkspace
        user={user}
        token={session.access_token}
        onSignOut={() => void signOut()}
      />
    );
  }

  return (
    <main id="top" className="min-h-[100dvh] overflow-hidden bg-[#e9eef3] text-[#102238]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between gap-2 border-b border-[#d1dbe4] px-2 py-3 sm:gap-3 sm:px-5 sm:py-4 md:px-12 lg:px-[7.4%]">
        <Wordmark compact />
        {!user && <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.08em] text-[#53677c] md:flex" aria-label={t('Main navigation', 'التنقل الرئيسي')}>
          <a href="#portfolio" className="transition-colors hover:text-[#102238]">{t('Portfolio', 'المحفظة')}</a>
          <a href="#records" className="transition-colors hover:text-[#102238]">{t('Rental records', 'سجلات الإيجار')}</a>
          <a href="#owners" className="transition-colors hover:text-[#102238]">{t('For owners', 'للملاك')}</a>
        </nav>}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <Link href="/tenant-portal" className="shrink-0 border border-[#cbd7e1] bg-white px-2.5 py-2 font-mono text-[8px] font-semibold uppercase tracking-[.05em] text-[#315b91] sm:px-3">
            {t('Tenant Portal', 'بوابة المستأجر')}
          </Link>
          <LanguageSwitcher />
          {user ? (
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <span dir="ltr" className="hidden truncate font-mono text-[9px] text-[#61758a] sm:inline">{user.email}</span>
              <button type="button" aria-label={t('Sign out', 'تسجيل الخروج')} onClick={() => void signOut()} className="shrink-0 whitespace-nowrap rounded-sm bg-[#102238] px-2 py-2 font-mono text-[8px] uppercase tracking-[.04em] text-white sm:px-3 sm:py-2.5 sm:text-[9px] sm:tracking-[.06em]">
                <span className="sm:hidden">{t('Exit', 'خروج')}</span>
                <span className="hidden sm:inline">{t('Sign out', 'تسجيل الخروج')}</span>
              </button>
            </div>
          ) : (
            <a href="#portfolio" className="hidden shrink-0 whitespace-nowrap rounded-sm bg-[#3f7cff] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[.06em] text-white transition-colors hover:bg-[#2f68e0] sm:inline-flex sm:px-4">{t('Owner sign in', 'دخول المالك')}</a>
          )}
        </div>
      </header>

      {createdLeaseDetails ? (
        <LeaseDetailsPage {...createdLeaseDetails} token={token} onGoToDashboard={goToDashboard} />
      ) : (
        <>
      <section className={user ? 'mx-auto grid max-w-[1440px] px-4 pb-10 pt-5 md:px-8 md:pt-6 lg:px-10' : 'mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 pt-12 md:px-12 md:pb-24 md:pt-16 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-12 lg:px-[7.4%]'}>
        {!user && <div className="relative z-[1] max-w-[500px]">
          <div className="mb-6 inline-flex items-center gap-2 border border-[#c6d3df] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.13em] text-[#536c83]">
            <span className="h-1.5 w-1.5 bg-[#3f7cff]" /> {t('Your properties, clearly kept', 'عقاراتك، بوضوح وترتيب')}
          </div>
          <h1 className="max-w-[560px] text-[clamp(3.1rem,6.4vw,5.7rem)] font-semibold leading-[.91] tracking-[-.075em]">{t('Start with', 'ابدأ بما')}<br />{t('what you', 'تملكه')} <span className="text-[#3f7cff]">{t('own.', 'أنت.')}</span></h1>
          <p className="mt-6 max-w-[340px] text-[14px] leading-[1.65] text-[#566b80]">{t('Your rental properties lead. Tenants, leases and rent records stay connected to each one.', 'عقاراتك المؤجرة في المقدمة. المستأجرون والعقود وسجلات الإيجار تبقى مرتبطة بكل عقار.')}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#portfolio" className="group inline-flex items-center gap-3 rounded-sm bg-[#3f7cff] px-4 py-3 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5">{t('Explore the portfolio', 'استكشف المحفظة')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" /></a>
            <span className="font-mono text-[9px] uppercase tracking-[.08em] text-[#718398]">{t('For independent owners', 'للملاك المستقلين')}</span>
          </div>
          <div className="mt-11 flex items-center gap-3 border-t border-[#cbd6df] pt-4"><RentlyMark size={25} /><p className="font-mono text-[10px] text-[#526980]">{t('Your inventory. Its records.', 'ممتلكاتك. وسجلاتها.')}</p></div>
        </div>}

        <div className={user ? 'relative w-full' : 'relative mx-auto w-full max-w-[760px] lg:ms-auto'}>
          {!user && <div className="absolute -end-4 -top-5 h-[180px] w-[180px] border border-[#c5d2de] md:-end-9 md:-top-8 md:h-[280px] md:w-[280px]" />}
          <div className={`relative border border-[#c6d2dd] bg-[#f4f7f9] p-3 md:p-5 ${user ? '' : 'shadow-[0_24px_70px_-48px_rgba(16,34,56,.45)]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1e8] px-2 pb-3 pt-1">
              <div className="flex items-center gap-2.5"><RentlyMark size={28} /><div><p className={user ? 'text-[13px] font-bold tracking-[-.02em]' : 'text-[11px] font-bold tracking-[-.02em]'}>{t('Property portfolio', 'محفظة العقارات')}</p>{!user && <p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#7b8da0]">{t('Owner inventory / private records', 'ممتلكات المالك / سجلات خاصة')}</p>}</div></div>
              {!user && <span className="border border-[#c5d4e0] bg-[#e8f0f6] px-2 py-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#44627e]">{t('Sign in required', 'يلزم تسجيل الدخول')}</span>}
            </div>

            {user && token && supabaseConfigured && (
              <GuidedSetupDisclosure>
                <GuidedSetup key={user.id} token={token} userId={user.id} onOpenRecords={(id) => { setSelectedPropertyId(id); window.setTimeout(() => document.getElementById('records')?.scrollIntoView({ behavior: 'smooth' }), 50); }} onLeaseCreated={showLeaseDetails} />
              </GuidedSetupDisclosure>
            )}
            <div className={user ? 'mt-3 grid gap-3 xl:grid-cols-[minmax(300px,.42fr)_1fr] xl:items-start' : ''}>
            <div id="portfolio" className="mt-3 border border-[#cdd9e3] bg-[#e7eef4] p-3 md:p-4">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
                <div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#536c83]">{t('Owned properties', 'العقارات المملوكة')}</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-.045em]">{t('Your portfolio', 'محفظتك')} <span className="font-mono text-[10px] font-normal text-[#6f8295]">{propertiesQuery.data ? `/ ${String(propertiesQuery.data.length).padStart(2, '0')}` : ''}</span></h2></div>
                {user && token ? (
                  <CreatePropertyForm token={token} userId={user.id} onCreated={(id) => setSelectedPropertyId(id)} />
                ) : (
                  <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.07em] text-[#536c83]"><Home size={12} className="text-[#3f7cff]" /> {t('Landlord-owned', 'ملك المالك')}</span>
                )}
              </div>
              {!supabaseConfigured ? (
                <div className="border border-[#d7e0e7] bg-[#f7f9fb] p-4">
                  <p className="text-[11px] font-semibold">{t('Rently database connection is not set up yet.', 'لم يتم إعداد اتصال قاعدة بيانات Rently بعد.')}</p>
                  <p className="mt-1 text-[9px] leading-5 text-[#718398]">{t('Connect the dedicated Supabase project to load private owner records.', 'اربط مشروع Supabase المخصص لتحميل سجلات المالك الخاصة.')}</p>
                </div>
              ) : !authReady ? (
                <p role="status" className="flex items-center gap-2 p-4 font-mono text-[9px] text-[#61768b]"><LoaderCircle size={14} className="animate-spin" /> {t('Restoring secure session…', 'جارٍ استعادة الجلسة الآمنة…')}</p>
              ) : !user ? (
                <div className="grid gap-2 border border-[#d7e0e7] bg-[#f7f9fb] p-4 sm:grid-cols-[.8fr_1.2fr] sm:gap-5">
                  <div><p className="text-[11px] font-semibold">{t('Sign in to view your properties', 'سجّل الدخول لعرض عقاراتك')}</p><p className="mt-1 text-[9px] leading-5 text-[#718398]">{t('Only records belonging to your account can be loaded.', 'لا يتم تحميل إلا السجلات التابعة لحسابك.')}</p></div>
                  <AuthForm />
                </div>
              ) : propertiesQuery.isPending ? (
                <p role="status" className="flex items-center gap-2 p-4 font-mono text-[9px] text-[#61768b]"><LoaderCircle size={14} className="animate-spin" /> {t('Loading your properties…', 'جارٍ تحميل عقاراتك…')}</p>
              ) : propertiesQuery.isError ? (
                <div role="alert" className="border border-red-200 bg-red-50 p-4">
                  <p className="text-[10px] font-semibold text-red-800">{t('Your properties could not be loaded.', 'تعذّر تحميل عقاراتك.')}</p>
                  <p className="mt-1 text-[9px] text-red-700">{text(propertiesQuery.error.message)}</p>
                  <button type="button" onClick={() => void propertiesQuery.refetch()} className="mt-2 font-mono text-[8px] uppercase text-red-800 underline">{t('Try again', 'حاول مجددًا')}</button>
                </div>
              ) : propertiesQuery.data?.length === 0 ? (
                <div className="border border-[#d7e0e7] bg-[#f7f9fb] p-4">
                  <p className="text-[11px] font-semibold">{t('No properties yet.', 'لا توجد عقارات بعد.')}</p>
                  <p className="mt-1 text-[9px] text-[#718398]">{t('Use the guided setup above or Add property.', 'استخدم الإعداد الموجّه أعلاه أو «إضافة عقار».')}</p>
                </div>
              ) : (
                <>
                  {!user && <p className="mb-2 px-1 font-mono text-[7px] uppercase tracking-[.08em] text-[#7b8da0]">{t('Select a property for its tenant and lease details', 'اختر عقارًا لعرض تفاصيل المستأجر والعقد')}</p>}
                  <div className="space-y-2">
                    {propertiesQuery.data?.map((property, index) => (
                      <PropertyButton
                        key={property.id}
                        property={property}
                        index={index}
                        selected={selectedPropertyId === property.id}
                        onSelect={() => setSelectedPropertyId(property.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div id="records" className={user ? 'mt-3 xl:mt-0' : 'mt-3'}>
              {!user ? null : !selectedProperty ? null : (
                <div className="grid gap-2.5 md:grid-cols-[.72fr_1.28fr] xl:grid-cols-[minmax(260px,.6fr)_1.4fr]">
                  <div className="grid content-start gap-2.5">
                    <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3 md:p-4">
                      <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#64798d]">{t('Selected property', 'العقار المحدد')}</p><Home size={14} className="text-[#3f7cff]" /></div>
                      <p data-testid="text-selected-property" dir="auto" className="mt-2 text-[12px] font-semibold tracking-[-.025em]">{selectedProperty.name}</p>
                      <p className="mt-1 font-mono text-[8px] text-[#778a9c]"><bdi>{propertyLocation(selectedProperty)}</bdi></p>
                      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[7px] uppercase tracking-[.05em]">
                        <span className="border border-[#cbd8e2] bg-[#e8eef3] px-1.5 py-1 text-[#47617a]">{PROPERTY_TYPE_LABELS[selectedProperty.property_type] ? text(PROPERTY_TYPE_LABELS[selectedProperty.property_type]) : selectedProperty.property_type}</span>
                      </div>
                    </div>
                    {detailsQuery.data?.rentSetupRequired ? (
                      <p role="alert" className="border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900">{t('Rent management needs the Supabase database update. Your existing records remain available.', 'تحتاج إدارة الإيجارات إلى تحديث قاعدة بيانات Supabase. سجلاتك الحالية ما زالت متاحة.')}</p>
                    ) : token && detailsQuery.data && <Panel code="L+" title={message('Tenant & lease', 'المستأجر والعقد')}><CreateLeaseForm key={selectedProperty.id} token={token} userId={user.id} propertyId={selectedProperty.id} units={detailsQuery.data.units} defaultUnitLabel={selectedProperty.street_address?.trim() || selectedProperty.name} onCreated={(_id, lease) => showLeaseDetails(lease, selectedProperty.id, selectedProperty.name, detailsQuery.data?.units.find((unit) => unit.id === lease.unitId)?.unit_label ?? selectedProperty.name)} /></Panel>}
                  </div>
                  <div className="border border-[#d8e1e8] bg-[#f8fafb] px-3 py-3 md:px-4" aria-live="polite">
                    <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-bold">{t('Leases / dues', 'العقود / المستحقات')}</p><span className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]" dir="ltr">{today}</span></div>
                    {detailsQuery.isPending ? (
                      <div role="status" aria-label={t('Loading records', 'جارٍ تحميل السجلات')} className="space-y-2 border-t border-[#dce3e9] pt-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse bg-[#e4ebf1]" />)}</div>
                    ) : detailsQuery.isError ? (
                      <div role="alert" className="border-t border-[#dce3e9] py-3 text-[9px] text-red-700">
                        {t('Records failed to load:', 'تعذّر تحميل السجلات:')} {text(detailsQuery.error.message)}
                        <button type="button" onClick={() => void detailsQuery.refetch()} className="ms-2 underline">{t('Retry', 'إعادة المحاولة')}</button>
                      </div>
                    ) : detailsQuery.data ? (
                      <div className="space-y-3 border-t border-[#dce3e9] pt-2">
                        {detailsQuery.data.units.length === 0 ? (
                          <p className="text-[9px] text-[#718398]">{t('No tenant or lease yet. Create the first lease below; it will use this property address.', 'لا يوجد مستأجر أو عقد بعد. أنشئ أول عقد أدناه وسيُربط بعنوان العقار.')}</p>
                        ) : detailsQuery.data.units.map((unit) => (
                          <section key={unit.id} data-testid={`section-unit-${unit.id}`} className="border-b border-[#e4e9ee] pb-3 last:border-0 last:pb-0">
                            <p className="mb-2 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.06em] text-[#47617a]"><bdi dir="auto">{unit.unit_label}</bdi><span className="text-[#8192a3]">{unit.leases.length} {unit.leases.length === 1 ? t('lease', 'عقد') : t('leases', 'عقود')}</span></p>
                            {unit.leases.length === 0 ? (
                              <p className="text-[9px] text-[#718398]">{t('Vacant. No lease.', 'شاغرة. لا يوجد عقد.')}</p>
                            ) : (
                              <div className="space-y-2">{[...unit.leases].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((lease) => (
                                <LeaseRecord key={lease.id} lease={lease} ctx={{ token, userId: user.id, propertyId: selectedProperty.id, today }} />
                              ))}</div>
                            )}
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            </div>
            {!user && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d8e1e8] px-1 pt-2 font-mono text-[7px] uppercase tracking-[.08em] text-[#7d90a1]"><span>{t('Property address → tenant → lease', 'عنوان العقار ← المستأجر ← العقد')}</span><span className="text-[#60778c]">{t('Private owner records', 'سجلات المالك الخاصة')}</span></div>}
          </div>
        </div>
      </section>

      {!user && <>
      <section className="border-y border-[#cbd6df] bg-[#dde6ed]"><div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:grid-cols-2 md:grid-cols-4 md:items-center md:px-12 lg:px-[7.4%]"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#6b8094]">{t('Owner records, in context', 'سجلات المالك في سياقها')}</p><div className="flex items-center gap-2.5"><Home size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">{t('Your properties & addresses', 'عقاراتك وعناوينها')}</span></div><div className="flex items-center gap-2.5"><UsersRound size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">{t('Linked tenants & leases', 'مستأجرون وعقود مرتبطة')}</span></div><div className="flex items-center gap-2.5"><CalendarDays size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">{t('Due dates & manual rent records', 'مواعيد الاستحقاق وسجلات الإيجار اليدوية')}</span></div></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]">
        <div className="grid gap-7 md:grid-cols-[.78fr_1.22fr] md:gap-20"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">{t('01 / Keep in order', '01 / رتّب سجلاتك')}</p><h2 className="mt-4 max-w-[400px] text-[clamp(2.1rem,4.1vw,3.7rem)] font-semibold leading-[.98] tracking-[-.07em]">{t('Your properties', 'عقاراتك')}<br />{t('are the starting point.', 'هي نقطة البداية.')}</h2></div><p className="max-w-[390px] pt-2 text-[13px] leading-[1.7] text-[#586e83] md:pt-8">{t('Make the owner’s inventory distinct. Then follow each address, tenant, lease date and recorded rent.', 'اجعل ممتلكات المالك واضحة، وتابع عنوان كل عقار ومستأجره وعقده ودفعات الإيجار.')}</p></div>
        <div className="mt-10 grid border-t border-[#cbd6df] md:mt-14 md:grid-cols-2">
          <article className="border-b border-[#cbd6df] py-5 md:border-e md:pe-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><Home size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">{t('01 / Inventory', '01 / الممتلكات')}</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">{t('See what you own', 'اعرف ما تملكه')}</h3><p className="mt-1 text-[11px] text-[#708398]">{t('Keep every property and full apartment address clearly identified.', 'سجّل كل عقار بعنوانه الكامل ورقم الشقة.')}</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:ps-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><UsersRound size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">{t('02 / Connections', '02 / الروابط')}</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">{t('Link people & leases', 'اربط الأشخاص والعقود')}</h3><p className="mt-1 text-[11px] text-[#708398]">{t('Tenant and agreement details stay with the property address.', 'ترتبط بيانات المستأجر والعقد بعنوان العقار.')}</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:border-e md:pe-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><FileText size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">{t('03 / Agreement', '03 / الاتفاق')}</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">{t('Keep lease dates close', 'مواعيد العقد في متناولك')}</h3><p className="mt-1 text-[11px] text-[#708398]">{t('Find agreement terms where the rental relationship lives.', 'تجد شروط الاتفاق حيث تعيش علاقة الإيجار.')}</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:ps-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><CalendarDays size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">{t('04 / Rent', '04 / الإيجار')}</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">{t('Record rent manually', 'سجّل الإيجار يدويًا')}</h3><p className="mt-1 text-[11px] text-[#708398]">{t('See due dates; log payments yourself.', 'اطّلع على المواعيد وسجّل الدفعات بنفسك.')}</p></article>
        </div>
      </section>

      <section className="bg-[#102238] text-[#f0f5f8]"><div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-16 lg:px-[7.4%]"><div><p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#b5f06b]">{t('02 / A simple sequence', '02 / تسلسل بسيط')}</p><h2 className="mt-4 max-w-[330px] text-[clamp(2rem,3.8vw,3.3rem)] font-semibold leading-[.98] tracking-[-.065em]">{t('From your property outward.', 'من عقارك إلى كل ما يرتبط به.')}</h2></div><div className="grid gap-4 sm:grid-cols-3"><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">01</span><p className="mt-3 text-[12px] font-semibold">{t('Property address', 'عنوان العقار')}</p></div><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">02</span><p className="mt-3 text-[12px] font-semibold">{t('Tenant & lease', 'المستأجر والعقد')}</p></div><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">03</span><p className="mt-3 text-[12px] font-semibold">{t('Manual rent record', 'سجل إيجار يدوي')}</p></div></div></div></section>

      <section id="owners" className="relative overflow-hidden px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]"><div className="absolute -end-16 top-[-70px] h-[300px] w-[300px] border border-[#cbd6df] md:end-[6%] md:top-[-120px] md:h-[440px] md:w-[440px]" /><div className="relative mx-auto max-w-[1440px]"><div className="max-w-[590px]"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">{t('03 / For owners', '03 / للملاك')}</p><h2 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[.93] tracking-[-.075em]">{t('Your portfolio,', 'محفظتك،')}<br /><span className="text-[#3f7cff]">{t('not a tangle of records.', 'لا فوضى من السجلات.')}</span></h2><p className="mt-4 max-w-[360px] text-[13px] leading-5 text-[#586e83]">{t('A focused way for independent landlords to organize properties and the rental details attached to them.', 'طريقة مركّزة للملاك المستقلين لتنظيم العقارات وتفاصيل الإيجار المرتبطة بها.')}</p></div><div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#cbd6df] pt-4 font-mono text-[8px] uppercase tracking-[.07em] text-[#60768b]"><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> {t('Owned properties & addresses', 'العقارات وعناوينها')}</span><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> {t('Lease agreements', 'عقود الإيجار')}</span><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> {t('Manual rent records', 'سجلات الإيجار اليدوية')}</span></div><a href="#portfolio" className="group mt-6 inline-flex items-center gap-2 border-b border-[#3f7cff] pb-1.5 text-[11px] font-semibold text-[#214a83]">{t('Back to the portfolio', 'العودة إلى المحفظة')} <ArrowDownRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" /></a></div></section>

      </>}
        </>
      )}

      <footer className="border-t border-[#cbd6df] bg-[#dde6ed]"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-12 lg:px-[7.4%]"><Wordmark compact />{!user && <p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#708398]">{t('Your portfolio / clearly connected', 'محفظتك / مترابطة بوضوح')}</p>}<p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#8092a3]" dir="ltr">© 2025 Rently</p></div></footer>
    </main>
  );
}
