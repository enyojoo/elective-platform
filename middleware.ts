import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Get session and hostname/path
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname

  // Environment and domain setup
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"

  // Subdomain extraction
  let subdomain: string | null = null
  if (isDevelopment) {
    subdomain = req.nextUrl.searchParams.get("subdomain")
  } else {
    const parts = hostname.split(".")
    if (parts.length > 2 && parts[0] !== "app" && parts[0] !== "www") {
      subdomain = parts[0]
    }
  }
  const isMainDomain = !subdomain

  // --- START: Institution Data Injection ---
  if (subdomain) {
    const { data: institution, error } = await supabase
      .from("institutions")
      .select("id, name, favicon_url, primary_color")
      .eq("subdomain", subdomain)
      .single()

    if (error || !institution) {
      // Invalid subdomain, redirect to main domain's institution required page
      const url = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`)
      url.pathname = "/institution-required"
      return NextResponse.redirect(url)
    }

    // Inject institution data into request headers for the app to use
    res.headers.set("x-electivepro-subdomain", subdomain)
    res.headers.set("x-institution-id", institution.id)
    res.headers.set("x-institution-name", institution.name)
    if (institution.favicon_url) res.headers.set("x-institution-favicon-url", institution.favicon_url)
    if (institution.primary_color) res.headers.set("x-institution-primary-color", institution.primary_color)
  }
  // --- END: Institution Data Injection ---

  // Define route types
  const isStudentRoute = path.startsWith("/student/")
  const isManagerRoute = path.startsWith("/manager/")
  const isAdminRoute = path.startsWith("/admin/")
  const isSuperAdminRoute = path.startsWith("/super-admin/")
  const isProtectedRoute = isStudentRoute || isManagerRoute || isAdminRoute || isSuperAdminRoute

  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]
  const isPublicPath = publicPaths.some((p) => path.includes(p))

  // --- START: AUTHENTICATION & ROUTING LOGIC ---

  // RULE 1: Redirect unauthenticated users from protected routes.
  if (!session && isProtectedRoute && !isPublicPath) {
    let loginUrl = "/"
    if (isStudentRoute) loginUrl = "/student/login"
    if (isManagerRoute) loginUrl = "/manager/login"
    if (isAdminRoute) loginUrl = "/admin/login"
    if (isSuperAdminRoute) loginUrl = "/super-admin/login"
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  // RULE 2: Redirect authenticated users from public auth pages.
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

  // RULE 5: Handle root path redirects.
  if (path === "/") {
    if (isMainDomain) {
      const destination = session ? "/admin/dashboard" : "/admin/login"
      return NextResponse.redirect(new URL(destination, req.url))
    } else {
      const destination = session ? "/student/dashboard" : "/student/login"
      return NextResponse.redirect(new URL(destination, req.url))
    }
  }

  // --- END: AUTHENTICATION & ROUTING LOGIC ---

  // Return the response, which has been modified by Supabase client and our header injection.
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
