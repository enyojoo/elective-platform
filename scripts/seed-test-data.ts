import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedTestData() {
  // Create test institution
  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .insert({
      name: "Demo University",
      subdomain: "demo",
      primary_color: "#027659",
      is_active: true,
      subscription_plan: "professional",
    })
    .select()
    .single()

  if (institutionError) {
    console.error("Error creating institution:", institutionError)
    return
  }

  console.log("Created institution:", institution)

  // Create admin user
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email: "admin@demo.electivepro.net",
    password: "demo123",
    email_confirm: true,
    user_metadata: { full_name: "Demo Admin" },
  })

  if (userError) {
    console.error("Error creating admin user:", userError)
    return
  }

  // Create admin profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.user.id,
    institution_id: institution.id,
    full_name: "Demo Admin",
    role: "admin",
    email: "admin@demo.electivepro.net",
  })

  if (profileError) {
    console.error("Error creating admin profile:", profileError)
    return
  }

  console.log("Created admin user and profile")

  // Create degrees
  const degrees = [
    { name: "Bachelor's", name_ru: "Бакалавриат", code: "bachelor", duration_years: 4 },
    { name: "Master's", name_ru: "Магистратура", code: "master", duration_years: 2 },
  ]

  for (const degree of degrees) {
    const { error } = await supabase.from("degrees").insert({
      institution_id: institution.id,
      name: degree.name,
      name_ru: degree.name_ru,
      code: degree.code,
      duration_years: degree.duration_years,
      status: "active",
    })

    if (error) {
      console.error(`Error creating degree ${degree.name}:`, error)
    }
  }

  console.log("Created degrees")

  // Get degree IDs
  const { data: degreeData } = await supabase.from("degrees").select("id, name").eq("institution_id", institution.id)

  const degreeMap = new Map(degreeData?.map((d) => [d.name, d.id]) || [])

  // Create programs
  const programs = [
    { name: "Management", name_ru: "Менеджмент", code: "MGT", degree: "Bachelor's" },
    { name: "International Business", name_ru: "Международный бизнес", code: "IB", degree: "Bachelor's" },
    { name: "Management", name_ru: "Менеджмент", code: "MGT", degree: "Master's" },
    { name: "Business Analytics", name_ru: "Бизнес-аналитика", code: "BA", degree: "Master's" },
  ]

  for (const program of programs) {
    const degreeId = degreeMap.get(program.degree)

    if (!degreeId) {
      console.error(`Degree not found for program ${program.name}`)
      continue
    }

    const { error } = await supabase.from("programs").insert({
      institution_id: institution.id,
      degree_id: degreeId,
      name: program.name,
      name_ru: program.name_ru,
      code: program.code,
      status: "active",
    })

    if (error) {
      console.error(`Error creating program ${program.name}:`, error)
    }
  }

  console.log("Created programs")

  // Create academic years
  const { data: programData } = await supabase.from("programs").select("id").eq("institution_id", institution.id)

  const years = ["2023", "2024"]

  for (const program of programData || []) {
    for (const year of years) {
      const { error } = await supabase.from("academic_years").insert({
        institution_id: institution.id,
        program_id: program.id,
        year,
        is_active: true,
      })

      if (error) {
        console.error(`Error creating academic year ${year} for program ${program.id}:`, error)
      }
    }
  }

  console.log("Created academic years")

  console.log("Test data seeding complete")
}

seedTestData()
  .then(() => console.log("Seed script completed"))
  .catch((err) => console.error("Error in seed script:", err))
