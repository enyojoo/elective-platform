export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      elective_courses: {
        Row: {
          id: string
          name: string
          name_ru: string | null
          status: string
          deadline: string
          max_selections: number
          syllabus_template_url: string | null
          courses: Json // This contains the course data as JSON
          institution_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ru?: string | null
          status: string
          deadline: string
          max_selections: number
          syllabus_template_url?: string | null
          courses: Json
          institution_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ru?: string | null
          status?: string
          deadline?: string
          max_selections?: number
          syllabus_template_url?: string | null
          courses?: Json
          institution_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elective_courses_institution_id_fkey"
            columns: ["institution_id"]
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_selections: {
        Row: {
          id: string
          student_id: string
          elective_courses_id: string
          status: string
          statement_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          elective_courses_id: string
          status: string
          statement_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          elective_courses_id?: string
          status?: string
          statement_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_selections_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_selections_elective_courses_id_fkey"
            columns: ["elective_courses_id"]
            referencedRelation: "elective_courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
