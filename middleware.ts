import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const method = req.method

  console.log(`Middleware: Processing ${method} request for hostname: ${hostname}, path: ${path}`)

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
    console.log(`Middleware: Development mode, subdomain from query: ${subdomain}`)
  } else {
    // In production, extract subdomain from hostname
    const isSubdomain =
      hostname.includes(".electivepro.net") &&
      !hostname.startsWith("www.") &&
      !hostname.startsWith("app.") &&
      !hostname.startsWith("api.")

    if (isSubdomain) {
      subdomain = hostname.split(".")[0]
      console.log(`Middleware: Production mode, subdomain from hostname: ${subdomain}`)
    }
  }

  const isMainDomain =
    hostname === "app.electivepro.net" || hostname === "electivepro.net" || (isDevelopment && !subdomain)

  // IMPORTANT: /institution-required should NEVER be accessible on a subdomain
  if (path === "/institution-required" && subdomain) {
    console.log(`Middleware: Redirecting /institution-required from subdomain to main domain`)
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
    console.log(`Middleware: Redirecting student/manager route to institution-required: ${path}`)
    // Redirect to institution required page on main domain
    if (isDevelopment) {
      return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
    } else {
      return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
    }
  }

  // RULE 2: Admin and Super-admin routes should ONLY be accessed via main domain
  if (isAdminOrSuperAdminRoute && subdomain) {
    console.log(`Middleware: Redirecting admin route to main domain: ${path}`)
    if (isDevelopment) {
      return NextResponse.redirect(new URL(`http://${mainDomain}${path}`, req.url))
    } else {
      return NextResponse.redirect(new URL(`https://${mainDomain}${path}`, req.url))
    }
  }

  // Handle subdomain routing
  if (subdomain) {
    console.log(`Middleware: Processing subdomain: ${subdomain}`)

    try {
      // Check if this is a dashboard page reload - we'll be more lenient
      const isDashboardPage = path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")

      // Use our special API endpoint to check the subdomain
      let apiUrl
      if (isDevelopment) {
        apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      } else {
        // In production, use the full URL to avoid cross-origin issues
        apiUrl = `https://${hostname}/api/subdomain/${subdomain}`
      }

      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)

      // Set a longer timeout for dashboard pages to prevent premature failures
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), isDashboardPage ? 5000 : 3000)

      const response = await fetch(apiUrl, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        console.error(`Middleware: API error for subdomain ${subdomain}:`, response.status)

        // For dashboard pages, we'll be more lenient and allow the request to proceed
        // This prevents redirects on page reloads when the API might be slow
        if (isDashboardPage) {
          console.log(`Middleware: Allowing dashboard page despite API error: ${path}`)
          const requestHeaders = new Headers(req.headers)
          requestHeaders.set("x-electivepro-subdomain", subdomain)

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }

        // For non-dashboard pages, redirect to institution required page on MAIN domain
        if (isDevelopment) {
          return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
        } else {
          return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
        }
      }

      const data = await response.json()

      if (!data.exists) {
        console.log(`Middleware: Invalid subdomain: ${subdomain}, redirecting to main domain institution-required`)

        // For dashboard pages, we'll log but still allow the request if it's a reload
        if (isDashboardPage && req.headers.get("sec-fetch-mode") === "navigate") {
          console.log(`Middleware: Allowing dashboard page despite invalid subdomain (likely a reload): ${path}`)
          const requestHeaders = new Headers(req.headers)
          requestHeaders.set("x-electivepro-subdomain", subdomain)

          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }

        // Redirect to institution required page on MAIN domain
        if (isDevelopment) {
          return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
        } else {
          return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
        }
      }

      // Valid subdomain - allow access and add institution info to headers
      console.log(`Middleware: Valid subdomain: ${subdomain}, allowing access`)
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

      // --- START: AUTHENTICATION LOGIC FOR PROTECTED SUBDOMAIN ROUTES ---
      const isStudentPath = path.startsWith("/student/")
      const isManagerPath = path.startsWith("/manager/")

      const publicStudentRoutes = [
        "/student/login",
        "/student/signup",
        "/student/forgot-password",
        "/student/reset-password",
      ]
      const publicManagerRoutes = [
        "/manager/login",
        "/manager/signup",
        "/manager/forgot-password",
        "/manager/reset-password",
      ]

      const isProtectedStudentRoute =
        isStudentPath && !publicStudentRoutes.some((publicPath) => path.startsWith(publicPath))
      const isProtectedManagerRoute =
        isManagerPath && !publicManagerRoutes.some((publicPath) => path.startsWith(publicPath))

      if (isProtectedStudentRoute || isProtectedManagerRoute) {
        // Verify the actual name of your Supabase auth cookie.
        // It might be 'sb-access-token' or 'sb-[YOUR_PROJECT_REF]-auth-token'.
        const supabaseAuthCookieName = Object.keys(req.cookies.getAll()).find(
          (name) => name.startsWith("sb-") && name.endsWith("-auth-token"),
        )
        const supabaseAuthCookie = supabaseAuthCookieName ? req.cookies.get(supabaseAuthCookieName) : undefined

        if (!supabaseAuthCookie) {
          let loginUrlPath = "/student/login" // Default
          if (isProtectedManagerRoute) {
            loginUrlPath = "/manager/login"
          }
          console.log(
            `Middleware: Unauthenticated access to ${path} on subdomain ${subdomain}, redirecting to ${loginUrlPath}`,
          )
          const loginUrl = new URL(loginUrlPath, req.url)
          return NextResponse.redirect(loginUrl)
        }
        console.log(`Middleware: Authenticated access to ${path} on subdomain ${subdomain} (cookie found).`)
      }
      // --- END: AUTHENTICATION LOGIC ---

      // Original logic for redirecting root of subdomain, /student, /manager
      if (path === "/") {
        return NextResponse.redirect(new URL("/student/login", req.url))
      }
      if (path === "/student") {
        return NextResponse.redirect(new URL("/student/login", req.url))
      }
      if (path === "/manager") {
        return NextResponse.redirect(new URL("/manager/login", req.url))
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (err) {
      console.error("Middleware: Error in subdomain processing:", err)

      if (path.includes("/dashboard") || path.endsWith("/student") || path.endsWith("/manager")) {
        console.log(`Middleware: Allowing dashboard page despite error: ${path}`)
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set("x-electivepro-subdomain", subdomain)

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }

      if (isDevelopment) {
        return NextResponse.redirect(new URL(`http://${mainDomain}/institution-required`, req.url))
      } else {
        return NextResponse.redirect(new URL(`https://${mainDomain}/institution-required`, req.url))
      }
    }
  }

  // If accessing the root of the main domain, redirect to admin login
  if (isMainDomain && path === "/") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  // Redirect base role paths to their login pages (for main domain access)
  if ((path === "/admin" || path === "/admin/") && isMainDomain) {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }
  if ((path === "/super-admin" || path === "/super-admin/") && isMainDomain) {
    return NextResponse.redirect(new URL("/super-admin/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
