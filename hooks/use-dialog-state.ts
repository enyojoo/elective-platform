"use client"

import { useState } from "react"

export function useDialogState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  return {
    isOpen,
    openDialog,
    closeDialog,
    setIsOpen,
  }
}
