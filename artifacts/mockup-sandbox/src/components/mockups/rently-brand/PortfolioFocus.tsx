import { ArrowDownRight, ArrowRight, CalendarDays, Check, ChevronRight, FileText, Home, Layers3, MapPin, UsersRound } from 'lucide-react';
import './_group.css';

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

const properties = [
  { name: 'Cedar House', location: 'North Park · San Diego', kind: 'Duplex', units: '2 units', accent: 'bg-[#dce8f3]', glyph: 'CH' },
  { name: 'Juniper Flat', location: 'Hillcrest · San Diego', kind: 'Apartment', units: '1 unit', accent: 'bg-[#e6e8df]', glyph: 'JF' },
  { name: 'Bayview Cottage', location: 'Point Loma · San Diego', kind: 'Detached home', units: '1 unit', accent: 'bg-[#e8e1d8]', glyph: 'BC' },
];

export function PortfolioFocus() {
  return (
    <main id="top" className="min-h-[100dvh] overflow-hidden bg-[#e9eef3] text-[#102238]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between border-b border-[#d1dbe4] px-5 py-4 md:px-12 lg:px-[7.4%]">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.08em] text-[#53677c] md:flex" aria-label="Main navigation">
          <a href="#portfolio" className="transition-colors hover:text-[#102238]">Portfolio</a>
          <a href="#records" className="transition-colors hover:text-[#102238]">Rental records</a>
          <a href="#owners" className="transition-colors hover:text-[#102238]">For owners</a>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button disabled className="cursor-not-allowed rounded-sm px-3 py-2.5 font-mono text-[10px] uppercase tracking-[.06em] text-[#61758a] opacity-60 sm:px-4" aria-label="Log in, unavailable">Log in</button>
          <button disabled className="cursor-not-allowed rounded-sm bg-[#102238] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.06em] text-[#f4f7f9] opacity-65 sm:px-5" aria-label="Sign up, unavailable">Sign up</button>
        </div>
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
              <div className="flex items-center gap-2.5"><RentlyMark size={28} /><div><p className="text-[11px] font-bold tracking-[-.02em]">Property portfolio</p><p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#7b8da0]">Owner inventory / sample view</p></div></div>
              <span className="border border-[#c5d4e0] bg-[#e8f0f6] px-2 py-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#44627e]">Sample / demo data</span>
            </div>

            <div id="portfolio" className="mt-3 border border-[#cdd9e3] bg-[#e7eef4] p-3 md:p-4">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2 px-1">
                <div><p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#536c83]">Owned properties</p><h2 className="mt-1 text-[17px] font-semibold tracking-[-.045em]">Your portfolio <span className="font-mono text-[10px] font-normal text-[#6f8295]">/ 03</span></h2></div>
                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[.07em] text-[#536c83]"><Home size={12} className="text-[#3f7cff]" /> Landlord-owned</span>
              </div>
              <div className="space-y-2">
                {properties.map((property, index) => (
                  <article key={property.name} className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 border border-[#d7e0e7] bg-[#f7f9fb] p-2.5 md:grid-cols-[48px_minmax(0,1fr)_auto_auto] md:gap-4 md:p-3">
                    <div className={`grid h-[42px] w-[42px] place-items-center ${property.accent} font-mono text-[10px] font-medium tracking-[.08em] text-[#344f68] md:h-12 md:w-12`}>{property.glyph}</div>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><p className="truncate text-[11px] font-semibold tracking-[-.02em]">{property.name}</p><span className="border border-[#bfcfdd] px-1 py-0.5 font-mono text-[7px] uppercase tracking-[.06em] text-[#526c83]">Owned</span></div><p className="mt-1 flex items-center gap-1 truncate font-mono text-[8px] text-[#7b8da0]"><MapPin size={9} />{property.location}</p></div>
                    <span className="hidden font-mono text-[8px] text-[#61768b] md:block">{property.kind}</span>
                    <span className="whitespace-nowrap border-l border-[#dce3e9] pl-3 font-mono text-[8px] text-[#61768b]">{property.units}</span>
                    <span className="sr-only">Sample property {index + 1}</span>
                  </article>
                ))}
              </div>
            </div>

            <div id="records" className="mt-3 grid gap-2.5 md:grid-cols-[.72fr_1.28fr]">
              <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3 md:p-4">
                <div className="flex items-center justify-between"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#64798d]">Linked rental records</p><Layers3 size={14} className="text-[#3f7cff]" /></div>
                <p className="mt-2 text-[12px] font-semibold tracking-[-.025em]">Records are not properties</p>
                <p className="mt-1 text-[9px] leading-[1.55] text-[#778a9c]">Tenant, lease and rent details attach to an owned home or unit.</p>
                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[7px] uppercase tracking-[.05em]">
                  <span className="border border-[#cbd8e2] bg-[#e8eef3] px-1.5 py-1 text-[#47617a]">Owner inventory</span><ChevronRight size={12} className="mt-0.5 text-[#8495a5]" /><span className="border border-[#d8e1e8] px-1.5 py-1 text-[#6b7f92]">Linked records</span>
                </div>
              </div>
              <div className="border border-[#d8e1e8] bg-[#f8fafb] px-3 py-3 md:px-4">
                <div className="mb-1 flex items-center justify-between"><p className="text-[10px] font-bold">Example record chain</p><span className="font-mono text-[7px] uppercase tracking-[.08em] text-[#8192a3]">Cedar House · demo</span></div>
                <div className="grid gap-1.5 sm:grid-cols-4">
                  <div className="flex items-center gap-2 border-t border-[#dce3e9] py-2 sm:block"><Home size={13} className="shrink-0 text-[#3f7cff]" /><p className="text-[9px] font-semibold sm:mt-1.5">Property</p><p className="ml-auto font-mono text-[7px] text-[#7d90a1] sm:ml-0 sm:mt-0.5">Cedar House</p></div>
                  <div className="flex items-center gap-2 border-t border-[#dce3e9] py-2 sm:block"><Layers3 size={13} className="shrink-0 text-[#3f7cff]" /><p className="text-[9px] font-semibold sm:mt-1.5">Unit</p><p className="ml-auto font-mono text-[7px] text-[#7d90a1] sm:ml-0 sm:mt-0.5">Unit 02</p></div>
                  <div className="flex items-center gap-2 border-t border-[#dce3e9] py-2 sm:block"><FileText size={13} className="shrink-0 text-[#3f7cff]" /><p className="text-[9px] font-semibold sm:mt-1.5">Lease</p><p className="ml-auto font-mono text-[7px] text-[#7d90a1] sm:ml-0 sm:mt-0.5">Tenant linked</p></div>
                  <div className="flex items-center gap-2 border-t border-[#dce3e9] py-2 sm:block"><CalendarDays size={13} className="shrink-0 text-[#3f7cff]" /><p className="text-[9px] font-semibold sm:mt-1.5">Rent record</p><p className="ml-auto font-mono text-[7px] text-[#7d90a1] sm:ml-0 sm:mt-0.5">Due 14 Jun · manual</p></div>
                </div>
                <div className="mt-1 flex items-center gap-2 border-t border-[#e1e7ec] pt-2"><UsersRound size={12} className="text-[#73889b]" /><p className="font-mono text-[7px] text-[#7d90a1]">Tenant details belong to the lease, not the property inventory.</p></div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d8e1e8] px-1 pt-2 font-mono text-[7px] uppercase tracking-[.08em] text-[#7d90a1]"><span>Property → unit → lease → rent record</span><span className="text-[#60778c]">Illustrative data only · not an account</span></div>
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
