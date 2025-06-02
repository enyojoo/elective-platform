import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  // Initialize response using NextResponse.next() to allow subsequent modifications
  // Clone the request headers to ensure they are mutable if needed later
  let response = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
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
          // Update the request's cookies. This is important for Server Components
          // that might run after the middleware and rely on the updated cookie state.
          req.cookies.set({ name, value, ...options })

          // Re-initialize the response to carry the updated request (especially its cookies)
          // This ensures that the response object has the latest headers/cookies from the modified req.
          // Use a new Headers object from req.headers to ensure it's the latest.
          response = NextResponse.next({
            request: {
              headers: new Headers(req.headers), // Pass updated request headers
            },
          })

          // Set the cookie on the outgoing response to the browser
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options })
          response = NextResponse.next({
            request: {
              headers: new Headers(req.headers),
            },
          })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // IMPORTANT: Refresh session if expired. Updates cookies on `response` if needed.
  // getSession() will also read the existing session.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  // Enhanced logging to see session status for every request
  console.log(
    `Middleware: Host: ${hostname}, Path: ${path}, Method: ${method}, Session: ${session ? `Exists (User ID: ${session.user.id})` : "None"}`,
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
    if (isSubdomainHost) {
      subdomain = hostname.split(".")[0]
    }
  }

  const isMainDomain =
    hostname === "app.electivepro.net" || hostname === "electivepro.net" || (isDevelopment && !subdomain)

  response.headers.set("x-url", req.url) // Set for downstream use

  // --- Route Protection & Redirection Logic ---

  // Rule: /institution-required should never be on a subdomain
  if (path === "/institution-required" && subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  const isStudentOrManagerRoute = path.startsWith("/student/") || path.startsWith("/manager/")
  const isAdminOrSuperAdminRoute = path.startsWith("/admin/") || path.startsWith("/super-admin/")

  // Rule: Student/Manager routes only on subdomains
  if (isStudentOrManagerRoute && !subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  // Rule: Admin/Super-admin routes only on main domain
  if (isAdminOrSuperAdminRoute && subdomain) {
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = path
    return NextResponse.redirect(redirectUrl)
  }

  // Authentication checks for protected routes
  if (isMainDomain) {
    const publicAdminRoutes = ["/admin/login", "/admin/signup", "/admin/forgot-password", "/admin/reset-password"]
    if (path.startsWith("/admin/") && !publicAdminRoutes.includes(path) && !session) {
      console.log(`Middleware: No session for protected admin route ${path}. Redirecting to /admin/login.`)
      return NextResponse.redirect(new URL("/admin/login", req.url))
    }

    const publicSuperAdminRoutes = ["/super-admin/login"]
    if (path.startsWith("/super-admin/") && !publicSuperAdminRoutes.includes(path) && !session) {
      console.log(`Middleware: No session for protected super-admin route ${path}. Redirecting to /super-admin/login.`)
      return NextResponse.redirect(new URL("/super-admin/login", req.url))
    }
  } else if (subdomain) {
    // Student/Manager routes on subdomains
    const publicStudentRoutes = [
      "/student/login",
      "/student/signup",
      "/student/forgot-password",
      "/student/reset-password",
    ]
    if (path.startsWith("/student/") && !publicStudentRoutes.includes(path) && !session) {
      console.log(
        `Middleware: No session for protected student route ${path} on subdomain ${subdomain}. Redirecting to /student/login.`,
      )
      return NextResponse.redirect(new URL("/student/login", req.url))
    }
    const publicManagerRoutes = [
      "/manager/login",
      "/manager/signup",
      "/manager/forgot-password",
      "/manager/reset-password",
    ]
    if (path.startsWith("/manager/") && !publicManagerRoutes.includes(path) && !session) {
      console.log(
        `Middleware: No session for protected manager route ${path} on subdomain ${subdomain}. Redirecting to /manager/login.`,
      )
      return NextResponse.redirect(new URL("/manager/login", req.url))
    }
  }

  // Subdomain validation and header injection (if applicable)
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

  // Default main domain routes
  if (isMainDomain && path === "/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  if (path === "/admin" && !path.startsWith("/admin/login")) {
    // Avoid redirect loop for /admin/login
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  if (path === "/super-admin" && !path.startsWith("/super-admin/login")) {
    // Avoid redirect loop
    return NextResponse.redirect(new URL("/super-admin/login", req.url))
  }

  // If no other redirection happened, return the (potentially modified) response
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
