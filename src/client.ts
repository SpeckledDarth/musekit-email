import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable');
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

export interface SendEmailOptions {
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  id: string;
  success: boolean;
  error?: string;
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: SendEmailOptions
): Promise<SendEmailResult> {
  const resend = getResendClient();

  try {
    const { data, error } = await resend.emails.send({
      from: options?.from || 'MuseKit <noreply@musekit.app>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: options?.replyTo,
      cc: options?.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options?.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      tags: options?.tags,
    });

    if (error) {
      return { id: '', success: false, error: error.message };
    }

    return { id: data?.id || '', success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error sending email';
    return { id: '', success: false, error: message };
  }
}

export interface BatchEmail {
  to: string | string[];
  subject: string;
  html: string;
  options?: SendEmailOptions;
}

export interface BatchEmailResult {
  results: SendEmailResult[];
  totalSent: number;
  totalFailed: number;
}

export async function sendBatchEmails(emails: BatchEmail[]): Promise<BatchEmailResult> {
  const results: SendEmailResult[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  const resend = getResendClient();

  try {
    const payload = emails.map((email) => ({
      from: email.options?.from || 'MuseKit <noreply@musekit.app>',
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      replyTo: email.options?.replyTo,
      tags: email.options?.tags,
    }));

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      return {
        results: [{ id: '', success: false, error: error.message }],
        totalSent: 0,
        totalFailed: emails.length,
      };
    }

    if (data?.data) {
      for (const item of data.data) {
        results.push({ id: item.id, success: true });
        totalSent++;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown batch error';
    results.push({ id: '', success: false, error: message });
    totalFailed = emails.length;
  }

  return { results, totalSent, totalFailed };
}
