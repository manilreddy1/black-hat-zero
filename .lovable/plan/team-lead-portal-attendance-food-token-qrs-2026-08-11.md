# Team Lead Portal, Attendance & Food Token QRs

## What gets built

### 1. Team lead login (separate from staff)
- New public route `/team` (login) and `/team/portal` (dashboard). Completely separate surface from the hidden staff area; a "Team lead login" button appears in the site nav/footer.
- Accounts are created automatically the moment a registration is marked **REGISTERED**: the leader's email gets a login account and an email from the built-in mail service with a one-click link to set their password. (Passwords are never generated in plain text or shown in the panel — the lead sets their own on first visit at `/team/set-password`.)
- Login is rate limited with the same exponential-backoff throttle as staff login, and a lead can only ever see their own team.

### 2. What a team lead sees
- Team details: team code, status, members, roll numbers, amount paid, payment status.
- **Attendance QR** — one QR for the whole team, always visible once registered.
- **Food token QRs** — one QR per participant, hidden until an admin presses **Send food tokens** for that team (or all teams). Each token shows the member name and whether it has already been redeemed.

### 3. Coordinator scanning (staff console)
- New console page **Check-in**: camera scanner + manual code entry.
- Scanning an attendance QR shows the team, then requires a confirm tap to mark **Present**.
- Scanning a food QR shows participant name + veg/non-veg, requires confirm, and is single-use — a second scan clearly says "already redeemed", with who redeemed it and when.

### 4. Food preference
- Registration adds a **Veg / Non-veg** choice per member (required).
- Staff overview dashboard gets a veg vs non-veg breakdown chart plus totals; registrations list and detail drawer show each member's preference; CSV export includes it.

### 5. Payment proof in admin
- The team's payment screenshot and the verifier's receipt already load in the detail drawer via signed links; this gets upgraded to an inline preview with a zoom/full-size view inside **View details**, so no separate click is needed.

## Security measures
- QR payloads are opaque signed tokens (HMAC with a server-only secret) — not guessable, not editable, and useless if copied to another team.
- All lead-portal reads/writes run through authenticated server functions scoped to the signed-in lead's own registration.
- Food tokens are marked redeemed inside a single database update guarded against double-redeem races; every scan is audit-logged with the coordinator's identity.
- Only admins/super admins can release food tokens; only coordinators and above can scan.
- Row-level security: leads can read only their own team rows; token tables are never readable by anonymous visitors.

## Technical notes
- New tables: `attendance` (per registration, marked_by, marked_at) and `food_tokens` (per team member, released flag, redeemed_at, redeemed_by), plus `food_pref` on `team_members` and a `lead_user_id` on `teams`.
- Token secret stored as a project secret; QR value = `registration_id|member_id|hmac`.
- Lead accounts use the same auth system as staff but hold no role rows, so the staff console gate still rejects them; the staff route guard additionally requires a role.
- Scanner uses a lightweight in-browser QR reader with manual-entry fallback for devices that block the camera.
