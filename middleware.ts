import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"

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

  // Create a new Headers object based on the incoming request.
  // This is what we will pass to the rest of the application.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-url", req.url)

  if (subdomain) {
    const { data: institution } = await supabase
      .from("institutions")
      .select("id, name, favicon_url, primary_color")
      .eq("subdomain", subdomain)
      .single()

    if (institution) {
      // Set the headers on our new requestHeaders object
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-institution-id", institution.id)
      requestHeaders.set("x-institution-name", institution.name)
      if (institution.favicon_url) requestHeaders.set("x-institution-favicon-url", institution.favicon_url)
      if (institution.primary_color) requestHeaders.set("x-institution-primary-color", institution.primary_color)
    } else {
      // If institution not found, redirect to an error page on the main domain
      const url = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`)
      url.pathname = "/institution-required"
      return NextResponse.redirect(url)
    }
  }

  // Define route types
  const isStudentRoute = path.startsWith("/student/")
  const isManagerRoute = path.startsWith("/manager/")
  const isAdminRoute = path.startsWith("/admin/")
  const isSuperAdminRoute = path.startsWith("/super-admin/")
  const isProtectedRoute = isStudentRoute || isManagerRoute || isAdminRoute || isSuperAdminRoute
  const publicPaths = ["/login", "/signup", "/forgot-password", "/reset-password"]
  const isPublicPath = publicPaths.some((p) => path.includes(p))

  // Authentication & Routing Logic
  if (!session && isProtectedRoute && !isPublicPath) {
    let loginUrl = "/"
    if (isStudentRoute) loginUrl = "/student/login"
    if (isManagerRoute) loginUrl = "/manager/login"
    if (isAdminRoute) loginUrl = "/admin/login"
    if (isSuperAdminRoute) loginUrl = "/super-admin/login"
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  if (session && isProtectedRoute && isPublicPath) {
    let dashboardUrl = "/"
    if (isStudentRoute) dashboardUrl = "/student/dashboard"
    if (isManagerRoute) dashboardUrl = "/manager/dashboard"
    if (isAdminRoute) dashboardUrl = "/admin/dashboard"
    if (isSuperAdminRoute) dashboardUrl = "/super-admin/dashboard"
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // Return NextResponse.next() with the modified request headers.
  // This makes the headers available to Server Components like layout.tsx
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
