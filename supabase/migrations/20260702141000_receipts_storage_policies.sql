-- Storage policies per bucket privato receipts

create policy "Helpers can upload receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Helpers can view own receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Seekers can view receipts for own requests"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and exists (
    select 1
    from public.requests r
    where r.id = ((storage.foldername(name))[2])::uuid
      and r.seeker_id = auth.uid()
  )
);
