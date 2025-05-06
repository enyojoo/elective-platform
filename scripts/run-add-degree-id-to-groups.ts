import { supabase } from "../lib/supabase"

async function runMigration() {
  try {
    console.log("Starting migration: Adding degree_id to groups table...")

    // Execute the SQL to add the degree_id column with the correct UUID type
    const { error } = await supabase.rpc("run_sql", {
      sql_query: `
        ALTER TABLE groups ADD COLUMN IF NOT EXISTS degree_id UUID REFERENCES degrees(id);
        
        UPDATE groups g
        SET degree_id = p.degree_id
        FROM programs p
        WHERE g.program_id = p.id AND g.degree_id IS NULL;
        
        COMMENT ON COLUMN groups.degree_id IS 'Reference to the degree this group belongs to';
      `,
    })

    if (error) {
      console.error("Error running migration:", error)
      return
    }

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Error:", error)
  }
}

runMigration()
