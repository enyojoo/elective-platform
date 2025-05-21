import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// EMERGENCY FIX: Add debug logging
const DEBUG = true
function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args)
  }
}

export async function middleware(req: NextRequest) {
  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  log(`🔍 MIDDLEWARE START: ${method} ${hostname}${path}`)

  // Check if we're in development mode (localhost)
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // Define main domain based on environment
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"

  // Extract subdomain parameter in development mode
  let subdomain = null
  if (isDevelopment) {
    // In development, get subdomain from query parameter
    const url = new URL(req.url)
    subdomain = url.searchParams.get("subdomain")
    log(`🔍 Development mode, subdomain from query: ${subdomain}`)
  } else {
    // In production, extract subdomain from hostname
    const isSubdomain =
      hostname.includes(".electivepro.net") &&
      !hostname.startsWith("www.") &&
      !hostname.startsWith("app.") &&
      !hostname.startsWith("api.")

    if (isSubdomain) {
      subdomain = hostname.split(".")[0]
      log(`🔍 Production mode, subdomain from hostname: ${subdomain}`)
    }
  }

  // EMERGENCY FIX: Check if this is a dashboard page that should NEVER redirect
  const isDashboardPath = path.includes("/dashboard") || path.startsWith("/student/") || path.startsWith("/manager/")

  log(`🔍 Path: ${path}, Is Dashboard Path: ${isDashboardPath}`)

  // EMERGENCY FIX: If this is a dashboard path with a subdomain, NEVER redirect
  if (isDashboardPath && subdomain) {
    log(`⚠️ EMERGENCY FIX: Dashboard path detected with subdomain, BYPASSING ALL CHECKS: ${path}`)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-electivepro-subdomain", subdomain)
    requestHeaders.set("x-url", req.url)
    requestHeaders.set("x-emergency-bypass", "true")

    // EMERGENCY FIX: ALWAYS allow dashboard paths with a subdomain
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  const isMainDomain =
    hostname === "app.electivepro.net" || hostname === "electivepro.net" || (isDevelopment && !subdomain)

  // IMPORTANT: /institution-required should NEVER be accessible on a subdomain
  if (path === "/institution-required" && subdomain) {
    log(`🔄 Redirecting /institution-required from subdomain to main domain`)
    if (isDevelopment) {
      return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
    } else {
      return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
    }
  }

  // Check if the path is for student or manager routes
  const isStudentOrManagerRoute = path.startsWith("/student/") || path.startsWith("/manager/")

  // Check if the path is for admin or super-admin routes
  const isAdminOrSuperAdminRoute = path.startsWith("/admin/") || path.startsWith("/super-admin/")

  // RULE 1: Student and Manager routes should ONLY be accessed via subdomain
  if (isStudentOrManagerRoute && !subdomain) {
    log(`🔄 Redirecting student/manager route to institution-required: ${path}`)
    // Redirect to institution required page on main domain
    if (isDevelopment) {
      return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
    } else {
      return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
    }
  }

  // RULE 2: Admin and Super-admin routes should ONLY be accessed via main domain
  if (isAdminOrSuperAdminRoute && subdomain) {
    log(`🔄 Redirecting admin route to main domain: ${path}`)
    if (isDevelopment) {
      return NextResponse.redirect(new URL(`http://${mainDomain}${path}`, req.url))
    } else {
      return NextResponse.redirect(new URL(`https://${mainDomain}${path}`, req.url))
    }
  }

  // Handle subdomain routing
  if (subdomain) {
    log(`🔍 Processing subdomain: ${subdomain}`)

    try {
      // CRITICAL FIX: Always allow access to API routes on subdomains
      if (path.startsWith("/api/")) {
        log(`✅ Allowing API access on subdomain: ${path}`)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain)
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }

      // CRITICAL FIX: Always allow access to static assets
      if (path.startsWith("/_next/") || path.includes(".") || path.startsWith("/images/")) {
        log(`✅ Allowing static asset access on subdomain: ${path}`)
        return NextResponse.next()
      }

      // For all other paths on a subdomain, validate the subdomain
      let apiUrl
      if (isDevelopment) {
        apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      } else {
        apiUrl = `https://${hostname}/api/subdomain/${subdomain}`
      }

      log(`🔍 Checking subdomain via API: ${apiUrl}`)

      // CRITICAL FIX: Increase timeout and add better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      try {
        const response = await fetch(apiUrl, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        // CRITICAL FIX: If API call fails, assume subdomain is valid to prevent false negatives
        if (!response.ok) {
          log(`⚠️ API error for subdomain ${subdomain}, assuming valid:`, response.status)
          const requestHeaders = new Headers(req.headers)
          requestHeaders.set("x-electivepro-subdomain", subdomain)
          requestHeaders.set("x-url", req.url)
          requestHeaders.set("x-api-error", "true")

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }

        const data = await response.json()
        log(`🔍 API response for subdomain ${subdomain}:`, data)

        // ONLY redirect if the API explicitly confirms the subdomain is invalid
        if (data.exists === false) {
          log(`❌ Confirmed invalid subdomain: ${subdomain}, redirecting to institution-required`)

          // Redirect to institution required page on MAIN domain
          if (isDevelopment) {
            return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
          } else {
            return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
          }
        }

        // Valid subdomain - allow access and add institution info to headers
        log(`✅ Valid subdomain: ${subdomain}, allowing access`)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain)

        // Only set these headers if we have the data
        if (data.institution) {
          if (data.institution.id) {
            requestHeaders.set("x-institution-id", data.institution.id)
          }
          if (data.institution.name) {
            requestHeaders.set("x-institution-name", data.institution.name)
          }
          if (data.institution.favicon_url) {
            requestHeaders.set("x-institution-favicon-url", data.institution.favicon_url)
          }
          if (data.institution.primary_color) {
            requestHeaders.set("x-institution-primary-color", data.institution.primary_color)
          }
        }

        requestHeaders.set("x-url", req.url)

        // If accessing the root of a subdomain, redirect to student login
        if (path === "/") {
          return NextResponse.redirect(new URL("/student/login", req.url))
        }

        // Redirect /student to /student/login on subdomains
        if (path === "/student") {
          return NextResponse.redirect(new URL("/student/login", req.url))
        }

        // Redirect /manager to /manager/login on subdomains
        if (path === "/manager") {
          return NextResponse.redirect(new URL("/manager/login", req.url))
        }

        // IMPORTANT: Return next response with the updated headers
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      } catch (err) {
        // CRITICAL FIX: If fetch fails, assume subdomain is valid
        log(`⚠️ Error in subdomain API call:`, err)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain)
        requestHeaders.set("x-url", req.url)
        requestHeaders.set("x-api-error", "true")

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
    } catch (err) {
      // CRITICAL FIX: If overall processing fails, assume subdomain is valid
      log(`⚠️ Critical error in subdomain processing:`, err)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-url", req.url)
      requestHeaders.set("x-processing-error", "true")

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  // If accessing the root of the main domain, redirect to admin login
  if (isMainDomain && path === "/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  // Redirect base role paths to their login pages
  if (path === "/admin" || path === "/admin/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  if (path === "/student" || path === "/student/") {
    return NextResponse.redirect(new URL("/student/login", req.url))
  }

  if (path === "/manager" || path === "/manager/") {
    return NextResponse.redirect(new URL("/manager/login", req.url))
  }

  if (path === "/super-admin" || path === "/super-admin/") {
    return NextResponse.redirect(new URL("/super-admin/login", req.url))
  }

  log(`🔍 MIDDLEWARE END: ${method} ${hostname}${path}`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
