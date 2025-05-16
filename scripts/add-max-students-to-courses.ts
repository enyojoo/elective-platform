import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  try {
    console.log("Adding max_students column to courses table...")

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "add-max-students-to-courses.sql")
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      throw error
    }

    console.log("Successfully added max_students column to courses table")
  } catch (error) {
    console.error("Error adding max_students column:", error)
    process.exit(1)
  }
}

main()
