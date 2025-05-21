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

// CRITICAL FIX: Add retry logic and better error handling
export async function isValidSubdomain(subdomain: string, supabase: any): Promise<boolean> {
  if (!subdomain || subdomain.trim() === "") {
    console.log("Invalid subdomain: empty or null")
    return false
  }

  // Try up to 3 times with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Checking validity of subdomain (attempt ${attempt}): ${subdomain}`)
      const { data, error } = await supabase
        .from("institutions")
        .select("id")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single()

      if (error) {
        console.error(`Error checking subdomain ${subdomain} (attempt ${attempt}):`, error.message)

        // If it's the last attempt, return false
        if (attempt === 3) return false

        // Otherwise wait and retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }

      const isValid = !!data
      console.log(`Subdomain ${subdomain} validity result (attempt ${attempt}):`, isValid)
      return isValid
    } catch (error) {
      console.error(`Error checking subdomain validity (attempt ${attempt}):`, error)

      // If it's the last attempt, return false
      if (attempt === 3) return false

      // Otherwise wait and retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  // If we get here, all attempts failed
  return false
}
