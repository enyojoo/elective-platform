interface ProgramData {
  programs: string[]
  years: string[]
  groups: Record<string, string[]>
}

export function extractProgramData(): ProgramData {
  // Define the programs and years for GSOM
  const programs = ["International Management", "Management", "Public Administration"]
  const years = ["2024", "2023", "2022", "2021"]

  // Define the groups for each program and year
  const groups: Record<string, string[]> = {
    "International Management-2021": ["21.B10", "21.B11", "21.B12"],
    "International Management-2022": ["22.B12", "22.B13"],
    "International Management-2023": ["23.B11", "23.B12"],
    "International Management-2024": ["24.B11", "24.B12"],
    "Management-2022": ["22.B01", "22.B02", "22.B03", "22.B04", "22.B05", "22.B06", "22.B07", "22.B08"],
    "Management-2023": ["23.B01", "23.B02", "23.B03", "23.B04", "23.B05", "23.B06", "23.B07"],
    "Management-2024": ["24.B01", "24.B02", "24.B03", "24.B04", "24.B05", "24.B06", "24.B07", "24.B08"],
    "Public Administration-2021": ["21.B09", "21.B13"],
    "Management-2021": ["21.B01", "21.B02", "21.B03", "21.B04", "21.B05", "21.B06", "21.B07", "21.B08", "21.B14"],
    "Public Administration-2023": ["23.B09", "23.B10"],
    "Public Administration-2024": ["24.B09", "24.B10"],
    "Public Administration-2022": ["22.B10", "22.B11"],
    // Master's degree programs
    "Management-2023-master": ["23.M01"],
    "Management-2024-master": ["24.M01"],
    "Business Analytics and Big Data-2023-master": ["23.M04"],
    "Business Analytics and Big Data-2024-master": ["24.M04"],
    "Smart City Management-2023-master": ["23.M03"],
    "Smart City Management-2024-master": ["24.M03"],
    "Corporate Finance-2023-master": ["23.M02"],
    "Corporate Finance-2024-master": ["24.M02"],
  }

  return { programs, years, groups }
}

// Function to get a display name for a program code
export function getProgramDisplayName(programCode: string): string {
  return programCode // Already using display names
}

// Function to get a display name for a group
export function getGroupDisplayName(group: string): string {
  // Format the group name for display
  // e.g., "23.B12" -> "B12" or "23.Б12" -> "Б12"
  const parts = group.split(".")
  if (parts.length >= 2) {
    return parts[1]
  }
  return group
}

// Function to get program code for slug
function getProgramCode(program: string): string {
  switch (program) {
    case "Management":
      return "men" // from Менеджмент
    case "International Management":
      return "mmen" // from Международный менеджмент
    case "Public Administration":
      return "gmu" // from Государственное и муниципальное управление
    case "Business Analytics and Big Data":
      return "babd" // from Бизнес-аналитика и большие данные
    case "Smart City Management":
      return "scm" // from Управление умным городом
    case "Corporate Finance":
      return "cfin" // from Корпоративные финансы
    default:
      return "prog"
  }
}

// Function to get degree code for slug
function getDegreeCode(degree: string): string {
  if (degree === "master") {
    return "mag" // from Магистратура
  }
  return "bak" // from Бакалавриат
}

// Function to generate a slug for the URL
export function generateSlug(program: string, year: string, group: string, degree = "bachelor"): string {
  // Extract the year prefix (e.g., 2023 -> 23)
  const yearPrefix = year.substring(2)

  // Extract the group code (e.g., 23.B12 -> B12 or 23.Б12 -> Б12)
  const groupCode = getGroupDisplayName(group).toLowerCase()

  // Get program code for the slug
  const programCode = getProgramCode(program)

  // Get degree code for the slug
  const degreeCode = getDegreeCode(degree)

  // Generate the slug (e.g., bak-men-24-b01 or mag-men-24-b01)
  return `${degreeCode}-${programCode}-${yearPrefix}-${groupCode}`
}
