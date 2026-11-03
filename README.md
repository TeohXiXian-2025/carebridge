# CareBridge

| | Link |
|---|---|
| 🌐 **Live app** | https://carebridge-topaz-eta.vercel.app |
| 🎨 **Figma design** (mobile + desktop) | https://www.figma.com/design/jHmYLe3TR7fmlCwH4OWXkK |
| 🧩 **Bubble.io version** | _coming soon_ |
| 📘 **User manual** (PDF) | [docs/CareBridge-User-Manual.pdf](docs/CareBridge-User-Manual.pdf) |
| 🛠️ **Developer manual** (PDF) | [docs/CareBridge-Developer-Manual.pdf](docs/CareBridge-Developer-Manual.pdf) |
| ✅ **Test checklist** (PDF) | [docs/CareBridge-Test-Checklist.pdf](docs/CareBridge-Test-Checklist.pdf) |

**Give what is needed, not what is guessed.** A needs-based wishlist and direct pledging web app for welfare homes in the Klang Valley. WIX2002 Project Management, Universiti Malaya.

- Donors browse approved homes, see what each one still needs, pledge items and drop them off.
- Home admins post their wishlist, accept pledges and mark items received; the counts update by themselves.
- Platform admins approve new homes before donors can see them.

The app is installable on phones (PWA) and sends push notifications. The same screens and workflows are built in Bubble.io for the course prototype. Both follow [`docs/SPEC.md`](docs/SPEC.md) and the [Figma wireframes](https://www.figma.com/design/jHmYLe3TR7fmlCwH4OWXkK).

## Stack (all free tiers)

| Part | Service |
|---|---|
| Web app | React + TypeScript + Vite, hosted on **Vercel** (Hobby) |
| Login, database | **Firebase** Spark plan: Authentication (email/password) + Firestore |
| App + email notifications | Vercel function `api/notify.ts`: Firebase Cloud Messaging (push) and SMTP email |
| Photos | Shrunk in the browser and stored in Firestore (Cloud Storage needs the paid Blaze plan) |
| Emails | Sent by the same Vercel function through a Gmail mailbox (App Password) |

## Run it locally

```bash
npm install
npm run dev        # demo mode: sample data in your browser, no Firebase needed
```

Demo accounts (password `demo1234`): `donor@demo.test`, `admin@demo.test` (Sri Damai Elderly Home), `platform@demo.test`.
To use the real Firebase project locally, copy `.env.production` to `.env.local`. Google sign-in only works on the live site or with Firebase configured.

## One-time Firebase setup

1. **Authentication** → Sign-in method → enable **Google** and **Email/Password**. Then Settings → Authorized domains → add your Vercel domain (e.g. `carebridge-topaz-eta.vercel.app`).
2. **Firestore** → create the database (production mode, `asia-southeast1`).
3. **Firestore → Rules**: paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
4. **Platform admin**: sign in with Google as an email listed in `src/lib/admins.ts` and `firestore.rules` (now xixianteoh@gmail.com). It becomes platform admin automatically.
5. **Notifications** – Vercel → Project → Settings → Environment Variables, then redeploy:
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase → Project settings → Service accounts → Generate new private key → paste the whole JSON. Never commit this file.
   - `SMTP_USER` / `SMTP_PASS`: the Gmail address that sends emails and its 16-letter App Password (Google Account → Security → 2-Step Verification on → App passwords).

## Deploy

Every push to `main` deploys on Vercel automatically once the GitHub repo is imported in Vercel.

## Project structure

```
src/lib/        data layer (Firebase + demo), workflows, push and email helpers
src/pages/      donor, home-admin and platform-admin screens
src/components/ shared UI (cards, tags, layouts, forms)
api/notify.ts   Vercel serverless function that sends push notifications
firestore.rules security rules (= the "privacy rules" in the spec)
docs/SPEC.md    shared spec for the Bubble and coded builds
```
