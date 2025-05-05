import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

async function main() {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    })

    console.log("Reading SQL file...")
    const sqlFilePath = path.join(__dirname, "disable-profiles-rls.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    console.log("Executing SQL to disable RLS for profiles table...")
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Error executing SQL:", error)
      process.exit(1)
    }

    console.log("Successfully disabled RLS for profiles table")
    console.log(
      "WARNING: This is a temporary security measure. Re-implement proper RLS policies after fixing the root cause.",
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }
}

main()
