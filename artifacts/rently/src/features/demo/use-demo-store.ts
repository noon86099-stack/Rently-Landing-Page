import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  STORAGE_KEY, addLease, addProperty, addTenant, addUnit, createSeed, parseState,
  recordPayment, todayISO, type DemoState, type LeaseInput, type PropertyInput,
  type TenantInput, type UnitInput,
} from './model';

export type ActionResult = { ok: true } | { ok: false; error: string };
function errorText(error: unknown): string {
  return error instanceof z.ZodError ? error.issues[0].message
    : error instanceof Error ? error.message : 'تعذر حفظ التغييرات';
}

export function useDemoStore() {
  const [today, setToday] = useState(todayISO);
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw === null ? createSeed() : parseState(raw);
      // Check that browser storage is actually writable before accepting saves.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return { state, error: '' };
    } catch {
      return { state: createSeed(), error: 'تعذر قراءة أو حفظ بيانات التجربة. قد تكون البيانات المخزنة تالفة أو التخزين محظورًا. لم نحذف بياناتك؛ أعد المحاولة أو أعد ضبط التجربة.' };
    }
  });
  const [state, setState] = useState<DemoState>(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const stateRef = useRef(state);
  const blocked = useRef(Boolean(initial.error));
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        if (event.newValue === null) throw new Error('تم حذف البيانات في نافذة أخرى؛ أعد تحميل الصفحة');
        const next = parseState(event.newValue);
        stateRef.current = next;
        setState(next);
        blocked.current = false;
        setStorageError('');
      } catch {
        blocked.current = true;
        setStorageError('تغير التخزين في نافذة أخرى وتعذر قراءته. أعد تحميل الصفحة قبل المتابعة.');
      }
    };
    window.addEventListener('storage', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function mutate(update: (current: DemoState) => DemoState): ActionResult {
    if (blocked.current) return { ok: false, error: 'التخزين غير متاح. عالج التنبيه قبل حفظ التغييرات.' };
    try {
      // Read the latest snapshot so another tab's accepted edits are not lost.
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) throw new Error('بيانات التجربة غير موجودة؛ أعد تحميل الصفحة');
      const next = update(parseState(raw));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      stateRef.current = next;
      setState(next);
      return { ok: true };
    } catch (error) {
      const message = errorText(error);
      if (error instanceof DOMException) {
        setStorageError('تعذر حفظ التغييرات في المتصفح. لم تُحفظ العملية الأخيرة؛ تحقق من إعدادات التخزين أو المساحة المتاحة.');
      }
      return { ok: false, error: message };
    }
  }

  function resetDemo(): ActionResult {
    try {
      const next = createSeed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      stateRef.current = next;
      setState(next);
      setStorageError('');
      blocked.current = false;
      return { ok: true };
    } catch {
      setStorageError('التخزين محظور أو ممتلئ. لم يتم حفظ إعادة الضبط؛ اسمح بالتخزين ثم أعد المحاولة.');
      return { ok: false, error: 'تعذر حفظ إعادة الضبط في المتصفح' };
    }
  }

  return {
    state, today, storageError,
    addProperty: (input: PropertyInput) => mutate(s => addProperty(s, input)),
    addUnit: (input: UnitInput) => mutate(s => addUnit(s, input)),
    addTenant: (input: TenantInput) => mutate(s => addTenant(s, input)),
    addLease: (input: LeaseInput) => mutate(s => addLease(s, input)),
    recordPayment: (paymentId: string, paidAt: string) => mutate(s => recordPayment(s, paymentId, paidAt)),
    resetDemo,
  };
}
