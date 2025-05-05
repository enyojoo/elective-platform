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
    { name: "favicons", public: true }, // Add a new bucket for favicons
  ]

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.name, { public: bucket.public })

    if (error) {
      if (error.message.includes("already exists")) {
        console.log(`Bucket ${bucket.name} already exists`)
      } else {
        console.error(`Error creating bucket ${bucket.name}:`, error)
      }
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

  // Set up storage policies for favicons
  const { error: faviconsPolicyError } = await supabase.storage.from("favicons").createPolicy("Favicons Access", {
    name: "Favicons Access",
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

  if (faviconsPolicyError) {
    console.error("Error creating favicons policy:", faviconsPolicyError)
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
