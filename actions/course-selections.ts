"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getCourseSelections(packId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
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
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCourseSelections:", error)
    return []
  }
}

export async function getElectiveCoursesPack(packId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching courses for elective pack ID:", packId)

    // Get the elective_courses record to get the courses array
    const { data: packData, error: packError } = await supabase
      .from("elective_courses")
      .select("courses")
      .eq("id", packId)
      .single()

    if (packError) {
      console.error("Error fetching elective courses pack:", packError)
      console.error("Pack ID:", packId)
      return []
    }

    console.log("Pack data:", packData)

    if (!packData?.courses || !Array.isArray(packData.courses) || packData.courses.length === 0) {
      console.log("No courses found in pack or courses is not an array")
      return []
    }

    console.log("Course UUIDs:", packData.courses)

    // Then get the course details using the UUIDs from the courses array
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        description,
        professor,
        credits,
        max_students
      `)
      .in("id", packData.courses)
      .order("name", { ascending: true })

    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      return []
    }

    console.log("Successfully fetched courses:", coursesData)
    return coursesData || []
  } catch (error) {
    console.error("Error in getElectiveCoursesPack:", error)
    return []
  }
}

export async function getElectiveCoursesPackDetails(packId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching elective courses pack details for ID:", packId)

    // First, let's check if the record exists at all
    const { data: checkData, error: checkError } = await supabase.from("elective_courses").select("*").eq("id", packId)

    console.log("Raw check query result:", { checkData, checkError })

    if (checkError) {
      console.error("Error in check query:", checkError)
      return null
    }

    if (!checkData || checkData.length === 0) {
      console.error("No record found with ID:", packId)
      return null
    }

    // Now get the specific fields we need
    const { data, error } = await supabase
      .from("elective_courses")
      .select(`
        id,
        name,
        description,
        status,
        deadline,
        max_selections,
        created_at,
        updated_at
      `)
      .eq("id", packId)
      .single()

    if (error) {
      console.error("Error fetching elective courses pack details:", error)
      console.error("Pack ID:", packId)
      return null
    }

    console.log("Successfully fetched pack details:", data)
    return data
  } catch (error) {
    console.error("Error in getElectiveCoursesPackDetails:", error)
    return null
  }
}

export async function downloadStatementFile(fileUrl: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase.storage.from("statements").download(fileUrl)

    if (error) {
      console.error("Error downloading statement file:", error)
      throw new Error("Failed to download statement file")
    }

    return data
  } catch (error) {
    console.error("Error in downloadStatementFile:", error)
    throw error
  }
}

export async function updateCourseSelectionStatus(selectionId: string, status: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("course_selections")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectionId)
      .select()

    if (error) {
      console.error("Error updating course selection status:", error)
      throw new Error("Failed to update course selection status")
    }

    return data
  } catch (error) {
    console.error("Error in updateCourseSelectionStatus:", error)
    throw error
  }
}

export async function updateCourseSelection(selectionId: string, selectedCourses: string[]) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("course_selections")
      .update({
        selected_courses: selectedCourses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectionId)
      .select()

    if (error) {
      console.error("Error updating course selection:", error)
      throw new Error("Failed to update course selection")
    }

    return data
  } catch (error) {
    console.error("Error in updateCourseSelection:", error)
    throw error
  }
}
