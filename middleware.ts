import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "lms_token";
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return new Uint8Array();
  return new TextEncoder().encode(secret);
}

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "CR" | "FACULTY" | "ADMIN";
  status?: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/subjects") ||
    pathname.startsWith("/assignments") ||
    pathname.startsWith("/cr") ||
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile");

  // console.log("here is the user", user);

  // 1. If user is logged in and trying to access /login or /register, redirect to their role home
  if (user && user.status && user.status !== "ACTIVE") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("status", user.status);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    let dest = "/dashboard";
    if (user.role === "ADMIN") dest = "/admin";
    else if (user.role === "FACULTY") dest = "/faculty/assignments";
    else if (user.role === "CR") dest = "/cr/announcements";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // 2. If user is NOT logged in and trying to access protected route, redirect to /login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-Based Access Control for authenticated users
  if (user) {
    // /admin requires ADMIN role
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // /faculty requires FACULTY or ADMIN role
    if (
      pathname.startsWith("/faculty") &&
      user.role !== "FACULTY" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // /cr requires CR or ADMIN role
    if (
      pathname.startsWith("/cr") &&
      user.role !== "CR" &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resources/:path*",
    "/subjects/:path*",
    "/assignments/:path*",
    "/cr/:path*",
    "/faculty/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};

