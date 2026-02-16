import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createRequestId,
  errorResponse,
  fetchWithTimeout,
  getAllowedHosts,
  internalErrorResponse,
  isUuid,
  sameOriginWriteGuard,
  validateOutgoingUrl,
} from "@/lib/api/security"

type RiskFilter = "High" | "High-Med" | "All"
type AiSensitivity = "Low" | "Medium" | "High"

function mapRiskFilter(value: string): RiskFilter {
  if (value === "all") return "All"
  if (value === "medium-high") return "High-Med"
  return "High"
}

function mapAiSensitivity(value: string): AiSensitivity {
  if (value === "low") return "Low"
  if (value === "high") return "High"
  return "Medium"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId()

  try {
    const csrfError = sameOriginWriteGuard(request, requestId)
    if (csrfError) return csrfError

    const { id: taskId } = await params
    if (!isUuid(taskId)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid task id format", requestId)
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Unauthorized", requestId)
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      return errorResponse(401, "UNAUTHORIZED", "No active session", requestId)
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("plan, credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return errorResponse(404, "NOT_FOUND", "User profile not found", requestId)
    }

    if (profile.plan === "Free") {
      return errorResponse(
        403,
        "FORBIDDEN",
        "Free plan users cannot start tasks. Please upgrade to Pro or Pro+.",
        requestId
      )
    }

    if (profile.credits < 1) {
      return errorResponse(
        403,
        "FORBIDDEN",
        "Insufficient credits. Please purchase more credits.",
        requestId
      )
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single()

    if (taskError || !task) {
      return errorResponse(404, "NOT_FOUND", "Task not found or access denied", requestId)
    }

    if (task.status === "running" || task.status === "running_recon") {
      return errorResponse(409, "CONFLICT", "Task is already running", requestId)
    }

    const { data: file, error: fileError } = await supabase
      .from("user_files")
      .select("file_path")
      .eq("id", task.file_id)
      .eq("user_id", user.id)
      .single()

    if (fileError || !file) {
      return errorResponse(404, "NOT_FOUND", "File not found", requestId)
    }

    const { data: urlData } = await supabase.storage
      .from("user-files")
      .createSignedUrl(file.file_path, 3600 * 24 * 7)

    if (!urlData?.signedUrl) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to generate download URL", requestId)
    }

    const rawExternalApiDomain = process.env.EXTERNAL_API_DOMAIN ?? "http://localhost:8080"
    const externalBaseUrl = new URL(rawExternalApiDomain)
    const allowedHosts = getAllowedHosts(
      process.env.EXTERNAL_API_ALLOWED_HOSTS,
      externalBaseUrl.hostname
    )
    const safeExternalBaseUrl = await validateOutgoingUrl(
      externalBaseUrl.toString(),
      allowedHosts,
      externalBaseUrl.protocol === "http:"
    )

    if (!safeExternalBaseUrl) {
      return errorResponse(500, "SERVER_MISCONFIGURED", "External API host is not allowed", requestId)
    }

    const externalApiData = {
      taskname: task.name,
      download_url: urlData.signedUrl,
      autodumper: task.auto_dumper || false,
      preset: task.preset || "",
      RiskFiltere: mapRiskFilter(task.parameter_risk_filter),
      AISensitivity: mapAiSensitivity(task.ai_sensitivity_level),
      EvasionEngine: false,
      accesstoken: `Bearer ${session.access_token}`,
    }

    const externalStartUrl = new URL(`/start/${taskId}`, safeExternalBaseUrl)
    const externalResponse = await fetchWithTimeout(
      externalStartUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(externalApiData),
      },
      15000
    )

    const externalData = await externalResponse.json().catch(() => null)
    if (!externalResponse.ok) {
      return errorResponse(502, "UPSTREAM_ERROR", "Failed to start task on external server", requestId, {
        upstreamStatus: externalResponse.status,
      })
    }

    return NextResponse.json({
      success: true,
      message: "success",
      taskid: taskId,
      requestId,
      upstream: externalData?.success === true ? "ok" : "unknown",
    })
  } catch (error) {
    return internalErrorResponse(requestId, "api/v1/tasks/[id]/start", error)
  }
}

