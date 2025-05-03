import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  // Create buckets
  const buckets = [
    { name: "logos", public: true },
    { name: "statements", public: true },
    { name: "documents", public: false },
  ]

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.name, { public: bucket.public })

    if (error) {
      console.error(`Error creating bucket ${bucket.name}:`, error)
    } else {
      console.log(`Bucket ${bucket.name} created successfully`)
    }
  }

  // Set up storage policies
  const { error: logosPolicyError } = await supabase.storage.from("logos").createPolicy("Institution Logo Access", {
    name: "Institution Logo Access",
    definition: {
      statements: [
        {
          effect: "allow",
          action: "select",
          principal: "*",
        },
      ],
    },
  })

  if (logosPolicyError) {
    console.error("Error creating logos policy:", logosPolicyError)
  }

  const { error: statementsPolicyError } = await supabase.storage.from("statements").createPolicy("Statements Access", {
    name: "Statements Access",
    definition: {
      statements: [
        {
          effect: "allow",
          action: "select",
          principal: "*",
        },
        {
          effect: "allow",
          action: "insert",
          principal: {
            type: "authenticated",
          },
        },
      ],
    },
  })

  if (statementsPolicyError) {
    console.error("Error creating statements policy:", statementsPolicyError)
  }
}

setupStorage()
  .then(() => console.log("Storage setup complete"))
  .catch((err) => console.error("Error setting up storage:", err))
