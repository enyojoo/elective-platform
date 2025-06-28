import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Create a response object and a Supabase client that can read and write cookies.
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get hostname and path for routing logic
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname

  // Environment and domain setup
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"

  // Subdomain extraction
  let subdomain = null
  if (isDevelopment) {
    const url = new URL(req.url)
    subdomain = url.searchParams.get("subdomain")
  } else {
    const isSubdomainHost =
      hostname.includes(".electivepro.net") &&
      !hostname.startsWith("www.") &&
      !hostname.startsWith("app.") &&
      !hostname.startsWith("api.")
    if (isSubdomainHost) {
      subdomain = hostname.split(".")[0]
    }
  }
  const isMainDomain = !subdomain

  // Define route types
  const isStudentRoute = path.startsWith("/student/")
  const isManagerRoute = path.startsWith("/manager/")
  const isAdminRoute = path.startsWith("/admin/")
  const isSuperAdminRoute = path.startsWith("/super-admin/")
  const isProtectedRoute = isStudentRoute || isManagerRoute || isAdminRoute || isSuperAdminRoute

  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]
  const isPublicPath = publicPaths.some((p) => path.includes(p))

  // --- START: AUTHENTICATION & ROUTING LOGIC ---

  // RULE 1: Redirect unauthenticated users from protected routes to the correct login page.
  if (!session && isProtectedRoute && !isPublicPath) {
    let loginUrl = "/"
    if (isStudentRoute) loginUrl = "/student/login"
    if (isManagerRoute) loginUrl = "/manager/login"
    if (isAdminRoute) loginUrl = "/admin/login"
    if (isSuperAdminRoute) loginUrl = "/super-admin/login"
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  // RULE 2: Redirect authenticated users from public auth pages to their dashboard.
  if (session && isProtectedRoute && isPublicPath) {
    let dashboardUrl = "/"
    if (isStudentRoute) dashboardUrl = "/student/dashboard"
    if (isManagerRoute) dashboardUrl = "/manager/dashboard"
    if (isAdminRoute) dashboardUrl = "/admin/dashboard"
    if (isSuperAdminRoute) dashboardUrl = "/super-admin/dashboard"
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // RULE 3: Student and Manager routes are for subdomains only.
  if ((isStudentRoute || isManagerRoute) && isMainDomain) {
    const redirectUrl = new URL(req.url)
    redirectUrl.host = mainDomain
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  // RULE 4: Admin and Super-admin routes are for the main domain only.
  if ((isAdminRoute || isSuperAdminRoute) && subdomain) {
    const redirectUrl = new URL(req.url)
    redirectUrl.host = mainDomain
    redirectUrl.pathname = path
    return NextResponse.redirect(redirectUrl)
  }

  // RULE 5: Handle root path redirects based on session and domain.
  if (path === "/") {
    if (isMainDomain) {
      const destination = session ? "/admin/dashboard" : "/admin/login"
      return NextResponse.redirect(new URL(destination, req.url))
    } else {
      // On a subdomain
      const destination = session ? "/student/dashboard" : "/student/login"
      return NextResponse.redirect(new URL(destination, req.url))
    }
  }

  // --- END: AUTHENTICATION & ROUTING LOGIC ---

  // If no redirects were triggered, pass the request through.
  // The `res` object has been modified by the Supabase client to refresh the session cookie if needed.
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
