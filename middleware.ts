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
  console.log(`Processing request for hostname: ${hostname}`)

  const isSubdomain =
    hostname.includes(".electivepro.net") &&
    !hostname.startsWith("www") &&
    !hostname.startsWith("app") &&
    !hostname.startsWith("api")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]
    console.log(`Detected subdomain: ${subdomain}`)

    try {
      // Use the custom function to check if subdomain exists
      const { data: exists, error: checkError } = await supabase.rpc("check_subdomain_exists", {
        subdomain_param: subdomain,
      })

      if (checkError) {
        console.error(`Error checking subdomain: ${checkError.message}`)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      if (!exists) {
        console.log(`Invalid subdomain: ${subdomain}, redirecting to main app`)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      // Get institution details using the custom function
      const { data: institution, error: getError } = await supabase
        .rpc("get_institution_by_subdomain", { subdomain_param: subdomain })
        .single()

      if (getError || !institution) {
        console.error(`Error getting institution: ${getError?.message || "Not found"}`)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      // Valid subdomain - allow access and add institution info to headers
      console.log(`Valid subdomain: ${subdomain}, allowing access to institution: ${institution.name}`)
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-institution-id", institution.id)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (err) {
      console.error("Error in middleware subdomain processing:", err)
      return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
