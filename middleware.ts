import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  // Create a response object that can be modified
  let response = NextResponse.next({
    request: {
      headers: new Headers(req.headers), // Clone request headers
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the request is mutated, ensure the new response reflects those changes
          req.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            // Recreate response if req.cookies changed
            request: { headers: new Headers(req.headers) },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({
            // Recreate response
            request: { headers: new Headers(req.headers) },
          })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // This call is crucial. It refreshes the session if needed and reads the current session.
  // It will use the cookie handlers defined above.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  console.log(
    `MIDDLEWARE: Path: ${path}, Host: ${hostname}, Session: ${session ? `Exists (User: ${session.user.id}, Role: ${session.user.role || "N/A"})` : "None"}`,
  )

  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"

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
    if (isSubdomainHost) subdomain = hostname.split(".")[0]
  }

  const isMainDomain =
    hostname === "app.electivepro.net" || hostname === "electivepro.net" || (isDevelopment && !subdomain)

  response.headers.set("x-url", req.url) // For context in layouts/pages

  // --- START OF ROUTING & AUTH LOGIC ---

  // Specific public paths that should always be allowed
  const globalPublicPaths = ["/api/subdomain", "/api/auth"] // Add more if any
  if (globalPublicPaths.some((p) => path.startsWith(p))) {
    return response // Allow these API routes
  }

  // Rule: /institution-required should never be on a subdomain
  if (path === "/institution-required" && subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  const isStudentRoute = path.startsWith("/student/")
  const isManagerRoute = path.startsWith("/manager/")
  const isAdminRoute = path.startsWith("/admin/")
  const isSuperAdminRoute = path.startsWith("/super-admin/")

  // Rule: Student/Manager routes only on subdomains (or dev with ?subdomain=)
  if ((isStudentRoute || isManagerRoute) && !subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  // Rule: Admin/Super-admin routes only on main domain
  if ((isAdminRoute || isSuperAdminRoute) && subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = path // Keep the original path for the main domain
    return NextResponse.redirect(redirectUrl)
  }

  // Authentication checks
  if (isMainDomain) {
    const publicAdminPaths = ["/admin/login", "/admin/signup", "/admin/forgot-password", "/admin/reset-password"]
    if (isAdminRoute && !publicAdminPaths.includes(path) && !session) {
      console.log(`MIDDLEWARE: No session for protected admin route ${path}. Redirecting to /admin/login.`)
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }

    const publicSuperAdminPaths = ["/super-admin/login"]
    if (isSuperAdminRoute && !publicSuperAdminPaths.includes(path) && !session) {
      console.log(`MIDDLEWARE: No session for protected super-admin route ${path}. Redirecting to /super-admin/login.`)
      return NextResponse.redirect(new URL("/super-admin/login", req.url))
    }
  } else if (subdomain) {
    // On a subdomain
    const publicStudentPaths = [
      "/student/login",
      "/student/signup",
      "/student/forgot-password",
      "/student/reset-password",
    ]
    if (isStudentRoute && !publicStudentPaths.includes(path) && !session) {
      console.log(
        `MIDDLEWARE: No session for protected student route ${path} on subdomain. Redirecting to /student/login.`,
      )
      return NextResponse.redirect(new URL("/student/login", req.url))
    }

    const publicManagerPaths = [
      "/manager/login",
      "/manager/signup",
      "/manager/forgot-password",
      "/manager/reset-password",
    ]
    if (isManagerRoute && !publicManagerPaths.includes(path) && !session) {
      console.log(
        `MIDDLEWARE: No session for protected manager route ${path} on subdomain. Redirecting to /manager/login.`,
      )
      return NextResponse.redirect(new URL("/manager/login", req.url))
    }
  }

  // Subdomain validation and header injection (if applicable and not already redirected)
  if (subdomain) {
    response.headers.set("x-electivepro-subdomain", subdomain)
    try {
      const isDashboardPage = path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")
      const apiUrl = isDevelopment
        ? `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
        : `https://${hostname}/api/subdomain/${subdomain}` // Use actual hostname in prod

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const apiCheckResponse = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!apiCheckResponse.ok) {
        console.error(`Middleware: API error for subdomain ${subdomain} check (${apiUrl}):`, apiCheckResponse.status)
        if (!isDashboardPage) {
          const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
          redirectUrl.pathname = "/institution-required"
          return NextResponse.redirect(redirectUrl)
        }
      } else {
        const data = await apiCheckResponse.json()
        if (!data.exists) {
          if (!(isDashboardPage && req.headers.get("sec-fetch-mode") === "navigate")) {
            const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
            redirectUrl.pathname = "/institution-required"
            return NextResponse.redirect(redirectUrl)
          }
        } else {
          if (data.institution) {
            if (data.institution.id) response.headers.set("x-institution-id", data.institution.id)
            if (data.institution.name) response.headers.set("x-institution-name", data.institution.name)
            // ... other institution headers
          }
        }
      }
    } catch (err) {
      console.error("Middleware: Error in subdomain API processing:", err)
      if (!(path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager"))) {
        const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
        redirectUrl.pathname = "/institution-required"
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Default subdomain routes
    if (path === "/") return NextResponse.redirect(new URL("/student/login", req.url))
    if (path === "/student" && !path.startsWith("/student/login"))
      return NextResponse.redirect(new URL("/student/login", req.url)) // Avoid redirect loop for /student/login
    if (path === "/manager" && !path.startsWith("/manager/login"))
      return NextResponse.redirect(new URL("/manager/login", req.url))
  }

  // Default route fallbacks (if no other redirect has happened)
  if (isMainDomain && path === "/") return NextResponse.redirect(new URL("/admin/login", req.url))
  if (path === "/admin" && !path.startsWith("/admin/login"))
    return NextResponse.redirect(new URL("/admin/login", req.url)) // Avoid loop
  if (path === "/super-admin" && !path.startsWith("/super-admin/login"))
    return NextResponse.redirect(new URL("/super-admin/login", req.url)) // Avoid loop

  if (subdomain) {
    if (path === "/") return NextResponse.redirect(new URL("/student/login", req.url))
    if (path === "/student" && !path.startsWith("/student/login"))
      return NextResponse.redirect(new URL("/student/login", req.url)) // Avoid loop
    if (path === "/manager" && !path.startsWith("/manager/login"))
      return NextResponse.redirect(new URL("/manager/login", req.url)) // Avoid loop
  }

  // If no redirection logic above was triggered, proceed with the request.
  return response
}

export const config = {
  matcher: [
    // Match all routes except for static assets, _next internal files, and specific API routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
}
