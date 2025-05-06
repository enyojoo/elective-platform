/**
 * Utility functions for managing dialogs and preventing UI freezing issues
 */

/**
 * Ensures that any lingering dialog-related DOM modifications are cleaned up
 * Call this function when experiencing UI freezing issues after dialog closes
 */
export function cleanupDialogEffects() {
  // Remove any dialog-related classes from the body
  document.body.classList.remove("overflow-hidden")

  // Reset body styles that might have been modified by dialogs
  const bodyStyle = document.body.style
  bodyStyle.removeProperty("overflow")
  bodyStyle.removeProperty("padding-right")

  // Remove any lingering backdrop/overlay elements
  const overlays = document.querySelectorAll("[data-radix-portal]")
  overlays.forEach((overlay) => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
  })

  // Force focus back to the document body to prevent focus trapping
  document.body.focus()

  // Reset tab index on body to ensure it can receive focus
  document.body.tabIndex = -1
}

/**
 * Attach this to your app's error boundary to automatically clean up dialog effects
 * when an error occurs
 */
export function handleDialogError(error: Error) {
  console.error("Dialog error occurred:", error)
  cleanupDialogEffects()
}
