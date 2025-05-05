import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log("Verifying institutions table...")

  // Check if the institutions table exists and has the right structure
  const { data: tableExists, error: tableError } = await supabase.from("institutions").select("id").limit(1)

  if (tableError) {
    console.error("Error checking institutions table:", tableError.message)
    console.log("Please run the fix-institutions-table.sql script first")
    process.exit(1)
  }

  // Check if we have any institutions
  const { count, error: countError } = await supabase.from("institutions").select("*", { count: "exact", head: true })

  if (countError) {
    console.error("Error counting institutions:", countError.message)
    process.exit(1)
  }

  console.log(`Found ${count} institutions`)

  // Add a test institution if none exists
  if (count === 0) {
    console.log("Creating a test institution...")

    const { data: institution, error: createError } = await supabase
      .from("institutions")
      .insert({
        name: "Demo University",
        subdomain: "demo",
        is_active: true,
        primary_color: "#4f46e5",
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating test institution:", createError.message)
      process.exit(1)
    }

    console.log("Created test institution:", institution)
  }

  // Test the RPC functions
  console.log("Testing RPC functions...")

  const { data: exists, error: existsError } = await supabase.rpc("check_subdomain_exists", { subdomain_param: "demo" })

  if (existsError) {
    console.error("Error testing check_subdomain_exists function:", existsError.message)
    console.log("Please run the fix-institutions-table.sql script again")
    process.exit(1)
  }

  console.log('Subdomain "demo" exists:', exists)

  const { data: institution, error: getError } = await supabase
    .rpc("get_institution_by_subdomain", { subdomain_param: "demo" })
    .single()

  if (getError) {
    console.error("Error testing get_institution_by_subdomain function:", getError.message)
    console.log("Please run the fix-institutions-table.sql script again")
    process.exit(1)
  }

  console.log('Institution details for "demo":', institution)

  console.log("Verification complete!")
}

main().catch(console.error)
