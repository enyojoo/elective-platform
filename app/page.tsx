import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default function Home() {
  // Get the hostname from the request headers
  const headersList = headers()
  const host = headersList.get("host") || ""

  // Check if we're on a subdomain
  if (host.includes(".electivepro.net") && host !== "app.electivepro.net") {
    // For institution subdomains, redirect to student login
    redirect("/student/login")
  } else {
    // For the main app domain, redirect to admin login
    redirect("/admin/login")
  }
}
