import { supabase } from "@/lib/supabase"

export async function uploadLogo(file: File, institutionId: string): Promise<string> {
  const fileExt = file.name.split(".").pop()
  const fileName = `institution_${institutionId}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  console.log(`Uploading logo to path: ${filePath} in logos bucket`)

  try {
    // Get the authenticated user
    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session) {
      throw new Error("No authenticated session found")
    }

    // Upload the file
    const { error } = await supabase.storage.from("logos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading logo:", error)
      throw new Error(`Error uploading logo: ${error.message}`)
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(filePath)
    console.log("Logo uploaded successfully, public URL:", data.publicUrl)

    return data.publicUrl
  } catch (error) {
    console.error("Unexpected error during logo upload:", error)
    throw error
  }
}

export async function uploadFavicon(file: File, institutionId: string): Promise<string> {
  const fileExt = file.name.split(".").pop()
  const fileName = `favicon_${institutionId}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  console.log(`Uploading favicon to path: ${filePath} in favicons bucket`)

  try {
    // Get the authenticated user
    const { data: authData } = await supabase.auth.getSession()
    if (!authData.session) {
      throw new Error("No authenticated session found")
    }

    // Upload the file
    const { error } = await supabase.storage.from("favicons").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading favicon:", error)
      throw new Error(`Error uploading favicon: ${error.message}`)
    }

    const { data } = supabase.storage.from("favicons").getPublicUrl(filePath)
    console.log("Favicon uploaded successfully, public URL:", data.publicUrl)

    return data.publicUrl
  } catch (error) {
    console.error("Unexpected error during favicon upload:", error)
    throw error
  }
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ url: string; path: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    // Since Supabase JS client doesn't provide real-time progress,
    // we'll simulate progress if a callback is provided
    if (onProgress) {
      const steps = 10
      for (let i = 1; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        onProgress((i / steps) * 100)
      }
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    return { url: urlData.publicUrl, path: filePath }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function uploadStatement(file: File, userId: string, packId: string): Promise<string> {
  // Import supabase client dynamically to avoid circular dependencies
  const { getSupabaseBrowserClient } = await import("@/lib/supabase")
  const supabase = getSupabaseBrowserClient()

  // Create a unique file path for the statement
  const filePath = `statements/${userId}/${packId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`

  // Upload the file to Supabase Storage
  const { data, error } = await supabase.storage.from("student-statements").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (error) {
    console.error("Error uploading statement:", error)
    throw new Error(`Failed to upload statement: ${error.message}`)
  }

  // Get the public URL for the uploaded file
  const {
    data: { publicUrl },
  } = supabase.storage.from("student-statements").getPublicUrl(filePath)

  return publicUrl
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  return true
}
