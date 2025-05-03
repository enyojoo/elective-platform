import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  const isSubdomain =
    hostname.includes(".electivepro.net") &&
    !hostname.startsWith("www") &&
    !hostname.startsWith("app") &&
    !hostname.startsWith("api")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]
    console.log(`Detected subdomain: ${subdomain}`)

    // Store subdomain in request headers for later use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-electivepro-subdomain", subdomain)

    // Check if this is a static file request
    const url = req.nextUrl.clone()
    const isStaticFile = /\.(jpg|jpeg|png|gif|svg|ico|css|js)$/i.test(url.pathname)

    if (!isStaticFile) {
      // For non-static files, ensure we're using the correct path
      // This helps with routing for institution-specific pages
      if (
        !url.pathname.startsWith("/api") &&
        !url.pathname.startsWith("/_next") &&
        !url.pathname.startsWith("/static")
      ) {
        // Keep the original path but ensure proper routing
        console.log(`Routing subdomain ${subdomain} to path: ${url.pathname}`)
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
