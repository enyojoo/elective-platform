import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixProfilesRecursion() {
  try {
    console.log("Starting to fix profiles table RLS policies...")

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "fix-profiles-recursion.sql")
    const sql = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return
    }

    console.log("Successfully fixed profiles table RLS policies!")
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

fixProfilesRecursion()
