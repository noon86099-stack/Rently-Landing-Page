import { useEffect, useState, type ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { message, useI18n, type UiMessage } from '@/lib/i18n';

export const labelCls = 'grid gap-1 font-mono text-[8px] uppercase tracking-[.08em] text-[#667b8e]';
export const inputCls =
  'min-h-9 w-full min-w-0 border border-[#cbd7e1] bg-white px-2.5 font-sans text-[12px] normal-case tracking-normal text-[#102238] outline-none focus:border-[#3f7cff] focus:ring-1 focus:ring-[#3f7cff] aria-[invalid=true]:border-red-500';
export const primaryBtn =
  'inline-flex min-h-9 items-center justify-center gap-2 bg-[#102238] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[.06em] text-white transition-colors hover:bg-[#1c3757] disabled:opacity-60';
export const ghostBtn =
  'inline-flex min-h-8 items-center gap-1.5 border border-[#c5d4e0] bg-[#f2f6f9] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[.06em] text-[#315b91] transition-colors hover:border-[#3f7cff] disabled:opacity-60';

export function authRequest(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useToday() {
  const [today, setToday] = useState(localToday);
  useEffect(() => {
    const id = window.setInterval(() => setToday(localToday()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

export function errorMessage(error: unknown, fallback: UiMessage = message('Request failed.', 'تعذّر إكمال الطلب.')): UiMessage {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

export function invalidatePortfolio(qc: QueryClient, userId: string, propertyId?: string | null) {
  const tasks = [qc.invalidateQueries({ queryKey: ['rently-properties', userId] })];
  if (propertyId) tasks.push(qc.invalidateQueries({ queryKey: ['rently-property-details', userId, propertyId] }));
  return Promise.all(tasks);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function FormNotice({ error, success }: { error?: UiMessage; success?: UiMessage }) {
  const { text } = useI18n();
  if (error) return <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-2 py-1 text-[10px] text-red-800">{text(error)}</p>;
  if (success) return <p role="status" className="border-s-2 border-[#6aa83a] bg-[#eef6e6] px-2 py-1 text-[10px] text-[#3d6324]">{text(success)}</p>;
  return null;
}

export function Panel({ code, title, children, action }: { code: string; title: UiMessage; children: ReactNode; action?: ReactNode }) {
  const { text } = useI18n();
  return (
    <div className="border border-[#d8e1e8] bg-[#f8fafb] p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-bold"><span className="font-mono text-[7px] font-normal tracking-[.1em] text-[#3f7cff]">{code}</span>{text(title)}</p>
        {action}
      </div>
      {children}
    </div>
  );
}
