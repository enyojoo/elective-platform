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
