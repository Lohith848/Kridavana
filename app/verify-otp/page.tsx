'use client';

/**
 * app/verify-otp/page.tsx
 *
 * Authentication Step 2 — OTP verification.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import OtpStep from '@/components/auth/OtpStep';
import AuthToast, { useToast } from '@/components/auth/AuthToast';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') ?? '';
  const next = searchParams.get('next') ?? '/';

  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  function handleBack() {
    router.push('/login');
  }

  function handleSuccess(_isNewUser: boolean) {
    setTimeout(() => {
      router.push(next);
      router.refresh();
    }, 1200);
  }

  if (!email) return null;

  return (
    <>
      <AuthToast toast={toast} onDismiss={dismissToast} />

      <AuthLayout
        heading="Check your inbox"
        subheading={`We sent a 6-digit code to ${email}. Enter it below to sign in.`}
        step={2}
      >
        <OtpStep
          email={email}
          onSuccess={handleSuccess}
          onToast={showToast}
          onBack={handleBack}
        />
      </AuthLayout>
    </>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  );
}
