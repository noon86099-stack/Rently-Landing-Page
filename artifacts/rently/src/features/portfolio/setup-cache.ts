import type { QueryClient } from '@tanstack/react-query';
import type { RentlyProperty, RentlyUnit } from '@workspace/api-client-react';
import type { Property, PropertyDetails } from '@/lib/rently-data';

// Use confirmed mutation responses immediately, even if the subsequent refresh
// fails. Never replace a record's already-loaded children with an empty list.
export function cacheSavedProperty(qc: QueryClient, userId: string, saved: RentlyProperty) {
  qc.setQueryData<Property[]>(['rently-properties', userId], (current) => {
    const existing = current?.find((p) => p.id === saved.id);
    const record: Property = {
      id: saved.id, name: saved.name, property_type: saved.propertyType,
      street_address: saved.streetAddress, city: saved.city, region: saved.region,
      units: existing?.units ?? [],
    };
    return [...(current ?? []).filter((p) => p.id !== saved.id), record];
  });
}

export function cacheSavedUnit(qc: QueryClient, userId: string, saved: RentlyUnit) {
  qc.setQueryData<Property[]>(['rently-properties', userId], (current) => current?.map((p) =>
    p.id !== saved.propertyId || p.units.some((u) => u.id === saved.id)
      ? p : { ...p, units: [...p.units, { id: saved.id }] }));
  qc.setQueryData<PropertyDetails>(['rently-property-details', userId, saved.propertyId], (current) => {
    if (!current) return current;
    const existing = current.units.find((u) => u.id === saved.id);
    return { ...current, units: [
      ...current.units.filter((u) => u.id !== saved.id),
      { id: saved.id, unit_label: saved.unitLabel, leases: existing?.leases ?? [] },
    ] };
  });
}
