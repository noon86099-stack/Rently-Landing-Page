import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupRequestId, setupErrorMessage } from '../src/features/portfolio/setup-request.ts';
import { QueryClient } from '@tanstack/react-query';
import { cacheSavedProperty, cacheSavedUnit } from '../src/features/portfolio/setup-cache.ts';

test('creation keys persist across retries, differ by owner/scope/data, and contain no form content', async () => {
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  } });
  const payload = { tenantFullName: 'Private tenant', tenantEmail: 'private@example.invalid', monthlyRent: 1500 };
  const first = await setupRequestId('owner-a', 'lease', payload);
  assert.match(first, /^[0-9a-f-]{36}$/);
  assert.equal(await setupRequestId('owner-a', 'lease', { ...payload }), first);
  assert.notEqual(await setupRequestId('owner-b', 'lease', payload), first);
  assert.notEqual(await setupRequestId('owner-a', 'property', payload), first);
  assert.notEqual(await setupRequestId('owner-a', 'lease', { ...payload,monthlyRent:1600 }), first);
  assert.doesNotMatch(JSON.stringify([...storage]), /Private tenant|private@example|1500|1600/);
  // A new page instance reads the same persisted identifier.
  const { setupRequestId: afterReload } = await import('../src/features/portfolio/setup-request.ts?reload');
  assert.equal(await afterReload('owner-a','lease',payload),first);
  // Corrupt local values must never become invalid API request IDs.
  const key = [...storage.keys()][0];
  storage.set(key, 'corrupt');
  assert.notEqual(await setupRequestId('owner-a', 'lease', payload), 'corrupt');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  await assert.rejects(setupRequestId('owner-a','lease',payload), /لم تُرسل أي بيانات/);
});

test('setup errors explain auth, setup, ownership and retry failures in Arabic', () => {
  for (const status of [400,401,403,404,409,503,500]) {
    const message = setupErrorMessage({ status }, 'تعذّر تأكيد الحفظ.');
    assert.match(message, /[\u0600-\u06ff]/);
    assert.doesNotMatch(message, /Request failed|undefined|migration/);
  }
  assert.equal(setupErrorMessage(new Error('خطأ عربي'), 'fallback'), 'خطأ عربي');
  assert.doesNotMatch(setupErrorMessage(new Error('Secret upstream details'), 'تعذّر الحفظ.'), /Secret upstream/);
});

test('confirmed saves remain visible without a refresh and do not overwrite existing children', () => {
  const qc = new QueryClient();
  const propertyKey = ['rently-properties', 'owner-a'];
  const detailsKey = ['rently-property-details', 'owner-a', 'property-a'];
  const savedProperty = { id:'property-a',name:'Saved',propertyType:'Apartment',streetAddress:null,city:null,region:null };
  cacheSavedProperty(qc,'owner-a',savedProperty);
  assert.equal(qc.getQueryData(propertyKey)[0].name,'Saved');
  const savedUnit = { id:'unit-a',propertyId:'property-a',unitLabel:'Saved unit' };
  qc.setQueryData(detailsKey,{ id:'property-a',units:[] });
  cacheSavedUnit(qc,'owner-a',savedUnit);
  assert.equal(qc.getQueryData(detailsKey).units[0].unit_label,'Saved unit');
  qc.setQueryData(detailsKey,{ id:'property-a',units:[{ id:'unit-a',unit_label:'Saved unit',leases:[{ id:'lease-a' }] }] });
  cacheSavedUnit(qc,'owner-a',savedUnit);
  cacheSavedProperty(qc,'owner-a',savedProperty);
  assert.equal(qc.getQueryData(propertyKey).length,1);
  assert.equal(qc.getQueryData(propertyKey)[0].units.length,1);
  assert.equal(qc.getQueryData(detailsKey).units.length,1);
  assert.equal(qc.getQueryData(detailsKey).units[0].leases[0].id,'lease-a');
  assert.equal(qc.getQueryData(['rently-properties','owner-b']),undefined);
  qc.clear();
});
