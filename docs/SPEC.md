# CareBridge – Shared Build Spec

One spec for both builds: the **Bubble.io** prototype and the **coded** version (React + Firebase).
Both must follow this file and the Figma wireframes. If one changes, update this file first.

Figma: https://www.figma.com/design/jHmYLe3TR7fmlCwH4OWXkK

---

## 1. Roles

| Role | Who | Can do |
|---|---|---|
| Donor | Public users (default on sign-up) | Browse approved homes, pledge items, track and cancel own pledges |
| Home Admin | Staff of one welfare home | Manage own home's wishlist and pledges, edit own home profile |
| Platform Admin | CareBridge team | Approve or reject homes, see platform overview |

**Sign-in:** "Continue with Google" (main) or email + password. Donors and welfare homes sign up themselves; at sign-up they choose **A donor** or **A welfare home**.
A welfare home's account fills in the home form right after sign-up, and the home is linked to that Google account / email (one home per account).
**Managers.** A home can have several managers (Home profile → Home managers: add by Gmail/email, remove, or hand over = add the new person, then Leave). Platform admins manage the admin list on Platform → Admins, and any home's managers on Platform → Homes. Invited emails join on their first sign-in with that (verified) email; at least one manager/admin must remain.
**Platform admins don't sign up.** Listed emails (now: xixianteoh@gmail.com) become Platform Admin automatically on their first Google sign-in. Bubble: set the role in the data editor.

## 2. Option sets (fixed values)

| Option set | Values |
|---|---|
| Role | donor, homeAdmin, platformAdmin |
| HomeType | Children, Elderly |
| Area | Cheras, Petaling Jaya, Klang, Shah Alam, Kajang, Subang Jaya, Kuala Lumpur, Other |
| Category | Packaged food (FOOD), Hygiene (HYG), Medical supplies (MED), Clothing (CLO), Education (EDU) |
| Priority | High, Medium, Low |
| ItemStatus | Open, Partially pledged, Fully pledged, Fulfilled, Paused |
| PledgeStatus | Pending, Accepted, Declined, Received, Cancelled |
| HomeStatus | Pending, Approved, Rejected |

## 3. Data types

**User**: email, fullName, phone, role (Role), homeId (→ Home, home managers only), emailNotifications (yes/no)

**Invite**: email (= id), role (platformAdmin / homeAdmin), homeId, homeName, invitedBy, createdAt

**Home**: name, type (HomeType), area (Area), about, address, dropoffHours, photo, status (HomeStatus), adminId (→ User), createdAt, reviewedAt

**WishlistItem**: homeId (→ Home), homeName, homeApproved (yes/no), name, category, image, priority, neededBy (date, optional), qtyNeeded, qtyPledged, qtyReceived, status (ItemStatus), createdAt

**Pledge**: pledgeNo, donorId (→ User), itemId (→ WishlistItem), itemName, homeId (→ Home), homeName, quantity, qtyReceived, dropoffDate, contactName, contactPhone, status (PledgeStatus), createdAt, receivedAt

Items and pledges copy the names they display (homeName, itemName). Pages never need to look up a linked record just to show a name, which keeps privacy rules simple.

## 4. Status rules

**Item status** (recalculate after every pledge change; skip if the item is Paused):

1. qtyReceived ≥ qtyNeeded → **Fulfilled**
2. qtyPledged ≥ qtyNeeded → **Fully pledged**
3. qtyPledged > 0 → **Partially pledged**
4. otherwise → **Open**

Where qtyPledged counts quantities from pledges that are Pending, Accepted or Received.

**Pledge button**: enabled only when status is Open or Partially pledged. Otherwise grey ("Pledged" / "Fulfilled" / "Paused").

**Still needed** = qtyNeeded − qtyPledged. The pledge quantity must be 1 … still needed.

**Urgent**: an item is urgent when priority = High and status is Open or Partially pledged. A home shows the red "Urgent need" tag when it has at least one urgent item.

**Home fulfilment** ("12 of 20 needs fulfilled") = number of items with status Fulfilled / number of items not Paused.

**Pledge number**: `CB-` + YYMMDD + `-` + 4 random uppercase letters/digits, e.g. `CB-261208-4F2A`.

## 5. Workflows

| # | Trigger | Steps |
|---|---|---|
| W1 | Donor confirms pledge | Check 1 ≤ quantity ≤ still needed → create Pledge (Pending) → item.qtyPledged += quantity → recalc item status → email donor ("Pledge sent") and home admin ("New pledge") |
| W2 | Home admin accepts | Pledge → Accepted → email donor ("Pledge accepted, see drop-off details") |
| W3 | Home admin declines | Pledge → Declined → item.qtyPledged −= quantity → recalc → email donor |
| W4 | Donor cancels (Pending or Accepted only) | Pledge → Cancelled → item.qtyPledged −= quantity → recalc |
| W5 | Home admin marks received (Accepted only) | Admin enters qty actually delivered (default = pledged) → pledge.qtyReceived = that, receivedAt = now, status Received → item.qtyReceived += delivered; item.qtyPledged += (delivered − pledged) → recalc → email donor ("Thank you") |
| W6 | Home admin adds a need | Create WishlistItem (qtyPledged 0, qtyReceived 0, status Open, homeApproved = home is Approved) |
| W7 | Home admin pauses / resumes | Paused → status Paused; Resume → recalc |
| W8 | User registers a home | Create Home (Pending, adminId = user) → user.role = homeAdmin, user.homeId = home |
| W9 | Platform admin approves | Home → Approved, reviewedAt = now → set homeApproved = yes on all its items |
| W10 | Platform admin rejects | Home → Rejected, reviewedAt = now |

## 6. Privacy rules

| Data | Who can see / change |
|---|---|
| Home | Everyone sees Approved homes. Its own admin and Platform Admins always. Only Platform Admins change status. |
| WishlistItem | Everyone sees items where homeApproved = yes. Its home admin and Platform Admins always. Only its home admin edits (donor pledge workflows may change qtyPledged and status only). |
| Pledge | Its donor, its home's managers, Platform Admins. |
| Invite | Platform Admins; the home's managers (for that home); the invited email. |
| User | Own record, and Platform Admins. Phone/email never shown publicly. |
| Admin pages | Redirect anyone whose role is wrong. |

## 7. Screens and routes

| Screen | Route (code) | Bubble page | Who |
|---|---|---|---|
| D1 Home | `/` | index | All |
| D2 Directory | `/homes` | directory | All |
| D3 Home profile (+ D4 pledge pop-up) | `/homes/:id` | home (type Home) | All (pledge needs login) |
| D5 Pledge confirmed | `/pledges/:id/confirmed` | pledge-confirmed | Donor |
| D6 My pledges | `/my-pledges` | my-pledges | Donor |
| D7 Log in / Sign up | `/login` | login | All |
| Register a home | `/register-home` | register-home | Logged in |
| A1 Dashboard | `/admin` | admin (tab) | Home Admin |
| A2 Wishlist (+ Add need) | `/admin/wishlist` | admin (tab) | Home Admin |
| A3 Pledges (+ A4 Mark received) | `/admin/pledges` | admin (tab) | Home Admin |
| Home profile settings | `/admin/profile` | admin (tab) | Home Admin |
| P1 Approvals | `/platform` | platform (tab) | Platform Admin |
| P2 Overview | `/platform/overview` | platform (tab) | Platform Admin |

Breakpoint: below 900 px use the mobile layouts (bottom tab bar), from 900 px the desktop layouts (top nav / sidebar).

## 8. Look and feel (match Figma)

| Token | Value |
|---|---|
| Teal (primary) | #0E7C6B |
| Teal dark | #0A5E52 |
| Teal light | #E3F2EF |
| Ink (text) | #1F2A2E |
| Muted text | #6B7780 |
| Lines | #E4E8EA |
| Page background | #F7F8F6 |
| Green (fulfilled) | #2E9E5B on #E2F4E8 |
| Yellow (partially / pending) | #C98A0B on #FDF3D7 |
| Red (urgent / high) | #D64545 on #FBE4E4 |
| Orange (logo accent) | #E8833A |
| Font | Inter (400, 500, 600, 700, 800) |
| Radius | cards 16–18, buttons 10–14, tags 11 (pill) |

## 9. Emails

| Event | To | Subject |
|---|---|---|
| W1 | Donor | Your CareBridge pledge {pledgeNo} |
| W1 | Home admin | New pledge: {itemName} × {quantity} |
| W2 | Donor | Pledge accepted – drop-off details |
| W3 | Donor | Pledge declined |
| W5 | Donor | Thank you – your donation was received |

Every event is sent two ways: an **app notification** (push, on devices where the user turned it on) and an **email** (unless the user switched emails off in My account).
Bubble: built-in "Send email" (push needs a paid plugin, so Bubble sends email only). Code: the Vercel function `api/notify.ts` sends both (Firebase Cloud Messaging + SMTP mailbox), because Firebase Spark has no server functions.

| Event | App notification to |
|---|---|
| W1 new pledge | Home admin ("New pledge") and donor ("Pledge sent") |
| W2 / W3 / W5 | Donor |
| W4 donor cancels | Home admin |
| W8 home registered | Platform admins |
| W9 / W10 reviewed | Home admin |
