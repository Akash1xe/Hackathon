import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check if user is logged in and is an admin
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check if user is logged in
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};