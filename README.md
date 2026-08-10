# Black Hat Zero

Build a production-ready full-stack hackathon event website called:

BLACK HAT ZERO '26
HACKATHON FOR HACKERS

Tagline:
"think like a hacker, innovate like a leader,(i forgoted u complete this)

Use the uploaded BLACK HAT ZERO '26 logo as the primary visual identity.

The website should feel like a premium cybersecurity/hacker event platform — dark, cinematic, futuristic, aggressive, highly animated, and visually impressive.

DO NOT make it look like a generic college event website.

==================================================
1. CORE DESIGN DIRECTION
==================================================

Visual identity:

- Primary background: near-black
- Secondary: dark charcoal
- Accent colors: cyber red, crimson, white
- Small amounts of gray
- Avoid excessive colors
- Strong contrast
- Hacker/cybersecurity aesthetic
- Premium typography
- Glitch effects
- Scanline effects
- Terminal-style UI elements
- Circuit-board patterns
- Binary/code textures
- Red neon glow
- Subtle particles
- Digital noise
- Animated borders
- Futuristic cards

Use the uploaded BLACK HAT#0 logo prominently.

The logo contains:
- Hacker silhouette
- Black hat
- Laptop
- Red/white circular cyber background
- BLACK HAT#0 typography
- "HACKATHON FOR HACKERS"
- "CODE. BREAK. INNOVATE."
- "OWN THE SYSTEM."

The entire website should visually follow this identity.

==================================================
2. TECHNOLOGY
==================================================

Use:

- React
- TypeScript
- Tailwind CSS
- Modern component architecture
- Supabase for backend/database/authentication/storage
- Framer Motion for animations
- Lucide icons
- QR code generation library
- Responsive design
- Proper form validation
- Secure role-based access control

Use a clean, scalable folder structure.

Do NOT hardcode event/payment information inside frontend components.

All important configuration must come from the database/admin settings.

==================================================
3. PUBLIC WEBSITE
==================================================

Create the following sections:

HOME
ABOUT
EVENT
TIMELINE
RULES
CHALLENGES
PRIZES
SPONSORS
FAQ
REGISTER
CONTACT

The navigation should have:

BLACK HAT#0 logo

Home
About
Event
Timeline
Rules
Prizes
FAQ

REGISTER NOW button

On mobile use a premium animated hamburger menu.

==================================================
4. HERO SECTION
==================================================

Create a cinematic full-screen hero.

Display:

BLACK HAT#0

HACKATHON FOR HACKERS

CODE. BREAK. INNOVATE.
OWN THE SYSTEM.

Add:

[ REGISTER YOUR TEAM ]

[ EXPLORE EVENT ]

Hero should include:

- Large BLACK HAT#0 logo
- Animated red cyber glow
- Hacker silhouette atmosphere
- Moving particles
- Binary numbers in background
- Circuit traces
- Subtle glitch animation
- Scanlines
- Digital distortion
- Mouse-follow glow
- Parallax movement
- Animated typography
- Red light pulses

Do not overdo animations to the point of hurting usability.

The hero should immediately communicate:

CYBERSECURITY
HACKATHON
COMPETITION
REGISTRATION

Add an event countdown timer.

Countdown must come from admin-configured event start date/time.

If event date changes in admin panel, countdown automatically updates.

==================================================
5. EVENT INFORMATION
==================================================

Create a visually impressive event overview.

Display configurable information:

Event Name
Date
Start Time
End Time
Venue
College
Team Size
Registration Fee
Registration Deadline
Eligibility
Mode

Do not hardcode these values.

Admin should be able to change them.

==================================================
6. TEAM REGISTRATION SYSTEM
==================================================

Registration should be team-based.

The user first selects:

TEAM SIZE

Example:

1 Member
2 Members
3 Members
4 Members

Team size limits must be configurable from Admin Settings.

Default:

Maximum team size = 4

Registration price:

₹350 per participant

Total amount must automatically calculate:

TOTAL = TEAM SIZE × ₹350

Examples:

1 member = ₹350
2 members = ₹700
3 members = ₹1050
4 members = ₹1400

IMPORTANT:

Do not allow the frontend to blindly trust the amount.

The server/database must calculate and validate the expected amount.

==================================================
7. REGISTRATION FORM
==================================================

Create a multi-step registration experience.

STEP 1 — TEAM DETAILS

Team Name
Team Leader Name
Team Leader Email
Team Leader Phone
College Name
Department
Year
City

STEP 2 — TEAM MEMBERS

For each member:

Full Name
Email
Phone
College ID / Student ID
Department
Year

Team leader should automatically be marked as member 1.

Number of member forms should dynamically depend on selected team size.

STEP 3 — PAYMENT

Display:

Team Name
Team Size
₹350 × team size

TOTAL AMOUNT

Generate a dynamic UPI QR code.

==================================================
8. DYNAMIC UPI PAYMENT SYSTEM
==================================================

The UPI ID must be configurable from the Admin Dashboard.

Example:

admin configured UPI ID:
hackathon@upi

The system must generate a UPI payment URI dynamically.

Amount must be calculated from:

team_size × registration_fee

For example:

Team size = 3
Registration fee = ₹350

Amount = ₹1050

Generate QR code containing the appropriate UPI payment information.

Display:

PAY ₹1050

UPI ID:
hackathon@upi

[ COPY UPI ID ]

[ OPEN UPI APP ]

[ QR CODE ]

IMPORTANT:

The website must NOT automatically mark the registration as paid just because the QR was displayed or the user clicked a payment button.

Payment verification must happen through UTR verification.

==================================================
9. PAYMENT SUBMISSION
==================================================

After making payment, user must submit:

UTR / Transaction ID
Payment Date
Payment Time
Optional payment screenshot

Allow screenshot upload to Supabase Storage.

Validate UTR.

Prevent obvious duplicate UTR submissions.

After submission:

Registration status becomes:

PAYMENT_REVIEW

Display:

"Payment submitted successfully."

"Your registration is currently under payment verification."

Generate a unique registration ID.

Example:

BH0-2026-00421

Also generate a unique team ID.

Example:

BH0-TEAM-0421

==================================================
10. REGISTRATION STATUS FLOW
==================================================

Implement this exact state machine:

DRAFT

↓
PAYMENT_PENDING

↓
PAYMENT_REVIEW

↓
PAYMENT_APPROVED

↓
REGISTERED

Possible rejection:

PAYMENT_REVIEW
↓
PAYMENT_REJECTED
↓
PAYMENT_PENDING

Possible cancellation:

REGISTERED
↓
CANCELLED

Display status clearly to the team.

Status labels:

PAYMENT_PENDING
"Payment Pending"

PAYMENT_REVIEW
"Payment Under Review"

PAYMENT_APPROVED
"Payment Approved"

REGISTERED
"Team Registered"

PAYMENT_REJECTED
"Payment Rejected"

CANCELLED
"Registration Cancelled"

Use visually distinct status badges.

==================================================
11. IMPORTANT PAYMENT VERIFICATION ROLE
==================================================

Create a dedicated role:

PAYMENT_VERIFIER

This account has ONLY payment verification permissions.

It must NOT have:

- Admin access
- Event settings access
- User management
- Registration editing
- UPI configuration
- Pricing configuration
- Role management

The payment verifier can:

1. Login
2. View payment-review registrations
3. Open registration details
4. View:
   - Team name
   - Team ID
   - Registration ID
   - Team members
   - Expected amount
   - Submitted UTR
   - Payment screenshot
   - Payment timestamp
5. Verify the UTR manually
6. Approve payment
7. Reject payment
8. Add verification notes

Approval button:

[ APPROVE PAYMENT ]

Rejection button:

[ REJECT PAYMENT ]

If rejecting, require a reason.

Example:

"UTR does not match transaction."

"Incorrect amount."

"Duplicate transaction."

"Invalid payment proof."

After approval:

PAYMENT_APPROVED

Then automatically:

REGISTERED

Record:

Verified By
Verification Timestamp
Verification Notes

Every action must be logged.

==================================================
12. ADMIN ROLE
==================================================

Create a powerful Admin Dashboard.

Admin has full control.

Admin can manage:

EVENT SETTINGS
REGISTRATIONS
PAYMENTS
USERS
ROLES
PRICING
UPI SETTINGS
TEAM SIZE
EVENT DATE
EVENT VENUE
RULES
TIMELINE
PRIZES
SPONSORS
FAQ
ANNOUNCEMENTS
CONTACT INFORMATION

Admin dashboard should contain analytics.

Display:

Total Registrations
Registered Teams
Pending Payments
Payments Under Review
Approved Payments
Rejected Payments
Total Participants
Total Revenue
Today's Registrations
Recent Registrations

Create charts for:

Registrations over time
Payment status
Team size distribution
College distribution

==================================================
13. ADMIN PAYMENT SETTINGS
==================================================

Create:

Payment Settings

UPI ID
Registration Fee Per Participant
Currency
Payment Instructions
Payment Deadline

Example:

Registration Fee:
₹350

UPI ID:
hackathon@upi

Admin changes should immediately affect future registrations.

Existing registrations must retain their original expected payment amount.

IMPORTANT:

Never recalculate an old registration using the new price.

Store:

fee_at_registration

==================================================
14. COORDINATOR ROLE
==================================================

Create a separate:

COORDINATOR

dashboard.

Coordinator is mainly for monitoring.

Coordinator can view:

All registrations
Registration status
Team details
Team members
Payment status
Registration timestamps
Event statistics

Coordinator can search/filter:

Team Name
Registration ID
Team ID
Email
Phone
College
Status
Payment Status

Coordinator should NOT be able to:

- Change UPI ID
- Change pricing
- Create admin accounts
- Change roles
- Approve payments
- Modify payment verification
- Delete critical records
- Change event configuration

Coordinator is OBSERVE/MONITOR focused.

==================================================
15. REGISTRATION TRACKING
==================================================

Create a public registration status page.

User enters:

Registration ID

OR

Team ID

OR

Team Leader Email

Then display:

Team Name
Team ID
Registration ID
Team Size
Amount
Payment Status
Registration Status
Submitted Date
Verification Status

Example:

BLACK HAT#0

TEAM: CYBER PHANTOMS

STATUS

✓ Registration Submitted
✓ Payment Submitted
⏳ Payment Under Review
○ Team Registration Pending

Once approved:

✓ Registration Submitted
✓ Payment Verified
✓ Team Registered

==================================================
16. TEAM REGISTRATION SUCCESS PAGE
==================================================

After payment approval, show a premium success page.

Display:

ACCESS GRANTED

TEAM REGISTERED

BLACK HAT#0

Team Name
Team ID
Registration ID

Provide:

[ DOWNLOAD REGISTRATION RECEIPT ]

[ VIEW TEAM DETAILS ]

[ CHECK REGISTRATION STATUS ]

Create a downloadable PDF registration confirmation.

==================================================
17. EMAIL SYSTEM
==================================================

Prepare email notification architecture.

Send email when:

Registration submitted
Payment submitted
Payment approved
Payment rejected
Team registered
Registration cancelled

Emails should contain:

BLACK HAT#0 branding
Team information
Registration ID
Team ID
Status
Relevant instructions

Admin should be able to enable/disable email notifications.

==================================================
18. ADMIN USER MANAGEMENT
==================================================

Admin can create:

ADMIN
COORDINATOR
PAYMENT_VERIFIER

Admin can:

Create user
Disable user
Reset access
Change role
View last login
View account status

Never expose passwords.

Use Supabase authentication.

Use proper role-based authorization at database/server level.

Do NOT rely only on frontend role checks.

==================================================
19. SECURITY
==================================================

Security is extremely important because this is a cybersecurity hackathon.

Implement:

Supabase Auth
Row Level Security
Role-based access control
Protected routes
Server-side validation
Input validation
Rate limiting where appropriate
File upload restrictions
File size limits
Secure storage policies
Audit logs
Duplicate UTR detection
Duplicate registration protection
CSRF-safe architecture where applicable
No sensitive information in frontend source
No service-role keys in frontend
Environment variables for secrets

Never expose:

Supabase service role key
Private credentials
Admin secrets
Payment credentials

==================================================
20. AUDIT LOG SYSTEM
==================================================

Create audit_logs table.

Track:

User
Role
Action
Entity
Entity ID
Timestamp
IP if available
Metadata

Examples:

PAYMENT_APPROVED
PAYMENT_REJECTED
REGISTRATION_CREATED
REGISTRATION_UPDATED
USER_CREATED
ROLE_CHANGED
UPI_CHANGED
FEE_CHANGED

Admin should be able to view audit logs.

==================================================
21. DATABASE DESIGN
==================================================

Create a normalized Supabase PostgreSQL database.

Recommended tables:

profiles
roles
events
event_settings
teams
team_members
registrations
payments
payment_verifications
registration_status_history
audit_logs
sponsors
prizes
timeline_items
faqs
announcements
contact_messages

Important relationships:

profiles
↓
roles

teams
↓
team_members

teams
↓
registrations
↓
payments
↓
payment_verifications

registrations
↓
registration_status_history

Use UUID primary keys.

Use created_at and updated_at timestamps.

Use appropriate foreign keys.

Add indexes for:

registration_id
team_id
email
utr_number
status
payment_status

==================================================
22. DUPLICATE PAYMENT PROTECTION
==================================================

UTR numbers must be unique where appropriate.

If a user submits a UTR that already exists:

Display:

"This transaction reference has already been submitted."

Do not allow the same UTR to be associated with multiple active registrations.

Admin should be able to investigate duplicate attempts.

==================================================
23. ADMIN REGISTRATION TABLE
==================================================

Create an advanced registration table.

Columns:

Registration ID
Team ID
Team Name
Team Leader
Team Size
College
Amount
Payment Status
Registration Status
Submitted At
Verified By

Features:

Search
Sort
Filter
Pagination
Export CSV
View details

Filters:

All
Pending
Payment Review
Approved
Rejected
Registered

==================================================
24. PAYMENT VERIFICATION QUEUE
==================================================

Create a dedicated payment verification page.

Show cards:

PAYMENT REVIEW QUEUE

Pending: 14

Each card:

Team Name
Team ID
Amount
UTR
Submitted Time
Screenshot

Buttons:

[ REVIEW ]

Inside review:

Expected Amount
Submitted UTR
Payment Screenshot
Team Details

Then:

[ APPROVE PAYMENT ]

[ REJECT PAYMENT ]

Require confirmation before approval.

Example confirmation:

"Confirm that you have verified this transaction?"

[ CANCEL ]
[ CONFIRM APPROVAL ]

==================================================
25. DASHBOARD UI
==================================================

Dashboards should look like a cybersecurity SOC / hacker command center.

Use:

Dark background
Red accent
Glass panels
Terminal-inspired cards
Animated metrics
Live counters
Charts
Status indicators
Grid layouts
Subtle scanline animations

But keep usability professional.

Do not make dashboards unnecessarily flashy.

==================================================
26. EVENT TIMELINE
==================================================

Create an animated timeline.

Example:

REGISTRATION OPENS
↓
TEAM FORMATION
↓
REGISTRATION CLOSES
↓
HACKATHON BEGINS
↓
HACKING PHASE
↓
SUBMISSION
↓
JUDGING
↓
WINNERS ANNOUNCED

All timeline data must be editable from Admin.

==================================================
27. PRIZES SECTION
==================================================

Create visually impressive prize cards.

Example:

1ST PLACE
₹XX,XXX

2ND PLACE
₹XX,XXX

3RD PLACE
₹XX,XXX

Special Awards

All values configurable from admin.

Use animated glow effects.

==================================================
28. RULES SECTION
==================================================

Display:

Eligibility
Team Rules
Code of Conduct
Submission Rules
Allowed Technologies
Prohibited Activities
Judging Criteria
Disqualification Rules

Admin editable.

==================================================
29. SPONSORS
==================================================

Create sponsor section.

Admin can:

Add sponsor
Upload logo
Set sponsor tier
Set sponsor website
Reorder sponsors
Remove sponsor

Display:

TITLE SPONSOR
GOLD
SILVER
COMMUNITY PARTNER

==================================================
30. FAQ
==================================================

Animated accordion.

Questions should be editable from admin.

Examples:

Who can participate?
What is the team size?
What is the registration fee?
How does payment verification work?
Can I change team members?
What happens after registration?
Where will the hackathon happen?
What should we bring?

==================================================
31. CONTACT
==================================================

Display:

College
Event Organizers
Email
Phone
Venue
Social links

Create contact form.

Store submissions in:

contact_messages

Admin can view messages.

==================================================
32. RESPONSIVE DESIGN
==================================================

Must work perfectly on:

Desktop
Laptop
Tablet
Mobile

The registration flow must be especially optimized for mobile because users may make UPI payments using their phones.

QR code should be appropriately sized.

On mobile:

[ PAY USING UPI ]

should be prominent.

==================================================
33. ANIMATION SYSTEM
==================================================

Make the public website highly animated.

Use Framer Motion.

Animations:

Page entrance
Text reveal
Glitch text
Scroll reveal
Parallax
Floating particles
Circuit animation
Hover effects
Button glow
Card tilt
Number counters
Timeline animation
Loading animation
Modal transitions
Status transitions

Create a custom loading screen:

BLACK HAT#0

INITIALIZING SYSTEM...

[████████████████] 100%

ACCESS GRANTED

Then reveal the website.

Do not sacrifice performance.

Use lazy loading and optimized animations.

==================================================
34. CUSTOM CURSOR
==================================================

Desktop:

Create a subtle custom hacker-style cursor.

Use a red glow.

Cursor interaction with buttons/cards should create subtle effects.

Disable custom cursor on mobile.

==================================================
35. TERMINAL COMPONENT
==================================================

Create a small terminal-style visual component.

Example:

> booting_black_hat.sh

> initializing security protocols...

> loading challenge environment...

> registration system online

> access granted_

This is purely visual and should not execute actual shell commands.

==================================================
36. MICROINTERACTIONS
==================================================

Buttons should have:

hover glow
slight movement
border animation
click feedback

Cards:

subtle tilt
glow on hover
animated border

Inputs:

focus glow
validation indicators

==================================================
37. REGISTRATION UX
==================================================

Registration should be extremely simple.

Use progress indicator:

01 TEAM
02 MEMBERS
03 PAYMENT
04 REVIEW
05 COMPLETE

Allow users to go back.

Preserve form data.

Validate every step.

Show clear errors.

Never lose entered information accidentally.

==================================================
38. PAYMENT SCREEN UX
==================================================

Make this extremely clear.

Example:

YOUR REGISTRATION

TEAM CYBER PHANTOMS

3 MEMBERS

₹350 × 3

TOTAL

₹1050

PAY USING UPI

[ QR CODE ]

UPI ID
hackathon@upi

[ COPY UPI ID ]

After payment:

ENTER TRANSACTION DETAILS

UTR / TRANSACTION ID
[________________]

PAYMENT SCREENSHOT
[ Upload ]

[ SUBMIT PAYMENT ]

Then:

PAYMENT SUBMITTED

Your transaction is now under verification.

Registration ID:
BH0-2026-00421

==================================================
39. ERROR HANDLING
==================================================

Handle:

Payment submission failure
Duplicate UTR
Invalid UTR
Invalid registration
Expired registration
Disabled event
Registration closed
File upload failure
Network error
Unauthorized access
Session expiration

Use professional error messages.

==================================================
40. REGISTRATION DEADLINE
==================================================

When registration deadline passes:

Disable new registrations.

Display:

REGISTRATION CLOSED

If admin reopens registration, registration automatically becomes available again.

==================================================
41. EVENT CAPACITY
==================================================

Admin can configure:

Maximum teams
Maximum participants

When capacity is reached:

REGISTRATION FULL

Optionally enable:

WAITLIST

==================================================
42. WAITLIST
==================================================

If enabled:

Users can join waitlist.

Store:

Name
Email
Phone
Team Name
Team Size

Admin can promote waitlisted teams.

==================================================
43. ADMIN EVENT CONTROL
==================================================

Admin dashboard should contain:

EVENT CONTROL

Registration:
OPEN / CLOSED

Payment:
ENABLED / DISABLED

Event:
UPCOMING / LIVE / COMPLETED

Maintenance Mode:
ON / OFF

Waitlist:
ON / OFF

Maximum Teams

Maximum Participants

==================================================
44. LIVE EVENT MODE
==================================================

When event becomes LIVE:

Homepage should transform slightly.

Show:

🔴 LIVE

HACKATHON IN PROGRESS

Live countdown / timer

Event status.

Admin can activate LIVE mode.

==================================================
45. SEO
==================================================

Implement:

SEO title
Meta description
Open Graph metadata
Twitter metadata
Favicon
Structured metadata where appropriate

Suggested title:

BLACK HAT#0 | Hackathon for Hackers

Description:

BLACK HAT#0 is a cybersecurity-focused hackathon where hackers, developers and innovators come together to code, break, innovate and own the system.

==================================================
46. PERFORMANCE
==================================================

Despite the heavy visual design:

- Optimize images
- Lazy load assets
- Avoid unnecessary re-renders
- Use GPU-friendly animations
- Avoid huge video backgrounds
- Compress uploaded images
- Keep mobile performance good
- Maintain accessibility

Target excellent Lighthouse performance.

==================================================
47. ACCESSIBILITY
==================================================

Support:

Keyboard navigation
Proper labels
ARIA where needed
Readable contrast
Focus states
Screen reader-friendly forms

Animations should respect:

prefers-reduced-motion

==================================================
48. ADMIN DASHBOARD NAVIGATION
==================================================

Admin sidebar:

Dashboard
Registrations
Payment Verification
Teams
Payments
Users
Event Settings
Payment Settings
Timeline
Prizes
Sponsors
Rules
FAQ
Announcements
Messages
Audit Logs
System Settings

==================================================
49. COORDINATOR DASHBOARD NAVIGATION
==================================================

Dashboard
Registrations
Teams
Payment Status
Statistics
Announcements

Read-only where appropriate.

==================================================
50. PAYMENT VERIFIER DASHBOARD
==================================================

Dashboard
Payment Review
Verified Payments
Rejected Payments
Search

Keep this dashboard extremely simple.

The payment verifier should immediately see:

PENDING PAYMENT REVIEWS

and be able to verify them quickly.

==================================================
51. SECURITY ROLE MATRIX
==================================================

ADMIN:

FULL ACCESS

COORDINATOR:

READ/MONITOR ACCESS

PAYMENT_VERIFIER:

PAYMENT REVIEW ONLY

PUBLIC USER:

Registration + status tracking only

Enforce this using Supabase Row Level Security.

Do NOT rely solely on frontend hiding.

==================================================
52. FINAL VISUAL EXPERIENCE
==================================================

The final website should feel like:

A cybersecurity command center
+
A premium hackathon landing page
+
A futuristic hacker terminal
+
A professional registration platform

Reference aesthetic:

BLACK
RED
WHITE
CYBER
GLITCH
TERMINAL
CIRCUITS
HACKER
PREMIUM
CINEMATIC

Avoid:

Generic Bootstrap appearance
Generic SaaS dashboard
Purple AI gradients
Excessive rounded cards
Childish gaming aesthetic
Overly bright colors

==================================================
53. IMPORTANT IMPLEMENTATION RULE
==================================================

Build the application as a REAL working application.

Do NOT create fake buttons.

Do NOT use fake registration data as the actual system.

Do NOT hardcode payment information.

Do NOT fake payment verification.

Use Supabase database/auth/storage.

Create proper database schema and RLS policies.

All three roles must actually have different permissions.

The registration → payment → UTR submission → verification → approval → registered workflow must actually work.

==================================================
54. DEMO DATA
==================================================

Create realistic seed/demo data only where useful.

Clearly distinguish demo data from real data.

Do not expose demo credentials publicly.

==================================================
55. FINAL QUALITY
==================================================

Before considering the project complete, verify:

✓ Registration works
✓ Team size changes price
✓ Price is server validated
✓ UPI QR dynamically changes
✓ UPI ID comes from admin settings
✓ UTR submission works
✓ Duplicate UTR is prevented
✓ Payment verifier can approve/reject
✓ Coordinator cannot approve payments
✓ Coordinator cannot change payment settings
✓ Admin has full control
✓ Registration status updates correctly
✓ Audit logs are created
✓ RLS protects data
✓ Mobile registration works
✓ QR payment flow works on mobile
✓ Registration receipt works
✓ Event countdown works
✓ Registration deadline works
✓ Admin settings work
✓ Public status tracking works
✓ Animations work smoothly
✓ Website is responsive
✓ No secrets are exposed in frontend

zero Build this as a polished production-ready hackathon platform rather than a simple landing page.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2b0198e2-287b-4a22-a7d0-2fb04b43c107).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
