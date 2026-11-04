# Bubble build scripts

Helpers used to build the Bubble.io version of CareBridge from the same spec (`docs/SPEC.md`).
Live (test version): https://xixianteoh.bubbleapps.io/version-test

Each `p_*.js` file describes Bubble elements + workflows as Bubble editor clipboard data, which is pasted into the editor.

| File | Bubble page / element |
|---|---|
| `dsl.js` | builders for elements, expressions, workflows, and clipboard I/O |
| `common.js` | shared pieces: donor page shell, tags, progress bar, status recalculation, notifications |
| `p_homes.js` | `homes` (directory) |
| `p_home.js` | `home` (home profile + pledge sheet, W1) |
| `p_donor.js` | `pledge-confirmed`, `my-pledges`, `register-home`, `profile` |
| `p_login.js` | `login` (log in / sign up, invite acceptance, routing by role) |
| `p_admin.js` | `admin` (dashboard, wishlist, pledges, home profile + managers; W2–W7, W11) |
| `p_platform.js` | `platform` (approvals, homes, overview, admins; W9, W10) — needs `p_admin.js` |
| `p_bell.js` | notification bell + list (Header reusable, admin and platform pages) |
| `p_seed.js` | `seed` (temporary sample data) |

How a page is pasted (in the Bubble editor tab, browser console):
1. Design tab of the page: load the files, `CB.putElements(...)`, select the target and press Ctrl+V.
   Big pages: paste the shell first, then each tab group into its content group.
2. Select all + Ctrl+C so `CB.idMap()` knows the real element ids.
3. Workflow tab: select any workflow, then for each workflow `CB.putWorkflow(...)` + Ctrl+V.
   On a page without workflows, create one empty workflow first, paste, then delete it.
