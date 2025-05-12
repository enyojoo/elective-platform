/**
 * Utility functions for managing dialogs and preventing UI freezing issues
 */

/**
 * Ensures that any lingering dialog-related DOM modifications are cleaned up
 * Call this function when experiencing UI freezing issues after dialog closes
 */
export function cleanupDialogEffects() {
  // Reset body styles
  document.body.style.removeProperty("overflow")
  document.body.style.removeProperty("padding-right")
  document.body.removeAttribute("aria-hidden")

  // Remove any data-radix-* attributes from the body
  const attributes = [...document.body.attributes]
  attributes.forEach((attr) => {
    if (attr.name.startsWith("data-radix-")) {
      document.body.removeAttribute(attr.name)
    }
  })
}

/**
 * Attach this to your app's error boundary to automatically clean up dialog effects
 * when an error occurs
 */
export function handleDialogError(error: Error) {
  console.error("Dialog error occurred:", error)
  cleanupDialogEffects()
}
