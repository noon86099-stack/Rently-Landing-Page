create table public.lease_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  lease_id uuid not null,
  storage_path text not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  content_type text not null check (content_type = 'application/pdf'),
  file_size bigint not null check (file_size between 1 and 26214400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lease_documents_owner_lease_unique unique (owner_id, lease_id),
  constraint lease_documents_storage_path_unique unique (storage_path),
  constraint lease_documents_storage_path_matches_owner check (
    storage_path like owner_id::text || '/' || lease_id::text || '/%'
  )
);

create index lease_documents_owner_lease_idx
  on public.lease_documents (owner_id, lease_id);

alter table public.lease_documents enable row level security;

grant select, insert, update, delete on public.lease_documents to authenticated;
revoke all on public.lease_documents from anon;

create policy "Owners can manage their lease document metadata"
  on public.lease_documents
  for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rently-lease-documents',
  'rently-lease-documents',
  false,
  26214400,
  array['application/pdf']
);

create policy "Owners can read their private lease documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'rently-lease-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can upload their private lease documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'rently-lease-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can replace their private lease documents"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'rently-lease-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'rently-lease-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners can remove their private lease documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'rently-lease-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
