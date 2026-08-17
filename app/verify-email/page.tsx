/**
 * app/verify-email/page.tsx
 *
 * Legacy route — kept so any bookmarked or linked URLs still work.
 * Redirects to the new /verify-otp page, preserving the `email` query param.
 */

import { redirect } from 'next/navigation';

interface Props {
  searchParams: { email?: string };
}

export default function VerifyEmailPage({ searchParams }: Props) {
  const email = searchParams.email ?? '';
  if (email) {
    redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  }
  redirect('/login');
}
