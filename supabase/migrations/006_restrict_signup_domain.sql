-- 006_restrict_signup_domain.sql
-- Enforce the company email domain for new signups at the database level.
--
-- The client-side check in src/pages/Signup.tsx is UX only; this trigger is the
-- real guard and holds no matter how the account is created. It fires only on
-- INSERT, so existing users are unaffected. GoTrue may surface a generic
-- "Database error saving new user" to clients on rejection — that is the abuse
-- path; legitimate users get the friendly message from the client check first.
--
-- To change or lift the restriction, edit the domain below (keep
-- ALLOWED_EMAIL_DOMAIN in Signup.tsx in sync) or drop the trigger.

create or replace function public.enforce_company_email_domain()
returns trigger
language plpgsql
as $$
begin
  if new.email is null or lower(new.email) not like '%@triumph.com' then
    raise exception 'Signups are restricted to @triumph.com email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_company_email_domain on auth.users;

create trigger enforce_company_email_domain
  before insert on auth.users
  for each row
  execute function public.enforce_company_email_domain();
