-- Repair profile creation for existing and future auth users.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
  base_username text := coalesce(requested_username, split_part(coalesce(new.email, ''), '@', 1), 'user');
  final_username text := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '_', 'g'));
  candidate_username text := final_username;
  counter int := 1;
begin
  if candidate_username = '' then
    candidate_username := 'user';
  end if;

  while exists (select 1 from public.profiles where username = candidate_username and user_id <> new.id) loop
    candidate_username := final_username || '_' || counter;
    counter := counter + 1;
  end loop;

  insert into public.profiles (user_id, email, username, full_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    candidate_username,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    case when coalesce(new.raw_user_meta_data->>'is_admin', 'false') = 'true' then 'admin'::user_role else 'customer'::user_role end,
    'active'::user_status
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create missing profiles for users created before the trigger was fixed.
do $$
declare
  auth_user record;
  base_username text;
  candidate_username text;
  counter int;
begin
  for auth_user in select id, email, raw_user_meta_data from auth.users loop
    if not exists (select 1 from public.profiles where user_id = auth_user.id) then
      base_username := lower(regexp_replace(
        coalesce(nullif(trim(auth_user.raw_user_meta_data->>'username'), ''), split_part(coalesce(auth_user.email, ''), '@', 1), 'user'),
        '[^a-zA-Z0-9_]', '_', 'g'
      ));
      if base_username = '' then
        base_username := 'user';
      end if;
      candidate_username := base_username;
      counter := 1;
      while exists (select 1 from public.profiles where username = candidate_username) loop
        candidate_username := base_username || '_' || counter;
        counter := counter + 1;
      end loop;

      insert into public.profiles (user_id, email, username, full_name, role, status)
      values (
        auth_user.id,
        coalesce(auth_user.email, ''),
        candidate_username,
        coalesce(nullif(auth_user.raw_user_meta_data->>'full_name', ''), split_part(coalesce(auth_user.email, ''), '@', 1)),
        case when coalesce(auth_user.raw_user_meta_data->>'is_admin', 'false') = 'true' then 'admin'::user_role else 'customer'::user_role end,
        'active'::user_status
      );
    end if;
  end loop;
end;
$$;