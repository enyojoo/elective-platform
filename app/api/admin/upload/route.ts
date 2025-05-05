import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user's institution_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institution_id, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.institution_id) {
      return NextResponse.json({ error: "No institution associated with this user" }, { status: 404 })
    }

    // Verify user is an admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can upload files" }, { status: 403 })
    }

    // Create a unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split(".").pop()
    const fileName = `${profile.institution_id}_${type}_${timestamp}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to the appropriate bucket
    const bucketName = type === "logo" ? "logos" : "favicons"
    const { data, error } = await supabaseAdmin.storage.from(bucketName).upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      console.error(`Error uploading ${type}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrlData.publicUrl })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
