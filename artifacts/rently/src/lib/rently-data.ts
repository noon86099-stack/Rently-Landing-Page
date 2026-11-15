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
  tenants: Tenant | null;
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
      'id,name,street_address,city,region,property_type,units:rently_units(id,unit_label,leases:rently_leases(id,start_date,end_date,status,tenants:rently_tenants(full_name,email,phone)))',
    )
    .eq('id', propertyId)
    .eq('owner_id', ownerId)
    .single();

  if (error) throw error;
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
