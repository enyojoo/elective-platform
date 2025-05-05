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
  console.log(`Middleware processing request for hostname: ${hostname}`)

  const isSubdomain =
    hostname.includes(".electivepro.net") &&
    !hostname.startsWith("www") &&
    !hostname.startsWith("app") &&
    !hostname.startsWith("api")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]
    console.log(`Detected subdomain: ${subdomain}`)

    // Check if the subdomain exists in the database
    const { data: institution, error } = await supabase
      .from("institutions")
      .select("id, name, subdomain")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`Middleware: Error finding institution for subdomain ${subdomain}:`, error)
    } else if (institution) {
      console.log(`Middleware: Found institution for subdomain ${subdomain}:`, institution.name)
    } else {
      console.log(`Middleware: No institution found for subdomain ${subdomain}`)
    }

    // Store subdomain in request headers for later use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-electivepro-subdomain", subdomain)

    // Also store whether the institution was found
    if (institution) {
      requestHeaders.set("x-electivepro-institution-found", "true")
      requestHeaders.set("x-electivepro-institution-id", institution.id)
    } else {
      requestHeaders.set("x-electivepro-institution-found", "false")
    }

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
