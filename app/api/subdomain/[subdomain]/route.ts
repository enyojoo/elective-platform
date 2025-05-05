import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  console.log(`API: Checking subdomain: ${subdomain}`)

  try {
    // Use the admin client to bypass RLS completely
    const { data, error } = await supabaseAdmin
      .from("institutions")
      .select("id, name, subdomain, logo_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`API: Error fetching institution: ${error.message}`)
      return NextResponse.json({ exists: false, error: error.message }, { status: 404 })
    }

    if (!data) {
      console.log(`API: No institution found for subdomain: ${subdomain}`)
      return NextResponse.json({ exists: false }, { status: 404 })
    }

    console.log(`API: Found institution: ${data.name}`)
    return NextResponse.json({
      exists: true,
      institution: {
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        logo_url: data.logo_url,
        primary_color: data.primary_color,
      },
    })
  } catch (error: any) {
    console.error(`API: Unexpected error: ${error.message}`)
    return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
  }
}
