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
    hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]

    // Store subdomain in request headers for later use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-electivepro-subdomain", subdomain)

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
