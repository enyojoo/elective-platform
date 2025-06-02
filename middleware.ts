import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const originalPath = req.nextUrl.pathname
  const method = req.method
  const hostname = req.headers.get("host") || ""

  console.log(`Middleware: Processing ${method} request for hostname: ${hostname}, path: ${originalPath}`)

  const response = NextResponse.next({
    request: {
      headers: req.headers,
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
  const publicSuperAdminPaths = ["/super-admin/login", "/super-admin/reset-password", "/super-admin/forgot-password"]

  const createRedirect = (url: string | URL) => {
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  const createRewrite = (url: URL, requestHeaders?: Headers) => {
    const rewriteResponse = NextResponse.rewrite(url, { request: { headers: requestHeaders || req.headers } })
    response.cookies.getAll().forEach((cookie) => rewriteResponse.cookies.set(cookie))
    return rewriteResponse
  }

  const createNextResponse = (updatedRequestHeaders?: Headers) => {
    const nextResponse = NextResponse.next({
      request: {
        headers: updatedRequestHeaders || req.headers,
      },
    })
    response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie))
    return nextResponse
  }

  if (originalPath === "/institution-required" && subdomain) {
    console.log(`Middleware: Redirecting /institution-required from subdomain to main domain`)
    return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
  }

  const isStudentRoute = originalPath.startsWith("/student/")
  const isManagerRoute = originalPath.startsWith("/manager/")
  const isAdminRoute = originalPath.startsWith("/admin/")
  const isSuperAdminRoute = originalPath.startsWith("/super-admin/")

  if ((isStudentRoute || isManagerRoute) && !subdomain) {
    console.log(
      `Middleware: Student/manager route ${originalPath} on main domain. Redirecting to /institution-required.`,
    )
    return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
  }

  if ((isAdminRoute || isSuperAdminRoute) && subdomain) {
    console.log(`Middleware: Admin/super-admin route ${originalPath} on subdomain. Redirecting to main domain.`)
    return createRedirect(new URL(originalPath, mainDomainUrlBase))
  }

  // Authentication and Post-Login Redirects
  if (isAdminRoute && isMainDomainAccess) {
    if (session && publicAdminPaths.includes(originalPath)) {
      console.log(`Middleware: Admin logged in, on public admin page ${originalPath}. Redirecting to dashboard.`)
      return createRedirect(new URL("/admin/dashboard", mainDomainUrlBase))
    }
    if (!session && !publicAdminPaths.includes(originalPath)) {
      console.log(`Middleware: No session for protected admin route ${originalPath}. Redirecting to /admin/login.`)
      return createRedirect(new URL("/admin/login", mainDomainUrlBase))
    }
  } else if (isStudentRoute && subdomain) {
    if (session && publicStudentPaths.includes(originalPath)) {
      console.log(`Middleware: Student logged in, on public student page ${originalPath}. Redirecting to dashboard.`)
      return createRedirect(new URL("/student/dashboard", req.url))
    }
    if (!session && !publicStudentPaths.includes(originalPath)) {
      console.log(`Middleware: No session for protected student route ${originalPath}. Redirecting to /student/login.`)
      return createRedirect(new URL("/student/login", req.url))
    }
  } else if (isManagerRoute && subdomain) {
    if (session && publicManagerPaths.includes(originalPath)) {
      console.log(`Middleware: Manager logged in, on public manager page ${originalPath}. Redirecting to dashboard.`)
      return createRedirect(new URL("/manager/dashboard", req.url))
    }
    if (!session && !publicManagerPaths.includes(originalPath)) {
      console.log(`Middleware: No session for protected manager route ${originalPath}. Redirecting to /manager/login.`)
      return createRedirect(new URL("/manager/login", req.url))
    }
  } else if (isSuperAdminRoute && isMainDomainAccess) {
    if (session && publicSuperAdminPaths.includes(originalPath)) {
      console.log(
        `Middleware: Super Admin logged in, on public super admin page ${originalPath}. Redirecting to dashboard.`,
      )
      return createRedirect(new URL("/super-admin/dashboard", mainDomainUrlBase))
    }
    if (!session && !publicSuperAdminPaths.includes(originalPath)) {
      console.log(
        `Middleware: No session for protected super-admin route ${originalPath}. Redirecting to /super-admin/login.`,
      )
      return createRedirect(new URL("/super-admin/login", mainDomainUrlBase))
    }
  }

  if (subdomain) {
    console.log(`Middleware: Processing subdomain specific logic for: ${subdomain}`)
    try {
      const isDashboardPage =
        originalPath.includes("/dashboard") || originalPath.endsWith("/student") || originalPath.endsWith("/manager")
      let apiUrl
      if (isDevelopment) {
        apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      } else {
        apiUrl = `https://${hostname}/api/subdomain/${subdomain}`
      }
      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const apiRes = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      const requestHeaders = new Headers(req.headers)
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

      // Rewrite base paths on subdomains if not already handled by auth redirects
      if (originalPath === "/") {
        // If already authenticated, auth redirect to dashboard would have happened.
        // If not authenticated, redirect to login.
        return createRewrite(new URL(session ? "/student/dashboard" : "/student/login", req.url), requestHeaders)
      }
      if (originalPath === "/student" && !originalPath.includes("login") && !originalPath.includes("signup")) {
        return createRewrite(new URL(session ? "/student/dashboard" : "/student/login", req.url), requestHeaders)
      }
      if (originalPath === "/manager" && !originalPath.includes("login") && !originalPath.includes("signup")) {
        return createRewrite(new URL(session ? "/manager/dashboard" : "/manager/login", req.url), requestHeaders)
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
        if (subdomain) requestHeaders.set("x-electivepro-subdomain", subdomain)
        return createNextResponse(requestHeaders)
      }
      return createRedirect(new URL(`/institution-required`, mainDomainUrlBase))
    }
  }

  if (isMainDomainAccess) {
    if (originalPath === "/") {
      return createRedirect(new URL(session ? "/admin/dashboard" : "/admin/login", mainDomainUrlBase))
    }
    if (originalPath === "/admin" || originalPath === "/admin/") {
      return createRedirect(new URL(session ? "/admin/dashboard" : "/admin/login", mainDomainUrlBase))
    }
    if (originalPath === "/student" || originalPath === "/student/") {
      return createRedirect(new URL("/institution-required", mainDomainUrlBase))
    }
    if (originalPath === "/manager" || originalPath === "/manager/") {
      return createRedirect(new URL("/institution-required", mainDomainUrlBase))
    }
    if (originalPath === "/super-admin" || originalPath === "/super-admin/") {
      return createRedirect(new URL(session ? "/super-admin/dashboard" : "/super-admin/login", mainDomainUrlBase))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
