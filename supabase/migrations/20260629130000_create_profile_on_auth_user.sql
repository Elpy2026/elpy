create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  accepted_terms_value boolean := coalesce((metadata ->> 'accepted_terms')::boolean, false);
  accepted_privacy_value boolean := coalesce((metadata ->> 'accepted_privacy')::boolean, false);
  marketing_consent_value boolean := coalesce((metadata ->> 'marketing_consent')::boolean, false);
  profile_role text := case
    when metadata ->> 'role' in ('seeker', 'helper') then metadata ->> 'role'
    else 'seeker'
  end;
begin
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
  ) values (
    new.id,
    nullif(metadata ->> 'full_name', ''),
    profile_role,
    nullif(metadata ->> 'phone', ''),
    false,
    false,
    accepted_terms_value,
    accepted_privacy_value,
    marketing_consent_value,
    case when accepted_terms_value then coalesce(new.created_at, now()) else null end,
    case when accepted_privacy_value then coalesce(new.created_at, now()) else null end,
    case when marketing_consent_value then coalesce(new.created_at, now()) else null end
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    role = coalesce(excluded.role, public.profiles.role),
    phone = coalesce(excluded.phone, public.profiles.phone),
    verified = coalesce(public.profiles.verified, false),
    is_admin = coalesce(public.profiles.is_admin, false),
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
  ) values (
    'new_user',
    'Nuovo utente registrato',
    coalesce(nullif(metadata ->> 'full_name', ''), coalesce(new.email, 'Un utente')) || ' si è registrato su ELPYO.',
    jsonb_build_object(
      'user_id', new.id,
      'email', new.email,
      'full_name', metadata ->> 'full_name',
      'role', profile_role,
      'source', 'auth_user_trigger'
    ),
    false
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();
