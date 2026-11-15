import { ArrowDownRight, ArrowRight, CalendarDays, FileText, Layers3, UsersRound } from 'lucide-react';

function RentlyMarkFocusSymbol({ size = 48, inverse = false }: { size?: number; inverse?: boolean }) {
  const stroke = inverse ? '#f2f3ec' : '#182c3c';
  const accent = inverse ? '#c7f078' : '#3978ec';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M11 4.75h19.4L43.25 17.6v19.15L30.4 43.25H11L4.75 37V11L11 4.75Z" stroke={stroke} strokeWidth="2.5" />
      <path d="M15.5 33V15h10.1c4.15 0 6.4 2.1 6.4 5.55 0 3.3-2.25 5.35-6.4 5.35h-5.45" stroke={accent} strokeWidth="3.4" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="m24.4 25.8 8.1 8.1" stroke={stroke} strokeWidth="2.7" strokeLinecap="square" />
      <path d="M31 5v8h8" stroke={accent} strokeWidth="2.5" />
    </svg>
  );
}

function MarkFocusWordmark() {
  return (
    <a href="#top" aria-label="Rently home" className="inline-flex items-center gap-2.5">
      <RentlyMarkFocusSymbol size={34} />
      <span className="text-[21px] font-bold tracking-[-.075em] text-[#182c3c]">rently<span className="text-[#3978ec]">/</span></span>
    </a>
  );
}

export function RentlyMarkFocus() {
  return (
    <main id="top" className="min-h-[100dvh] overflow-hidden bg-[#f2f1e9] text-[#182c3c]">
      <header className="mx-auto flex max-w-[1320px] items-center justify-between border-b border-[#d9d9ce] px-5 py-4 md:px-10 lg:px-16">
        <MarkFocusWordmark />
        <nav aria-label="Main navigation" className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[.12em] text-[#67747a] md:flex">
          <a className="transition-colors hover:text-[#182c3c]" href="#records">Records</a>
          <a className="transition-colors hover:text-[#182c3c]" href="#how-it-works">How it works</a>
        </nav>
        <a href="#records" className="inline-flex items-center gap-2 border border-[#182c3c] px-3.5 py-2.5 font-mono text-[9px] uppercase tracking-[.1em] transition-colors hover:bg-[#182c3c] hover:text-[#f2f1e9]">
          See the system <ArrowRight size={13} />
        </a>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-14 pt-9 md:px-10 md:pb-20 md:pt-14 lg:grid-cols-[.92fr_1.08fr] lg:gap-12 lg:px-16 lg:py-[74px]">
        <div className="relative z-10 max-w-[540px]">
          <p className="mb-6 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#65767b]">
            <span className="h-1.5 w-1.5 bg-[#3978ec]" /> A clearer way to keep the record
          </p>
          <h1 className="max-w-[560px] text-[clamp(3.35rem,7.3vw,6.5rem)] font-semibold leading-[.87] tracking-[-.085em]">
            Rental life,<br /><span className="text-[#3978ec]">in its place.</span>
          </h1>
          <p className="mt-6 max-w-[355px] text-[14px] leading-[1.7] text-[#5e6f75]">
            Property, people, leases and rent records—connected in one straightforward workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#records" className="group inline-flex items-center gap-3 bg-[#3978ec] px-4 py-3 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5">
              Explore Rently <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </a>
            <span className="font-mono text-[9px] uppercase tracking-[.1em] text-[#738187]">For independent owners</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[620px] lg:ml-auto">
          <div className="absolute -right-3 -top-3 h-[78%] w-[78%] border border-[#d4d8cc] md:-right-8 md:-top-8" />
          <div className="relative overflow-hidden bg-[#182c3c] px-5 pb-5 pt-4 text-[#f2f3ec] md:px-7 md:pb-7 md:pt-6">
            <div className="relative flex items-center justify-between border-b border-[#445462] pb-3">
              <div className="flex items-center gap-2.5">
                <RentlyMarkFocusSymbol size={27} inverse />
                <div>
                  <p className="text-[11px] font-semibold tracking-[-.02em]">Rently / Rental records</p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[.13em] text-[#a7b4b5]">A connected view</p>
                </div>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[.12em] text-[#a7b4b5]">01 — 04</span>
            </div>

            <div className="relative grid min-h-[294px] grid-cols-[1fr_1fr] gap-4 py-5 md:min-h-[352px] md:py-7">
              <div className="flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#a7b4b5]">Property</p>
                  <p className="mt-2 text-[18px] font-semibold tracking-[-.055em] md:text-[22px]">Cedar House</p>
                  <p className="mt-1 font-mono text-[9px] text-[#a7b4b5]">Unit 01 / one lease</p>
                </div>
                <div className="border-t border-[#445462] pt-3">
                  <p className="font-mono text-[8px] uppercase tracking-[.14em] text-[#a7b4b5]">Next rent due</p>
                  <p className="mt-2 text-[29px] font-semibold leading-none tracking-[-.07em]">14 <span className="font-mono text-[10px] text-[#c7f078]">JUN</span></p>
                </div>
              </div>
              <div className="relative grid place-items-center border-l border-[#445462]">
                <div className="absolute inset-0 grid place-items-center opacity-[.08]">
                  <RentlyMarkFocusSymbol size={260} inverse />
                </div>
                <div className="relative">
                  <RentlyMarkFocusSymbol size={178} inverse />
                  <span className="absolute -right-2 -top-2 h-3 w-3 bg-[#c7f078]" />
                  <span className="absolute -bottom-1 -left-3 h-px w-9 bg-[#c7f078]" />
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-3 border-t border-[#445462] pt-3">
              <div className="flex items-center gap-2"><Layers3 size={13} className="text-[#c7f078]" /><span className="font-mono text-[8px] uppercase tracking-[.08em]">Property</span></div>
              <div className="flex items-center gap-2"><UsersRound size={13} className="text-[#c7f078]" /><span className="font-mono text-[8px] uppercase tracking-[.08em]">Tenant</span></div>
              <div className="flex items-center gap-2"><FileText size={13} className="text-[#c7f078]" /><span className="font-mono text-[8px] uppercase tracking-[.08em]">Lease</span></div>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[.1em] text-[#738187]">
            <span>One clear record</span><span>R / 01</span>
          </p>
        </div>
      </section>

      <section id="records" className="border-y border-[#d9d9ce] bg-[#e8e9df]">
        <div className="mx-auto grid max-w-[1320px] gap-5 px-5 py-5 md:grid-cols-[1.15fr_1fr_1fr_1fr] md:items-center md:px-10 lg:px-16">
          <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#68777b]">The details, connected</p>
          <div className="flex items-center gap-2.5 text-[11px] font-semibold"><Layers3 size={15} className="text-[#3978ec]" /> Properties</div>
          <div className="flex items-center gap-2.5 text-[11px] font-semibold"><UsersRound size={15} className="text-[#3978ec]" /> Tenants & leases</div>
          <div className="flex items-center gap-2.5 text-[11px] font-semibold"><CalendarDays size={15} className="text-[#3978ec]" /> Due dates & rent</div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto grid max-w-[1320px] gap-8 px-5 py-12 md:grid-cols-[.7fr_1.3fr] md:gap-14 md:px-10 md:py-16 lg:px-16">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#3978ec]">A smaller, clearer system</p>
          <h2 className="mt-3 max-w-[330px] text-[clamp(1.8rem,3vw,2.65rem)] font-semibold leading-[.98] tracking-[-.07em]">Keep every rental detail in context.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="border-t border-[#cfd2c7] pt-3">
            <span className="font-mono text-[9px] text-[#3978ec]">01</span>
            <h3 className="mt-3 text-[12px] font-semibold">Organize properties</h3>
            <p className="mt-1 text-[10px] leading-5 text-[#69777a]">Keep homes and rental details together.</p>
          </article>
          <article className="border-t border-[#cfd2c7] pt-3">
            <span className="font-mono text-[9px] text-[#3978ec]">02</span>
            <h3 className="mt-3 text-[12px] font-semibold">Connect people & leases</h3>
            <p className="mt-1 text-[10px] leading-5 text-[#69777a]">Link tenants and agreements to a home.</p>
          </article>
          <article className="border-t border-[#cfd2c7] pt-3">
            <span className="font-mono text-[9px] text-[#3978ec]">03</span>
            <h3 className="mt-3 text-[12px] font-semibold">Record rent manually</h3>
            <p className="mt-1 text-[10px] leading-5 text-[#69777a]">See due dates and log payments yourself.</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-[#d9d9ce]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
          <MarkFocusWordmark />
          <p className="font-mono text-[8px] uppercase tracking-[.12em] text-[#738187]">Rental records, in their place.</p>
          <a href="#top" className="group inline-flex items-center gap-1.5 self-start font-mono text-[8px] uppercase tracking-[.12em] text-[#68777b] md:self-auto">
            Back to top <ArrowDownRight size={12} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </footer>
    </main>
  );
}
