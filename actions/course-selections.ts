"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getCourseSelections(packId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("course_selections")
    .select(`
      id,
      student_id,
      elective_pack_id,
      selected_courses,
      statement_file_url,
      status,
      created_at,
      updated_at,
      students (
        id,
        name,
        email,
        student_id,
        group_name,
        degree_program
      )
    `)
    .eq("elective_pack_id", packId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching course selections:", error)
    throw new Error("Failed to fetch course selections")
  }

  return data
}

export async function getElectiveCourses(packId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("elective_courses")
    .select(`
      id,
      name,
      description,
      professor,
      credits,
      max_students,
      elective_pack_id
    `)
    .eq("elective_pack_id", packId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching elective courses:", error)
    throw new Error("Failed to fetch elective courses")
  }

  return data
}

export async function downloadStatementFile(fileUrl: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.storage.from("statements").download(fileUrl)

  if (error) {
    console.error("Error downloading statement file:", error)
    throw new Error("Failed to download statement file")
  }

  return data
}

export async function updateCourseSelectionStatus(selectionId: string, status: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("course_selections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", selectionId)
    .select()

  if (error) {
    console.error("Error updating course selection status:", error)
    throw new Error("Failed to update course selection status")
  }

  return data
}
