/**
 * lib/auth/auth.ts
 *
 * All Supabase authentication logic lives here.
 * UI components import these functions — they never call Supabase directly.
 *
 * Auth strategy: Email OTP only.
 *   - signInWithOtp()  →  Supabase sends a 6-digit code to the user's email.
 *   - verifyOtp()      →  Validates the code; establishes a session.
 *   - New users are created automatically (shouldCreateUser: true).
 *   - No passwords, no magic links, no OAuth.
 */

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface VerifyResult extends AuthResult {
  /** true when a brand-new account was just created */
  isNewUser?: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email address is required.';
  if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}

// ─── Error normaliser ─────────────────────────────────────────────────────────

function normaliseError(err: { message?: string; status?: number }): string {
  const msg = (err.message ?? '').toLowerCase();

  if (msg.includes('expired'))
    return 'This code has expired. Please request a new one.';

  if (
    msg.includes('invalid') ||
    msg.includes('incorrect') ||
    msg.includes('not match') ||
    msg.includes('token')
  )
    return 'That code is incorrect. Double-check and try again.';

  if (msg.includes('too many') || msg.includes('rate') || err.status === 429)
    return 'Too many requests — please wait a moment before trying again.';

  if (msg.includes('already') || msg.includes('verified'))
    return 'This email is already verified. You can sign in normally.';

  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error — check your connection and try again.';

  return err.message || 'Something went wrong. Please try again.';
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

/**
 * Step 1 — Send a 6-digit OTP to the given email.
 * Creates the user account if one does not already exist.
 */
export async function sendOtp(email: string): Promise<AuthResult> {
  const validationError = validateEmail(email);
  if (validationError) return { success: false, error: validationError };

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      // Automatically create an account for first-time users
      shouldCreateUser: true,
    },
  });

  if (error) return { success: false, error: normaliseError(error) };
  return { success: true };
}

/**
 * Step 2 — Verify the 6-digit OTP the user received.
 * Uses type:'email' which is correct for the signInWithOtp() flow.
 * After success a Supabase session is established automatically.
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<VerifyResult> {
  const validationError = validateEmail(email);
  if (validationError) return { success: false, error: validationError };

  if (token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { success: false, error: 'Please enter the complete 6-digit code.' };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token,
    type: 'email', // ← correct type for signInWithOtp() flow
  });

  if (error) return { success: false, error: normaliseError(error) };

  // Detect new-user creation: Supabase sets created_at ≈ now
  const user = data.user;
  const isNewUser =
    !!user &&
    !!user.created_at &&
    Date.now() - new Date(user.created_at).getTime() < 10_000; // within 10 s

  return { success: true, isNewUser };
}

/**
 * Resend the OTP — simply re-calls signInWithOtp() with the same email.
 * Rate limiting is enforced by Supabase on the server side.
 */
export async function resendOtp(email: string): Promise<AuthResult> {
  const validationError = validateEmail(email);
  if (validationError) return { success: false, error: validationError };

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true },
  });

  if (error) return { success: false, error: normaliseError(error) };
  return { success: true };
}
