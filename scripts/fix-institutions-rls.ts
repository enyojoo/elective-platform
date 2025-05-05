import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables. Please check your .env file.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixInstitutionsRLS() {
  console.log("Starting to fix RLS policies for institutions table...")

  try {
    // First, let's check if the table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("institutions").select("id").limit(1)

    if (tableCheckError) {
      console.error("Error checking institutions table:", tableCheckError.message)
      return
    }

    console.log("Institutions table exists, proceeding with RLS fixes...")

    // Execute SQL to fix RLS policies
    const { error: revokeError } = await supabase.rpc("revoke_all_on_institutions")
    if (revokeError) {
      console.error("Error revoking permissions:", revokeError.message)
    } else {
      console.log("Successfully revoked all permissions on institutions table")
    }

    // Create new RLS policies
    const { error: policyError } = await supabase.rpc("create_institutions_policies")
    if (policyError) {
      console.error("Error creating policies:", policyError.message)
    } else {
      console.log("Successfully created new RLS policies for institutions table")
    }

    console.log("RLS policy update completed!")
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

fixInstitutionsRLS()
  .then(() => {
    console.log("Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Script failed:", error)
    process.exit(1)
  })
