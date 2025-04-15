import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
    const isCheckoutPage = req.nextUrl.pathname.startsWith('/checkout');
    const isGuestCheckout = req.nextUrl.pathname === '/checkout/guest';
    const isCartPage = req.nextUrl.pathname === '/cart';

    // Allow access to cart and guest checkout pages without authentication
    if (isCartPage || isGuestCheckout) {
      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect admin routes - only allow access if user is authenticated and has admin role
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/signin', req.url));
      }
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    }

    // Protect checkout routes (except guest checkout)
    if (isCheckoutPage && !isAuth && !isGuestCheckout) {
      return NextResponse.redirect(new URL('/signin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow access to cart and guest checkout pages without authentication
        if (path === '/cart' || path === '/checkout/guest') {
          return true;
        }
        
        // For admin routes, require admin role
        if (path.startsWith('/admin')) {
          return token?.role === 'ADMIN';
        }
        
        // For other protected routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
    '/checkout/:path*',
    '/cart',
    '/account/:path*',
  ],
}; 