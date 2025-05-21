import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cache for subdomain validation results
const subdomainCache = new Map<string, { valid: boolean; data?: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function middleware(req: NextRequest) {
  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  const path = req.nextUrl.pathname
  const url = new URL(req.url)

  console.log(`Middleware: Processing request for hostname: ${hostname}, path: ${path}`)

  // Check if we're in development mode (localhost)
  const isDevelopment = hostname.includes("localhost") || hostname.includes("127.0.0.1")

  // Define main domain based on environment
  const mainDomain = isDevelopment ? "localhost:3000" : "app.electivepro.net"
  const mainDomainUrl = isDevelopment ? `http://${mainDomain}` : `https://${mainDomain}`

  // Extract subdomain parameter in development mode
  let subdomain = null
  if (isDevelopment) {
    // In development, get subdomain from query parameter
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
    return NextResponse.redirect(new URL(`${mainDomainUrl}/institution-required`, req.url))
  }

  // Check if the path is for student or manager routes
  const isStudentOrManagerRoute = path.startsWith("/student/") || path.startsWith("/manager/")

  // Check if the path is for admin or super-admin routes
  const isAdminOrSuperAdminRoute = path.startsWith("/admin/") || path.startsWith("/super-admin/")

  // RULE 1: Student and Manager routes should ONLY be accessed via subdomain
  if (isStudentOrManagerRoute && !subdomain) {
    console.log(`Middleware: Redirecting student/manager route to institution-required: ${path}`)
    // Redirect to institution required page on main domain
    return NextResponse.redirect(new URL(`${mainDomainUrl}/institution-required`, req.url))
  }

  // RULE 2: Admin and Super-admin routes should ONLY be accessed via main domain
  if (isAdminOrSuperAdminRoute && subdomain) {
    console.log(`Middleware: Redirecting admin route to main domain: ${path}`)
    return NextResponse.redirect(new URL(`${mainDomainUrl}${path}`, req.url))
  }

  // Handle subdomain routing
  if (subdomain) {
    console.log(`Middleware: Processing subdomain: ${subdomain}`)

    try {
      // Check if we have a valid cached result for this subdomain
      const cacheKey = subdomain
      const cachedResult = subdomainCache.get(cacheKey)
      const now = Date.now()

      let isValidSubdomain = false
      let institutionData = null

      // Use cached result if available and not expired
      if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
        console.log(`Middleware: Using cached subdomain validation for ${subdomain}`)
        isValidSubdomain = cachedResult.valid
        institutionData = cachedResult.data
      } else {
        // No valid cache, need to validate subdomain via API
        console.log(`Middleware: No valid cache for ${subdomain}, validating via API`)

        // Use our special API endpoint to check the subdomain
        let apiUrl
        if (isDevelopment) {
          apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
        } else {
          // In production, use the full URL to avoid cross-origin issues
          apiUrl = `https://${hostname}/api/subdomain/${subdomain}`
        }

        console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)

        const response = await fetch(apiUrl, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          console.error(`Middleware: API error for subdomain ${subdomain}:`, response.status)
          // Cache the negative result
          subdomainCache.set(cacheKey, { valid: false, timestamp: now })
          // Redirect to institution required page on MAIN domain
          return NextResponse.redirect(new URL(`${mainDomainUrl}/institution-required`, req.url))
        }

        const data = await response.json()
        isValidSubdomain = data.exists
        institutionData = data.institution

        // Cache the result
        subdomainCache.set(cacheKey, {
          valid: isValidSubdomain,
          data: institutionData,
          timestamp: now,
        })
      }

      if (!isValidSubdomain) {
        console.log(`Middleware: Invalid subdomain: ${subdomain}, redirecting to main domain institution-required`)
        // Redirect to institution required page on MAIN domain
        return NextResponse.redirect(new URL(`${mainDomainUrl}/institution-required`, req.url))
      }

      // Valid subdomain - allow access and add institution info to headers
      console.log(`Middleware: Valid subdomain: ${subdomain}, allowing access`)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)

      if (institutionData) {
        requestHeaders.set("x-institution-id", institutionData.id)
        requestHeaders.set("x-institution-name", institutionData.name)

        // Add favicon and primary color to headers if available
        if (institutionData.favicon_url) {
          requestHeaders.set("x-institution-favicon-url", institutionData.favicon_url)
        }
        if (institutionData.primary_color) {
          requestHeaders.set("x-institution-primary-color", institutionData.primary_color)
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
      console.error("Middleware: Error in subdomain processing:", err)
      // Redirect to institution required page on MAIN domain
      return NextResponse.redirect(new URL(`${mainDomainUrl}/institution-required`, req.url))
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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain|api/auth).*)"],
}
