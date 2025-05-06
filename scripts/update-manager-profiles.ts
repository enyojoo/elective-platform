import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log("Starting migration: Update manager_profiles table")

    // Read SQL file
    const sqlFilePath = path.join(__dirname, "update-manager-profiles.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Execute SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      throw error
    }

    console.log("Migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
