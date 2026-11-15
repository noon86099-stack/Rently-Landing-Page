import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addLease, addProperty, addTenant, addUnit, createSeed, generatePayments,
  isValidDate, parseState, paymentStatus, recordPayment, todayISO,
  type DemoState, type Lease,
} from './model.ts';

const empty = (): DemoState => ({ version: 1, properties: [], units: [], tenants: [], leases: [], payments: [] });
const lease: Lease = {
  id: 'schedule', unitId: 'unit', tenantId: 'tenant', startDate: '2026-01-31',
  endDate: '2026-05-31', dueDay: 31, rent: 1250,
};

test('monthly day 31 clamps short months without drifting subsequent months', () => {
  assert.deepEqual(generatePayments(lease).map(p => p.dueDate), [
    '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31',
  ]);
});
test('leap year February and year rollover are handled', () => {
  assert.deepEqual(generatePayments({ ...lease, startDate: '2023-12-31', endDate: '2024-03-31' }).map(p => p.dueDate),
    ['2023-12-31', '2024-01-31', '2024-02-29', '2024-03-31']);
});
test('schedule only includes dates inside inclusive contract boundaries', () => {
  const schedule = generatePayments({ ...lease, startDate: '2026-01-16', endDate: '2026-04-14', dueDay: 15 });
  assert.deepEqual(schedule.map(p => p.dueDate), ['2026-02-15', '2026-03-15']);
  assert.equal(new Set(schedule.map(p => p.id)).size, schedule.length);
});
test('invalid dates and excessively long/reversed terms are rejected', () => {
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2026-13-01'), false);
  assert.throws(() => generatePayments({ ...lease, endDate: '2025-01-01' }));
  assert.throws(() => generatePayments({ ...lease, dueDay: 0 }));
  assert.throws(() => generatePayments({ ...lease, dueDay: 32 }));
  assert.throws(() => generatePayments({ ...lease, dueDay: 1.5 }));
  assert.throws(() => generatePayments({ ...lease, startDate: '2026-02-30' }));
  assert.throws(() => generatePayments({ ...lease, endDate: '2040-12-31' }));
});
test('unpaid rent is upcoming on its due date and overdue the next day; paid takes precedence', () => {
  const [payment] = generatePayments(lease);
  assert.equal(paymentStatus(payment, '2026-01-30'), 'upcoming');
  assert.equal(paymentStatus(payment, '2026-01-31'), 'upcoming');
  assert.equal(paymentStatus(payment, '2026-02-01'), 'overdue');
  assert.equal(paymentStatus({ ...payment, paidAt: '2026-02-01' }, '2026-02-15'), 'paid');
});
test('property → units → tenant → contract → paid rent persists through serialization', () => {
  let state = addProperty(empty(), { name: '  New House ', location: 'Riyadh', kind: 'منزل', unitName: '01' });
  assert.equal(state.properties[0].name, 'New House');
  const propertyId = state.properties[0].id;
  state = addUnit(state, { propertyId, name: '02' });
  assert.equal(state.units.length, 2);
  const unitId = state.units[1].id;
  state = addTenant(state, { unitId, name: 'Test Tenant', email: 'tenant@example.test', phone: '555-0100' });
  const tenantId = state.tenants[0].id;
  state = addLease(state, { unitId, tenantId, startDate: '2026-01-31', endDate: '2026-03-31', dueDay: 31, rent: 1500 });
  assert.equal(state.payments.length, 3);
  const payment = state.payments[0];
  state = recordPayment(state, payment.id, '2026-02-01', '2026-02-01');
  const restored = parseState(JSON.stringify(state));
  assert.equal(restored.payments[0].paidAt, '2026-02-01');
  assert.equal(paymentStatus(restored.payments[0], '2026-03-01'), 'paid');
  assert.equal(restored.leases[0].tenantId, tenantId);
  assert.deepEqual(restored, state);
  assert.throws(() => recordPayment(state, payment.id, '2026-02-01', '2026-02-01'), /بالفعل/);
  assert.throws(() => addLease(state, { ...state.leases[0] }), /عقد آخر/);
});
test('invalid links, duplicate units, invalid amounts, and empty schedules are rejected', () => {
  let state = addProperty(empty(), { name: 'House', location: 'City', kind: 'Home', unitName: '01' });
  const unitId = state.units[0].id;
  assert.throws(() => addUnit(state, { propertyId: 'missing', name: '02' }));
  assert.throws(() => addUnit(state, { propertyId: state.properties[0].id, name: '01' }));
  assert.throws(() => addTenant(state, { unitId: 'missing', name: 'Tenant', email: 't@example.test', phone: '555' }));
  state = addTenant(state, { unitId, name: 'Tenant', email: 't@example.test', phone: '555' });
  const input = { unitId, tenantId: state.tenants[0].id, startDate: '2026-01-01', endDate: '2026-12-31', dueDay: 1, rent: 100 };
  assert.throws(() => addLease(state, { ...input, tenantId: 'missing' }));
  assert.throws(() => addLease(state, { ...input, rent: 0 }));
  assert.throws(() => addLease(state, { ...input, rent: NaN }));
  assert.throws(() => addLease(state, { ...input, startDate: '2026-01-02', endDate: '2026-01-03', dueDay: 1 }), /لا يوجد/);
});
test('future payment dates, invalid dates, and missing installments are rejected', () => {
  const state = createSeed('2026-06-15');
  const unpaid = state.payments.find(p => !p.paidAt)!;
  assert.throws(() => recordPayment(state, unpaid.id, '2026-06-16', '2026-06-15'));
  assert.throws(() => recordPayment(state, unpaid.id, '2026-02-30', '2026-06-15'));
  assert.throws(() => recordPayment(state, 'missing', '2026-06-15', '2026-06-15'));
});
test('damaged local data does not silently overwrite user records', () => {
  const state = createSeed('2026-06-15');
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.throws(() => parseState('{bad json'));
  assert.throws(() => parseState(JSON.stringify({ ...state, version: 2 })));
  assert.throws(() => parseState(JSON.stringify({ ...state, units: [] })));
  assert.throws(() => parseState(JSON.stringify({ ...state, payments: [] })));
  assert.throws(() => parseState(JSON.stringify({ ...state, properties: [...state.properties, state.properties[0]] })));
  assert.throws(() => parseState(JSON.stringify({ ...state, payments: state.payments.map((p, i) => i ? p : { ...p, amount: 3 }) })));
});
test('seed and reset create valid unique schedules with no old browser additions', () => {
  const first = createSeed('2026-11-15');
  const modified = addProperty(first, { name: 'Extra', location: 'City', kind: 'Home', unitName: '1' });
  const reset = createSeed('2026-11-15');
  assert.equal(modified.properties.length, 4);
  assert.equal(reset.properties.length, 3);
  assert.equal(new Set(reset.payments.map(p => p.id)).size, reset.payments.length);
  assert.deepEqual(parseState(JSON.stringify(reset)), first);
  assert.equal(todayISO(new Date(2026, 0, 3, 23, 59)), '2026-01-03');
});
