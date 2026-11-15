-- Append-only history deliberately has no cascading foreign keys: deleting a
-- lease, payment or auth account must never erase its correction evidence.
create table if not exists public.rently_payment_corrections (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null,
  owner_id uuid not null,
  actor_id uuid not null,
  previous_paid_at date not null,
  new_paid_at date not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  corrected_at timestamptz not null default clock_timestamp(),
  check (previous_paid_at <> new_paid_at),
  check (actor_id = owner_id)
);
create index if not exists rently_payment_corrections_payment_idx
  on public.rently_payment_corrections(owner_id, payment_id, corrected_at);

alter table public.rently_payment_corrections enable row level security;
revoke all on public.rently_payment_corrections from public, anon, authenticated;
grant select on public.rently_payment_corrections to authenticated;
drop policy if exists "Owners read their payment corrections" on public.rently_payment_corrections;
create policy "Owners read their payment corrections"
  on public.rently_payment_corrections for select to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.prevent_rently_correction_changes()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Payment correction history is immutable' using errcode = '42501';
end;
$$;
drop trigger if exists rently_corrections_immutable on public.rently_payment_corrections;
create trigger rently_corrections_immutable
  before update or delete or truncate on public.rently_payment_corrections
  for each statement execute function public.prevent_rently_correction_changes();

create or replace function public.correct_rently_payment(
  p_payment_id uuid,
  p_paid_at date,
  p_expected_paid_at date,
  p_reason text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_previous date;
begin
  if v_owner is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_paid_at is null or p_paid_at > current_date
     or p_reason is null or length(btrim(p_reason)) not between 1 and 1000 then
    raise exception 'A valid payment date and correction reason are required' using errcode = '22023';
  end if;
  select paid_at into v_previous from public.rently_payments
    where id = p_payment_id and owner_id = v_owner for update;
  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_previous is null or v_previous is distinct from p_expected_paid_at then
    raise exception 'Payment changed or is not recorded; reload before correcting' using errcode = '23505';
  end if;
  if v_previous = p_paid_at then
    raise exception 'Correction must change the payment date' using errcode = '22023';
  end if;
  insert into public.rently_payment_corrections
    (payment_id, owner_id, actor_id, previous_paid_at, new_paid_at, reason)
    values (p_payment_id, v_owner, v_owner, v_previous, p_paid_at, btrim(p_reason));
  update public.rently_payments set paid_at = p_paid_at
    where id = p_payment_id and owner_id = v_owner;
  return true;
end;
$$;
revoke all on function public.correct_rently_payment(uuid,date,date,text) from public, anon;
grant execute on function public.correct_rently_payment(uuid,date,date,text) to authenticated;
