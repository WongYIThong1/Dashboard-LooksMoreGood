import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createRequestId,
  errorResponse,
  internalErrorResponse,
  isSafeTxtFilename,
  sameOriginWriteGuard,
} from "@/lib/api/security"

const ALLOWED_FILE_TYPES = new Set(["data", "urls"])

export async function GET(request: Request) {
  const requestId = createRequestId()

  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get("type")
    const minimal = searchParams.get("minimal") === "1"

    if (typeFilter && !ALLOWED_FILE_TYPES.has(typeFilter)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid file type filter", requestId)
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Unauthorized", requestId)
    }

    let filesQuery = supabase
      .from("user_files")
      .select("id, filename, file_type, updated_at, file_size, line_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (typeFilter) {
      filesQuery = filesQuery.eq("file_type", typeFilter)
    }

    const { data: files, error: filesError } = await filesQuery
    if (filesError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to fetch files", requestId)
    }

    if (minimal) {
      return NextResponse.json({
        success: true,
        files: (files || []).map((file) => ({
          id: file.id,
          name: file.filename,
          type: file.file_type,
          modified: file.updated_at,
        })),
        requestId,
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("storage_used, storage_limit")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to fetch storage info", requestId)
    }

    return NextResponse.json({
      success: true,
      files: (files || []).map((file) => ({
        id: file.id,
        name: file.filename,
        size: file.file_size,
        type: file.file_type,
        lines: file.line_count,
        modified: file.updated_at,
      })),
      storage_used: profile?.storage_used || 0,
      storage_max: profile?.storage_limit || 0,
      requestId,
    })
  } catch (error) {
    return internalErrorResponse(requestId, "api/files", error)
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId()

  try {
    const csrfError = sameOriginWriteGuard(request, requestId)
    if (csrfError) return csrfError

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Unauthorized", requestId)
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("name")?.trim() ?? ""
    if (!isSafeTxtFilename(filename)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid filename", requestId)
    }

    const { data: file, error: fileError } = await supabase
      .from("user_files")
      .select("id, file_path")
      .eq("user_id", user.id)
      .eq("filename", filename)
      .single()

    if (fileError || !file) {
      return errorResponse(404, "NOT_FOUND", "File not found", requestId)
    }

    const { error: storageError } = await supabase.storage.from("user-files").remove([file.file_path])
    if (storageError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to delete file from storage", requestId)
    }

    const { error: dbError } = await supabase
      .from("user_files")
      .delete()
      .eq("id", file.id)
      .eq("user_id", user.id)

    if (dbError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to delete file record", requestId)
    }

    return NextResponse.json({ success: true, requestId })
  } catch (error) {
    return internalErrorResponse(requestId, "api/files", error)
  }
}
