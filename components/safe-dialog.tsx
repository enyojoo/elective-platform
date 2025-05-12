"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Dialog, type DialogProps } from "@/components/ui/dialog"
import { cleanupDialogEffects } from "@/lib/dialog-utils"

interface SafeDialogProps extends DialogProps {
  children: React.ReactNode
}

export function SafeDialog({ children, open, onOpenChange, ...props }: SafeDialogProps) {
  const isMounted = useRef(true)

  // Set up cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
      cleanupDialogEffects()
    }
  }, [])

  // Ensure cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        if (isMounted.current) {
          cleanupDialogEffects()
        }
      }, 300) // Wait for animation to complete

      return () => clearTimeout(timeout)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </Dialog>
  )
}
