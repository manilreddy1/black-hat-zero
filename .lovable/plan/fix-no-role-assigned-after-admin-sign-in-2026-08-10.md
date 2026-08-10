# Fix: "No role assigned" after admin sign-in

## What's happening

Sign-in itself works — the auth logs show a successful login for admin@blackhatnrcm.com, and the admin role row does exist in the database. The dashboard still shows "No role assigned" because the database can no longer read that role row.

During the recent security hardening, the two role-checking helpers were moved into a locked-down `private` area and all access was revoked from signed-in users. Every access rule on the tables (including the roles table itself) calls those helpers, so each check now fails with a permission error instead of returning true/false. The result: the dashboard sees an empty role list for a real admin, and staff pages will misbehave the same way.

Verified: the admin role row exists; the roles-table policy calls `private.has_role`; signed-in users currently have neither access to the `private` area nor permission to run those helpers.

## The fix

One database migration that restores the ability for signed-in users to *run* the helper checks, without re-exposing them as a public API:

- Grant usage of the `private` area and execute permission on the two helper functions to signed-in users only.
- Keep anonymous visitors with no access at all.
- The helpers stay in `private`, so they remain invisible to the public data API — the original security finding stays fixed.

## Verification after applying

- Sign in as admin and confirm the dashboard shows the admin role and all sections (Content, Website Text, Settings, Staff, Audit Logs).
- Confirm the payment-verifier account sees only its permitted sections.
- Confirm the public pages (home, register, status) still load for logged-out visitors.

## Technical detail

```sql
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated;
```

Both functions are `SECURITY DEFINER` and read-only; `private` is not in the API's exposed schema list, so they cannot be invoked over HTTP. No application code changes are needed.
