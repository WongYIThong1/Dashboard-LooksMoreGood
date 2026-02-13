"use client"

import * as React from "react"
import {
  IconTrophy,
  IconDatabase,
  IconChartBar,
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
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { getCachedUserInfo, setCachedUserInfo } from "@/lib/user-cache"

const leaderboardData = [
  { rank: 1, username: "Alice", score: 28470 },
  { rank: 2, username: "Bob", score: 26540 },
  { rank: 3, username: "Charlie", score: 25010 },
  { rank: 4, username: "David", score: 23980 },
  { rank: 5, username: "Eva", score: 22450 },
  { rank: 6, username: "Frank", score: 21020 },
  { rank: 7, username: "Grace", score: 19870 },
  { rank: 8, username: "Henry", score: 18540 },
  { rank: 9, username: "Ivy", score: 17420 },
  { rank: 10, username: "Jack", score: 16980 },
  { rank: 11, username: "Kate", score: 15640 },
  { rank: 12, username: "Leo", score: 14520 },
  { rank: 13, username: "Mia", score: 13890 },
  { rank: 14, username: "Noah", score: 12760 },
  { rank: 15, username: "Olivia", score: 11540 },
]

const currentUser = { rank: 42, username: "You", score: 1234 }

const announcements = [
  { title: "System Maintenance", desc: "Scheduled maintenance on Saturday 2:00-4:00 AM", isNew: true },
  { title: "New Feature Released", desc: "Real-time leaderboard updates now available", isNew: true },
  { title: "Monthly Challenge", desc: "January injection challenge starts soon", isNew: false },
]

const recentActivity = [
  { domain: "example.com", rows: 1542, status: "success" },
  { domain: "test-site.de", rows: 892, status: "success" },
  { domain: "shop.jp", rows: 0, status: "failed" },
  { domain: "store.cn", rows: 4512, status: "success" },
]

export function DashboardContent() {
  const [username, setUsername] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchUsername = async () => {
      // 先从缓存获取
      const cached = getCachedUserInfo()
      if (cached) {
        setUsername(cached.username)
        setIsLoading(false)
      }

      // 然后从服务器获取最新数据
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', user.id)
            .single()

          const fetchedUsername = profile?.username || user.email?.split('@')[0] || 'User'
          setUsername(fetchedUsername)
          setCachedUserInfo({
            id: user.id,
            username: fetchedUsername,
            email: user.email || 'user@example.com',
            plan: 'Free',
          })
        }
      } catch (error) {
        console.error('Failed to fetch username:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsername()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 font-[family-name:var(--font-inter)]">
      {/* Welcome & Stats */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Welcome back, {username || 'User'}</h1>
            <p className="text-muted-foreground text-sm">{"Here's what's happening with your account today."}</p>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">#42</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <IconTrophy className="size-5 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+8 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Injected</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">1,234</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <IconTarget className="size-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+156 today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dumped</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">58.4K</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <IconDatabase className="size-5 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <IconTrendingUp className="size-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+2.8K this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">94.2%</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <IconChartBar className="size-5 text-emerald-500" />
              </div>
            </div>
            <Progress value={94.2} className="h-1 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Leaderboard */}
        <Card className="rounded-xl lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFlame className="size-4 text-orange-500" />
                <CardTitle className="text-base">Leaderboard</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">{leaderboardData.length} users</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((item) => (
                    <TableRow key={item.rank}>
                      <TableCell>
                        {item.rank === 1 ? (
                          <div className="flex items-center justify-center size-7 rounded-full bg-yellow-500/10">
                            <IconCrown className="size-4 text-yellow-500" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)] pl-2">
                            #{item.rank}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.username}</span>
                      </TableCell>
                      <TableCell className="text-right font-[family-name:var(--font-jetbrains-mono)]">
                        {item.score.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Current User Row - Fixed at bottom */}
            <div className="border-t bg-muted/30">
              <Table>
                <TableBody>
                  <TableRow className="bg-emerald-500/5">
                    <TableCell className="w-16">
                      <span className="text-emerald-500 font-[family-name:var(--font-jetbrains-mono)] font-medium pl-2">
                        #{currentUser.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-emerald-500">{currentUser.username}</span>
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-jetbrains-mono)] text-emerald-500">
                      {currentUser.score.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Announcements */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <IconBell className="size-4 text-blue-500" />
                <CardTitle className="text-base">Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`size-2 rounded-full mt-1.5 ${item.isNew ? 'bg-blue-500' : 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-xl flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <IconDatabase className="size-4 text-purple-500" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">{item.domain}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-[family-name:var(--font-jetbrains-mono)] text-muted-foreground">
                      {item.rows > 0 ? item.rows.toLocaleString() : '-'}
                    </span>
                    <div className={`size-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
