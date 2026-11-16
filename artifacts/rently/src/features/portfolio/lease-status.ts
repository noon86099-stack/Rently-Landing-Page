export type LeaseStatus = 'active' | 'ended' | 'upcoming';

export function leaseStatusOnDate(
  lease: { start_date: string; end_date: string },
  today: string,
): LeaseStatus {
  const startDate = lease.start_date.slice(0, 10);
  const endDate = lease.end_date.slice(0, 10);

  if (startDate > today) return 'upcoming';
  if (endDate < today) return 'ended';
  return 'active';
}
