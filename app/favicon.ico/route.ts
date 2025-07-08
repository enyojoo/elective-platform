import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { getSubdomain } from "@/lib/subdomain-utils"
import { supabase } from "@/lib/supabase"

const DEFAULT_FAVICON_URL =
  "https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/favicons//epro_favicon.svg"

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const host = headersList.get("host") || ""
    const subdomain = getSubdomain(host)
    const url = headersList.get("x-url") || ""
    const isAdminPath = url.includes("/admin")

    let faviconUrl = DEFAULT_FAVICON_URL

    // For admin paths, always use default favicon
    if (isAdminPath) {
      faviconUrl = DEFAULT_FAVICON_URL
    } else if (subdomain) {
      // Try to get institution favicon from subdomain
      const { data: institution } = await supabase
        .from("institutions")
        .select("favicon_url")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single()

      if (institution?.favicon_url) {
        faviconUrl = institution.favicon_url
      }
    }

    // Fetch the favicon from the URL
    const faviconResponse = await fetch(faviconUrl)

    if (!faviconResponse.ok) {
      // Fallback to default if fetch fails
      const defaultResponse = await fetch(DEFAULT_FAVICON_URL)
      if (defaultResponse.ok) {
        const buffer = await defaultResponse.arrayBuffer()
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
          },
        })
      }
      return new NextResponse("Not Found", { status: 404 })
    }

    const buffer = await faviconResponse.arrayBuffer()
    const contentType = faviconResponse.headers.get("content-type") || "image/x-icon"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error serving favicon:", error)

    // Fallback to default favicon
    try {
      const defaultResponse = await fetch(DEFAULT_FAVICON_URL)
      if (defaultResponse.ok) {
        const buffer = await defaultResponse.arrayBuffer()
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=3600",
          },
        })
      }
    } catch (fallbackError) {
      console.error("Error serving default favicon:", fallbackError)
    }

    return new NextResponse("Not Found", { status: 404 })
  }
}
