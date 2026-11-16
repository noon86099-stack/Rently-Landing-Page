-- Store Stripe references alongside the existing rent payment records.
-- No application data is moved or duplicated into Stripe's sync database.
alter table public.rently_payments
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists rently_payments_stripe_checkout_session_unique
  on public.rently_payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists rently_payments_stripe_payment_intent_unique
  on public.rently_payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create or replace function public.record_rently_stripe_payment(
  p_payment_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_cents bigint,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount numeric(12, 2);
  v_checkout_session_id text;
  v_payment_intent_id text;
begin
  if p_checkout_session_id is null
     or length(p_checkout_session_id) < 8
     or length(p_checkout_session_id) > 255
     or p_amount_cents is null
     or p_amount_cents <= 0
     or lower(coalesce(p_currency, '')) <> 'usd' then
    raise exception 'Invalid Stripe payment confirmation'
      using errcode = '22023';
  end if;

  select p.amount, p.stripe_checkout_session_id, p.stripe_payment_intent_id
    into v_amount, v_checkout_session_id, v_payment_intent_id
    from public.rently_payments p
    where p.id = p_payment_id
    for update;

  if not found then
    raise exception 'Rent payment not found' using errcode = 'P0002';
  end if;
  if round(v_amount * 100)::bigint <> p_amount_cents then
    raise exception 'Stripe amount does not match rent payment'
      using errcode = '22023';
  end if;
  if v_checkout_session_id is not null
     and v_checkout_session_id <> p_checkout_session_id then
    raise exception 'Stripe session does not match rent payment'
      using errcode = '22023';
  end if;
  if v_payment_intent_id is not null
     and p_payment_intent_id is not null
     and v_payment_intent_id <> p_payment_intent_id then
    raise exception 'Stripe payment intent does not match rent payment'
      using errcode = '22023';
  end if;

  update public.rently_payments
    set paid_at = coalesce(paid_at, current_date),
        stripe_checkout_session_id = p_checkout_session_id,
        stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id)
    where id = p_payment_id;

  return true;
end;
$$;

revoke all on function public.record_rently_stripe_payment(uuid, text, text, bigint, text)
  from public, anon, authenticated;
