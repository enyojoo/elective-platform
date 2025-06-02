import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  // 1. Initialize response object. Headers from the original request are cloned.
  const initialHeaders = new Headers(req.headers)
  const response = NextResponse.next({
    request: {
      headers: initialHeaders,
    },
  })

  // 2. Setup Supabase client with cookie handling tied to `req` and `response`
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // 3. IMPORTANT: Refresh session if expired. Updates cookies on `response` if needed.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 4. Extract request details
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  console.log(
    `Middleware: Processing ${method} request for hostname: ${hostname}, path: ${path}. Session ${session ? "exists" : "does not exist"}.`,
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

  // Set x-url on the response headers for downstream use (e.g., in layout)
  response.headers.set("x-url", req.url)

  if (path === "/institution-required" && subdomain) {
    console.log(`Middleware: Redirecting /institution-required from subdomain to main domain.`)
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  const isStudentOrManagerRoute = path.startsWith("/student/") || path.startsWith("/manager/")
  const isAdminOrSuperAdminRoute = path.startsWith("/admin/") || path.startsWith("/super-admin/")

  if (isStudentOrManagerRoute && !subdomain) {
    console.log(`Middleware: Redirecting student/manager route ${path} to institution-required (not on subdomain).`)
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = "/institution-required"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminOrSuperAdminRoute && subdomain) {
    console.log(`Middleware: Redirecting admin/super-admin route ${path} from subdomain ${subdomain} to main domain.`)
    const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
    redirectUrl.pathname = path
    return NextResponse.redirect(redirectUrl)
  }

  // --- Authentication Checks for Protected Routes on Main Domain ---
  if (isMainDomain) {
    const publicAdminRoutes = ["/admin/login", "/admin/signup", "/admin/forgot-password", "/admin/reset-password"]
    if (path.startsWith("/admin/") && !publicAdminRoutes.includes(path)) {
      if (!session) {
        console.log(`Middleware: No session for protected admin route ${path}. Redirecting to /admin/login.`)
        const loginUrl = new URL("/admin/login", req.url)
        // loginUrl.searchParams.set('redirect_to', path); // Optional
        return NextResponse.redirect(loginUrl)
      }
      console.log(`Middleware: Session found for protected admin route ${path}.`)
    }

    const publicSuperAdminRoutes = ["/super-admin/login"]
    if (path.startsWith("/super-admin/") && !publicSuperAdminRoutes.includes(path)) {
      if (!session) {
        console.log(
          `Middleware: No session for protected super-admin route ${path}. Redirecting to /super-admin/login.`,
        )
        return NextResponse.redirect(new URL("/super-admin/login", req.url))
      }
      console.log(`Middleware: Session found for protected super-admin route ${path}.`)
    }
  }
  // --- End of Authentication Checks ---

  if (subdomain) {
    console.log(`Middleware: Processing subdomain: ${subdomain}`)
    response.headers.set("x-electivepro-subdomain", subdomain)

    try {
      const isDashboardPage = path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")
      const apiUrl = isDevelopment
        ? `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
        : `https://${hostname}/api/subdomain/${subdomain}`

      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const apiCheckResponse = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!apiCheckResponse.ok) {
        console.error(`Middleware: API error for subdomain ${subdomain}:`, apiCheckResponse.status)
        if (!isDashboardPage) {
          const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
          redirectUrl.pathname = "/institution-required"
          return NextResponse.redirect(redirectUrl)
        }
        console.log(`Middleware: Allowing dashboard page ${path} despite API error (subdomain: ${subdomain}).`)
      } else {
        const data = await apiCheckResponse.json()
        if (!data.exists) {
          console.log(`Middleware: Invalid subdomain: ${subdomain}.`)
          if (!(isDashboardPage && req.headers.get("sec-fetch-mode") === "navigate")) {
            const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
            redirectUrl.pathname = "/institution-required"
            return NextResponse.redirect(redirectUrl)
          }
          console.log(
            `Middleware: Allowing dashboard page ${path} despite invalid subdomain (likely a reload, subdomain: ${subdomain}).`,
          )
        } else {
          console.log(`Middleware: Valid subdomain: ${subdomain}. Institution data:`, data.institution)
          if (data.institution) {
            if (data.institution.id) response.headers.set("x-institution-id", data.institution.id)
            if (data.institution.name) response.headers.set("x-institution-name", data.institution.name)
            if (data.institution.favicon_url)
              response.headers.set("x-institution-favicon-url", data.institution.favicon_url)
            if (data.institution.primary_color)
              response.headers.set("x-institution-primary-color", data.institution.primary_color)
          }
        }
      }
    } catch (err) {
      console.error("Middleware: Error in subdomain processing:", err)
      if (!(path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager"))) {
        const redirectUrl = new URL(isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`, req.url)
        redirectUrl.pathname = "/institution-required"
        return NextResponse.redirect(redirectUrl)
      }
      console.log(`Middleware: Allowing dashboard page ${path} despite error (subdomain: ${subdomain}).`)
    }

    if (path === "/") return NextResponse.redirect(new URL("/student/login", req.url))
    if (path === "/student") return NextResponse.redirect(new URL("/student/login", req.url))
    if (path === "/manager") return NextResponse.redirect(new URL("/manager/login", req.url))
  }

  if (isMainDomain && path === "/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  if (path === "/admin" || path === "/admin/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  if (path === "/super-admin" || path === "/super-admin/") {
    return NextResponse.redirect(new URL("/super-admin/login", req.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
