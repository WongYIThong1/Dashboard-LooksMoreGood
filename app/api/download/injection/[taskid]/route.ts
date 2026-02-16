import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function filenameFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").filter(Boolean).pop()
    return decodeURIComponent(last || fallback)
  } catch {
    return fallback
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskid: string }> }
) {
  try {
    const { taskid } = await params

    if (!isUuid(taskid)) {
      return NextResponse.json(
        { success: false, error: "invalid taskid format: UUID required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session || !session.access_token || session.access_token.length < 20) {
      return NextResponse.json(
        { success: false, error: "missing or invalid bearer token" },
        { status: 401 }
      )
    }

    const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || "http://localhost:8080"
    const metaResp = await fetch(`${externalApiDomain}/download/injection/${taskid}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const meta = await metaResp.json().catch(() => null)
    const downloadUrl: string | undefined = meta?.downloadurl || meta?.download_url

    if (!metaResp.ok || !meta?.success || !downloadUrl) {
      const msg =
        meta?.error ||
        meta?.message ||
        (metaResp.status === 404 ? "injection file not found" : `failed to create download url (HTTP ${metaResp.status})`)
      return NextResponse.json({ success: false, error: msg }, { status: metaResp.status || 500 })
    }

    const fileResp = await fetch(downloadUrl, { method: "GET", cache: "no-store" })
    if (!fileResp.ok || !fileResp.body) {
      return NextResponse.json(
        { success: false, error: `failed to download file (HTTP ${fileResp.status})` },
        { status: 500 }
      )
    }

    const contentType = fileResp.headers.get("content-type") || "application/octet-stream"
    const fallbackName = `${taskid}.csv`
    const fileName = filenameFromUrl(downloadUrl, fallbackName)

    return new NextResponse(fileResp.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[api/download/injection] error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

