import { supabase } from "./supabase"

export async function uploadLogo(
  file: File,
  institutionId: string,
  isFavicon = false,
): Promise<{ url: string; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop()
    const prefix = isFavicon ? "favicon" : "logo"
    const fileName = `${prefix}_${institutionId}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage.from("logos").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading logo:", error)
      return { url: "", error: error.message }
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(filePath)

    return { url: data.publicUrl }
  } catch (error: any) {
    console.error("Unexpected error in uploadLogo:", error)
    return { url: "", error: error.message }
  }
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<{ url: string; path: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return { url: "", path: "", error: error.message }
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
  } catch (error: any) {
    console.error("Unexpected error in uploadFile:", error)
    return { url: "", path: "", error: error.message }
  }
}

export async function uploadStatement(file: File, userId: string, packId: string): Promise<string> {
  try {
    // Create a unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}_${packId}_${Date.now()}.${fileExt}`
    const filePath = `statements/${fileName}`

    // Upload the file to Supabase Storage
    const { error } = await supabase.storage.from("statements").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from("statements").getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  return true
}
