import { z } from 'zod';

export const STORAGE_KEY = 'rently.demo.portfolio.v1';
const text = z.string().trim().min(1, 'هذا الحقل مطلوب').max(160);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidDate, 'التاريخ غير صالح');
const id = z.string().min(1);
const propertySchema = z.object({ id, name: text, location: text, kind: text });
const unitSchema = z.object({ id, propertyId: id, name: text });
const tenantSchema = z.object({
  id, unitId: id, name: text,
  email: z.string().trim().email('البريد الإلكتروني غير صالح'),
  phone: z.string().trim().min(3, 'أدخل رقم الهاتف').max(40),
});
const leaseSchema = z.object({
  id, unitId: id, tenantId: id, startDate: date, endDate: date,
  rent: z.number().finite().positive('الإيجار يجب أن يكون أكبر من صفر').max(100000000),
  dueDay: z.number().int().min(1).max(31),
});
const paymentSchema = z.object({
  id, leaseId: id, dueDate: date, amount: z.number().finite().positive(),
  paidAt: date.nullable(),
});
const stateSchema = z.object({
  version: z.literal(1),
  properties: z.array(propertySchema).max(1000),
  units: z.array(unitSchema).max(5000),
  tenants: z.array(tenantSchema).max(5000),
  leases: z.array(leaseSchema).max(5000),
  payments: z.array(paymentSchema).max(100000),
});

export type Property = z.infer<typeof propertySchema>;
export type Unit = z.infer<typeof unitSchema>;
export type Tenant = z.infer<typeof tenantSchema>;
export type Lease = z.infer<typeof leaseSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type DemoState = z.infer<typeof stateSchema>;
export type RentStatus = 'paid' | 'overdue' | 'upcoming';
export type PropertyInput = Omit<Property, 'id'> & { unitName: string };
export type UnitInput = Omit<Unit, 'id'>;
export type TenantInput = Omit<Tenant, 'id'>;
export type LeaseInput = Omit<Lease, 'id'>;

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200 || month < 1 || month > 12) return false;
  return day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function validateLeaseDates(lease: Pick<Lease, 'startDate' | 'endDate' | 'dueDay'>) {
  if (!isValidDate(lease.startDate) || !isValidDate(lease.endDate)) throw new Error('تواريخ العقد غير صالحة');
  if (lease.endDate < lease.startDate) throw new Error('نهاية العقد يجب ألا تسبق بدايته');
  const [sy, sm] = lease.startDate.split('-').map(Number);
  const [ey, em] = lease.endDate.split('-').map(Number);
  if ((ey - sy) * 12 + em - sm > 120) throw new Error('الحد الأقصى للعقد التجريبي عشر سنوات');
  if (!Number.isInteger(lease.dueDay) || lease.dueDay < 1 || lease.dueDay > 31) throw new Error('يوم الاستحقاق يجب أن يكون بين 1 و31');
}

/** Month iteration always retains the contractual day, never a clamped February day. */
export function generatePayments(lease: Lease): Payment[] {
  validateLeaseDates(lease);
  let [year, month] = lease.startDate.split('-').map(Number);
  const endMonth = lease.endDate.slice(0, 7);
  const result: Payment[] = [];
  while (`${year}-${String(month).padStart(2, '0')}` <= endMonth) {
    const day = Math.min(lease.dueDay, new Date(Date.UTC(year, month, 0)).getUTCDate());
    const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dueDate >= lease.startDate && dueDate <= lease.endDate) {
      result.push({ id: `${lease.id}:${dueDate}`, leaseId: lease.id, dueDate, amount: lease.rent, paidAt: null });
    }
    month += 1;
    if (month === 13) { month = 1; year += 1; }
  }
  return result;
}

export function paymentStatus(payment: Payment, today: string): RentStatus {
  return payment.paidAt ? 'paid' : payment.dueDate < today ? 'overdue' : 'upcoming';
}

export function addProperty(state: DemoState, input: PropertyInput): DemoState {
  const property = propertySchema.parse({ ...input, id: crypto.randomUUID() });
  const unit = unitSchema.parse({ id: crypto.randomUUID(), propertyId: property.id, name: input.unitName });
  return { ...state, properties: [...state.properties, property], units: [...state.units, unit] };
}

export function addUnit(state: DemoState, input: UnitInput): DemoState {
  const unit = unitSchema.parse({ ...input, id: crypto.randomUUID() });
  if (!state.properties.some(p => p.id === unit.propertyId)) throw new Error('اختر عقارًا موجودًا');
  if (state.units.some(u => u.propertyId === unit.propertyId && u.name.toLowerCase() === unit.name.toLowerCase())) throw new Error('اسم الوحدة موجود في هذا العقار');
  return { ...state, units: [...state.units, unit] };
}

export function addTenant(state: DemoState, input: TenantInput): DemoState {
  const tenant = tenantSchema.parse({ ...input, id: crypto.randomUUID() });
  if (!state.units.some(u => u.id === tenant.unitId)) throw new Error('اختر وحدة موجودة');
  return { ...state, tenants: [...state.tenants, tenant] };
}

export function addLease(state: DemoState, input: LeaseInput): DemoState {
  const lease = leaseSchema.parse({ ...input, rent: Math.round(input.rent * 100) / 100, id: crypto.randomUUID() });
  if (!state.units.some(u => u.id === lease.unitId)) throw new Error('اختر وحدة موجودة');
  if (!state.tenants.some(t => t.id === lease.tenantId && t.unitId === lease.unitId)) throw new Error('المستأجر غير مرتبط بالوحدة المختارة');
  validateLeaseDates(lease);
  if (state.leases.some(l => l.unitId === lease.unitId && l.startDate <= lease.endDate && l.endDate >= lease.startDate)) {
    throw new Error('يوجد عقد آخر لهذه الوحدة خلال الفترة المحددة');
  }
  const payments = generatePayments(lease);
  if (!payments.length) throw new Error('لا يوجد موعد استحقاق داخل مدة العقد؛ راجع التواريخ ويوم الاستحقاق');
  return { ...state, leases: [...state.leases, lease], payments: [...state.payments, ...payments] };
}

export function recordPayment(state: DemoState, paymentId: string, paidAt: string, today = todayISO()): DemoState {
  if (!isValidDate(paidAt) || paidAt > today) throw new Error('أدخل تاريخ دفع صحيحًا لا يتجاوز اليوم');
  if (!state.payments.some(p => p.id === paymentId)) throw new Error('الدفعة غير موجودة');
  if (state.payments.some(p => p.id === paymentId && p.paidAt)) throw new Error('تم تسجيل هذه الدفعة بالفعل');
  return { ...state, payments: state.payments.map(p => p.id === paymentId ? { ...p, paidAt } : p) };
}

/** Reject broken local data explicitly instead of silently discarding user work. */
export function parseState(raw: string): DemoState {
  const state = stateSchema.parse(JSON.parse(raw));
  for (const collection of [state.properties, state.units, state.tenants, state.leases, state.payments]) {
    if (new Set(collection.map(record => record.id)).size !== collection.length) throw new Error('بيانات مكررة');
  }
  for (const unit of state.units) if (!state.properties.some(p => p.id === unit.propertyId)) throw new Error('عقار الوحدة مفقود');
  for (const tenant of state.tenants) if (!state.units.some(u => u.id === tenant.unitId)) throw new Error('وحدة المستأجر مفقودة');
  const expected = new Map<string, Payment>();
  for (const lease of state.leases) {
    if (!state.units.some(u => u.id === lease.unitId) || !state.tenants.some(t => t.id === lease.tenantId && t.unitId === lease.unitId)) throw new Error('روابط العقد غير صالحة');
    if (state.leases.some(other => other.id !== lease.id && other.unitId === lease.unitId && other.startDate <= lease.endDate && other.endDate >= lease.startDate)) throw new Error('عقود متداخلة');
    generatePayments(lease).forEach(p => expected.set(p.id, p));
  }
  if (state.payments.length !== expected.size) throw new Error('جدول الاستحقاقات غير مكتمل');
  for (const payment of state.payments) {
    const match = expected.get(payment.id);
    if (!match || payment.leaseId !== match.leaseId || payment.amount !== match.amount || payment.dueDate !== match.dueDate) throw new Error('استحقاق غير صالح');
  }
  return state;
}

export function createSeed(today = todayISO()): DemoState {
  const year = Number(today.slice(0, 4));
  const properties: Property[] = [
    { id: 'cedar', name: 'Cedar House', location: 'North Park · San Diego', kind: 'دوبلكس' },
    { id: 'juniper', name: 'Juniper Flat', location: 'Hillcrest · San Diego', kind: 'شقة' },
    { id: 'bayview', name: 'Bayview Cottage', location: 'Point Loma · San Diego', kind: 'منزل' },
  ];
  const units = properties.map(p => ({ id: `${p.id}-01`, propertyId: p.id, name: 'وحدة 01' }));
  units.push({ id: 'cedar-02', propertyId: 'cedar', name: 'وحدة 02' });
  const tenants = properties.map((p, i) => ({
    id: `tenant-${i}`, unitId: `${p.id}-01`, name: `مستأجر تجريبي ${i + 1}`,
    email: `tenant0${i + 1}@example.test`, phone: `+1 (555) 010-010${i + 1}`,
  }));
  const leases = tenants.map((t, i) => ({
    id: `lease-${i}`, tenantId: t.id, unitId: t.unitId, startDate: `${year}-01-01`, endDate: `${year}-12-31`,
    rent: [2400, 1800, 3200][i], dueDay: [1, 15, 31][i],
  }));
  const payments = leases.flatMap(generatePayments).map((p, i) =>
    p.dueDate < today && i % 3 !== 0 ? { ...p, paidAt: p.dueDate } : p);
  return { version: 1, properties, units, tenants, leases, payments };
}
