export enum UserRole {
  STUDENT = "student",
  PROGRAM_MANAGER = "program_manager",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum Degree {
  BACHELOR = "bachelor",
  MASTER = "master",
  PHD = "phd",
}

export enum Semester {
  FALL = "fall",
  SPRING = "spring",
}

export enum SelectionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum ElectivePackStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CLOSED = "closed",
  ARCHIVED = "archived",
}

export enum SubscriptionPlan {
  FREE = "free",
  STANDARD = "standard",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
}

export interface DegreeType {
  id: number
  name: string
  code: string
}

export interface Institution {
  id: number
  name: string
  domain: string
  plan: SubscriptionPlan
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SuperAdmin {
  id: number
  userId: string
  email: string
  name: string
  createdAt: string
}

export interface ElectiveCourse {
  id: string
  institution_id: string
  name: string
  name_ru: string | null
  status: string
  academic_year: string
  semester: Semester
  deadline: string
  max_selections: number
  syllabus_template_url: string | null
  courses: string[] // Array of course IDs
  created_at: string
  updated_at: string
}

export interface CourseSelection {
  id: string
  institution_id: string
  student_id: string
  elective_courses_id: string
  status: SelectionStatus
  statement_url: string | null
  created_at: string
  updated_at: string
}

export interface FormattedElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  semester: Semester
  academic_year: string
  deadline: string
  max_selections: number
  syllabus_template_url: string | null
  status: string
  course_count: number
  available_spaces: boolean
  selected: boolean
  selection_status: SelectionStatus | null
  selected_count: number
  statement_url: string | null
}
