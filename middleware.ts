import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  console.log(`Middleware: Processing request for hostname: ${hostname}`)

  const isSubdomain =
    hostname.includes(".electivepro.net") &&
    !hostname.startsWith("www") &&
    !hostname.startsWith("app") &&
    !hostname.startsWith("api")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]
    console.log(`Middleware: Detected subdomain: ${subdomain}`)

    try {
      // Use our special API endpoint to check the subdomain
      // This bypasses Supabase RLS completely
      const apiUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/subdomain/${subdomain}`
      console.log(`Middleware: Checking subdomain via API: ${apiUrl}`)

      const response = await fetch(apiUrl)
      const data = await response.json()

      console.log(`Middleware: API response:`, data)

      if (!response.ok || !data.exists) {
        console.log(`Middleware: Invalid subdomain: ${subdomain}, redirecting to main app`)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      // Valid subdomain - allow access and add institution info to headers
      console.log(`Middleware: Valid subdomain: ${subdomain}, allowing access`)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-institution-id", data.institution.id)
      requestHeaders.set("x-institution-name", data.institution.name)

      // IMPORTANT: Return next response with the updated headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (err) {
      console.error("Middleware: Error in subdomain processing:", err)
      return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg|api/subdomain).*)"],
}
