export function getSubdomain(hostname: string): string | null {
  // Skip localhost for development
  if (hostname.includes("localhost")) return null

  // Check if it's a subdomain of electivepro.net
  if (hostname.includes(".electivepro.net")) {
    const subdomain = hostname.split(".")[0]
    // Exclude www and app subdomains
    if (subdomain !== "www" && subdomain !== "app") {
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
