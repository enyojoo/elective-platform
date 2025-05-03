import { supabase } from "./supabase"

export async function uploadLogo(file: File, institutionId: string) {
  const fileExt = file.name.split(".").pop()
  const fileName = `institution_${institutionId}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage.from("logos").upload(filePath, file)

  if (error) {
    throw new Error(`Error uploading logo: ${error.message}`)
  }

  const { data } = await supabase.storage.from("logos").getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadStatement(file: File, userId: string, packId: string) {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}_${packId}_${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage.from("statements").upload(filePath, file)

  if (error) {
    throw new Error(`Error uploading statement: ${error.message}`)
  }

  const { data } = await supabase.storage.from("statements").getPublicUrl(filePath)

  return data.publicUrl
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`)
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

  const { data: urlData } = await supabase.storage.from(bucketName).getPublicUrl(filePath)

  return { url: urlData.publicUrl, path: filePath }
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  return true
}
