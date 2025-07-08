"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Clock, MapPin, Globe, CheckCircle, XCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { useCachedStudentSelections } from "@/hooks/use-cached-student-selections"

interface University {
  id: string
  name: string
  country: string
  city: string
  description: string
  max_students: number
  current_students: number
}

interface ExchangePack {
  id: string
  name: string
  description: string
  universities: University[]
  max_selections: number
  selection_deadline: string
  status: string
}

export default function ExchangePackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.packId as string
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const [pack, setPack] = useState<ExchangePack | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])

  const { profile } = useCachedStudentProfile()
  const { selections: exchangeSelections } = useCachedStudentSelections(profile?.id)

  useEffect(() => {
    if (packId) {
      fetchPackDetails()
    }
  }, [packId])

  useEffect(() => {
    // Set existing selections when data loads
    if (exchangeSelections.length > 0 && pack) {
      const existingSelection = exchangeSelections.find((s) => s.elective_exchange?.id === pack.id)
      if (existingSelection && existingSelection.selected_ids) {
        setSelectedUniversities(existingSelection.selected_ids)
      }
    }
  }, [exchangeSelections, pack])

  const fetchPackDetails = async () => {
    try {
      setLoading(true)

      // Fetch elective exchange pack details
      const { data: packData, error: packError } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("id", packId)
        .single()

      if (packError) throw packError

      if (!packData) {
        toast({
          title: "Error",
          description: "Exchange pack not found",
          variant: "destructive",
        })
        router.push("/student/exchange")
        return
      }

      // Fetch universities with enrollment counts
      const universitiesWithEnrollment = await Promise.all(
        (packData.universities || []).map(async (university: any) => {
          // Count pending and approved selections for this university
          const { count, error: countError } = await supabase
            .from("exchange_selections")
            .select("*", { count: "exact", head: true })
            .eq("elective_exchange_id", packId)
            .contains("selected_ids", [university.id])
            .in("status", ["pending", "approved"])

          if (countError) {
            console.error("Error counting enrollments:", countError)
            return { ...university, current_students: 0 }
          }

          return {
            ...university,
            current_students: count || 0,
          }
        }),
      )

      setPack({
        ...packData,
        universities: universitiesWithEnrollment,
      })
    } catch (error: any) {
      console.error("Error fetching pack details:", error)
      toast({
        title: "Error",
        description: "Failed to load exchange pack details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUniversityToggle = (universityId: string) => {
    if (!pack) return

    const university = pack.universities.find((u) => u.id === universityId)
    if (!university) return

    // Check if university is full (excluding current user's selection)
    const isCurrentlySelected = selectedUniversities.includes(universityId)
    if (!isCurrentlySelected && university.current_students >= university.max_students) {
      toast({
        title: "University Full",
        description: "This university has reached its maximum capacity",
        variant: "destructive",
      })
      return
    }

    setSelectedUniversities((prev) => {
      if (prev.includes(universityId)) {
        return prev.filter((id) => id !== universityId)
      } else {
        if (prev.length >= pack.max_selections) {
          toast({
            title: "Selection Limit Reached",
            description: `You can only select up to ${pack.max_selections} universities`,
            variant: "destructive",
          })
          return prev
        }
        return [...prev, universityId]
      }
    })
  }

  const handleSubmit = async () => {
    if (!profile || !pack) return

    if (selectedUniversities.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one university",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // Check if user already has a selection for this pack
      const existingSelection = exchangeSelections.find((s) => s.elective_exchange?.id === pack.id)

      if (existingSelection) {
        // Update existing selection
        const { error } = await supabase
          .from("exchange_selections")
          .update({
            selected_ids: selectedUniversities,
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSelection.id)

        if (error) throw error
      } else {
        // Create new selection
        const { error } = await supabase.from("exchange_selections").insert({
          student_id: profile.id,
          elective_exchange_id: pack.id,
          selected_ids: selectedUniversities,
          status: "pending",
        })

        if (error) throw error
      }

      toast({
        title: "Success",
        description: "Your exchange selection has been submitted",
      })

      router.push("/student/exchange")
    } catch (error: any) {
      console.error("Error submitting selection:", error)
      toast({
        title: "Error",
        description: "Failed to submit exchange selection",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getExistingSelection = () => {
    return exchangeSelections.find((s) => s.elective_exchange?.id === pack?.id)
  }

  const existingSelection = getExistingSelection()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exchange Pack Not Found</h1>
          <Button onClick={() => router.push("/student/exchange")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exchange
          </Button>
        </div>
      </div>
    )
  }

  const isDeadlinePassed = new Date() > new Date(pack.selection_deadline)
  const canModify = !isDeadlinePassed && pack.status === "published"

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/student/exchange")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exchange
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{pack.name}</CardTitle>
              <CardDescription className="mt-2">{pack.description}</CardDescription>
            </div>
            <Badge variant={pack.status === "published" ? "default" : "secondary"}>{pack.status}</Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Deadline: {new Date(pack.selection_deadline).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Select up to {pack.max_selections} universities
            </div>
          </div>
        </CardHeader>
      </Card>

      {existingSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {existingSelection.status === "approved" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : existingSelection.status === "rejected" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              Current Selection Status: {existingSelection.status}
            </CardTitle>
            <CardDescription>
              {existingSelection.status === "pending" && "Your selection is being reviewed"}
              {existingSelection.status === "approved" && "Your selection has been approved"}
              {existingSelection.status === "rejected" && "Your selection was rejected. You can make a new selection."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {pack.universities.map((university) => {
          const isSelected = selectedUniversities.includes(university.id)
          const isFull = university.current_students >= university.max_students
          const canSelect = canModify && (!isFull || isSelected)

          return (
            <Card
              key={university.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? "ring-2 ring-primary" : ""
              } ${!canSelect ? "opacity-50" : ""}`}
              onClick={() => canSelect && handleUniversityToggle(university.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{university.name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4" />
                    <span className={isFull ? "text-red-500 font-medium" : ""}>
                      {university.current_students}/{university.max_students}
                    </span>
                  </div>
                </div>
                <CardDescription>{university.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Country: {university.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>City: {university.city}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Badge variant={isSelected ? "default" : "outline"}>{isSelected ? "Selected" : "Available"}</Badge>
                  {isFull && !isSelected && <Badge variant="destructive">Full</Badge>}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {canModify && (
        <div className="flex justify-end gap-4">
          <Button onClick={handleSubmit} disabled={submitting || selectedUniversities.length === 0} size="lg">
            {submitting ? "Submitting..." : existingSelection ? "Update Selection" : "Submit Selection"}
          </Button>
        </div>
      )}

      {isDeadlinePassed && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>The selection deadline has passed. No changes can be made.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
