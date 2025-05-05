import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

async function testSubdomain() {
  console.log("Testing subdomain functionality...")

  // Test 1: Check if the institutions table exists and has the right structure
  console.log("\nTest 1: Checking institutions table...")
  const { data: tableInfo, error: tableError } = await supabase
    .from("institutions")
    .select("id, name, subdomain, is_active")
    .limit(1)

  if (tableError) {
    console.error("❌ Error accessing institutions table:", tableError.message)
    return
  }

  console.log("✅ Institutions table exists and is accessible")

  // Test 2: Check if there's at least one active institution
  console.log("\nTest 2: Checking for active institutions...")
  const { data: institutions, error: institutionsError } = await supabase
    .from("institutions")
    .select("id, name, subdomain")
    .eq("is_active", true)

  if (institutionsError) {
    console.error("❌ Error querying active institutions:", institutionsError.message)
    return
  }

  if (!institutions || institutions.length === 0) {
    console.log("❌ No active institutions found. Creating a test institution...")

    // Create a test institution
    const { data: newInst, error: createError } = await supabase
      .from("institutions")
      .insert({
        name: "Demo Institution",
        subdomain: "demo",
        is_active: true,
      })
      .select()

    if (createError) {
      console.error("❌ Error creating test institution:", createError.message)
      return
    }

    console.log("✅ Created test institution:", newInst)
  } else {
    console.log("✅ Found active institutions:", institutions)
  }

  // Test 3: Test direct query by subdomain
  console.log("\nTest 3: Testing direct query by subdomain...")
  const testSubdomain = "demo"
  const { data: instBySubdomain, error: subdomainError } = await supabase
    .from("institutions")
    .select("id, name, subdomain")
    .eq("subdomain", testSubdomain)
    .eq("is_active", true)
    .single()

  if (subdomainError) {
    console.error(`❌ Error querying institution by subdomain '${testSubdomain}':`, subdomainError.message)
    return
  }

  console.log(`✅ Successfully queried institution by subdomain '${testSubdomain}':`, instBySubdomain)

  console.log("\nAll tests completed successfully!")
}

testSubdomain()
  .catch((err) => {
    console.error("Unexpected error:", err)
  })
  .finally(() => {
    process.exit(0)
  })
