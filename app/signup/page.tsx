/**
 * app/signup/page.tsx
 *
 * Signup no longer exists as a separate page.
 * New accounts are created automatically when a user signs in via OTP
 * for the first time (shouldCreateUser: true in signInWithOtp).
 *
 * This page simply redirects to /login.
 */

import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/login');
}
