import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "add-max-students-to-universities.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const { error } = await supabase.rpc("exec_sql", { sql: sqlQuery })

    if (error) {
      throw error
    }

    console.log("Successfully added max_students column to universities table")
  } catch (error) {
    console.error("Error adding max_students column to universities table:", error)
    process.exit(1)
  }
}

main()
