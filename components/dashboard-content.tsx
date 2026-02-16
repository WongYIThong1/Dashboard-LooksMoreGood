"use client"

import * as React from "react"
import {
  IconTrophy,
  IconDatabase,
  IconBell,
  IconCrown,
  IconFlame,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getCachedUserInfo, setCachedUserInfo } from "@/lib/user-cache"
import { toast } from "sonner"

type DashboardUser = {
  user_name: string
  plan: string
  rank: number | null
  injected_total: number
  dumped_total: number
  score: number
  last_week_rank: number | null
  last_week_injected: number
  last_week_dumped: number
}

type LeaderboardItem = {
  rank: number | null
  user_name: string
  score: number
  injected_total: number
  dumped_total: number
}

type RecentActivityItem = {
  taskid: string
  domain: string
  country: string
  category: string
  ts: number
  event_id: string
}

type AnnouncementItem = {
  id: string
  main: string
  subtext: string
  created_at: string
}

type DashboardSnapshot = {
  type: string
  user: DashboardUser
  leaderboard: LeaderboardItem[]
  recent_activity: RecentActivityItem[]
  announcements: AnnouncementItem[]
  ts: number
}

const ACTIVITY_LIMIT = 3
const ANNOUNCEMENT_LIMIT = 3

const DEFAULT_USER: DashboardUser = {
  user_name: "User",
  plan: "Free",
  rank: null,
  injected_total: 0,
  dumped_total: 0,
  score: 0,
  last_week_rank: null,
  last_week_injected: 0,
  last_week_dumped: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }
  return fallback
}

function toInteger(value: unknown, fallback = 0): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.trunc(n))
}

function toRank(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rank = Math.trunc(n)
  return rank > 0 ? rank : null
}

function formatRank(rank: number | null): string {
  return rank === null ? "-" : `#${rank}`
}

function formatCount(value: number): string {
  return value.toLocaleString()
}

function formatTime(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return "-"
  return new Date(ts).toLocaleString()
}

function normalizeUser(input: unknown): DashboardUser {
  if (!isRecord(input)) return { ...DEFAULT_USER }

  const injectedTotal = toInteger(input.injected_total)
  const dumpedTotal = toInteger(input.dumped_total)
  const providedScore = Number(input.score)

  return {
    user_name: toText(input.user_name, DEFAULT_USER.user_name),
    plan: toText(input.plan, DEFAULT_USER.plan),
    rank: toRank(input.rank),
    injected_total: injectedTotal,
    dumped_total: dumpedTotal,
    score: Number.isFinite(providedScore)
      ? Math.max(0, Math.trunc(providedScore))
      : injectedTotal + dumpedTotal * 3,
    last_week_rank: toRank(input.last_week_rank),
    last_week_injected: toInteger(input.last_week_injected, 0),
    last_week_dumped: toInteger(input.last_week_dumped, 0),
  }
}

function normalizeLeaderboard(input: unknown): LeaderboardItem[] {
  if (!Array.isArray(input)) return []
  return input.map((item) => {
    const row = isRecord(item) ? item : {}
    const injectedTotal = toInteger(row.injected_total)
    const dumpedTotal = toInteger(row.dumped_total)
    const providedScore = Number(row.score)

    return {
      rank: toRank(row.rank),
      user_name: toText(row.user_name, "Unknown"),
      score: Number.isFinite(providedScore)
        ? Math.max(0, Math.trunc(providedScore))
        : injectedTotal + dumpedTotal * 3,
      injected_total: injectedTotal,
      dumped_total: dumpedTotal,
    }
  })
}

function normalizeRecentActivity(input: unknown): RecentActivityItem[] {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      const row = isRecord(item) ? item : {}
      return {
        taskid: toText(row.taskid),
        domain: toText(row.domain, "-"),
        country: toText(row.country, "-"),
        category: toText(row.category, "-"),
        ts: toInteger(row.ts),
        event_id: toText(row.event_id),
      }
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, ACTIVITY_LIMIT)
}

function mergeRecentActivity(prev: RecentActivityItem[], incoming: unknown): RecentActivityItem[] {
  if (Array.isArray(incoming)) {
    return normalizeRecentActivity(incoming)
  }

  if (!isRecord(incoming)) {
    return prev.slice(0, ACTIVITY_LIMIT)
  }

  const next = normalizeRecentActivity([incoming])
  if (next.length === 0) return prev.slice(0, ACTIVITY_LIMIT)

  const merged = [...next, ...prev]
  const seen = new Set<string>()
  return merged
    .filter((item) => {
      const key = item.event_id || `${item.taskid}_${item.ts}`
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, ACTIVITY_LIMIT)
}

function dedupeAnnouncements(items: AnnouncementItem[]): AnnouncementItem[] {
  const seen = new Set<string>()
  const merged: AnnouncementItem[] = []
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
    if (merged.length >= ANNOUNCEMENT_LIMIT) break
  }
  return merged
}

function normalizeAnnouncements(input: unknown): AnnouncementItem[] {
  if (!Array.isArray(input)) return []
  const mapped = input.map((item, idx) => {
    const row = isRecord(item) ? item : {}
    const id = toText(row.id, `ann_${idx}`)
    return {
      id,
      main: toText(row.main, "Announcement"),
      subtext: toText(row.subtext),
      created_at: toText(row.created_at),
    }
  })
  return dedupeAnnouncements(mapped)
}

function normalizeSnapshot(input: unknown): DashboardSnapshot {
  const row = isRecord(input) ? input : {}
  return {
    type: toText(row.type, "dashboard_snapshot"),
    user: normalizeUser(row.user),
    leaderboard: normalizeLeaderboard(row.leaderboard),
    recent_activity: normalizeRecentActivity(row.recent_activity),
    announcements: normalizeAnnouncements(row.announcements),
    ts: toInteger(row.ts, Date.now()),
  }
}

export function DashboardContent() {
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const lastEventIdRef = React.useRef<string>("")
  const sseAbortRef = React.useRef<AbortController | null>(null)
  const sseRetryTimerRef = React.useRef<number | null>(null)
  const sseRetryCountRef = React.useRef<number>(0)

  const getAccessToken = React.useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || null
  }, [])

  const applySnapshot = React.useCallback((next: DashboardSnapshot) => {
    setSnapshot(next)

    const cached = getCachedUserInfo()
    setCachedUserInfo({
      id: cached?.id,
      email: cached?.email || "user@example.com",
      username: next.user.user_name,
      plan: next.user.plan,
      avatarUrl: cached?.avatarUrl,
      avatarHash: cached?.avatarHash,
    })
  }, [])

  const fetchDashboard = React.useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      throw new Error("No access token")
    }

    const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || "http://localhost:8080"
    const url = new URL(`${externalApiDomain}/dashboard`)
    url.searchParams.set("top", "0")
    url.searchParams.set("activity_limit", String(ACTIVITY_LIMIT))
    url.searchParams.set("ann_limit", String(ANNOUNCEMENT_LIMIT))

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Dashboard request failed (HTTP ${response.status})`)
    }

    const payload = normalizeSnapshot(await response.json())
    applySnapshot(payload)
  }, [applySnapshot, getAccessToken])

  const fetchAnnouncements = React.useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return

    const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || "http://localhost:8080"
    const response = await fetch(`${externalApiDomain}/announcement`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) return

    const payload = normalizeAnnouncements(await response.json())
    setSnapshot((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        announcements: payload,
        ts: Date.now(),
      }
    })
  }, [getAccessToken])

  const handleDashboardEvent = React.useCallback((raw: string, eventName: string) => {
    if (!raw) return

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (parseError) {
      console.error("[Dashboard SSE] parse error:", parseError)
      return
    }

    const packet = isRecord(parsed) ? parsed : {}
    const packetType = toText(packet.type)
    const eventType = packetType || eventName

    if (eventType === "dashboard_snapshot") {
      applySnapshot(normalizeSnapshot(packet))
      return
    }

    if (eventType === "dashboard_update") {
      setSnapshot((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          user: normalizeUser(packet.user ?? prev.user),
          recent_activity: mergeRecentActivity(prev.recent_activity, packet.recent_activity ?? packet.recent),
          ts: Date.now(),
        }
      })
      return
    }

    if (eventType === "leaderboard_update") {
      setSnapshot((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          leaderboard: normalizeLeaderboard(packet.leaderboard),
          ts: Date.now(),
        }
      })
      return
    }

    if (eventType === "announcement_update") {
      setSnapshot((prev) => {
        if (!prev) return prev

        const incomingList = normalizeAnnouncements(packet.announcements)
        if (incomingList.length > 0) {
          return {
            ...prev,
            announcements: dedupeAnnouncements([...incomingList, ...prev.announcements]),
            ts: Date.now(),
          }
        }

        const incomingOne = normalizeAnnouncements([packet.announcement ?? packet])
        if (incomingOne.length > 0) {
          return {
            ...prev,
            announcements: dedupeAnnouncements([...incomingOne, ...prev.announcements]),
            ts: Date.now(),
          }
        }

        return prev
      })
      void fetchAnnouncements()
    }
  }, [applySnapshot, fetchAnnouncements])

  React.useEffect(() => {
    let cancelled = false

    const clearRetryTimer = () => {
      if (sseRetryTimerRef.current !== null) {
        window.clearTimeout(sseRetryTimerRef.current)
        sseRetryTimerRef.current = null
      }
    }

    const scheduleReconnect = () => {
      if (cancelled) return
      clearRetryTimer()
      const retry = sseRetryCountRef.current + 1
      sseRetryCountRef.current = retry
      const delay = Math.min(30000, 1000 * 2 ** Math.min(retry, 5))
      sseRetryTimerRef.current = window.setTimeout(() => {
        void connectSSE()
      }, delay)
    }

    const connectSSE = async () => {
      if (cancelled) return

      try {
        sseAbortRef.current?.abort()
        const controller = new AbortController()
        sseAbortRef.current = controller

        const token = await getAccessToken()
        if (!token) {
          scheduleReconnect()
          return
        }

        const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || "http://localhost:8080"
        const url = new URL(`${externalApiDomain}/sse/dashboard`)
        if (lastEventIdRef.current) {
          url.searchParams.set("since", lastEventIdRef.current)
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
            ...(lastEventIdRef.current ? { "Last-Event-ID": lastEventIdRef.current } : {}),
          },
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          scheduleReconnect()
          return
        }

        sseRetryCountRef.current = 0

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let currentEvent = ""
        let currentId = ""
        let dataLines: string[] = []

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line === "") {
              const payload = dataLines.join("\n").trim()
              if (currentId) {
                lastEventIdRef.current = currentId
              }
              if (payload) {
                handleDashboardEvent(payload, currentEvent || "message")
              }
              currentEvent = ""
              currentId = ""
              dataLines = []
              continue
            }
            if (line.startsWith(":")) continue
            if (line.startsWith("id:")) {
              currentId = line.slice(3).trim()
              continue
            }
            if (line.startsWith("event:")) {
              currentEvent = line.slice(6).trim()
              continue
            }
            if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trimStart())
            }
          }
        }

        if (!controller.signal.aborted) {
          scheduleReconnect()
        }
      } catch (sseError) {
        if (!cancelled) {
          console.error("[Dashboard SSE] connection error:", sseError)
          scheduleReconnect()
        }
      }
    }

    const bootstrap = async () => {
      setIsLoading(true)
      try {
        await fetchDashboard()
      } catch (fetchError) {
        console.error("[Dashboard] initial fetch failed:", fetchError)
        if (!cancelled) {
          toast.error("Failed to connect to dashboard")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          void connectSSE()
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      clearRetryTimer()
      sseAbortRef.current?.abort()
    }
  }, [fetchDashboard, getAccessToken, handleDashboardEvent])

  const user = snapshot?.user ?? DEFAULT_USER
  const leaderboard = snapshot?.leaderboard ?? []
  const announcements = snapshot?.announcements ?? []
  const recentActivity = snapshot?.recent_activity ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-hide p-4 font-[family-name:var(--font-inter)]">
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Welcome back, {user.user_name}</h1>
            <p className="text-muted-foreground text-sm">{"Here's what's happening with your account today."}</p>
          </>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{formatRank(user.rank)}</p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <IconTrophy className="size-5 text-yellow-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Last week {formatRank(user.last_week_rank)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Injected</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{formatCount(user.injected_total)}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <IconTarget className="size-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Last week {formatCount(user.last_week_injected)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dumped</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{formatCount(user.dumped_total)}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-2">
                <IconDatabase className="size-5 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Last week {formatCount(user.last_week_dumped)}</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="h-[460px] rounded-xl lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFlame className="size-4 text-orange-500" />
                <CardTitle className="text-base">Leaderboard</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">{leaderboard.length} users</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((item, index) => (
                    <TableRow key={`${item.user_name}_${item.rank ?? index}`}>
                      <TableCell>
                        {item.rank === 1 ? (
                          <div className="flex size-7 items-center justify-center rounded-full bg-yellow-500/10">
                            <IconCrown className="size-4 text-yellow-500" />
                          </div>
                        ) : (
                          <span className="pl-2 font-[family-name:var(--font-jetbrains-mono)] text-muted-foreground">
                            {formatRank(item.rank)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.user_name}</span>
                      </TableCell>
                      <TableCell className="text-right font-[family-name:var(--font-jetbrains-mono)]">
                        {formatCount(item.score)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        No leaderboard data
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="h-[190px] rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <IconBell className="size-4 text-blue-500" />
                <CardTitle className="text-base">Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-1.5 size-2 rounded-full bg-blue-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.main}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtext}</p>
                  </div>
                </div>
              ))}
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-[240px] rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <IconDatabase className="size-4 text-purple-500" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto scrollbar-hide space-y-3">
              {recentActivity.map((item, index) => (
                <div key={item.event_id || `${item.taskid}_${index}`} className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.domain}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.country} | {item.category}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-[family-name:var(--font-jetbrains-mono)] text-muted-foreground">
                    {formatTime(item.ts)}
                  </span>
                </div>
              ))}
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent injected activity</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
