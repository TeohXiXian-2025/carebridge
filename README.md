# CareBridge

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
| Push notifications | Firebase Cloud Messaging, sent by the Vercel function `api/notify.ts` |
| Photos | Shrunk in the browser and stored in Firestore (Cloud Storage needs the paid Blaze plan) |
| Emails (optional) | EmailJS free tier, sent from the browser |

## Run it locally

```bash
npm install
npm run dev        # demo mode: sample data in your browser, no Firebase needed
```

Demo accounts (password `demo1234`): `donor@demo.test`, `admin@demo.test` (Sri Damai Elderly Home), `platform@demo.test`.
To use the real Firebase project locally, copy `.env.production` to `.env.local`.

## One-time Firebase setup

1. **Authentication** → Sign-in method → enable **Email/Password**.
2. **Firestore** → create the database (production mode, `asia-southeast1`).
3. **Firestore → Rules**: paste the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
4. **Make the first platform admin**: sign up in the app, then in Firestore → `users` → your document, change `role` to `platformAdmin`.
5. **Push notifications** (optional): Project settings → Service accounts → **Generate new private key**. In Vercel → Project → Settings → Environment Variables, add `FIREBASE_SERVICE_ACCOUNT` and paste the whole JSON file as the value. Never commit this file.

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
