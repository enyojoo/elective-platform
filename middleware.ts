import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const originalPath = req.nextUrl.pathname
  const method = req.method
  const hostname = req.headers.get("host") || ""

  console.log(`Middleware: Processing ${method} request for hostname: ${hostname}, path: ${originalPath}`)

  // This response object will be used by Supabase to set cookies
  // and will be the base for our final response.
  const response = NextResponse.next({
    request: {
      headers: req.headers, // Pass original headers to the request for the next layer
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
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Fetch the session. This also refreshes the session if needed.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"
  const mainDomainUrlBase = isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`

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

  const isMainDomainAccess =
    hostname === "app.electivepro.net" || hostname === "electivepro.net" || (isDevelopment && !subdomain)

  // Define public paths (accessible without authentication) for each role
  const publicAdminPaths = ["/admin/login", "/admin/signup", "/admin/forgot-password", "/admin/reset-password"]
  const publicStudentPaths = [
    "/student/login",
    "/student/signup",
    "/student/forgot-password",
    "/student/reset-password",
  ]
  const publicManagerPaths = [
    "/manager/login",
    "/manager/signup",
    "/manager/forgot-password",
    "/manager/reset-password",
  ]
  const publicSuperAdminPaths = ["/super-admin/login"] // For completeness

  // Helper to create a redirect response while preserving cookies set by Supabase
  const createRedirect = (url: string | URL) => {
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  // Helper to create a rewrite response while preserving cookies
  const createRewrite = (url: URL, requestHeaders?: Headers) => {
    const rewriteResponse = NextResponse.rewrite(url, { request: { headers: requestHeaders || req.headers } })
    response.cookies.getAll().forEach((cookie) => rewriteResponse.cookies.set(cookie))
    return rewriteResponse
  }

  // Helper to create a next response (proceeding) while preserving cookies and allowing new request headers
  const createNextResponse = (updatedRequestHeaders?: Headers) => {
    const nextResponse = NextResponse.next({
      request: {
        headers: updatedRequestHeaders || req.headers,
      },
    })
    response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie))
    return nextResponse
  }

  // --- Routing and Authentication Logic ---

  if (originalPath === "/institution-required" && subdomain) {
    console.log(`Middleware: Redirecting /institution-required from subdomain to main domain`)
    return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
  }

  const isStudentRoute = originalPath.startsWith("/student/")
  const isManagerRoute = originalPath.startsWith("/manager/")
  const isAdminRoute = originalPath.startsWith("/admin/")
  const isSuperAdminRoute = originalPath.startsWith("/super-admin/")

  // RULE 1: Student and Manager routes should ONLY be accessed via subdomain
  if ((isStudentRoute || isManagerRoute) && !subdomain) {
    console.log(
      `Middleware: Student/manager route ${originalPath} on main domain. Redirecting to /institution-required.`,
    )
    return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
  }

  // RULE 2: Admin and Super-admin routes should ONLY be accessed via main domain
  if ((isAdminRoute || isSuperAdminRoute) && subdomain) {
    console.log(`Middleware: Admin/super-admin route ${originalPath} on subdomain. Redirecting to main domain.`)
    return createRedirect(new URL(originalPath, mainDomainUrlBase))
  }

  // Authentication Checks
  if (isAdminRoute && isMainDomainAccess) {
    if (!session && !publicAdminPaths.includes(originalPath)) {
      console.log(`Middleware: No session for protected admin route ${originalPath}. Redirecting to /admin/login.`)
      return createRedirect(new URL("/admin/login", mainDomainUrlBase))
    }
  } else if (isStudentRoute && subdomain) {
    if (!session && !publicStudentPaths.includes(originalPath)) {
      console.log(
        `Middleware: No session for protected student route ${originalPath} on subdomain ${subdomain}. Redirecting to /student/login.`,
      )
      return createRedirect(new URL("/student/login", req.url)) // req.url preserves subdomain
    }
  } else if (isManagerRoute && subdomain) {
    if (!session && !publicManagerPaths.includes(originalPath)) {
      console.log(
        `Middleware: No session for protected manager route ${originalPath} on subdomain ${subdomain}. Redirecting to /manager/login.`,
      )
      return createRedirect(new URL("/manager/login", req.url)) // req.url preserves subdomain
    }
  } else if (isSuperAdminRoute && isMainDomainAccess) {
    if (!session && !publicSuperAdminPaths.includes(originalPath)) {
      console.log(
        `Middleware: No session for protected super-admin route ${originalPath}. Redirecting to /super-admin/login.`,
      )
      return createRedirect(new URL("/super-admin/login", mainDomainUrlBase))
    }
  }

  // Subdomain specific logic (validation and header injection)
  if (subdomain) {
    console.log(`Middleware: Processing subdomain specific logic for: ${subdomain}`)
    try {
      const isDashboardPage =
        originalPath.includes("/dashboard") || originalPath.endsWith("/student") || originalPath.endsWith("/manager")
      let apiUrl
      if (isDevelopment) {
        apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      } else {
        apiUrl = `https://${hostname}/api/subdomain/${subdomain}` // Use actual hostname in prod
      }
      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const apiRes = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      const requestHeaders = new Headers(req.headers) // Start with original request headers
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-url", req.url)

      if (!apiRes.ok) {
        console.error(`Middleware: API error for subdomain ${subdomain}:`, apiRes.status)
        if (isDashboardPage) {
          console.log(`Middleware: Allowing dashboard page ${originalPath} despite API error.`)
          return createNextResponse(requestHeaders)
        }
        return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
      }

      const data = await apiRes.json()
      if (!data.exists) {
        console.log(`Middleware: Invalid subdomain: ${subdomain}, redirecting to /institution-required.`)
        if (isDashboardPage && req.headers.get("sec-fetch-mode") === "navigate") {
          console.log(
            `Middleware: Allowing dashboard page ${originalPath} despite invalid subdomain (likely a reload).`,
          )
          return createNextResponse(requestHeaders)
        }
        return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
      }

      console.log(`Middleware: Valid subdomain: ${subdomain}. Setting institution headers.`)
      if (data.institution) {
        if (data.institution.id) requestHeaders.set("x-institution-id", data.institution.id)
        if (data.institution.name) requestHeaders.set("x-institution-name", data.institution.name)
        if (data.institution.favicon_url) requestHeaders.set("x-institution-favicon-url", data.institution.favicon_url)
        if (data.institution.primary_color)
          requestHeaders.set("x-institution-primary-color", data.institution.primary_color)
      }

      if (originalPath === "/") {
        return createRewrite(new URL("/student/login", req.url), requestHeaders)
      }
      if (originalPath === "/student") {
        return createRewrite(new URL("/student/login", req.url), requestHeaders)
      }
      if (originalPath === "/manager") {
        return createRewrite(new URL("/manager/login", req.url), requestHeaders)
      }

      return createNextResponse(requestHeaders)
    } catch (err) {
      console.error("Middleware: Error in subdomain processing:", err)
      if (
        originalPath.includes("/dashboard") ||
        originalPath.endsWith("/student") ||
        originalPath.endsWith("/manager")
      ) {
        console.log(`Middleware: Allowing dashboard page ${originalPath} despite error.`)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain) // Assuming subdomain is available
        return createNextResponse(requestHeaders)
      }
      return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
    }
  }

  // Main domain specific redirects for base paths
  if (isMainDomainAccess) {
    if (originalPath === "/") {
      return createRedirect(new URL("/admin/login", mainDomainUrlBase))
    }
    if (originalPath === "/admin" || originalPath === "/admin/") {
      return createRedirect(new URL("/admin/login", mainDomainUrlBase))
    }
    // Student/Manager base paths on main domain should be caught by RULE 1 (subdomain required)
    // and redirected to /institution-required.
    // If they somehow reach here, it's an anomaly.
    if (originalPath === "/student" || originalPath === "/student/") {
      return createRedirect(new URL("/institution-required", mainDomainUrlBase))
    }
    if (originalPath === "/manager" || originalPath === "/manager/") {
      return createRedirect(new URL("/institution-required", mainDomainUrlBase))
    }
    if (originalPath === "/super-admin" || originalPath === "/super-admin/") {
      return createRedirect(new URL("/super-admin/login", mainDomainUrlBase))
    }
  }

  // If no other specific response was returned, proceed with the original plan (NextResponse.next())
  // but ensure cookies from Supabase are included.
  return response // This `response` object was initialized as NextResponse.next() and potentially had cookies added by Supabase.
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
