import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '@/lib/i18n';
import type { Lease, Property, PropertyDetails, Unit } from '@/lib/rently-data';
import { OwnerDashboard } from './owner-dashboard';

type LeaseEntry = {
  property: PropertyDetails;
  unit: Unit;
  lease: Lease;
};

const today = '2026-11-16';
const noAction = () => {};

function entry(id: string, endDate: string, payments: Lease['payments'] = []): LeaseEntry {
  const property: PropertyDetails = {
    id: `property-${id}`,
    name: `Property ${id}`,
    street_address: null,
    city: null,
    region: null,
    property_type: 'Residential',
    units: [],
  };
  const unit: Unit = { id: `unit-${id}`, unit_label: `Unit ${id}`, leases: [] };
  const lease: Lease = {
    id,
    start_date: '2026-01-01',
    end_date: endDate,
    status: 'active',
    monthly_rent: 1200,
    due_day: 16,
    payments,
    tenants: {
      full_name: `Tenant ${id}`,
      email: `${id}@example.test`,
      phone: null,
    },
  };
  return { property, unit, lease };
}

function renderDashboard(entries: LeaseEntry[]) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const properties: Property[] = entries.map(({ property, unit }) => ({
    id: property.id,
    name: property.name,
    street_address: property.street_address,
    city: property.city,
    region: property.region,
    property_type: property.property_type,
    units: [{ id: unit.id }],
  }));

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { getItem: () => 'en' } },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { pathname: '/dashboard', search: '' },
  });

  try {
    return renderToStaticMarkup(
      createElement(I18nProvider, {
        children: createElement(OwnerDashboard, {
          properties,
          leaseEntries: entries,
          today,
          loading: false,
          onOpenProperties: noAction,
          onOpenTenants: noAction,
          onOpenLeases: noAction,
          onAddProperty: noAction,
          onAddTenantLease: noAction,
        }),
      }),
    );
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else Reflect.deleteProperty(globalThis, 'location');
  }
}

test('urgent notices include overdue rent and leases ending within 30 days, with direct lease links', () => {
  const markup = renderDashboard([
    entry('late-lease', '2027-03-01', [
      { id: 'late-payment', due_date: '2026-11-15', amount: 1200, paid_at: null },
    ]),
    entry('ending-lease', '2026-12-16'),
  ]);

  assert.match(markup, /Urgent notices/);
  assert.match(markup, /Overdue rent/);
  assert.match(markup, /Lease ending soon/);
  assert.match(markup, /data-testid="notice-overdue-late-lease"/);
  assert.match(markup, /href="\/leases\/late-lease"/);
  assert.match(markup, /data-testid="notice-ending-ending-lease"/);
  assert.match(markup, /href="\/leases\/ending-lease"/);
});

test('paid rent, rent due today, and leases ending after 30 days do not create urgent notices', () => {
  const markup = renderDashboard([
    entry('not-urgent', '2026-12-17', [
      { id: 'already-paid', due_date: '2026-11-15', amount: 1200, paid_at: '2026-11-15T12:00:00Z' },
      { id: 'due-today', due_date: today, amount: 1200, paid_at: null },
    ]),
  ]);

  assert.match(markup, /Nothing urgent right now/);
  assert.doesNotMatch(markup, /data-testid="notice-overdue-/);
  assert.doesNotMatch(markup, /data-testid="notice-ending-/);
});
