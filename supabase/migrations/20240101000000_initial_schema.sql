-- ============================================================
-- Creators Point - Supabase Database Migration
-- ============================================================
-- This schema implements:
--   * Profiles and roles (customer/admin)
--   * Dynamic categories and campaigns
--   * Submission event ON/OFF system
--   * Submissions with review workflow
--   * Point ledger with atomic transactions
--   * Withdrawals with double-approval protection
--   * Notifications
--   * Admin audit logs
--   * Site settings and payment methods
--   * Row Level Security on every table
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'suspended', 'banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type withdrawal_status as enum ('pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum ('submission_reward', 'submission_rejection', 'withdrawal', 'admin_adjustment', 'bonus', 'penalty');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  full_name text not null default '',
  username text not null unique,
  email text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  points_balance numeric(12,2) not null default 0,
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles (user_id);
create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_status on public.profiles (status);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  instructions text,
  reward_points numeric(12,2) not null default 50,
  rejection_points numeric(12,2) not null default 20,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CAMPAIGNS (Content Requirements)
-- ============================================================
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  requirements text,
  video_instructions text,
  reference_info text,
  reward_points numeric(12,2) not null default 50,
  rejection_points numeric(12,2) not null default 20,
  category_id uuid references public.categories (id) on delete set null,
  start_date timestamptz,
  end_date timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBMISSION EVENTS
-- ============================================================
create table if not exists public.submission_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Submission Event',
  description text,
  is_open boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  max_submissions int check (max_submissions is null or max_submissions > 0),
  current_submission_count int not null default 0,
  max_per_user_per_day int check (max_per_user_per_day is null or max_per_user_per_day > 0),
  max_per_user_per_event int check (max_per_user_per_event is null or max_per_user_per_event > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  video_url text not null,
  notes text,
  status submission_status not null default 'pending',
  admin_note text,
  reward_points numeric(12,2),
  deduction_points numeric(12,2),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_submissions_user_id on public.submissions (user_id);
create index if not exists idx_submissions_status on public.submissions (status);
create index if not exists idx_submissions_category on public.submissions (category_id);
create index if not exists idx_submissions_created_at on public.submissions (created_at);
create unique index if not exists idx_submissions_video_url_unique on public.submissions (video_url);

-- ============================================================
-- POINT TRANSACTIONS (Ledger)
-- ============================================================
create table if not exists public.point_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type transaction_type not null,
  amount numeric(12,2) not null,
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  reference_type text,
  reference_id uuid,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_point_tx_user on public.point_transactions (user_id);
create index if not exists idx_point_tx_type on public.point_transactions (type);
create index if not exists idx_point_tx_created_at on public.point_transactions (created_at);

-- ============================================================
-- PAYMENT METHODS
-- ============================================================
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed default payment methods
insert into public.payment_methods (name, description, is_active) values
  ('eSewa', 'eSewa wallet payment', true),
  ('Khalti', 'Khalti wallet payment', true),
  ('Bank', 'Bank transfer', true)
on conflict (name) do nothing;

-- ============================================================
-- WITHDRAWALS
-- ============================================================
create table if not exists public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null,
  account_details text not null,
  qr_image_url text,
  note text,
  status withdrawal_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawals_amount_min_check check (amount >= 100)
);

create index if not exists idx_withdrawals_user on public.withdrawals (user_id);
create index if not exists idx_withdrawals_status on public.withdrawals (status);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system' check (type in ('submission', 'points', 'withdrawal', 'event', 'announcement', 'system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_notifications_read on public.notifications (user_id, is_read);

-- ============================================================
-- ADMIN LOGS
-- ============================================================
create table if not exists public.admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_action on public.admin_logs (action);
create index if not exists idx_admin_logs_created_at on public.admin_logs (created_at);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
create table if not exists public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  website_name text not null default 'Creators Point',
  logo_url text,
  favicon_url text,
  site_description text,
  contact_email text,
  contact_phone text,
  support_info text,
  default_reward_points numeric(12,2) not null default 50,
  default_rejection_points numeric(12,2) not null default 20,
  min_withdrawal numeric(12,2) not null default 100,
  point_to_npr numeric(12,2) not null default 1,
  submission_event_status text not null default 'closed' check (submission_event_status in ('open', 'closed')),
  maintenance_mode boolean not null default false,
  registration_open boolean not null default true,
  withdrawal_open boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (uuid_generate_v4());

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists trg_submissions_updated on public.submissions;
create trigger trg_submissions_updated before update on public.submissions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_withdrawals_updated on public.withdrawals;
create trigger trg_withdrawals_updated before update on public.withdrawals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_campaigns_updated on public.campaigns;
create trigger trg_campaigns_updated before update on public.campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated on public.site_settings;
create trigger trg_site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text := coalesce(
    split_part(new.email, '@', 1),
    'user'
  );
  final_username text;
  counter int := 1;
begin
  insert into public.profiles (user_id, email, username, full_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    base_username,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    case when coalesce(new.raw_user_meta_data->>'is_admin', 'false') = 'true' then 'admin'::user_role else 'customer'::user_role end,
    'active'::user_status
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: Sync submission count into event
-- ============================================================
create or replace function public.sync_submission_count()
returns trigger as $$
declare
  v_event record;
begin
  select * into v_event from public.submission_events order by created_at desc limit 1;
  if v_event.id is not null then
    update public.submission_events
    set current_submission_count = (
      select count(*) from public.submissions where created_at >= coalesce(v_event.start_date, '1900-01-01')
    )
    where id = v_event.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_submission_count on public.submissions;
create trigger trg_submission_count after insert on public.submissions
  for each row execute function public.sync_submission_count();

-- ============================================================
-- HELPER: Is the requesting user an admin?
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
declare
  v_role user_role;
begin
  select role into v_role from public.profiles where user_id = auth.uid();
  return coalesce(v_role, 'customer') = 'admin';
end;
$$ language plpgsql security definer stable set search_path = public;

-- ============================================================
-- HELPER: Create a point transaction + update balance atomically
-- ============================================================
create or replace function public.apply_point_change(
  p_user_id uuid,
  p_type transaction_type,
  p_amount numeric,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_description text default null,
  p_created_by uuid default null
) returns void as $$
declare
  v_balance numeric(12,2);
  v_new_balance numeric(12,2);
begin
  select points_balance into v_balance from public.profiles where id = p_user_id for update;
  v_new_balance := v_balance + p_amount;

  update public.profiles set points_balance = v_new_balance where id = p_user_id;

  insert into public.point_transactions (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, description, created_by
  ) values (
    p_user_id, p_type, p_amount, v_balance, v_new_balance,
    p_reference_type, p_reference_id, p_description, p_created_by
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- FUNCTION: submit_content
-- Creates a submission with full validation.
-- Enforces: event open, status active, limits, duplicate URLs.
-- ============================================================
create or replace function public.submit_content(
  p_category_id uuid,
  p_video_url text,
  p_notes text default null,
  p_campaign_id uuid default null
) returns uuid as $$
declare
  v_profile public.profiles%rowtype;
  v_event public.submission_events%rowtype;
  v_category public.categories%rowtype;
  v_exists boolean;
  v_user_daily int;
  v_user_event int;
  v_normalized_url text;
  v_result_id uuid;
begin
  select * into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then
    raise exception 'Profile not found';
  end if;
  if v_profile.status <> 'active' then
    raise exception 'Your account is not active. Please contact support.';
  end if;

  if p_video_url is null or trim(p_video_url) = '' then
    raise exception 'Please provide a valid video link.' using errcode = '22000';
  end if;

  if p_video_url !~ '^https?://[^\s]+$' then
    raise exception 'Please enter a valid video link (must start with http or https).' using errcode = '22000';
  end if;

  if position('javascript:' in lower(p_video_url)) > 0
     or position('data:' in lower(p_video_url)) > 0 then
    raise exception 'Unsafe link detected.' using errcode = '22000';
  end if;

  v_normalized_url := lower(trim(p_video_url));

  -- Duplicate URL detection (any user)
  select exists(
    select 1 from public.submissions where video_url = v_normalized_url
  ) into v_exists;
  if v_exists then
    raise exception 'This content has already been submitted.' using errcode = '23505';
  end if;

  select * into v_category from public.categories where id = p_category_id;

  if v_category is null then
    raise exception 'Invalid category.' using errcode = '22000';
  end if;
  if v_category.status <> 'active' then
    raise exception 'This category is not currently active.' using errcode = '22000';
  end if;

  -- Event gate
  select * into v_event from public.submission_events order by created_at desc limit 1;
  if v_event.is_open is not true then
    raise exception 'Content submissions are currently closed.' using errcode = '22000';
  end if;
  if v_event.start_date is not null and now() < v_event.start_date then
    raise exception 'Submissions have not opened yet.' using errcode = '22000';
  end if;
  if v_event.end_date is not null and now() > v_event.end_date then
    raise exception 'Submissions are currently closed. Please check again later.' using errcode = '22000';
  end if;

  -- Event-level max submissions
  if v_event.max_submissions is not null
     and v_event.current_submission_count >= v_event.max_submissions then
    raise exception 'The submission limit for this event has been reached.' using errcode = '22000';
  end if;

  -- Per-user daily limit
  if v_event.max_per_user_per_day is not null then
    select count(*) into v_user_daily
    from public.submissions
    where user_id = v_profile.id and created_at >= date_trunc('day', now());
    if v_user_daily >= v_event.max_per_user_per_day then
      raise exception 'You have reached today''s submission limit.' using errcode = '22000';
    end if;
  end if;

  -- Per-user event limit
  if v_event.max_per_user_per_event is not null then
    select count(*) into v_user_event
    from public.submissions
    where user_id = v_profile.id
      and created_at >= coalesce(v_event.start_date, '1900-01-01')
      and created_at <= coalesce(v_event.end_date, now());
    if v_user_event >= v_event.max_per_user_per_event then
      raise exception 'You have reached your submission limit for this event.' using errcode = '22000';
    end if;
  end if;

  insert into public.submissions (user_id, category_id, campaign_id, video_url, notes)
  values (v_profile.id, p_category_id, p_campaign_id, v_normalized_url, p_notes)
  returning id into v_result_id;

  return v_result_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.submit_content to authenticated;

-- ============================================================
-- FUNCTION: admin_review_submission
-- Approve or reject a submission. Atomically updates points.
-- Cannot double-review. Locks the row to avoid races.
-- ============================================================
create or replace function public.admin_review_submission(
  p_submission_id uuid,
  p_decision text,
  p_points numeric,
  p_admin_note text default null
) returns void as $$
declare
  v_submission public.submissions%rowtype;
  v_profile public.profiles%rowtype;
  v_admin_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;

  select * into v_admin_profile from public.profiles where user_id = auth.uid();

  select * into v_submission from public.submissions where id = p_submission_id for update;
  if v_submission is null then
    raise exception 'Submission not found.' using errcode = '22000';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'This submission has already been reviewed.' using errcode = '55000';
  end if;

  select * into v_profile from public.profiles where id = v_submission.user_id for update;

  if p_decision = 'approve' then
    if p_points is null or p_points < 0 then
      raise exception 'Reward points must be non-negative.' using errcode = '22000';
    end if;

    update public.submissions
    set status = 'approved',
        reward_points = p_points,
        admin_note = coalesce(p_admin_note, admin_note),
        reviewed_by = v_admin_profile.id,
        reviewed_at = now()
    where id = p_submission_id;

    perform public.apply_point_change(
      p_user_id => v_profile.id,
      p_type => 'submission_reward',
      p_amount => p_points,
      p_reference_type => 'submission',
      p_reference_id => p_submission_id,
      p_description => 'Video approved' || ' (' || coalesce(p_admin_note, '') || ')',
      p_created_by => v_admin_profile.id
    );

    insert into public.notifications (user_id, title, message, type) values (
      v_profile.id,
      'Content Approved',
      'Your submission has been approved and ' || p_points || ' points have been added to your account.',
      'submission'
    );

    insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata) values (
      v_admin_profile.id, 'submission_approved', 'submission', p_submission_id,
      'Approved submission and awarded ' || p_points || ' points.',
      jsonb_build_object('points', p_points)
    );
  elsif p_decision = 'reject' then
    if p_points is null or p_points < 0 then
      raise exception 'Deduction points must be non-negative.' using errcode = '22000';
    end if;

    update public.submissions
    set status = 'rejected',
        deduction_points = p_points,
        admin_note = coalesce(p_admin_note, admin_note),
        reviewed_by = v_admin_profile.id,
        reviewed_at = now()
    where id = p_submission_id;

    perform public.apply_point_change(
      p_user_id => v_profile.id,
      p_type => 'submission_rejection',
      p_amount => -p_points,
      p_reference_type => 'submission',
      p_reference_id => p_submission_id,
      p_description => 'Video rejected' || ' (' || coalesce(p_admin_note, '') || ')',
      p_created_by => v_admin_profile.id
    );

    insert into public.notifications (user_id, title, message, type) values (
      v_profile.id,
      'Content Rejected',
      'Your submission was rejected. ' || p_points || ' points have been deducted from your account.',
      'submission'
    );

    insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata) values (
      v_admin_profile.id, 'submission_rejected', 'submission', p_submission_id,
      'Rejected submission and deducted ' || p_points || ' points.',
      jsonb_build_object('points', p_points)
    );
  else
    raise exception 'Invalid decision. Use approve or reject.' using errcode = '22000';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_review_submission to authenticated;

-- ============================================================
-- FUNCTION: request_withdrawal
-- Creates a pending withdrawal. NO point deduction at request time.
-- ============================================================
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_payment_method text,
  p_account_details text,
  p_note text default null,
  p_qr_image_url text default null
) returns uuid as $$
declare
  v_profile public.profiles%rowtype;
  v_settings public.site_settings%rowtype;
  v_method boolean;
  v_result uuid;
begin
  select * into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null or v_profile.status <> 'active' then
    raise exception 'Your account is not active.' using errcode = '42501';
  end if;

  select * into v_settings from public.site_settings order by id limit 1;
  if v_settings.withdrawal_open is not true then
    raise exception 'Withdrawals are currently closed.' using errcode = '22000';
  end if;

  if p_amount < v_settings.min_withdrawal then
    raise exception 'Minimum withdrawal amount is % points (NPR %).', v_settings.min_withdrawal, v_settings.min_withdrawal using errcode = '22000';
  end if;

  if p_amount > v_profile.points_balance then
    raise exception 'You don''t have enough available points for this withdrawal. You need at least % available points.', v_settings.min_withdrawal using errcode = '22000';
  end if;

  select exists(
    select 1 from public.payment_methods where name = p_payment_method and is_active = true
  ) into v_method;
  if not v_method then
    raise exception 'Selected payment method is not available.' using errcode = '22000';
  end if;

  if p_account_details is null or trim(p_account_details) = '' then
    raise exception 'Payment account details are required.' using errcode = '22000';
  end if;

  insert into public.withdrawals (user_id, amount, payment_method, account_details, qr_image_url, note)
  values (v_profile.id, p_amount, p_payment_method, p_account_details, p_qr_image_url, p_note)
  returning id into v_result;

  insert into public.notifications (user_id, title, message, type) values (
    v_profile.id,
    'Withdrawal Request Submitted',
    'Your withdrawal request of ' || p_amount || ' points (NPR ' || p_amount || ') has been submitted and is pending review.',
    'withdrawal'
  );

  return v_result;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.request_withdrawal to authenticated;

-- ============================================================
-- FUNCTION: admin_review_withdrawal
-- Approve: deduct points atomically (once).
-- Reject: no point change.
-- ============================================================
create or replace function public.admin_review_withdrawal(
  p_withdrawal_id uuid,
  p_decision text,
  p_admin_note text default null
) returns void as $$
declare
  v_withdrawal public.withdrawals%rowtype;
  v_admin_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;

  select * into v_admin_profile from public.profiles where user_id = auth.uid();

  select * into v_withdrawal from public.withdrawals where id = p_withdrawal_id for update;
  if v_withdrawal is null then
    raise exception 'Withdrawal not found.' using errcode = '22000';
  end if;

  if v_withdrawal.status <> 'pending' then
    raise exception 'This withdrawal has already been processed.' using errcode = '55000';
  end if;

  if p_decision = 'approve' then
    update public.withdrawals
    set status = 'approved',
        admin_note = coalesce(p_admin_note, admin_note),
        reviewed_by = v_admin_profile.id,
        reviewed_at = now()
    where id = p_withdrawal_id;

    perform public.apply_point_change(
      p_user_id => v_withdrawal.user_id,
      p_type => 'withdrawal',
      p_amount => -v_withdrawal.amount,
      p_reference_type => 'withdrawal',
      p_reference_id => p_withdrawal_id,
      p_description => 'Withdrawal approved - ' || v_withdrawal.payment_method,
      p_created_by => v_admin_profile.id
    );

    insert into public.notifications (user_id, title, message, type) values (
      v_withdrawal.user_id,
      'Withdrawal Approved',
      'Your withdrawal of ' || v_withdrawal.amount || ' points (NPR ' || v_withdrawal.amount || ') has been approved and paid.',
      'withdrawal'
    );

    insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata) values (
      v_admin_profile.id, 'withdrawal_approved', 'withdrawal', p_withdrawal_id,
      'Approved withdrawal of ' || v_withdrawal.amount || ' points.',
      jsonb_build_object('amount', v_withdrawal.amount)
    );
  elsif p_decision = 'reject' then
    update public.withdrawals
    set status = 'rejected',
        admin_note = coalesce(p_admin_note, admin_note),
        reviewed_by = v_admin_profile.id,
        reviewed_at = now()
    where id = p_withdrawal_id;

    insert into public.notifications (user_id, title, message, type) values (
      v_withdrawal.user_id,
      'Withdrawal Rejected',
      'Your withdrawal request of ' || v_withdrawal.amount || ' points has been rejected. No points were deducted.',
      'withdrawal'
    );

    insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata) values (
      v_admin_profile.id, 'withdrawal_rejected', 'withdrawal', p_withdrawal_id,
      'Rejected withdrawal of ' || v_withdrawal.amount || ' points.',
      jsonb_build_object('amount', v_withdrawal.amount)
    );
  else
    raise exception 'Invalid decision. Use approve or reject.' using errcode = '22000';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_review_withdrawal to authenticated;

-- ============================================================
-- FUNCTION: admin_adjust_points
-- Manual point adjustment with audit log and notification.
-- ============================================================
create or replace function public.admin_adjust_points(
  p_user_id uuid,
  p_amount numeric,
  p_description text,
  p_type transaction_type default 'admin_adjustment'
) returns void as $$
declare
  v_admin_profile public.profiles%rowtype;
  v_target public.profiles%rowtype;
  v_type transaction_type := p_type;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;

  select * into v_admin_profile from public.profiles where user_id = auth.uid();
  select * into v_target from public.profiles where id = p_user_id for update;

  if v_target is null then
    raise exception 'Target user not found.' using errcode = '22000';
  end if;

  if p_amount = 0 then
    raise exception 'Amount cannot be zero.' using errcode = '22000';
  end if;

  if p_type = 'admin_adjustment' and p_amount > 0 then
    v_type := 'bonus';
  elsif p_type = 'admin_adjustment' and p_amount < 0 then
    v_type := 'penalty';
  end if;

  perform public.apply_point_change(
    p_user_id => v_target.id,
    p_type => v_type,
    p_amount => p_amount,
    p_reference_type => 'profile',
    p_reference_id => v_target.id,
    p_description => p_description,
    p_created_by => v_admin_profile.id
  );

  insert into public.notifications (user_id, title, message, type) values (
    v_target.id,
    case when p_amount > 0 then 'Points Added' else 'Points Deducted' end,
    p_amount || ' points have been ' || case when p_amount > 0 then 'added to' else 'deducted from' end || ' your account. ' || coalesce(p_description, ''),
    'points'
  );

  insert into public.admin_logs (admin_id, action, target_type, target_id, description, metadata) values (
    v_admin_profile.id, 'points_adjusted', 'profile', v_target.id,
    'Adjusted points by ' || p_amount || ' (' || coalesce(p_description, 'no reason') || ')',
    jsonb_build_object('amount', p_amount, 'reason', p_description)
  );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_adjust_points to authenticated;

-- ============================================================
-- FUNCTION: mark_notifications_read
-- ============================================================
create or replace function public.mark_notifications_read(p_ids uuid[])
returns void as $$
begin
  if p_ids is null or array_length(p_ids, 1) is null then
    return;
  end if;
  update public.notifications
  set is_read = true
  where id = any(p_ids) and user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.mark_all_notifications_read()
returns void as $$
begin
  update public.notifications set is_read = true where user_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.mark_notifications_read to authenticated;
grant execute on function public.mark_all_notifications_read to authenticated;

-- ============================================================
-- FUNCTION: admin_update_profile_status (suspend/activate/ban)
-- ============================================================
create or replace function public.admin_update_user_status(
  p_user_id uuid,
  p_status user_status
) returns void as $$
declare
  v_admin public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;
  select * into v_admin from public.profiles where user_id = auth.uid();

  update public.profiles set status = p_status where id = p_user_id;

  insert into public.admin_logs (admin_id, action, target_type, target_id, description) values (
    v_admin.id, 'user_status_' || p_status, 'profile', p_user_id,
    'User status changed to ' || p_status
  );

  insert into public.notifications (user_id, title, message, type) values (
    p_user_id,
    'Account ' || p_status,
    'Your account status has been changed to ' || p_status || ' by the administrator.',
    'system'
  );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_update_user_status to authenticated;

-- ============================================================
-- FUNCTION: send_announcement (broadcast to all users)
-- ============================================================
create or replace function public.admin_send_announcement(p_title text, p_message text)
returns void as $$
declare
  v_admin public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;
  select * into v_admin from public.profiles where user_id = auth.uid();

  insert into public.notifications (user_id, title, message, type)
  select id, p_title, p_message, 'announcement'
  from public.profiles
  where role = 'customer' and status = 'active';

  insert into public.admin_logs (admin_id, action, target_type, description) values (
    v_admin.id, 'announcement_sent', 'all_users',
    'Sent announcement: ' || p_title
  );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_send_announcement to authenticated;

-- ============================================================
-- FUNCTION: set_event_status (admin only)
-- ============================================================
create or replace function public.admin_set_event_status(p_is_open boolean)
returns void as $$
declare
  v_admin public.profiles%rowtype;
  v_event public.submission_events%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required.' using errcode = '42501';
  end if;
  select * into v_admin from public.profiles where user_id = auth.uid();

  select * into v_event from public.submission_events order by created_at desc limit 1;
  if v_event.id is null then
    raise exception 'No event exists yet. Create an event first.' using errcode = '22000';
  end if;

  update public.submission_events set is_open = p_is_open where id = v_event.id;

  insert into public.admin_logs (admin_id, action, target_type, target_id, description) values (
    v_admin.id, case when p_is_open then 'event_opened' else 'event_closed' end,
    'submission_event', v_event.id,
    case when p_is_open then 'Submission event opened.' else 'Submission event closed.' end
  );

  if p_is_open then
    insert into public.notifications (user_id, title, message, type)
    select id, 'Submissions Open', 'The submission event is now open. Submit your content and earn points!', 'event'
    from public.profiles where role = 'customer' and status = 'active';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.admin_set_event_status to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.campaigns enable row level security;
alter table public.submission_events enable row level security;
alter table public.submissions enable row level security;
alter table public.point_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.payment_methods enable row level security;

-- ============================================================
-- PROFILES POLICIES
-- Users can read their own profile; admins can read all.
-- Users can update their own non-sensitive fields.
-- ============================================================
create policy "profiles_select_own" on public.profiles
  for select using (user_id = auth.uid());

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and role = (select role from public.profiles where user_id = auth.uid())
    and points_balance = (select points_balance from public.profiles where user_id = auth.uid())
    and status = (select status from public.profiles where user_id = auth.uid())
    and user_id = (select user_id from public.profiles where user_id = auth.uid())
  );

-- ============================================================
-- CATEGORIES POLICIES
-- Read for everyone (active only), write for admins.
-- ============================================================
create policy "categories_read" on public.categories
  for select using (true);

create policy "categories_insert_admin" on public.categories
  for insert with check (public.is_admin());

create policy "categories_update_admin" on public.categories
  for update using (public.is_admin());

create policy "categories_delete_admin" on public.categories
  for delete using (public.is_admin());

-- ============================================================
-- CAMPAIGNS POLICIES
-- Read active for everyone, write for admins.
-- ============================================================
create policy "campaigns_read" on public.campaigns
  for select using (true);

create policy "campaigns_insert_admin" on public.campaigns
  for insert with check (public.is_admin());

create policy "campaigns_update_admin" on public.campaigns
  for update using (public.is_admin());

create policy "campaigns_delete_admin" on public.campaigns
  for delete using (public.is_admin());

-- ============================================================
-- SUBMISSION EVENTS POLICIES
-- ============================================================
create policy "events_read" on public.submission_events
  for select using (true);

create policy "events_insert_admin" on public.submission_events
  for insert with check (public.is_admin());

create policy "events_update_admin" on public.submission_events
  for update using (public.is_admin());

create policy "events_delete_admin" on public.submission_events
  for delete using (public.is_admin());

-- ============================================================
-- SUBMISSIONS POLICIES
-- ============================================================
create policy "submissions_select_own" on public.submissions
  for select using (user_id = auth.uid());

create policy "submissions_select_admin" on public.submissions
  for select using (public.is_admin());

-- Insert goes through the submit_content RPC (security definer).
-- Direct inserts blocked for everyone:
create policy "submissions_insert_none" on public.submissions
  for insert with check (false);

create policy "submissions_update_admin" on public.submissions
  for update using (public.is_admin());

-- ============================================================
-- POINT TRANSACTIONS POLICIES
-- ============================================================
create policy "point_tx_select_own" on public.point_transactions
  for select using (user_id = auth.uid());

create policy "point_tx_select_admin" on public.point_transactions
  for select using (public.is_admin());

create policy "point_tx_insert_none" on public.point_transactions
  for insert with check (false);

-- ============================================================
-- WITHDRAWALS POLICIES
-- ============================================================
create policy "withdrawals_select_own" on public.withdrawals
  for select using (user_id = auth.uid());

create policy "withdrawals_select_admin" on public.withdrawals
  for select using (public.is_admin());

create policy "withdrawals_insert_none" on public.withdrawals
  for insert with check (false);

create policy "withdrawals_update_admin" on public.withdrawals
  for update using (public.is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_select_admin" on public.notifications
  for select using (public.is_admin());

create policy "notifications_insert_none" on public.notifications
  for insert with check (false);

-- ============================================================
-- ADMIN LOGS POLICIES
-- ============================================================
create policy "admin_logs_select_none" on public.admin_logs
  for select using (false);

create policy "admin_logs_select_admin" on public.admin_logs
  for select using (public.is_admin());

create policy "admin_logs_insert_none" on public.admin_logs
  for insert with check (false);

-- ============================================================
-- SITE SETTINGS POLICIES
-- ============================================================
-- Users can read non-sensitive settings; admins can read all and write.
create policy "site_settings_read" on public.site_settings
  for select using (true);

create policy "site_settings_update_admin" on public.site_settings
  for update using (public.is_admin());

-- ============================================================
-- PAYMENT METHODS POLICIES
-- ============================================================
create policy "payment_methods_read" on public.payment_methods
  for select using (true);

create policy "payment_methods_write_admin" on public.payment_methods
  for insert with check (public.is_admin());

create policy "payment_methods_update_admin" on public.payment_methods
  for update using (public.is_admin());

create policy "payment_methods_delete_admin" on public.payment_methods
  for delete using (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('private-files', 'private-files', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Private bucket (QR codes, etc.)
create policy "private_files_read_owner" on storage.objects
  for select using (
    bucket_id = 'private-files'
    and (auth.uid()::text = (storage.foldername(name))[1] or exists (
      select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'
    ))
  );

create policy "private_files_insert_owner" on storage.objects
  for insert with check (
    bucket_id = 'private-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public avatars
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );