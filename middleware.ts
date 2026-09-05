import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Auth pages — logged-in users should be redirected away from these to home. */
const AUTH_PAGES = ['/login', '/verify-otp', '/verify-email'];

/** Routes that strictly require a logged-in session. */
const PROTECTED_ROUTES = ['/lists/new'];

// Keep middleware extremely fast. Tune timeout as needed (e.g. 500-1500ms).
const GETUSER_TIMEOUT_MS = 800;

function promiseWithTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timed out')), ms);
  });
  return Promise.race([p, timeoutPromise]) as Promise<T>;
}

export async function middleware(request: NextRequest) {
  // Create a response early so cookie setters can update it without re-creating heavy objects later.
  let response = NextResponse.next({ request: { headers: request.headers } });

  // Quick path: skip middleware for Next internals and static files — very fast and avoids extra work.
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));

  // Fast check: if there are no cookies at all and the route is protected, redirect to login without calling Supabase.
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Attempt to get the user but bound the call with a short timeout to avoid middleware invocation timeouts.
  let user = null as any;
  try {
    const getUserPromise = supabase.auth.getUser();
    const result = await promiseWithTimeout(getUserPromise, GETUSER_TIMEOUT_MS).catch((err) => {
      // If the Supabase call times out or fails, we log and treat the user as unauthenticated.
      console.warn('supabase.auth.getUser timed out or failed in middleware', err);
      return null;
    });

    if (result && typeof result === 'object' && 'data' in result) {
      user = (result as any).data?.user ?? null;
    }
  } catch (err) {
    // Ensure middleware never throws — fail-safe to allow the request to continue where appropriate.
    console.error('unexpected error while checking user in middleware', err);
    user = null;
  }

  // Unauthenticated user attempting to access a strictly protected route
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting an auth page → redirect to home
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.delete('next');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
