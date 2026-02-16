import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createRequestId,
  errorResponse,
  internalErrorResponse,
  isUuid,
  sameOriginWriteGuard,
} from "@/lib/api/security"

const ALLOWED_ACTIONS = new Set(["pause", "restart", "start"])
const ALLOWED_STATUSES = new Set([
  "pending",
  "running",
  "running_recon",
  "paused",
  "completed",
  "failed",
])
const ALLOWED_RISK_FILTERS = new Set(["medium-high", "all", "high"])
const ALLOWED_AI_SENSITIVITY = new Set(["low", "medium", "high"])

function booleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId()

  try {
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

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single()

    if (taskError || !task) {
      return errorResponse(404, "NOT_FOUND", "Task not found", requestId)
    }

    const { data: file } = await supabase
      .from("user_files")
      .select("id, filename, file_type, line_count, file_path")
      .eq("id", task.file_id)
      .eq("user_id", user.id)
      .single()

    const responseData = {
      id: task.id,
      name: task.name,
      status: task.status,
      file_id: task.file_id,
      file_name: file?.filename || "Unknown",
      file_path: file?.file_path || "",
      target: task.target ? parseInt(task.target, 10) || 0 : 0,
      credits_used: 0,
      ai_mode: task.ai_mode,
      auto_dumper: task.auto_dumper,
      preset: task.preset,
      parameter_risk_filter: task.parameter_risk_filter,
      ai_sensitivity_level: task.ai_sensitivity_level,
      response_pattern_drift: task.response_pattern_drift,
      baseline_profiling: task.baseline_profiling,
      structural_change_detection: task.structural_change_detection,
      union_based: task.injection_union,
      error_based: task.injection_error,
      boolean_based: task.injection_boolean,
      time_based: task.injection_timebased,
      created_at: task.created_at,
      updated_at: task.updated_at,
      started_at: task.started_at,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      requestId,
    })
  } catch (error) {
    return internalErrorResponse(requestId, "api/v1/tasks/[id]", error)
  }
}

export async function DELETE(
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

    const { data: existingTask } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single()

    if (!existingTask) {
      return errorResponse(404, "NOT_FOUND", "Task not found", requestId)
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id)

    if (deleteError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to delete task", requestId)
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      requestId,
    })
  } catch (error) {
    return internalErrorResponse(requestId, "api/v1/tasks/[id]", error)
  }
}

export async function PATCH(
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

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid JSON body", requestId)
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Unauthorized", requestId)
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("id, status")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single()

    if (!task) {
      return errorResponse(404, "NOT_FOUND", "Task not found or access denied", requestId)
    }

    const updateData: Record<string, unknown> = {}
    const action = typeof body.action === "string" ? body.action : ""
    const status = typeof body.status === "string" ? body.status : ""

    if (action && !ALLOWED_ACTIONS.has(action)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid action", requestId)
    }

    if (action === "pause") {
      updateData.status = "paused"
    } else if (action === "restart") {
      updateData.status = "pending"
      updateData.started_at = null
    } else if (action === "start") {
      updateData.status = "running"
      updateData.started_at = new Date().toISOString()
    } else if (status) {
      if (!ALLOWED_STATUSES.has(status)) {
        return errorResponse(400, "VALIDATION_ERROR", "Invalid status", requestId)
      }
      updateData.status = status
    } else {
      if (typeof body.preset === "string" && body.preset.length <= 100) {
        updateData.preset = body.preset
      } else if (body.preset === null) {
        updateData.preset = null
      }

      const autoDumper = booleanOrUndefined(body.auto_dumper)
      if (autoDumper !== undefined) updateData.auto_dumper = autoDumper
      const aiMode = booleanOrUndefined(body.ai_mode)
      if (aiMode !== undefined) updateData.ai_mode = aiMode
      const responsePatternDrift = booleanOrUndefined(body.response_pattern_drift)
      if (responsePatternDrift !== undefined) updateData.response_pattern_drift = responsePatternDrift
      const baselineProfiling = booleanOrUndefined(body.baseline_profiling)
      if (baselineProfiling !== undefined) updateData.baseline_profiling = baselineProfiling
      const structuralChangeDetection = booleanOrUndefined(body.structural_change_detection)
      if (structuralChangeDetection !== undefined) {
        updateData.structural_change_detection = structuralChangeDetection
      }
      const unionBased = booleanOrUndefined(body.union_based)
      if (unionBased !== undefined) updateData.injection_union = unionBased
      const errorBased = booleanOrUndefined(body.error_based)
      if (errorBased !== undefined) updateData.injection_error = errorBased
      const booleanBased = booleanOrUndefined(body.boolean_based)
      if (booleanBased !== undefined) updateData.injection_boolean = booleanBased
      const timeBased = booleanOrUndefined(body.time_based)
      if (timeBased !== undefined) updateData.injection_timebased = timeBased

      if (
        typeof body.parameter_risk_filter === "string" &&
        ALLOWED_RISK_FILTERS.has(body.parameter_risk_filter)
      ) {
        updateData.parameter_risk_filter = body.parameter_risk_filter
      }

      if (
        typeof body.ai_sensitivity_level === "string" &&
        ALLOWED_AI_SENSITIVITY.has(body.ai_sensitivity_level)
      ) {
        updateData.ai_sensitivity_level = body.ai_sensitivity_level
      }
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(400, "VALIDATION_ERROR", "No valid fields to update", requestId)
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      return errorResponse(500, "INTERNAL_ERROR", "Failed to update task", requestId)
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      requestId,
    })
  } catch (error) {
    return internalErrorResponse(requestId, "api/v1/tasks/[id]", error)
  }
}

