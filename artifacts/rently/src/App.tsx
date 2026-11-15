import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  FileText,
  Home as HomeIcon,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

const queryClient = new QueryClient();

function Home() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f4f2e9] text-[#193c32]">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-12 lg:px-[7.4%]">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Rently home" data-testid="link-home">
          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#244d3f] text-[#f5f1e5]">
            <HomeIcon size={19} strokeWidth={1.8} />
          </span>
          <span className="text-[20px] font-bold tracking-[-.055em]">rently</span>
        </a>
        <nav className="hidden items-center gap-9 text-[13px] font-medium text-[#5e7167] md:flex" aria-label="Main navigation">
          <a className="transition-colors hover:text-[#193c32]" href="#platform" data-testid="link-platform">Platform</a>
          <a className="transition-colors hover:text-[#193c32]" href="#how-it-works" data-testid="link-how-it-works">How it works</a>
          <a className="transition-colors hover:text-[#193c32]" href="#about" data-testid="link-about">For owners</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <button disabled className="inline-flex cursor-not-allowed rounded-full px-3 py-2.5 text-[13px] font-semibold text-[#496358] opacity-80 sm:px-4" aria-label="Login (not available yet)" data-testid="button-login">Log in</button>
          <button disabled className="cursor-not-allowed rounded-full bg-[#244d3f] px-3 py-2.5 text-[13px] font-semibold text-[#f7f4ea] opacity-90 shadow-sm sm:px-5" aria-label="Sign up (not available yet)" data-testid="button-sign-up">Sign up</button>
        </div>
      </header>

      <section id="top" className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-16 lg:grid-cols-[.95fr_1.05fr] lg:gap-8 lg:px-[7.4%] lg:pb-32">
        <div className="relative z-[1] max-w-[590px]">
          <div className="reveal mb-7 inline-flex items-center gap-2 rounded-full border border-[#d6d8ca] bg-[#f7f5ed] px-3.5 py-2 text-[11px] font-semibold tracking-[.07em] text-[#557365]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8845e]" />
            RENTAL MANAGEMENT, MADE HUMAN
          </div>
          <h1 className="reveal reveal-delay-1 max-w-[650px] text-[clamp(3.45rem,7.2vw,6.8rem)] font-medium leading-[.91] tracking-[-.075em]">
            A steadier way to <span className="serif font-normal italic text-[#b87250]">own</span> your rentals.
          </h1>
          <p className="reveal reveal-delay-2 mt-7 max-w-[470px] text-[16px] leading-[1.75] text-[#63746a] md:text-[17px]">
            The moving parts of a rental, in one clear place. Keep properties, people, leases and rent records together—without turning ownership into a second job.
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center gap-4">
            <a href="#platform" className="group inline-flex items-center gap-3 rounded-full bg-[#244d3f] px-6 py-3.5 text-[14px] font-semibold text-[#f7f4ea] transition-all hover:-translate-y-0.5 hover:bg-[#193c32]" data-testid="link-explore-platform">
              Explore the platform <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <span className="text-[12px] text-[#78857b]">Made for independent owners</span>
          </div>
          <div className="reveal reveal-delay-3 mt-12 flex items-center gap-4 border-t border-[#d9dbd0] pt-5">
            <div className="flex -space-x-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f4f2e9] bg-[#d6a58a] text-[10px] font-bold text-[#4b4537]">M</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f4f2e9] bg-[#b5c3a5] text-[10px] font-bold text-[#35493d]">J</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#f4f2e9] bg-[#e3c98f] text-[10px] font-bold text-[#554a35]">A</span>
            </div>
            <p className="text-[12px] leading-5 text-[#758177]"><span className="font-semibold text-[#3e5c4e]">Thoughtfully simple.</span><br />For one home or a growing portfolio.</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[630px] lg:ml-auto">
          <div className="absolute -right-10 -top-12 h-[280px] w-[280px] rounded-full border border-[#e1e1d5] md:-right-16 md:-top-20 md:h-[410px] md:w-[410px]" />
          <div className="absolute -right-2 -top-3 h-[205px] w-[205px] rounded-full border border-[#e1e1d5] md:right-[-18px] md:top-[-18px] md:h-[300px] md:w-[300px]" />
          <div className="relative rounded-[26px] border border-[#e2e1d6] bg-[#faf9f3] p-3 shadow-[0_28px_80px_-48px_rgba(37,65,51,.36)] md:rounded-[30px] md:p-5">
            <div className="flex items-center justify-between px-2 pb-4 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#e9eee5] text-[#496b57]"><HomeIcon size={16} /></span>
                <div>
                  <p className="text-[12px] font-bold tracking-[-.02em]">Your portfolio</p>
                  <p className="text-[10px] text-[#8c978d]">A clear view of what you own</p>
                </div>
              </div>
              <span className="mono text-[9px] tracking-[.1em] text-[#99a097]">OVERVIEW</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[17px] bg-[#244d3f] p-4 text-[#f5f1e5] md:p-5">
                <p className="text-[10px] font-medium text-[#c3d0c3]">PROPERTIES</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-[32px] leading-none tracking-[-.06em]">04</p>
                  <HomeIcon size={17} className="mb-1 text-[#c5b58a]" strokeWidth={1.6} />
                </div>
                <p className="mt-3 text-[10px] text-[#c3d0c3]">Across 3 locations</p>
              </div>
              <div className="rounded-[17px] bg-[#ebe9dc] p-4 md:p-5">
                <p className="text-[10px] font-medium text-[#788478]">NEXT DUE DATE</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-[28px] leading-none tracking-[-.06em]">14 <span className="text-[14px] text-[#899286]">Jun</span></p>
                  <CalendarDays size={17} className="mb-1 text-[#b77753]" strokeWidth={1.7} />
                </div>
                <p className="mt-3 text-[10px] text-[#788478]">2 rent records to review</p>
              </div>
            </div>
            <div className="mt-3 rounded-[17px] border border-[#e6e5dc] bg-[#fdfcf8] px-4 py-4 md:px-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold">A little more organized</p>
                <span className="mono text-[9px] text-[#9da398]">YOUR RENTALS</span>
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-3 border-t border-[#eeede6] py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#e7ece3] text-[#55725f]"><HomeIcon size={16} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">Willow Court · Apt 2B</p><p className="mt-0.5 text-[10px] text-[#879186]">Lease active · Renews 01 Sep</p></div>
                  <span className="rounded-full bg-[#eef2e9] px-2.5 py-1 text-[9px] font-semibold text-[#5c785f]">On track</span>
                </div>
                <div className="flex items-center gap-3 border-t border-[#eeede6] py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#f2e9dc] text-[#a66d4f]"><HomeIcon size={16} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">Cedar House · Unit 1</p><p className="mt-0.5 text-[10px] text-[#879186]">Rent due 14 Jun · Manual record</p></div>
                  <span className="rounded-full bg-[#f5eee2] px-2.5 py-1 text-[9px] font-semibold text-[#a16e43]">Upcoming</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1 pb-1 text-[9px] text-[#99a097]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Your rental details, clearly arranged</span><span>JUST THE ESSENTIALS</span>
            </div>
          </div>
          <div className="drift absolute -bottom-7 -left-5 hidden rounded-[15px] border border-[#e5e2d6] bg-[#f9f7ef] px-4 py-3 shadow-[0_15px_32px_-20px_rgba(37,65,51,.3)] md:block">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#536d5b]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#e6ede1]"><Check size={12} /></span> One place for the details</div>
          </div>
        </div>
        <a href="#platform" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-[#849087] lg:flex" aria-label="Scroll to platform">
          SCROLL TO EXPLORE <ArrowDown size={13} />
        </a>
      </section>

      <section className="border-y border-[#dfe0d5] bg-[#ecebe0]">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-7 md:grid-cols-[1.15fr_repeat(3,1fr)] md:items-center md:px-12 lg:px-[7.4%]">
          <p className="text-[12px] leading-5 text-[#748075]">Less scattered admin.<br /><span className="font-semibold text-[#294b3c]">More room to own well.</span></p>
          <div className="flex items-center gap-3"><HomeIcon size={17} className="text-[#b77753]" /><span className="text-[12px] font-semibold">Properties</span></div>
          <div className="flex items-center gap-3"><UsersRound size={17} className="text-[#b77753]" /><span className="text-[12px] font-semibold">Tenants & leases</span></div>
          <div className="flex items-center gap-3"><CalendarDays size={17} className="text-[#b77753]" /><span className="text-[12px] font-semibold">Rent due dates</span></div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-[1440px] px-6 py-20 md:px-12 md:py-28 lg:px-[7.4%]">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-20">
          <div>
            <p className="mono text-[10px] tracking-[.16em] text-[#b77753]">THE RENTLY APPROACH</p>
            <h2 className="serif mt-5 max-w-[410px] text-[clamp(2.8rem,5.2vw,4.7rem)] leading-[.98] tracking-[-.045em]">The details, <em>in their place.</em></h2>
          </div>
          <div className="max-w-[560px] pt-1 md:pt-8">
            <p className="text-[16px] leading-[1.8] text-[#66766c]">Spreadsheets, inboxes and memory were never meant to be your property management system. Rently brings the essentials into one considered space—so it’s easier to know what’s happening, and what needs your attention.</p>
            <a href="#how-it-works" className="group mt-6 inline-flex items-center gap-2 border-b border-[#b77753]/50 pb-1 text-[13px] font-semibold text-[#315544] transition-colors hover:border-[#315544]" data-testid="link-how-it-works-inline">A simpler rhythm for ownership <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
          </div>
        </div>
        <div className="mt-14 grid border-t border-[#daddd2] md:mt-20 md:grid-cols-2">
          <article className="group border-b border-[#daddd2] py-7 md:border-r md:pr-12 md:py-9">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e7ece3] text-[#496b57]"><HomeIcon size={19} strokeWidth={1.7} /></span>
              <span className="mono text-[10px] text-[#a1a99f]">01 / PROPERTY</span>
            </div>
            <h3 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">Know what you own</h3>
            <p className="mt-2 max-w-[390px] text-[13px] leading-6 text-[#718075]">Keep each property and its key details together. See your rentals as a portfolio, not a pile of notes.</p>
          </article>
          <article className="group border-b border-[#daddd2] py-7 md:pl-12 md:py-9">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f1e9dc] text-[#a66e4d]"><UsersRound size={19} strokeWidth={1.7} /></span>
              <span className="mono text-[10px] text-[#a1a99f]">02 / PEOPLE</span>
            </div>
            <h3 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">Keep people connected</h3>
            <p className="mt-2 max-w-[390px] text-[13px] leading-6 text-[#718075]">Associate tenants with the right home and lease, so important context is easy to find when you need it.</p>
          </article>
          <article className="group border-b border-[#daddd2] py-7 md:border-b-0 md:border-r md:pr-12 md:py-9">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eee9dd] text-[#8a7954]"><FileText size={19} strokeWidth={1.7} /></span>
              <span className="mono text-[10px] text-[#a1a99f]">03 / AGREEMENTS</span>
            </div>
            <h3 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">Stay close to the lease</h3>
            <p className="mt-2 max-w-[390px] text-[13px] leading-6 text-[#718075]">Keep lease agreements alongside the people and properties they belong to. One less place to search.</p>
          </article>
          <article className="group border-b border-[#daddd2] py-7 md:border-b-0 md:pl-12 md:py-9">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e2edeb] text-[#4d7771]"><CalendarDays size={19} strokeWidth={1.7} /></span>
              <span className="mono text-[10px] text-[#a1a99f]">04 / RENT</span>
            </div>
            <h3 className="mt-5 text-[20px] font-semibold tracking-[-.04em]">See what’s due and recorded</h3>
            <p className="mt-2 max-w-[390px] text-[13px] leading-6 text-[#718075]">Keep rent due dates visible and record payments manually, with a straightforward history you can refer back to.</p>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#244d3f] text-[#f4f1e7]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-[.8fr_1.2fr] md:px-12 md:py-20 lg:px-[7.4%]">
          <div>
            <p className="mono text-[10px] tracking-[.16em] text-[#d4aa83]">A CLEARER ROUTINE</p>
            <h2 className="serif mt-5 max-w-[390px] text-[clamp(2.7rem,4.5vw,4rem)] leading-[.98] tracking-[-.04em]">Built around the way you already work.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            <div className="border-t border-[#769083]/50 py-5 sm:mr-5">
              <span className="mono text-[10px] text-[#d4aa83]">01</span>
              <p className="mt-5 text-[15px] font-semibold">Add your properties</p>
              <p className="mt-2 text-[12px] leading-5 text-[#c1d0c4]">Start with the homes you look after and the details that matter.</p>
            </div>
            <div className="border-t border-[#769083]/50 py-5 sm:mr-5">
              <span className="mono text-[10px] text-[#d4aa83]">02</span>
              <p className="mt-5 text-[15px] font-semibold">Bring records together</p>
              <p className="mt-2 text-[12px] leading-5 text-[#c1d0c4]">Connect tenants, lease agreements and rent due dates.</p>
            </div>
            <div className="border-t border-[#769083]/50 py-5">
              <span className="mono text-[10px] text-[#d4aa83]">03</span>
              <p className="mt-5 text-[15px] font-semibold">Keep a clear record</p>
              <p className="mt-2 text-[12px] leading-5 text-[#c1d0c4]">Mark rent payments manually and find the history when needed.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden px-6 py-20 md:px-12 md:py-28 lg:px-[7.4%]">
        <div className="absolute -right-24 top-[-100px] h-[380px] w-[380px] rounded-full border border-[#e1e1d5] md:right-[4%] md:top-[-160px] md:h-[560px] md:w-[560px]" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="max-w-[690px]">
            <p className="mono text-[10px] tracking-[.16em] text-[#b77753]">FOR THE PEOPLE BEHIND THE KEYS</p>
            <h2 className="serif mt-5 text-[clamp(3rem,6.3vw,5.8rem)] leading-[.93] tracking-[-.05em]">Ownership is personal.<br /><em>Managing it can be simple.</em></h2>
            <p className="mt-6 max-w-[470px] text-[15px] leading-7 text-[#6d7c71]">Rently is for the individual owners and small property holders who want a better handle on the day-to-day—without heavyweight systems or unnecessary complexity.</p>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-[#d9dbd0] pt-5 text-[11px] text-[#687a6d]">
            <span className="flex items-center gap-2"><Check size={14} className="text-[#b77753}" /> Clear records</span><span className="mx-1 hidden h-1 w-1 rounded-full bg-[#b7bdb2] sm:block" />
            <span className="flex items-center gap-2"><Check size={14} className="text-[#b77753]" /> Manual rent tracking</span><span className="mx-1 hidden h-1 w-1 rounded-full bg-[#b7bdb2] sm:block" />
            <span className="flex items-center gap-2"><Check size={14} className="text-[#b77753]" /> Your rentals, in context</span>
          </div>
        </div>
      </section>

      <footer className="bg-[#e9e8dd]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-12 lg:px-[7.4%]">
          <a href="#top" className="flex w-fit items-center gap-2.5" aria-label="Rently home" data-testid="link-footer-home">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#244d3f] text-[#f5f1e5]"><HomeIcon size={16} /></span>
            <span className="text-[18px] font-bold tracking-[-.055em]">rently</span>
          </a>
          <p className="text-[11px] text-[#7c887d]">A clearer place for the work of owning rentals.</p>
          <p className="mono text-[9px] tracking-[.09em] text-[#8e988e]">© 2025 RENTLY</p>
        </div>
      </footer>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
