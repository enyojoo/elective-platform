export function getSubdomain(hostname: string): string | null {
  // For localhost development, check URL parameters
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // In middleware, we'll handle this differently
    // This is for server components that can't access URL params directly
    return null
  }

  // Check if it's a subdomain of electivepro.net
  if (hostname.includes(".electivepro.net")) {
    const subdomain = hostname.split(".")[0]
    // Exclude www and app subdomains
    if (subdomain !== "www" && subdomain !== "app" && subdomain !== "") {
      return subdomain
    }
  }

  return null
}

export function getInstitutionUrl(subdomain: string): string {
  const isProduction = process.env.NODE_ENV === "production"
  if (isProduction) {
    return `https://${subdomain}.electivepro.net`
  } else {
    return `http://localhost:3000?subdomain=${subdomain}`
  }
}

export async function isValidSubdomain(subdomain: string, supabase: any): Promise<boolean> {
  if (!subdomain || subdomain.trim() === "") {
    console.log("Invalid subdomain: empty or null")
    return false
  }

  try {
    console.log(`Checking validity of subdomain: ${subdomain}`)
    const { data, error } = await supabase
      .from("institutions")
      .select("id")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`Error checking subdomain ${subdomain}:`, error.message)
      return false
    }

    console.log(`Subdomain ${subdomain} validity result:`, !!data)
    return !!data
  } catch (error) {
    console.error("Error checking subdomain validity:", error)
    return false
  }
}
