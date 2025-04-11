"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectionStatus } from "@/lib/types"

interface ElectivePackSelectionProps {
  courses: any[] // Replace 'any' with a more specific type if possible
  maxSelections: number
  existingSelection: any // Replace 'any' with a more specific type if possible
  packId: string
}

export function ElectivePackSelection({
  courses,
  maxSelections,
  existingSelection,
  packId,
}: ElectivePackSelectionProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(existingSelection?.selectedCourseIds || [])

  const handleCourseSelect = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (selectedCourses.length < maxSelections) {
        setSelectedCourses([...selectedCourses, courseId])
      } else {
        alert(`You can only select up to ${maxSelections} courses.`)
      }
    }
  }

  const handleSubmit = () => {
    // In a real application, you would send the selectedCourses to the server
    console.log("Selected courses:", selectedCourses)
    alert("Selection submitted!")
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <p>Select your preferred elective courses for this pack:</p>
        <div className="space-y-2">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center space-x-2">
              <Checkbox
                id={`course-${course.id}`}
                checked={selectedCourses.includes(course.id)}
                onCheckedChange={() => handleCourseSelect(course.id)}
                disabled={existingSelection?.status === SelectionStatus.APPROVED}
              />
              <label
                htmlFor={`course-${course.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {course.name} - {course.teacher} ({course.credits} credits)
              </label>
            </div>
          ))}
        </div>
        <Button onClick={handleSubmit} disabled={existingSelection?.status === SelectionStatus.APPROVED}>
          Submit Selection
        </Button>
      </CardContent>
    </Card>
  )
}
