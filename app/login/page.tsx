'use client';

/**
 * app/login/page.tsx
 *
 * Authentication entry point — Email OTP flow, Step 1.
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/auth/AuthLayout';
import EmailStep from '@/components/auth/EmailStep';
import AuthToast, { useToast } from '@/components/auth/AuthToast';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const { toast, showToast, dismissToast } = useToast();
  const [sent, setSent] = useState(false);

  function handleEmailSuccess(email: string) {
    setSent(true);
    router.push(`/verify-otp?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
  }

  return (
    <>
      <AuthToast toast={toast} onDismiss={dismissToast} />

      <AuthLayout
        heading="Sign in to KridaVana"
        subheading="Enter your email and we'll send you a 6-digit code. No password needed."
        step={1}
      >
        <EmailStep
          onSuccess={handleEmailSuccess}
          onToast={showToast}
        />

        {sent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center font-mono text-xs text-muted"
          >
            Redirecting…
          </motion.p>
        )}
      </AuthLayout>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
