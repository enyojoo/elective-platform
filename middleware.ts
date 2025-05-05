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

    // Check if this subdomain exists in the database
    const { data: institution, error } = await supabase
      .from("institutions")
      .select("id, is_active")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    // If subdomain doesn't exist or is not active, redirect to main site
    if (error || !institution) {
      console.log(`Invalid subdomain: ${subdomain}`)
      // Use absolute URL to prevent redirect loops
      return NextResponse.redirect(new URL("https://electivepro.net", req.url))
    }

    // Store subdomain in request headers for later use
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-electivepro-subdomain", subdomain)
    requestHeaders.set("x-institution-id", institution.id)

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
