import { ArrowRight, CalendarDays, FileText, Home, UsersRound } from 'lucide-react';
import './_group.css';

function RentlyIdentityMark({ size = 48, inverse = false }: { size?: number; inverse?: boolean }) {
  const ink = inverse ? '#f4f1e7' : '#152d3b';
  const signal = inverse ? '#d8ed7a' : '#315fdb';

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M8 12V7H31L41 17V39H35" stroke={ink} strokeWidth="2" />
      <path d="M13 35V14H25.5C30.2 14 33 16.4 33 20.2C33 24.1 30.2 26.2 25.5 26.2H13" stroke={signal} strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M24 26L33.5 36" stroke={ink} strokeWidth="2.8" strokeLinecap="square" />
      <path d="M31 7V17H41" stroke={signal} strokeWidth="2" />
      <path d="M8 30V36L14 42H27" stroke={ink} strokeWidth="2" />
    </svg>
  );
}

function IdentityWordmark({ inverse = false, size = 'normal' }: { inverse?: boolean; size?: 'normal' | 'large' }) {
  return (
    <span dir="ltr" className={`inline-flex items-center gap-3 ${inverse ? 'text-[#f4f1e7]' : 'text-[#152d3b]'}`}>
      <RentlyIdentityMark size={size === 'large' ? 48 : 34} inverse={inverse} />
      <span className={`font-bold tracking-[-.085em] ${size === 'large' ? 'text-[31px]' : 'text-[21px]'}`}>
        rently<span className={inverse ? 'text-[#d8ed7a]' : 'text-[#315fdb]'}>/</span>
      </span>
    </span>
  );
}

function PropertySurface() {
  return (
    <div className="overflow-hidden border border-[#cbd2cc] bg-[#f8f8f2] shadow-[0_20px_55px_-40px_rgba(21,45,59,.5)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#dfe3da] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <RentlyIdentityMark size={27} />
          <div>
            <p className="text-[11px] font-semibold tracking-[-.02em] text-[#152d3b]">Property portfolio</p>
            <p className="mono mt-0.5 text-[8px] uppercase tracking-[.1em] text-[#75817d]">Owner workspace</p>
          </div>
        </div>
        <span className="mono border border-[#cbd2cc] px-2 py-1 text-[8px] uppercase tracking-[.08em] text-[#63716e]">01 property</span>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-[.84fr_1.16fr] sm:p-4">
        <div className="border border-[#dfe3da] bg-[#eef0e8] p-3">
          <p className="mono text-[8px] uppercase tracking-[.1em] text-[#75817d]">Owned property</p>
          <div className="mt-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-semibold tracking-[-.045em] text-[#152d3b]">Cedar House</p>
              <p className="mono mt-1 text-[8px] text-[#73807c]">Unit 01 · one lease</p>
            </div>
            <span className="grid h-9 w-9 place-items-center border border-[#d1d8cd] bg-[#f8f8f2] text-[#315fdb]"><Home size={15} /></span>
          </div>
          <div className="mt-5 border-t border-[#d4dbd1] pt-3">
            <p className="mono text-[8px] uppercase tracking-[.09em] text-[#75817d]">Next rent due</p>
            <p className="mt-1 text-[24px] font-semibold leading-none tracking-[-.07em] text-[#152d3b]">14 <span className="mono text-[9px] font-normal tracking-[.08em] text-[#315fdb]">JUN</span></p>
          </div>
        </div>
        <div className="border border-[#dfe3da] bg-[#fbfbf6] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-[#152d3b]">Rental records</p>
            <span className="mono text-[8px] text-[#7b8882]">RENT / 01</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 border border-[#e2e5de] bg-white px-2.5 py-2">
              <span className="grid h-7 w-7 place-items-center bg-[#e9edf8] text-[#315fdb]"><Home size={13} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold text-[#253e49]">Cedar House</span><span className="mono block text-[7px] text-[#7c8983]">PROPERTY</span></span>
              <span className="h-px w-5 bg-[#bfc9bf]" />
              <span className="mono text-[7px] text-[#315fdb]">01</span>
            </div>
            <div className="ms-3 h-2 border-s border-dashed border-[#bfc9bf]" />
            <div className="flex items-center gap-2.5 border border-[#e2e5de] bg-white px-2.5 py-2">
              <span className="grid h-7 w-7 place-items-center bg-[#eef0e8] text-[#52675c]"><UsersRound size={13} /></span>
              <span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold text-[#253e49]">Tenant & lease</span><span className="mono block text-[7px] text-[#7c8983]">CONNECTED RECORD</span></span>
              <span className="h-px w-5 bg-[#bfc9bf]" />
              <FileText size={13} className="text-[#52675c]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#e2e5de] pt-2">
            <span className="mono text-[7px] uppercase tracking-[.08em] text-[#7c8983]">Due dates · rent records</span>
            <CalendarDays size={12} className="text-[#315fdb]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantSurface() {
  return (
    <div className="border border-[#354c55] bg-[#193643] p-4 text-[#f4f1e7] sm:p-5">
      <div className="flex items-center justify-between border-b border-[#3a5660] pb-3">
        <IdentityWordmark inverse />
        <span className="mono text-[8px] uppercase tracking-[.1em] text-[#b9c8bf]">Tenant view</span>
      </div>
      <div className="grid gap-5 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="mono text-[8px] uppercase tracking-[.12em] text-[#c8d985]">Rent record</p>
          <p className="mt-2 text-[19px] font-semibold tracking-[-.05em]">Cedar House</p>
          <p className="mt-1 text-[10px] text-[#b9c8bf]">Unit 01 · lease details</p>
        </div>
        <div className="sm:text-end">
          <p className="mono text-[8px] uppercase tracking-[.1em] text-[#b9c8bf]">Due date</p>
          <p className="mt-1 text-[18px] font-semibold tracking-[-.04em]">14 Jun</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#3a5660] pt-3">
        <p dir="rtl" lang="ar" className="text-[10px] text-[#d5ded4]">سجل الإيجار · تفاصيل العقد</p>
        <span className="mono border border-[#53696d] px-2 py-1 text-[7px] uppercase tracking-[.08em] text-[#d8ed7a]">EN / AR</span>
      </div>
    </div>
  );
}

export function DistinctiveIdentity() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#e9e9df] text-[#152d3b]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between border-b border-[#cfd4ca] px-5 py-4 sm:px-8 lg:px-12">
        <IdentityWordmark />
        <p className="mono hidden text-[9px] uppercase tracking-[.14em] text-[#74817a] sm:block">Identity study / 02</p>
        <span className="inline-flex items-center gap-2 mono text-[8px] uppercase tracking-[.1em] text-[#74817a]"><span className="h-1.5 w-1.5 bg-[#315fdb]" /> English · العربية</span>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-12 pt-9 sm:px-8 md:pb-16 md:pt-14 lg:grid-cols-[.78fr_1.22fr] lg:gap-16 lg:px-12 lg:pt-[72px]">
        <div className="reveal relative z-10 flex flex-col justify-center">
          <p className="mono mb-6 flex items-center gap-2 text-[9px] uppercase tracking-[.15em] text-[#687873]"><span className="h-px w-7 bg-[#315fdb]" /> A rental record, drawn clearly</p>
          <h1 className="max-w-[620px] text-[clamp(3.5rem,8.4vw,7.5rem)] font-semibold leading-[.84] tracking-[-.095em]">
            Everything<br />in its <span className="text-[#315fdb]">place.</span>
          </h1>
          <p className="mt-6 max-w-[370px] text-[14px] leading-[1.7] text-[#5e706f]">
            Property, people, leases and rent dates—kept together in one clear workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 bg-[#315fdb] px-4 py-3 text-[11px] font-semibold text-[#f8f8f2]">Rently, re-drawn <ArrowRight size={13} /></span>
            <span className="mono text-[8px] uppercase tracking-[.1em] text-[#77847e]">For independent owners</span>
          </div>
          <div className="mt-10 grid max-w-[400px] grid-cols-2 border-t border-[#cfd4ca] pt-4">
            <div>
              <p className="mono text-[8px] uppercase tracking-[.11em] text-[#7a8780]">01 / Mark</p>
              <p className="mt-1 text-[10px] font-medium">A record, framed</p>
            </div>
            <div>
              <p className="mono text-[8px] uppercase tracking-[.11em] text-[#7a8780]">02 / Voice</p>
              <p className="mt-1 text-[10px] font-medium">Quietly precise</p>
            </div>
          </div>
        </div>

        <div className="reveal reveal-delay-1 relative mx-auto w-full max-w-[720px] lg:ms-auto">
          <div className="absolute -right-3 -top-3 h-[74%] w-[72%] border border-[#c5ccc1] sm:-right-6 sm:-top-6" />
          <div className="relative overflow-hidden bg-[#152d3b] p-5 text-[#f4f1e7] sm:p-7 md:p-9">
            <div className="flex items-start justify-between gap-4 border-b border-[#3d5359] pb-5">
              <div>
                <p className="mono text-[8px] uppercase tracking-[.16em] text-[#bec9bd]">The new signature</p>
                <div className="mt-3"><IdentityWordmark inverse size="large" /></div>
              </div>
              <span className="mono pt-1 text-[8px] uppercase tracking-[.1em] text-[#bec9bd]">R / 02</span>
            </div>
            <div className="relative grid min-h-[260px] grid-cols-[.9fr_1.1fr] items-center py-6 sm:min-h-[330px] sm:py-8">
              <div className="relative z-10">
                <p className="mono text-[8px] uppercase tracking-[.12em] text-[#c8d985]">A mark for the record</p>
                <p className="mt-3 max-w-[190px] text-[clamp(1.4rem,3vw,2.25rem)] font-medium leading-[.98] tracking-[-.065em]">Built from a frame. Finished as an R.</p>
                <p className="mt-4 max-w-[170px] text-[9px] leading-5 text-[#b8c5bd]">Open corners echo a workspace with every detail connected.</p>
              </div>
              <div className="relative grid place-items-center border-s border-[#3d5359]">
                <div className="absolute inset-0 grid place-items-center opacity-[.08]"><RentlyIdentityMark size={235} inverse /></div>
                <div className="relative">
                  <RentlyIdentityMark size={clampMarkSize()} inverse />
                  <span className="absolute -right-2 top-1 h-2.5 w-2.5 bg-[#d8ed7a]" />
                </div>
                <span className="mono absolute bottom-0 right-0 text-[7px] tracking-[.1em] text-[#93a49c]">48 × 48 / GRID</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#3d5359] pt-3">
              <span className="mono text-[8px] uppercase tracking-[.12em] text-[#bec9bd]">Technical, not cold</span>
              <span className="mono text-[8px] uppercase tracking-[.12em] text-[#d8ed7a]">EN · AR</span>
            </div>
          </div>
          <p className="mono mt-3 flex justify-between text-[8px] uppercase tracking-[.11em] text-[#78857e]"><span>Distinctive identity concept</span><span>R / 02 — 04</span></p>
        </div>
      </section>

      <section className="border-y border-[#cfd4ca] bg-[#f1f1e9]">
        <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:grid-cols-[.8fr_1fr_1fr_1fr] sm:items-center sm:px-8 lg:px-12">
          <p className="mono text-[8px] uppercase tracking-[.14em] text-[#77847e]">The system stays familiar</p>
          <div className="flex items-center gap-2 text-[10px] font-semibold"><Home size={14} className="text-[#315fdb]" /> Properties</div>
          <div className="flex items-center gap-2 text-[10px] font-semibold"><UsersRound size={14} className="text-[#315fdb]" /> Tenants & leases</div>
          <div className="flex items-center gap-2 text-[10px] font-semibold"><CalendarDays size={14} className="text-[#315fdb]" /> Due dates & rent</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[.64fr_1.36fr] lg:gap-14 lg:px-12">
        <div className="reveal">
          <p className="mono text-[8px] uppercase tracking-[.15em] text-[#315fdb]">Identity in context</p>
          <h2 className="mt-3 max-w-[350px] text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[.98] tracking-[-.075em]">One mark.<br />Two sides of the record.</h2>
          <p className="mt-4 max-w-[300px] text-[11px] leading-5 text-[#687873]">A practical owner workspace and a clear tenant view, in English and Arabic.</p>
          <div className="mt-7 space-y-3 border-t border-[#cfd4ca] pt-4">
            <div className="flex items-center gap-3"><span className="mono text-[8px] text-[#315fdb]">01</span><span className="text-[10px] font-semibold">Recognizable at 24px</span></div>
            <div className="flex items-center gap-3"><span className="mono text-[8px] text-[#315fdb]">02</span><span className="text-[10px] font-semibold">Legible across both scripts</span></div>
            <div className="flex items-center gap-3"><span className="mono text-[8px] text-[#315fdb]">03</span><span className="text-[10px] font-semibold">Grounded in rental records</span></div>
          </div>
        </div>
        <div className="reveal reveal-delay-1 grid content-start gap-4">
          <PropertySurface />
          <TenantSurface />
        </div>
      </section>

      <footer className="border-t border-[#cfd4ca]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <IdentityWordmark />
          <p className="mono text-[8px] uppercase tracking-[.12em] text-[#78857e]">Rental records, in their place.</p>
          <p dir="rtl" lang="ar" className="text-[9px] text-[#78857e]">سجلات الإيجار، في مكانها.</p>
        </div>
      </footer>
    </main>
  );
}

function clampMarkSize() {
  if (typeof window === 'undefined') return 150;
  return window.innerWidth < 640 ? 116 : window.innerWidth < 900 ? 142 : 164;
}
