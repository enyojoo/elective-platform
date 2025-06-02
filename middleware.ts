import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  console.log(
    `Middleware: Processing ${method} request for hostname: ${hostname}, path: ${path}, session: ${session ? "active" : "none"}`,
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
  console.log(`Middleware: isDevelopment=${isDevelopment}, mainDomain=${mainDomain}, subdomain=${subdomain}`)

  const isMainDomainAccess = hostname === mainDomain || (isDevelopment && !subdomain)

  const publicPaths = [
    "/admin/login",
    "/admin/signup",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/student/login",
    "/student/signup",
    "/student/forgot-password",
    "/student/reset-password",
    "/manager/login",
    "/manager/signup",
    "/manager/forgot-password",
    "/manager/reset-password",
    "/super-admin/login",
    "/institution-required",
    // API routes used by public pages or for auth itself
    "/api/auth/check-role", // Assuming this might be used by login/signup flows
    "/api/auth/signup-admin",
    "/api/subdomain", // Subdomain check API is public
  ]

  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath))

  // If trying to access a public path (like login) AND already has a session, redirect to dashboard
  if (session && isPublicPath) {
    if ((path.startsWith("/admin/login") || path.startsWith("/super-admin/login")) && isMainDomainAccess) {
      const dashboardPath = path.startsWith("/super-admin/login") ? "/super-admin/dashboard" : "/admin/dashboard"
      console.log(`Middleware: Session active, redirecting from ${path} to ${dashboardPath}`)
      return NextResponse.redirect(new URL(dashboardPath, req.url))
    }
    if (path.startsWith("/student/login") && subdomain) {
      console.log(`Middleware: Session active, redirecting from ${path} to /student/dashboard on subdomain`)
      return NextResponse.redirect(new URL("/student/dashboard", req.url))
    }
    if (path.startsWith("/manager/login") && subdomain) {
      console.log(`Middleware: Session active, redirecting from ${path} to /manager/dashboard on subdomain`)
      return NextResponse.redirect(new URL("/manager/dashboard", req.url))
    }
    // Allow access to other public paths like forgot-password even if logged in
  }

  // If trying to access a protected path WITHOUT a session
  if (!session && !isPublicPath) {
    console.log(`Middleware: No session, accessing protected path: ${path}. Redirecting to login.`)
    const loginUrlParams = new URLSearchParams()
    // loginUrlParams.set('redirect_to', path); // Optional: if login pages handle this

    const targetUrl = new URL(req.url) // Use req.url to preserve current host/protocol for subdomain redirects

    if (path.startsWith("/admin/") || path.startsWith("/super-admin/")) {
      if (subdomain) {
        // Admin/Super-admin on subdomain is wrong context, redirect to main domain login
        const mainDomainLoginPath = path.startsWith("/super-admin/") ? "/super-admin/login" : "/admin/login"
        console.log(
          `Middleware: Admin/Super-admin path on subdomain without session. Redirecting to main domain ${mainDomainLoginPath}.`,
        )
        return NextResponse.redirect(
          new URL(
            `http${isDevelopment ? "" : "s"}://${mainDomain}${mainDomainLoginPath}?${loginUrlParams.toString()}`,
            req.url,
          ),
        )
      }
      const loginPath = path.startsWith("/super-admin/") ? "/super-admin/login" : "/admin/login"
      targetUrl.pathname = loginPath
      targetUrl.search = loginUrlParams.toString()
      console.log(`Middleware: Redirecting to ${targetUrl.toString()}`)
      return NextResponse.redirect(targetUrl)
    }
    if (path.startsWith("/student/")) {
      if (!subdomain) {
        console.log(`Middleware: Student path on main domain without session. Redirecting to /institution-required.`)
        return NextResponse.redirect(
          new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
        )
      }
      targetUrl.pathname = "/student/login"
      targetUrl.search = loginUrlParams.toString()
      console.log(`Middleware: Redirecting to ${targetUrl.toString()} (student login on subdomain)`)
      return NextResponse.redirect(targetUrl)
    }
    if (path.startsWith("/manager/")) {
      if (!subdomain) {
        console.log(`Middleware: Manager path on main domain without session. Redirecting to /institution-required.`)
        return NextResponse.redirect(
          new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
        )
      }
      targetUrl.pathname = "/manager/login"
      targetUrl.search = loginUrlParams.toString()
      console.log(`Middleware: Redirecting to ${targetUrl.toString()} (manager login on subdomain)`)
      return NextResponse.redirect(targetUrl)
    }

    // Default redirect for other protected paths
    if (isMainDomainAccess) {
      console.log(`Middleware: Default unauth redirect to /admin/login on main domain.`)
      return NextResponse.redirect(new URL(`/admin/login?${loginUrlParams.toString()}`, req.url))
    }
    if (subdomain) {
      console.log(`Middleware: Default unauth redirect to /student/login on subdomain.`)
      targetUrl.pathname = "/student/login" // Default to student login on subdomain
      targetUrl.search = loginUrlParams.toString()
      return NextResponse.redirect(targetUrl)
    }

    console.log(`Middleware: Fallback unauth redirect to /admin/login (main domain).`)
    return NextResponse.redirect(new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/admin/login`, req.url))
  }

  // --- Existing domain/subdomain routing logic (RUNS IF SESSION EXISTS or IS PUBLIC PATH) ---

  // IMPORTANT: /institution-required should NEVER be accessible on a subdomain
  if (path === "/institution-required" && subdomain) {
    console.log(`Middleware: Redirecting /institution-required from subdomain to main domain`)
    return NextResponse.redirect(
      new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
    )
  }

  const isStudentOrManagerRoute = path.startsWith("/student/") || path.startsWith("/manager/")
  const isAdminOrSuperAdminRoute = path.startsWith("/admin/") || path.startsWith("/super-admin/")

  // RULE 1: Student and Manager routes (that are not public, e.g. login) should ONLY be accessed via subdomain
  if (isStudentOrManagerRoute && !isPublicPath && !subdomain) {
    console.log(`Middleware: Redirecting student/manager route ${path} to institution-required (no subdomain)`)
    return NextResponse.redirect(
      new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
    )
  }

  // RULE 2: Admin and Super-admin routes (that are not public, e.g. login) should ONLY be accessed via main domain
  if (isAdminOrSuperAdminRoute && !isPublicPath && subdomain) {
    console.log(`Middleware: Redirecting admin/super-admin route ${path} to main domain (from subdomain)`)
    return NextResponse.redirect(new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}${path}`, req.url))
  }

  // Handle subdomain specific logic (e.g., API checks, header injections)
  if (subdomain) {
    console.log(`Middleware: Processing subdomain specific logic for: ${subdomain}, path: ${path}`)
    // This part includes API checks for subdomain validity and setting headers
    // It should largely remain as is, but ensure it doesn't conflict with auth redirects
    // For example, if an API call here fails, it might redirect.
    // The redirects for `/`, `/student`, `/manager` roots on subdomain are good.
    try {
      const isDashboardPage = path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")
      let apiUrl
      if (isDevelopment) {
        apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      } else {
        apiUrl = `https://${hostname}/api/subdomain/${subdomain}`
      }
      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const apiResponse = await fetch(apiUrl, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!apiResponse.ok) {
        console.error(`Middleware: API error for subdomain ${subdomain}:`, apiResponse.status)
        if (isDashboardPage) {
          console.log(`Middleware: Allowing dashboard page despite API error: ${path}`)
          // Proceed with header setting
        } else {
          return NextResponse.redirect(
            new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
          )
        }
      } else {
        const data = await apiResponse.json()
        if (!data.exists) {
          console.log(`Middleware: Invalid subdomain: ${subdomain}, redirecting to main domain institution-required`)
          if (isDashboardPage && req.headers.get("sec-fetch-mode") === "navigate") {
            console.log(`Middleware: Allowing dashboard page despite invalid subdomain (likely a reload): ${path}`)
            // Proceed with header setting
          } else {
            return NextResponse.redirect(
              new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
            )
          }
        }
      }
      // Valid subdomain or allowed dashboard page - allow access and add institution info to headers
      console.log(`Middleware: Valid subdomain or allowed dashboard: ${subdomain}, allowing access for ${path}`)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      // ... (rest of your header setting logic from original middleware)
      if (apiResponse.ok) {
        const data = await apiResponse.json() // Re-parse if needed, or store from above
        if (data.institution) {
          if (data.institution.id) requestHeaders.set("x-institution-id", data.institution.id)
          if (data.institution.name) requestHeaders.set("x-institution-name", data.institution.name)
          if (data.institution.favicon_url)
            requestHeaders.set("x-institution-favicon-url", data.institution.favicon_url)
          if (data.institution.primary_color)
            requestHeaders.set("x-institution-primary-color", data.institution.primary_color)
        }
      }
      requestHeaders.set("x-url", req.url)

      const updatedRes = NextResponse.next({ request: { headers: requestHeaders } })

      if (path === "/")
        return NextResponse.redirect(new URL("/student/login", req.url), { headers: updatedRes.headers })
      if (path === "/student")
        return NextResponse.redirect(new URL("/student/login", req.url), { headers: updatedRes.headers })
      if (path === "/manager")
        return NextResponse.redirect(new URL("/manager/login", req.url), { headers: updatedRes.headers })

      // For other paths on subdomain, pass through with new headers
      // Need to merge headers from `res` (which has Supabase cookies) and `updatedRes` (which has x-headers)
      // A bit tricky, let's try setting cookies on the `updatedRes`
      const sessionCookie = res.headers.get("set-cookie")
      if (sessionCookie) {
        updatedRes.headers.append("set-cookie", sessionCookie)
      }
      return updatedRes
    } catch (err) {
      console.error("Middleware: Error in subdomain processing:", err)
      if (path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")) {
        console.log(`Middleware: Allowing dashboard page despite error: ${path}`)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain)
        const errorRes = NextResponse.next({ request: { headers: requestHeaders } })
        const sessionCookie = res.headers.get("set-cookie")
        if (sessionCookie) {
          errorRes.headers.append("set-cookie", sessionCookie)
        }
        return errorRes
      }
      return NextResponse.redirect(
        new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
      )
    }
  }

  // If accessing the root of the main domain, redirect to admin login (if not already handled)
  if (isMainDomainAccess && path === "/") {
    console.log(`Middleware: Main domain root access, redirecting to /admin/login`)
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  // Redirect base role paths to their login pages (if not already handled)
  if ((path === "/admin" || path === "/admin/") && isMainDomainAccess)
    return NextResponse.redirect(new URL("/admin/login", req.url))
  if ((path === "/student" || path === "/student/") && !subdomain)
    return NextResponse.redirect(
      new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
    ) // Should go to institution-required
  if ((path === "/manager" || path === "/manager/") && !subdomain)
    return NextResponse.redirect(
      new URL(`http${isDevelopment ? "" : "s"}://${mainDomain}/institution-required`, req.url),
    ) // Should go to institution-required
  if ((path === "/super-admin" || path === "/super-admin/") && isMainDomainAccess)
    return NextResponse.redirect(new URL("/super-admin/login", req.url))

  console.log(`Middleware: Passing request through for path: ${path}`)
  return res // Return the res object that has Supabase cookies set
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
