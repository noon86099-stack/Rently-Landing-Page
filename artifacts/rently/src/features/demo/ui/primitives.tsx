import { type ReactNode } from 'react';
import type { RentStatus } from '@/features/demo/model';

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

export type UiStatus = RentStatus | 'today';
export const STATUS_META: Record<UiStatus, { label: string; cls: string; dot: string }> = {
  paid: { label: 'مدفوع', cls: 'border-[#9fd0b4] bg-[#e4f4ea] text-[#1d6b45]', dot: 'bg-[#2f9a62]' },
  overdue: { label: 'متأخر', cls: 'border-[#efb3a8] bg-[#fbe9e5] text-[#a33421]', dot: 'bg-[#d4452c]' },
  today: { label: 'مستحق اليوم', cls: 'border-[#f0cf7a] bg-[#fdf3d6] text-[#8a5a00]', dot: 'bg-[#e0a100]' },
  upcoming: { label: 'قادم', cls: 'border-[#bcd0ef] bg-[#e8f0fc] text-[#2d5bb8]', dot: 'bg-[#3f7cff]' },
};

export function StatusPill({ status }: { status: UiStatus }) {
  const m = STATUS_META[status];
  return (
    <span data-testid={`status-${status}`} className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 ${m.dot}`} />{m.label}
    </span>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[.12em] text-[#6b8094]">{children}</p>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#344f68]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-[#a33421]">{error}</span>}
    </label>
  );
}

export const inputCls =
  'h-9 w-full border border-[#c6d3df] bg-[#f7f9fb] px-2.5 text-[13px] text-[#102238] outline-none transition-colors focus:border-[#3f7cff] focus:ring-2 focus:ring-[#3f7cff]/20 disabled:opacity-50';

export const btnPrimary =
  'inline-flex h-9 items-center justify-center gap-2 bg-[#3f7cff] px-3.5 text-[12px] font-semibold text-white transition-[transform,background-color] hover:bg-[#2f68e0] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102238]';
export const btnGhost =
  'inline-flex h-9 items-center justify-center gap-2 border border-[#c6d3df] bg-[#f4f7f9] px-3 text-[12px] font-semibold text-[#102238] transition-colors hover:border-[#3f7cff] hover:text-[#214a83] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff]';

export function FormError({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p role="alert" data-testid="text-form-error" className="border-r-2 border-[#d4452c] bg-[#fbe9e5] px-2.5 py-2 text-[12px] text-[#a33421]">{msg}</p>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#102238]/45 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="demo-pop w-full max-w-[440px] border border-[#c6d2dd] bg-[#f4f7f9] shadow-[0_30px_80px_-30px_rgba(16,34,56,.6)]">
        <div className="flex items-center justify-between border-b border-[#d8e1e8] px-4 py-3">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <button type="button" data-testid="button-close-modal" onClick={onClose} className="font-mono text-[11px] text-[#6b8094] hover:text-[#102238]">ESC / إغلاق</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-[#bccbd8] bg-[#eef3f7] px-4 py-6 text-center">
      <div className="mx-auto mb-2 h-6 w-6 border-2 border-[#bccbd8] [clip-path:polygon(25%_0,100%_0,100%_75%,75%_100%,0_100%,0_25%)]" />
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mt-1 text-[12px] text-[#6b8094]">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
