import { useState, type FormEvent } from 'react';
import type { ActionResult } from '@/features/demo/use-demo-store';
import type { Tenant, Unit } from '@/features/demo/model';
import { Field, FormError, btnGhost, btnPrimary, inputCls } from './primitives';

type Done = (msg: string) => void;
function useSubmit(onDone: Done) {
  const [error, setError] = useState('');
  const run = (e: FormEvent, check: () => string, act: () => ActionResult, ok: string) => {
    e.preventDefault();
    const v = check();
    if (v) { setError(v); return; }
    const r = act();
    if (r.ok) { setError(''); onDone(ok); } else setError(r.error);
  };
  return { error, run };
}

function Actions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="submit" data-testid="button-submit" className={btnPrimary}>{label}</button>
      <button type="button" data-testid="button-cancel" onClick={onCancel} className={btnGhost}>إلغاء</button>
    </div>
  );
}

export function PropertyForm({ add, onDone, onCancel }: { add: (i: { name: string; location: string; kind: string; unitName: string }) => ActionResult; onDone: Done; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', location: '', kind: 'شقة', unitName: 'وحدة 01' });
  const { error, run } = useSubmit(onDone);
  return (
    <form className="space-y-3" onSubmit={e => run(e, () => (!f.name.trim() || !f.location.trim() || !f.unitName.trim() ? 'أكمل الحقول المطلوبة' : ''), () => add(f), `أضيف العقار «${f.name.trim()}» مع ${f.unitName.trim()}`)}>
      <Field label="اسم العقار"><input data-testid="input-property-name" className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <Field label="الموقع"><input data-testid="input-property-location" className={inputCls} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="النوع">
          <select data-testid="select-property-kind" className={inputCls} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>
            {['شقة', 'دوبلكس', 'منزل', 'مبنى', 'محل'].map(k => <option key={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="الوحدة الأولى"><input data-testid="input-property-unit" className={inputCls} value={f.unitName} onChange={e => setF({ ...f, unitName: e.target.value })} /></Field>
      </div>
      <FormError msg={error} />
      <Actions onCancel={onCancel} label="حفظ العقار" />
    </form>
  );
}

export function UnitForm({ propertyId, add, onDone, onCancel }: { propertyId: string; add: (i: { propertyId: string; name: string }) => ActionResult; onDone: Done; onCancel: () => void }) {
  const [name, setName] = useState('');
  const { error, run } = useSubmit(onDone);
  return (
    <form className="space-y-3" onSubmit={e => run(e, () => (name.trim() ? '' : 'أدخل اسم الوحدة'), () => add({ propertyId, name }), `أضيفت ${name.trim()}`)}>
      <Field label="اسم الوحدة"><input data-testid="input-unit-name" className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="وحدة 03" autoFocus /></Field>
      <FormError msg={error} />
      <Actions onCancel={onCancel} label="إضافة الوحدة" />
    </form>
  );
}

export function TenantForm({ unit, add, onDone, onCancel }: { unit: Unit; add: (i: { unitId: string; name: string; email: string; phone: string }) => ActionResult; onDone: Done; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', email: '', phone: '' });
  const { error, run } = useSubmit(onDone);
  return (
    <form className="space-y-3" onSubmit={e => run(e, () => (!f.name.trim() ? 'أدخل اسم المستأجر' : ''), () => add({ unitId: unit.id, ...f }), `أضيف المستأجر إلى ${unit.name}`)}>
      <p className="font-mono text-[11px] text-[#6b8094]">الوحدة: {unit.name}</p>
      <Field label="الاسم (بيانات وهمية)"><input data-testid="input-tenant-name" className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <Field label="البريد"><input dir="ltr" type="email" data-testid="input-tenant-email" className={inputCls} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@example.test" /></Field>
      <Field label="الهاتف"><input dir="ltr" data-testid="input-tenant-phone" className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+1 555 0100" /></Field>
      <FormError msg={error} />
      <Actions onCancel={onCancel} label="حفظ المستأجر" />
    </form>
  );
}

export function LeaseForm({ unit, tenants, today, add, onDone, onCancel }: { unit: Unit; tenants: Tenant[]; today: string; add: (i: { unitId: string; tenantId: string; startDate: string; endDate: string; rent: number; dueDay: number }) => ActionResult; onDone: Done; onCancel: () => void }) {
  const y = today.slice(0, 4);
  const [f, setF] = useState({ tenantId: tenants[0]?.id ?? '', startDate: today, endDate: `${Number(y) + 1}${today.slice(4)}`, rent: '', dueDay: '1' });
  const { error, run } = useSubmit(onDone);
  const check = () => {
    if (!f.tenantId) return 'أضف مستأجرًا لهذه الوحدة أولًا';
    if (!f.startDate || !f.endDate) return 'أدخل تاريخي البداية والنهاية';
    if (f.endDate < f.startDate) return 'نهاية العقد يجب ألا تسبق بدايته';
    const r = Number(f.rent);
    if (!f.rent || !Number.isFinite(r) || r <= 0) return 'الإيجار يجب أن يكون أكبر من صفر';
    const d = Number(f.dueDay);
    if (!Number.isInteger(d) || d < 1 || d > 31) return 'يوم الاستحقاق بين 1 و31';
    return '';
  };
  return (
    <form className="space-y-3" onSubmit={e => run(e, check, () => add({ unitId: unit.id, tenantId: f.tenantId, startDate: f.startDate, endDate: f.endDate, rent: Number(f.rent), dueDay: Number(f.dueDay) }), `أنشئ العقد وجدول الإيجار لـ ${unit.name}`)}>
      <Field label="المستأجر">
        <select data-testid="select-lease-tenant" className={inputCls} value={f.tenantId} onChange={e => setF({ ...f, tenantId: e.target.value })}>
          {tenants.length === 0 && <option value="">لا يوجد مستأجر</option>}
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="البداية"><input type="date" data-testid="input-lease-start" className={inputCls} value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="النهاية"><input type="date" data-testid="input-lease-end" className={inputCls} value={f.endDate} onChange={e => setF({ ...f, endDate: e.target.value })} /></Field>
        <Field label="الإيجار الشهري ($)"><input dir="ltr" type="number" min="0" step="0.01" data-testid="input-lease-rent" className={inputCls} value={f.rent} onChange={e => setF({ ...f, rent: e.target.value })} /></Field>
        <Field label="يوم الاستحقاق"><input dir="ltr" type="number" min="1" max="31" data-testid="input-lease-dueday" className={inputCls} value={f.dueDay} onChange={e => setF({ ...f, dueDay: e.target.value })} /></Field>
      </div>
      <p className="font-mono text-[10px] text-[#6b8094]">أقصى مدة 10 سنوات · الأشهر القصيرة تُضبط لآخر يوم · لا تداخل للعقود</p>
      <FormError msg={error} />
      <Actions onCancel={onCancel} label="إنشاء العقد" />
    </form>
  );
}

export function PayForm({ today, record, onDone, onCancel, summary }: { today: string; summary: string; record: (paidAt: string) => ActionResult; onDone: Done; onCancel: () => void }) {
  const [paidAt, setPaidAt] = useState(today);
  const { error, run } = useSubmit(onDone);
  return (
    <form className="space-y-3" onSubmit={e => run(e, () => (!paidAt ? 'أدخل تاريخ الدفع' : paidAt > today ? 'تاريخ الدفع لا يتجاوز اليوم' : ''), () => record(paidAt), `سُجلت الدفعة بتاريخ ${paidAt}`)}>
      <p className="font-mono text-[12px] text-[#344f68]">{summary}</p>
      <Field label="تاريخ الدفع"><input type="date" max={today} data-testid="input-paid-at" className={inputCls} value={paidAt} onChange={e => setPaidAt(e.target.value)} autoFocus /></Field>
      <FormError msg={error} />
      <Actions onCancel={onCancel} label="تسجيل كمدفوع" />
    </form>
  );
}
