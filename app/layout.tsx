import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast';
import Nav from '@/components/nav';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600'],
  display: 'swap'
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Kridavana — your play diary',
  description: 'Log, rate, and review every game you play.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink text-cream font-body antialiased selection:bg-amber selection:text-ink">
        <TooltipProvider delayDuration={0}>
          <ToastProvider>
            <Nav />
            <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
              {children}
            </main>
          </ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
