import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes - accessible to everyone
  const publicRoutes = ["/"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Auth routes - redirect to dashboard if already logged in
  if (isLoggedIn && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protected routes - redirect to home if not logged in
  const protectedRoutes = ["/dashboard", "/onboard"];
  if (
    !isLoggedIn &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

// See "Matching Paths" below
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
