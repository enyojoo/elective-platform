import { redirect } from "next/navigation"

export default function BrandingRedirect() {
  redirect("/admin/settings")
}
