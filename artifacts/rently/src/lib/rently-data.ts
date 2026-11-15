import { supabase } from './supabase';

export type Property = {
  id: string;
  name: string;
  street_address: string | null;
  city: string | null;
  region: string | null;
  property_type: string;
  units: { id: string }[];
};

export type PropertyDetails = {
  id: string;
  name: string;
  street_address: string | null;
  city: string | null;
  region: string | null;
  property_type: string;
  units: Unit[];
  rentSetupRequired?: boolean;
};

export type Unit = {
  id: string;
  unit_label: string;
  leases: Lease[];
};

export type Lease = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  monthly_rent: number | null;
  due_day: number | null;
  payments: Payment[];
  tenants: Tenant | null;
};

export type Payment = {
  id: string;
  due_date: string;
  amount: number;
  paid_at: string | null;
};

export type Tenant = {
  full_name: string;
  email: string | null;
  phone: string | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

export async function loadOwnerProperties(ownerId: string): Promise<Property[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('rently_properties')
    .select(
      'id,name,street_address,city,region,property_type,units:rently_units(id)',
    )
    .eq('owner_id', ownerId)
    .order('name');

  if (error) throw error;
  return (data ?? []) as unknown as Property[];
}

export async function loadPropertyDetails(
  ownerId: string,
  propertyId: string,
): Promise<PropertyDetails> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('rently_properties')
    .select(
      'id,name,street_address,city,region,property_type,units:rently_units(id,unit_label,leases:rently_leases(id,start_date,end_date,status,monthly_rent,due_day,payments:rently_payments(id,due_date,amount,paid_at),tenants:rently_tenants(full_name,email,phone)))',
    )
    .eq('id', propertyId)
    .eq('owner_id', ownerId)
    .single();

  if (error) {
    // Keep the already-installed, read-only portfolio usable while the new
    // rent migration awaits application. This is not demo data: the records
    // are still loaded from the owner's existing Supabase tables.
    if (['42703', '42P01', 'PGRST200', 'PGRST204', 'PGRST205'].includes(error.code)) {
      const base = await client
        .from('rently_properties')
        .select('id,name,street_address,city,region,property_type,units:rently_units(id,unit_label,leases:rently_leases(id,start_date,end_date,status,tenants:rently_tenants(full_name,email,phone)))')
        .eq('id', propertyId)
        .eq('owner_id', ownerId)
        .single();
      if (base.error) throw base.error;
      const details = base.data as unknown as PropertyDetails;
      details.rentSetupRequired = true;
      details.units.forEach((unit) => unit.leases.forEach((lease) => {
        lease.monthly_rent = null;
        lease.due_day = null;
        lease.payments = [];
      }));
      return details;
    }
    throw error;
  }
  return data as unknown as PropertyDetails;
}

export function propertyLocation(property: {
  street_address: string | null;
  city: string | null;
  region: string | null;
}) {
  return [property.street_address, property.city, property.region]
    .filter(Boolean)
    .join(' · ') || 'Location not added';
}
