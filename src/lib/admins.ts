/**
 * Platform admins don't sign up: these emails become platform admins automatically the first
 * time they sign in with Google (Google confirms the email belongs to them).
 * Keep this list the same as PLATFORM_ADMINS in firestore.rules.
 */
export const PLATFORM_ADMIN_EMAILS = ['xixianteoh@gmail.com'];
export const isPlatformAdminEmail = (email: string) => PLATFORM_ADMIN_EMAILS.includes(email.trim().toLowerCase());
