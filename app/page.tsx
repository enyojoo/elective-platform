import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSubdomain } from "@/lib/subdomain-utils"

export default function Home() {
  const headersList = headers()
  const host = headersList.get("host") || ""
  const subdomain = getSubdomain(host)

  // If accessed via subdomain, redirect to student login
  if (subdomain) {
    redirect("/student/login")
  }

  // Otherwise, show the main landing page or redirect to admin login
  redirect("/admin/login")
}
