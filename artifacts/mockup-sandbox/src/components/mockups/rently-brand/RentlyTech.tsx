import { ArrowDownRight, ArrowRight, CalendarDays, Check, ChevronRight, FileText, Layers3, UsersRound } from 'lucide-react';
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

function Wordmark({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <a href="#top" className="inline-flex items-center gap-2.5" aria-label="Rently home">
      <RentlyMark inverse={inverse} size={compact ? 34 : 40} />
      <span className="text-[20px] font-bold tracking-[-.07em]" style={{ color: inverse ? '#f0f5f8' : '#102238' }}>rently<span className="text-[#3f7cff]">/</span></span>
    </a>
  );
}

export function RentlyTech() {
  return (
    <main id="top" className="min-h-[100dvh] overflow-hidden bg-[#e9eef3] text-[#102238]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between border-b border-[#d1dbe4] px-5 py-4 md:px-12 lg:px-[7.4%]">
        <Wordmark />
        <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.08em] text-[#53677c] md:flex" aria-label="Main navigation">
          <a href="#platform" className="transition-colors hover:text-[#102238]">Platform</a>
          <a href="#workflow" className="transition-colors hover:text-[#102238]">Workflow</a>
          <a href="#owners" className="transition-colors hover:text-[#102238]">For owners</a>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button disabled className="cursor-not-allowed rounded-sm px-3 py-2.5 font-mono text-[10px] uppercase tracking-[.06em] text-[#61758a] opacity-60 sm:px-4" aria-label="Log in, unavailable">Log in</button>
          <button disabled className="cursor-not-allowed rounded-sm bg-[#102238] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.06em] text-[#f4f7f9] opacity-65 sm:px-5" aria-label="Sign up, unavailable">Sign up</button>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-16 pt-12 md:px-12 md:pb-24 md:pt-16 lg:grid-cols-[.88fr_1.12fr] lg:gap-8 lg:px-[7.4%]">
        <div className="relative z-[1] max-w-[560px]">
          <div className="mb-6 inline-flex items-center gap-2 border border-[#c6d3df] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.13em] text-[#536c83]">
            <span className="h-1.5 w-1.5 bg-[#3f7cff]" />
            Rental records / 01
          </div>
          <h1 className="max-w-[610px] text-[clamp(3.1rem,6.4vw,5.7rem)] font-semibold leading-[.91] tracking-[-.075em]">
            Rental records,<br /><span className="text-[#3f7cff]">in formation.</span>
          </h1>
          <p className="mt-6 max-w-[340px] text-[14px] leading-[1.65] text-[#566b80]">
            Property, people, leases, due dates. One clear record.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#platform" className="group inline-flex items-center gap-3 rounded-sm bg-[#3f7cff] px-4 py-3 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5">
              Explore Rently <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </a>
            <span className="font-mono text-[9px] uppercase tracking-[.08em] text-[#718398]">For independent owners</span>
          </div>
          <div className="mt-11 flex items-center gap-3 border-t border-[#cbd6df] pt-4">
            <RentlyMark size={25} />
            <p className="font-mono text-[10px] text-[#526980]">Clarity for the day-to-day.</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[640px] lg:ml-auto">
          <div className="absolute -right-5 -top-8 h-[220px] w-[220px] border border-[#c5d2de] md:-right-12 md:-top-12 md:h-[350px] md:w-[350px]" />
          <div className="absolute -right-1 -top-3 h-[180px] w-[180px] border border-[#c5d2de] md:right-[-15px] md:top-[-14px] md:h-[270px] md:w-[270px]" />
          <div className="relative border border-[#c6d2dd] bg-[#f4f7f9] p-3 shadow-[0_24px_70px_-48px_rgba(16,34,56,.45)] md:p-5">
            <div className="flex items-center justify-between border-b border-[#d8e1e8] px-2 pb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <RentlyMark size={28} />
                <div><p className="text-[11px] font-bold tracking-[-.02em]">Rental ledger</p><p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#7b8da0]">Rently / overview</p></div>
              </div>
              <span className="border border-[#ced9e2] px-2 py-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#687e92]">Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              <div className="bg-[#102238] p-4 text-[#f0f5f8] md:p-5">
                <p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#a5b7c7]">Property</p>
                <div className="mt-4 flex items-center justify-between"><p className="text-[16px] font-semibold tracking-[-.04em]">Cedar House</p><Layers3 size={16} className="text-[#b5f06b]" /></div>
                <p className="mt-2 font-mono text-[9px] text-[#a5b7c7]">Unit 01 / 1 lease</p>
              </div>
              <div className="border border-[#d8e1e8] bg-[#e8eef3] p-4 md:p-5">
                <p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#61768b]">Next rent due</p>
                <div className="mt-4 flex items-center justify-between"><p className="text-[24px] font-semibold leading-none tracking-[-.06em]">14 <span className="font-mono text-[10px] text-[#708398]">JUN</span></p><CalendarDays size={16} className="text-[#3f7cff]" /></div>
                <p className="mt-2 font-mono text-[9px] text-[#61768b]">Manual payment record</p>
              </div>
            </div>
            <div className="mt-2.5 border border-[#d8e1e8] bg-[#f8fafb] px-4 py-3 md:px-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold">Rental record</p><span className="font-mono text-[8px] uppercase tracking-[.08em] text-[#8192a3]">Lease / rent</span>
              </div>
              <div className="flex items-center gap-3 border-t border-[#e1e7ec] py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#e9eef3] text-[#3f7cff]"><UsersRound size={14} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">Tenant details</p><p className="mt-0.5 font-mono text-[8px] text-[#8192a3]">Linked to lease agreement</p></div>
                <ChevronRight size={13} className="text-[#8091a2]" />
              </div>
              <div className="flex items-center gap-3 border-t border-[#e1e7ec] py-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center bg-[#edf2e7] text-[#607b3c]"><FileText size={14} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">Lease agreement</p><p className="mt-0.5 font-mono text-[8px] text-[#8192a3]">Due date / payment history</p></div>
                <span className="flex items-center gap-1 border border-[#d6e2cd] px-1.5 py-1 font-mono text-[7px] uppercase text-[#637d4d]"><Check size={9} /> Filed</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1 pb-1 font-mono text-[7px] uppercase tracking-[.08em] text-[#7d90a1]">
              <span>Property → tenant → lease → rent</span><span>01 / 04</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#cbd6df] bg-[#dde6ed]">
        <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:grid-cols-2 md:grid-cols-4 md:items-center md:px-12 lg:px-[7.4%]">
          <p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#6b8094]">Rental records, connected</p>
          <div className="flex items-center gap-2.5"><Layers3 size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Properties</span></div>
          <div className="flex items-center gap-2.5"><UsersRound size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Tenants & leases</span></div>
          <div className="flex items-center gap-2.5"><CalendarDays size={15} className="text-[#3f7cff]" /><span className="text-[10px] font-semibold">Due dates & rent records</span></div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-[1440px] px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]">
        <div className="grid gap-7 md:grid-cols-[.78fr_1.22fr] md:gap-20">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">01 / Platform</p>
            <h2 className="mt-4 max-w-[400px] text-[clamp(2.1rem,4.1vw,3.7rem)] font-semibold leading-[.98] tracking-[-.07em]">The right record.<br />Right where it belongs.</h2>
          </div>
          <p className="max-w-[390px] pt-2 text-[13px] leading-[1.7] text-[#586e83] md:pt-8">
            Keep each property, tenant, lease and manual rent record in context.
          </p>
        </div>
        <div className="mt-10 grid border-t border-[#cbd6df] md:mt-14 md:grid-cols-2">
          <article className="border-b border-[#cbd6df] py-5 md:border-r md:pr-12 md:py-7">
            <div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><Layers3 size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">01 / Property</span></div>
            <h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Organize properties</h3>
            <p className="mt-1 text-[11px] text-[#708398]">Homes and their rental details, together.</p>
          </article>
          <article className="border-b border-[#cbd6df] py-5 md:pl-12 md:py-7">
            <div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><UsersRound size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">02 / People</span></div>
            <h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Connect tenants & leases</h3>
            <p className="mt-1 text-[11px] text-[#708398]">Associate people and agreements with a property.</p>
          </article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:border-r md:pr-12 md:py-7">
            <div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><FileText size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">03 / Agreement</span></div>
            <h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Keep lease agreements close</h3>
            <p className="mt-1 text-[11px] text-[#708398]">Find the lease with its rental record.</p>
          </article>
          <article className="border-b border-[#cbd6df] py-5 md:border-b-0 md:pl-12 md:py-7">
            <div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center border border-[#cbd6df] bg-[#f0f4f7] text-[#3f7cff]"><CalendarDays size={16} /></span><span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8092a3]">04 / Rent</span></div>
            <h3 className="mt-4 text-[15px] font-semibold tracking-[-.035em]">Track due dates manually</h3>
            <p className="mt-1 text-[11px] text-[#708398]">See what’s due. Record payments yourself.</p>
          </article>
        </div>
      </section>

      <section id="workflow" className="bg-[#102238] text-[#f0f5f8]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-16 lg:px-[7.4%]">
          <div><p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#b5f06b]">02 / Workflow</p><h2 className="mt-4 max-w-[330px] text-[clamp(2rem,3.8vw,3.3rem)] font-semibold leading-[.98] tracking-[-.065em]">A clear path through rental records.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">01</span><p className="mt-3 text-[12px] font-semibold">Add properties</p></div>
            <div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">02</span><p className="mt-3 text-[12px] font-semibold">Connect tenants & leases</p></div>
            <div className="border-t border-[#506175] py-3"><span className="font-mono text-[9px] text-[#b5f06b]">03</span><p className="mt-3 text-[12px] font-semibold">Record rent manually</p></div>
          </div>
        </div>
      </section>

      <section id="owners" className="relative overflow-hidden px-5 py-16 md:px-12 md:py-24 lg:px-[7.4%]">
        <div className="absolute -right-16 top-[-70px] h-[300px] w-[300px] border border-[#cbd6df] md:right-[6%] md:top-[-120px] md:h-[440px] md:w-[440px]" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="max-w-[590px]">
            <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#3f7cff]">03 / For owners</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.6rem)] font-semibold leading-[.93] tracking-[-.075em]">Rental management,<br /><span className="text-[#3f7cff]">without the sprawl.</span></h2>
            <p className="mt-4 max-w-[360px] text-[13px] leading-5 text-[#586e83]">A focused tool for individual landlords and small property owners.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#cbd6df] pt-4 font-mono text-[8px] uppercase tracking-[.07em] text-[#60768b]">
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Properties</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Lease agreements</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#3f7cff]" /> Manual rent records</span>
          </div>
          <a href="#platform" className="group mt-6 inline-flex items-center gap-2 border-b border-[#3f7cff] pb-1.5 text-[11px] font-semibold text-[#214a83]">Explore the platform <ArrowDownRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" /></a>
        </div>
      </section>

      <footer className="border-t border-[#cbd6df] bg-[#dde6ed]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-12 lg:px-[7.4%]">
          <Wordmark compact />
          <p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#708398]">Rental records / connected</p>
          <p className="font-mono text-[8px] uppercase tracking-[.09em] text-[#8092a3]">© 2025 Rently</p>
        </div>
      </footer>
    </main>
  );
}
