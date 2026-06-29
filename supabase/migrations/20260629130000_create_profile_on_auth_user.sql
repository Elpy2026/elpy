create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  accepted_terms_value boolean;
  accepted_privacy_value boolean;
  marketing_consent_value boolean;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'seeker');

  if user_role not in ('seeker', 'helper') then
    user_role := 'seeker';
  end if;

  accepted_terms_value := coalesce((new.raw_user_meta_data->>'accepted_terms')::boolean, false);
  accepted_privacy_value := coalesce((new.raw_user_meta_data->>'accepted_privacy')::boolean, false);
  marketing_consent_value := coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false);

  insert into public.profiles (
    id,
    full_name,
    role,
    phone,
    verified,
    is_admin,
    accepted_terms,
    accepted_privacy,
    marketing_consent,
    accepted_terms_at,
    accepted_privacy_at,
    marketing_consent_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    user_role,
    nullif(new.raw_user_meta_data->>'phone', ''),
    false,
    false,
    accepted_terms_value,
    accepted_privacy_value,
    marketing_consent_value,
    case when accepted_terms_value then now() else null end,
    case when accepted_privacy_value then now() else null end,
    case when marketing_consent_value then now() else null end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    phone = excluded.phone,
    accepted_terms = excluded.accepted_terms,
    accepted_privacy = excluded.accepted_privacy,
    marketing_consent = excluded.marketing_consent,
    accepted_terms_at = coalesce(public.profiles.accepted_terms_at, excluded.accepted_terms_at),
    accepted_privacy_at = coalesce(public.profiles.accepted_privacy_at, excluded.accepted_privacy_at),
    marketing_consent_at = coalesce(public.profiles.marketing_consent_at, excluded.marketing_consent_at);

  insert into public.admin_notifications (
    type,
    title,
    message,
    metadata,
    is_read
  )
  values (
    'new_user',
    'Nuovo utente registrato',
    coalesce(new.raw_user_meta_data->>'full_name', 'Un nuovo utente') || ' si è registrato su ELPYO.',
    jsonb_build_object(
      'user_id', new.id,
      'email', new.email,
      'full_name', new.raw_user_meta_data->>'full_name',
      'role', user_role
    ),
    false
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
