/**
 * Notification emails (Spec §9). Firebase Spark has no server functions, so emails go
 * straight from the browser through EmailJS (free tier). Create ONE EmailJS template with
 * the variables {{to_email}}, {{subject}} and {{message}}, then set the three VITE_EMAILJS_*
 * values. Without them, emails are skipped and logged to the console instead.
 */
const SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export async function sendEmail(to: string | undefined | null, subject: string, message: string) {
  if (!to) return;
  if (!SERVICE || !TEMPLATE || !KEY) {
    console.info(`[email skipped – EmailJS not configured] to=${to} | ${subject}\n${message}`);
    return;
  }
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: SERVICE, template_id: TEMPLATE, user_id: KEY, template_params: { to_email: to, subject, message } }),
    });
  } catch (e) {
    console.warn('Email failed (pledge still saved):', e);
  }
}
