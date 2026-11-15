import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownRight, ArrowRight, CalendarDays, Check, FileText, Home, Layers3, LoaderCircle, MapPin, UsersRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { loadOwnerProperties, loadPropertyDetails, propertyLocation, type Property } from '@/lib/rently-data';
import { supabase, supabaseConfigured } from '@/lib/supabase';

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
  return (
    <a href="#top" className="inline-flex items-center gap-2.5" aria-label="Rently home">
      <RentlyMark size={compact ? 34 : 40} />
      <span className="text-[20px] font-bold tracking-[-.07em] text-[#102238]">rently<span className="text-[#3f7cff]">/</span></span>
    </a>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function AuthForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to authenticate. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-2.5" aria-label={mode === 'sign-in' ? 'Sign in' : 'Create an account'}>
      <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-10 border border-[#cbd7e1] bg-white px-3 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
        />
      </label>
      <label className="grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]">
        Password
        <input
          required
          minLength={8}
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-10 border border-[#cbd7e1] bg-white px-3 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff]"
        />
      </label>
      {error && <p role="alert" className="text-[10px] text-red-700">{error}</p>}
      {message && <p role="status" className="text-[10px] text-[#466a2d]">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={submitting} className="inline-flex min-h-9 items-center gap-2 bg-[#102238] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-white disabled:opacity-60">
          {submitting && <LoaderCircle size={13} className="animate-spin" />}
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
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
          {mode === 'sign-in' ? 'Create an account' : 'Already registered? Sign in'}
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
      aria-label={`Show tenant and lease details for ${property.name}`}
      className={`grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 bg-[#f7f9fb] p-2.5 text-left transition-colors hover:border-[#3f7cff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] md:grid-cols-[48px_minmax(0,1fr)_auto_auto] md:gap-4 md:p-3 ${selected ? 'border-[#3f7cff] ring-1 ring-[#3f7cff]' : 'border border-[#d7e0e7]'}`}
    >
      <div className={`grid h-[42px] w-[42px] place-items-center ${accents[index % accents.length]} font-mono text-[10px] font-medium tracking-[.08em] text-[#344f68] md:h-12 md:w-12`}>{glyph || 'RE'}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-[11px] font-semibold tracking-[-.02em]">{property.name}</p>
          <span className="border border-[#bfcfdd] px-1 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] text-[#526c83]">Owned</span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate font-mono text-[8px] text-[#7b8da0]"><MapPin size={9} />{propertyLocation(property)}</p>
      </div>
      <span className="hidden font-mono text-[8px] text-[#61768b] md:block">{property.property_type}</span>
      <span className="whitespace-nowrap border-l border-[#dce3e9] pl-3 font-mono text-[8px] text-[#61768b]">{property.units.length} {property.units.length === 1 ? 'unit' : 'units'}</span>
    </button>
  );
}

export function RentlyHomepage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      queryClient.clear();
      setSelectedPropertyId(null);
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Unable to restore the Rently session', error);
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const propertiesQuery = useQuery({
    queryKey: ['rently-properties', user?.id],
    queryFn: () => loadOwnerProperties(user!.id),
    enabled: supabaseConfigured && authReady && Boolean(user),
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
  });

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Unable to sign out of Rently', error);
  }

  return (
    <main id="top" className="min-h-[100dvh] overflow-hidden bg-[#e9eef3] text-[#102238]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between border-b border-[#d1dbe4] px-5 py-4 md:px-12 lg:px-[7.4%]">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.08em] text-[#53677c] md:flex" aria-label="Main navigation">
          <a href="#portfolio" className="transition-colors hover:text-[#102238]">Portfolio</a>
          <a href="#records" className="transition-colors hover:text-[#102238]">Rental records</a>
          <a href="#owners" className="transition-colors hover:text-[#102238]">For owners</a>
        </nav>
        {user ? (
          <div className="flex max-w-[55%] items-center gap-2 sm:gap-3">
            <span className="truncate font-mono text-[9px] text-[#61758a]">{user.email}</span>
            <button type="button" onClick={() => void signOut()} className="rounded-sm bg-[#102238] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[.06em] text-white">Sign out</button>
          </div>
        ) : (
          <a href="#portfolio" className="rounded-sm bg-[#102238] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[.06em] text-white sm:px-4">Owner sign in</a>
        )}
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 pt-12 md:px-12 md:pb-24 md:pt-16 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:gap-12 lg:px-[7.4%]">
        <div className="relative z-[1] max-w-[500px]">
          <div className="mb-6 inline-flex items-center gap-2 border border-[#c6d3df] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.13em] text-[#536c83]">
            <span className="h-1.5 w-1.5 bg-[#3f7cff]" /> Your properties, clearly kept
          </div>
          <h1 className="max-w-[560px] text-[clamp(3.1rem,6.4vw,5.7rem)] font-semibold leading-[.91] tracking-[-.075em]">Start with<br />what you <span className="text-[#3f7cff]">own.</span></h1>
          <p className="mt-6 max-w-[340px] text-[14px] leading-[1.65] text-[#566b80]">Your rental properties lead. Tenants, leases and rent records stay connected to each one.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#portfolio" className="group inline-flex items-center gap-3 rounded-sm bg-[#3f7cff] px-4 py-3 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5">Explore the portfolio <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></a>
            <span className="font-mono text-[9px] uppercase tracking-[.08em] text-[#718398]">For independent owners</span>
          </div>
          <div className="mt-11 flex items-center gap-3 border-t border-[#cbd6df] pt-4"><RentlyMark size={25} /><p className="font-mono text-[10px] text-[#526980]">Your inventory. Its records.</p></div>
        </div>

        <div className="relative mx-auto w-full max-w-[760px] lg:ml-auto">
          <div className="absolute -right-4 -top-5 h-[180px] w-[180px] border border-[#c5d2de] md:-right-9 md:-top-8 md:h-[280px] md:w-[280px]" />
          <div className="relative border border-[#c6d2dd] bg-[#f4f7f9] p-3 shadow-[0_24px_70px_-48px_rgba(16,34,56,.45)] md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e1e8] px-2 pb-3 pt-1">
              <div className="flex items-center gap-2.5"><RentlyMark size={28} /><div><p className="text-[11px] font-bold tracking-[-.02em]">Property portfolio</p><p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#7b8da0]">Owner inventory / private records</p></div></div>
              <span className="border border-[#c5d4e0] bg-[#e8f0f6] px-2 py-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#44627e]">{user ? 'Owner data' : 'Sign in required'}</span>
            </div>

            <div id="portfolio" className="mt-3 border border-[#cdd9e3] bg-[#e7eef4] p-3 md:p-4">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
                <div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#536c83]">Owned properties</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-.045em]">Your portfolio <span className="font-mono text-[10px] font-normal text-[#6f8295]">{propertiesQuery.data ? `/ ${String(propertiesQuery.data.length).padStart(2, '0')}` : ''}</span></h2></div>
                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.07em] text-[#536c83]"><Home size={12} className="text-[#3f7cff]" /> Landlord-owned</span>
              </div>
              {!supabaseConfigured ? (
                <div className="border border-[#d7e0e7] bg-[#f7f9fb] p-4">
                  <p className="text-[11px] font-semibold">Rently database connection is not set up yet.</p>
                  <p className="mt-1 text-[9px] leading-5 text-[#718398]">Connect the dedicated Supabase project to load private owner records.</p>
                </div>
              ) : !authReady ? (
                <p role="status" className="flex items-center gap-2 p-4 font-mono text-[9px] text-[#61768b]"><LoaderCircle size={14} className="animate-spin" /> Restoring secure session…</p>
              ) : !user ? (
                <div className="grid gap-2 border border-[#d7e0e7] bg-[#f7f9fb] p-4 sm:grid-cols-[.8fr_1.2fr] sm:gap-5">
                  <div><p className="text-[11px] font-semibold">Sign in to view your properties</p><p className="mt-1 text-[9px] leading-5 text-[#718398]">Only records belonging to your account can be loaded.</p></div>
                  <AuthForm />
                </div>
              ) : propertiesQuery.isPending ? (
                <p role="status" className="flex items-center gap-2 p-4 font-mono text-[9px] text-[#61768b]"><LoaderCircle size={14} className="animate-spin" /> Loading your properties…</p>
              ) : propertiesQuery.isError ? (
                <div role="alert" className="border border-red-200 bg-red-50 p-4">
                  <p className="text-[10px] font-semibold text-red-800">Your properties could not be loaded.</p>
                  <p className="mt-1 text-[9px] text-red-700">{propertiesQuery.error.message}</p>
                  <button type="button" onClick={() => void propertiesQuery.refetch()} className="mt-2 font-mono text-[8px] uppercase text-red-800 underline">Try again</button>
                </div>
              ) : propertiesQuery.data?.length === 0 ? (
                <div className="border border-[#d7e0e7] bg-[#f7f9fb] p-4">
                  <p className="text-[11px] font-semibold">No properties are linked to this account yet.</p>
                  <p className="mt-1 text-[9px] text-[#718398]">Your portfolio will appear here when property records are added.</p>
                </div>
              ) : (
                <>
                  <p className="mb-2 px-1 font-mono text-[7px] uppercase tracking-[.08em] text-[#7b8da0]">Select a property for its tenant and lease details</p>
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

            <div id="records" className="mt-3">
              {!user ? null : !selectedProperty ? null : (
                <div className="grid gap-2.5 md:grid-cols-[.72fr_1.28fr]">
                  <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3 md:p-4">
                    <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#64798d]">Selected property</p><Home size={14} className="text-[#3f7cff]" /></div>
                    <p className="mt-2 text-[12px] font-semibold tracking-[-.025em]">{selectedProperty.name}</p>
                    <p className="mt-1 font-mono text-[8px] text-[#778a9c]">{propertyLocation(selectedProperty)}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[7px] uppercase tracking-[.05em]">
                      <span className="border border-[#cbd8e2] bg-[#e8eef3] px-1.5 py-1 text-[#47617a]">{selectedProperty.property_type}</span>
                      <span className="border border-[#d8e1e8] px-1.5 py-1 text-[#6b7f92]">{selectedProperty.units.length} {selectedProperty.units.length === 1 ? 'unit' : 'units'}</span>
                    </div>
                  </div>
                  <div className="border border-[#d8e1e8] bg-[#f8fafb] px-3 py-3 md:px-4" aria-live="polite">
                    <div className="mb-2 flex items-center justify-between gap-2"><p className="text-[10px] font-bold">Tenant and lease details</p><span className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Linked records</span></div>
                    {detailsQuery.isPending ? (
                      <p role="status" className="flex items-center gap-2 border-t border-[#dce3e9] py-3 font-mono text-[9px] text-[#61768b]"><LoaderCircle size={13} className="animate-spin" /> Loading linked records…</p>
                    ) : detailsQuery.isError ? (
                      <div role="alert" className="border-t border-[#dce3e9] py-3 text-[9px] text-red-700">
                        Could not load this property’s linked records.
                        <button type="button" onClick={() => void detailsQuery.refetch()} className="ml-2 underline">Try again</button>
                      </div>
                    ) : detailsQuery.data ? (
                      <div className="space-y-3 border-t border-[#dce3e9] pt-2">
                        {detailsQuery.data.units.length === 0 ? (
                          <p className="text-[9px] text-[#718398]">No units have been added to this property.</p>
                        ) : detailsQuery.data.units.map((unit) => (
                          <section key={unit.id} className="border-b border-[#e4e9ee] pb-3 last:border-0 last:pb-0">
                            <p className="mb-2 font-mono text-[8px] uppercase tracking-[.06em] text-[#47617a]">{unit.unit_label}</p>
                            {unit.leases.length === 0 ? (
                              <p className="text-[9px] text-[#718398]">No tenant or lease is linked to this unit.</p>
                            ) : unit.leases.map((lease) => (
                              <dl key={lease.id} className="grid grid-cols-2 gap-x-3 gap-y-2">
                                <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Tenant</dt><dd className="mt-0.5 text-[9px] font-semibold">{lease.tenants?.full_name ?? 'Tenant details unavailable'}</dd></div>
                                <div><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Lease status</dt><dd className="mt-0.5 text-[9px] font-semibold capitalize">{lease.status}</dd></div>
                                {lease.tenants?.email && <div className="col-span-2"><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Email</dt><dd className="mt-0.5 break-all text-[9px] font-semibold">{lease.tenants.email}</dd></div>}
                                {lease.tenants?.phone && <div className="col-span-2"><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Phone</dt><dd className="mt-0.5 text-[9px] font-semibold">{lease.tenants.phone}</dd></div>}
                                <div className="col-span-2"><dt className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Lease dates</dt><dd className="mt-0.5 text-[9px] font-semibold">{formatDate(lease.start_date)} – {formatDate(lease.end_date)}</dd></div>
                              </dl>
                            ))}
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d8e1e8] px-1 pt-2 font-mono text-[7px] uppercase tracking-[.08em] text-[#7d90a1]"><span>Property → unit → lease</span><span className="text-[#60778c]">Private owner records</span></div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cbd6df] bg-[#dde6ed]"><div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:grid-cols-2 md:grid-cols-4 md:items-center md:px-12 lg:px-[7.4%]"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#6b8094]">Owner records, in context</p><div className="flex items-center gap-2.5"><Home size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Your properties & units</span></div><div className="flex items-center gap-2.5"><UsersRound size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Linked tenants & leases</span></div><div className="flex items-center gap-2.5"><CalendarDays size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Due dates & manual rent records</span></div></div></section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]">
        <div className="grid gap-7 md:grid-cols-[.78fr_1.22fr] md:gap-20"><div><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">01 / Keep in order</p><h2 className="mt-4 max-w-[400px] text-[clamp(2.1rem,4.1vw,3.7rem)] font-semibold leading-[.98] tracking-[-.07em]">Your properties<br />are the starting point.</h2></div><p className="max-w-[390px] pt-2 text-[13px] leading-[1.7] text-[#586e83] md:pt-8">Make the owner’s inventory distinct. Then follow each home’s units, people, lease dates and manually recorded rent.</p></div>
        <div className="mt-10 grid border-t border-[#cbd6df] md:mt-14 md:grid-cols-2">
          <article className="border-b border-[#cbd6df] py-5 md:border-r md:pr-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><Home size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">01 / Inventory</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">See what you own</h3><p className="mt-1 text-[11px] text-[#708398]">Keep rental homes and their units clearly identified.</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:pl-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><UsersRound size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">02 / Connections</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Link people & leases</h3><p className="mt-1 text-[11px] text-[#708398]">Tenant and agreement details stay under the right unit.</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:border-r md:pr-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><FileText size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">03 / Agreement</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Keep lease dates close</h3><p className="mt-1 text-[11px] text-[#708398]">Find agreement terms where the rental relationship lives.</p></article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:pl-12 md:py-7"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><CalendarDays size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">04 / Rent</span></div><h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Record rent manually</h3><p className="mt-1 text-[11px] text-[#708398]">See due dates; log payments yourself.</p></article>
        </div>
      </section>

      <section className="bg-[#102238] text-[#f0f5f8]"><div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-16 lg:px-[7.4%]"><div><p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#b5f06b]">02 / A simple sequence</p><h2 className="mt-4 max-w-[330px] text-[clamp(2rem,3.8vw,3.3rem)] font-semibold leading-[.98] tracking-[-.065em]">From your property outward.</h2></div><div className="grid gap-4 sm:grid-cols-4"><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">01</span><p className="mt-3 text-[12px] font-semibold">Property</p></div><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">02</span><p className="mt-3 text-[12px] font-semibold">Unit</p></div><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">03</span><p className="mt-3 text-[12px] font-semibold">Tenant & lease</p></div><div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">04</span><p className="mt-3 text-[12px] font-semibold">Manual rent record</p></div></div></div></section>

      <section id="owners" className="relative overflow-hidden px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]"><div className="absolute -right-16 top-[-70px] h-[300px] w-[300px] border border-[#cbd6df] md:right-[6%] md:top-[-120px] md:h-[440px] md:w-[440px]" /><div className="relative mx-auto max-w-[1440px]"><div className="max-w-[590px]"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">03 / For owners</p><h2 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[.93] tracking-[-.075em]">Your portfolio,<br /><span className="text-[#3f7cff]">not a tangle of records.</span></h2><p className="mt-4 max-w-[360px] text-[13px] leading-5 text-[#586e83]">A focused way for independent landlords to organize properties and the rental details attached to them.</p></div><div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#cbd6df] pt-4 font-mono text-[8px] uppercase tracking-[.07em] text-[#60768b]"><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Owned properties & units</span><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Lease agreements</span><span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Manual rent records</span></div><a href="#portfolio" className="group mt-6 inline-flex items-center gap-2 border-b border-[#3f7cff] pb-1.5 text-[11px] font-semibold text-[#214a83]">Back to the portfolio <ArrowDownRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" /></a></div></section>

      <footer className="border-t border-[#cbd6df] bg-[#dde6ed]"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-12 lg:px-[7.4%]"><Wordmark compact /><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#708398]">Your portfolio / clearly connected</p><p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#8092a3]">© 2025 Rently</p></div></footer>
    </main>
  );
}
