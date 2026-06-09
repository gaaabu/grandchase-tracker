import { NextResponse } from 'next/server';

export default async function proxy(request) {
  const session = request.cookies.get('session_token');

  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/summary', '/edit', '/history'];

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If going to login/register and already logged in, redirect to summary
  if ((pathname === '/' || pathname === '/register') && session) {
    return NextResponse.redirect(new URL('/summary', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
