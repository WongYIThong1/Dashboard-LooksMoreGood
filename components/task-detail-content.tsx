"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowLeft,
  IconPlayerPlay,
  IconTrash,
  IconDatabase,
  IconDownload,
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader2,
  IconClock,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconSettings,
  IconList,
  IconWorld,
  IconSparkles,
  IconShield,
  IconAdjustments,
  IconWaveSine,
  IconChartLine,
  IconBinaryTree,
  IconBrain,
  IconEye,
  IconBook,
  IconCpu,
  IconGitMerge,
  IconToggleLeft,
  IconShieldCheck,
  IconCoins,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiStepLoader } from "@/components/ui/multi-step-loader"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

// API Response Types
interface UrlItem {
  id: string
  domain: string
  status: string
}

interface TaskDetailResponse {
  id: string
  status: "pending" | "running_recon" | "running" | "paused" | "complete" | "failed"
  target: string | number
  progress?: {
    target: number
    current: number
  }
  urls: UrlItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

interface TaskSettings {
  id: string
  name: string
  file: string
  ai_mode: boolean
  auto_dumper: boolean
  preset: string | null
  union_based: boolean
  error_based: boolean
  time_based: boolean
  boolean_based: boolean
  parameter_risk_filter: "high" | "medium-high" | "all"
  ai_sensitivity_level: "low" | "medium" | "high"
  response_pattern_drift: boolean
  baseline_profiling: boolean
  structural_change_detection: boolean
  status: string
  created_at: string
}

interface TaskDetailContentProps {
  id: string
}

// Table row data (transformed from API)
interface TableRowData {
  id: string
  country: string
  domain: string
  type: string
  database: string
  rows: number
  status: "complete" | "dumping" | "failed" | "queue"
}

// Removed SSE functionality as per requirements

// Map API status to UI status
function mapUrlStatus(apiStatus: string): "complete" | "dumping" | "failed" | "queue" {
  if (apiStatus === "recon_complete") return "queue"
  if (apiStatus === "complete") return "complete"
  if (apiStatus === "dumping") return "dumping"
  if (apiStatus === "failed") return "failed"
  return "queue"
}

const isDev = process.env.NODE_ENV !== "production"

// Format credits number to k/M format
function formatCredits(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

const statusConfig = {
  complete: { 
    icon: IconCircleCheck, 
    label: "Complete", 
    className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    iconClass: "text-emerald-600 dark:text-emerald-400"
  },
  dumping: { 
    icon: IconLoader2, 
    label: "Dumping", 
    className: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    iconClass: "text-blue-600 dark:text-blue-400 animate-spin"
  },
  failed: { 
    icon: IconAlertTriangle, 
    label: "Failed", 
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
    iconClass: "text-red-600 dark:text-red-400"
  },
  queue: { 
    icon: IconClock, 
    label: "Queue", 
    className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    iconClass: "text-yellow-600 dark:text-yellow-400"
  },
}

function getColumns(taskId: string): ColumnDef<TableRowData>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        const shortId = id.split("-")[0]
        return <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
      },
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }) => {
        const country = row.getValue("country") as string
        return <span className="font-medium">{country || "Unknown"}</span>
      },
    },
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => {
        const domain = row.getValue("domain") as string
        return <span className="font-mono text-sm text-muted-foreground">{domain || "-"}</span>
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return type !== "-" ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {type}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "database",
      header: "Database",
      cell: ({ row }) => {
        const database = row.getValue("database") as string
        return <span className="font-mono text-sm font-medium">{database || "-"}</span>
      },
    },
    {
      accessorKey: "rows",
      header: () => <div className="text-right">Rows</div>,
      cell: ({ row }) => {
        const rows = row.getValue("rows") as number
        return (
          <div className="text-right">
            <span className="font-mono text-sm font-medium">
              {rows > 0 ? rows.toLocaleString() : "-"}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig
        const config = statusConfig[status]
        const StatusIcon = config.icon
        return (
          <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
            <StatusIcon size={12} className={config.iconClass} />
            <span className="font-medium">{config.label}</span>
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <IconDotsVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/tasks/${taskId}/${row.original.id}`}>View database</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

export function TaskDetailContent({ id }: TaskDetailContentProps) {
  const shortId = id.split("-")[0]

  // Loading states for multi-step loader
  const startLoadingStates = [
    {
      text: "Finding Server For Recon",
    },
    {
      text: "Uploading Files To The Server",
      hasProgress: true,
    },
    {
      text: "Removing Duplicates",
    },
    {
      text: "Starting Recon",
      hasProgress: true,
      showStats: true,
    },
  ]

  // Data state
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [isCheckingTask, setIsCheckingTask] = React.useState(true)
  const [taskNotFound, setTaskNotFound] = React.useState(false)
  const [taskStatus, setTaskStatus] = React.useState<"pending" | "running_recon" | "running" | "paused" | "complete" | "failed">("pending")
  const [progress, setProgress] = React.useState({ target: 0, current: 0 })
  const [creditsUsed, setCreditsUsed] = React.useState(0)
  const [fileId, setFileId] = React.useState<string>("")
  const [storagePath, setStoragePath] = React.useState<string>("")
  
  // Client-side pagination state
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 50

  // Removed multi-step loader (was used for SSE)
  
  // Settings dialog state
  const [showSettings, setShowSettings] = React.useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [taskName, setTaskName] = React.useState("")
  const [listsFile, setListsFile] = React.useState("")
  const [aiMode, setAiMode] = React.useState(true)
  const [autoDumper, setAutoDumper] = React.useState(false)
  const [preset, setPreset] = React.useState("")
  const [unionBased, setUnionBased] = React.useState(true)
  const [errorBased, setErrorBased] = React.useState(true)
  const [booleanBased, setBooleanBased] = React.useState(false)
  const [timeBased, setTimeBased] = React.useState(false)
  
  // AI Settings
  const [parameterRiskFilter, setParameterRiskFilter] = React.useState<"high" | "medium-high" | "all">("medium-high")
  const [responsePatternDrift, setResponsePatternDrift] = React.useState(true)
  const [baselineProfiling, setBaselineProfiling] = React.useState(true)
  const [structuralChangeDetection, setStructuralChangeDetection] = React.useState(false)
  const [aiSensitivityLevel, setAiSensitivityLevel] = React.useState<"low" | "medium" | "high">("medium")

  const [isStarting, setIsStarting] = React.useState(false)
  const [showStartLoader, setShowStartLoader] = React.useState(false)
  const [loaderStep, setLoaderStep] = React.useState(0)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [reconProgress, setReconProgress] = React.useState(0)
  const [reconStats, setReconStats] = React.useState({ current: 0, total: 0, timeRunning: '0s' })
  const [startTime, setStartTime] = React.useState<number>(0)
  const [baseElapsedMs, setBaseElapsedMs] = React.useState<number>(0)
  const [lastUpdateTime, setLastUpdateTime] = React.useState<number>(0)
  const [taskDoneReceived, setTaskDoneReceived] = React.useState(false)
  const [loaderIsDone, setLoaderIsDone] = React.useState(false)
  const hasFetched = React.useRef(false)
  const sseAbortController = React.useRef<AbortController | null>(null)
  const timeAnimationInterval = React.useRef<number | null>(null)
  const sseRetryCount = React.useRef<number>(0)
  const sseRetryTimer = React.useRef<number | null>(null)
  const sseConnectionState = React.useRef<'idle' | 'connecting' | 'connected'>('idle')
  const sseConnectionId = React.useRef<number>(0)
  const taskDoneToastShown = React.useRef<boolean>(false)
  
  // Cache key for localStorage
  const CACHE_KEY = `task_stats_${id}`
  
  // Data storage
  const [tableData, setTableData] = React.useState<TableRowData[]>([])

  const columns = React.useMemo(() => getColumns(id), [id])
  
  // Derived state for pagination
  const totalItems = tableData.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const pageData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return tableData.slice(start, start + pageSize)
  }, [tableData, currentPage, pageSize])

  // Keep currentPage in valid range when data changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Validate task id exists and belongs to user
  React.useEffect(() => {
    let isMounted = true
    const validateTask = async () => {
      setIsCheckingTask(true)
      setTaskNotFound(false) // 重置状态
      try {
        const response = await fetch(`/api/v1/tasks/${id}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        const data = await response.json()

        if (!response.ok) {
          // 400 或 404 表示任务不存在或无效
          if (response.status === 400 || response.status === 404) {
            if (isMounted) setTaskNotFound(true)
          }
          return
        }

        // 响应成功，检查 data.success
        if (isMounted) {
          setTaskNotFound(!data?.success)
        }
      } catch (error) {
        console.error('Task validation error:', error)
        if (isMounted) setTaskNotFound(true)
      } finally {
        if (isMounted) setIsCheckingTask(false)
      }
    }

    validateTask()
    return () => {
      isMounted = false
    }
  }, [id])

  // Load cached task stats from localStorage
  const loadCachedStats = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        console.log('[Cache] 📦 Loaded cached stats:', data)
        
        // Restore progress
        if (data.progress !== undefined) {
          setReconProgress(data.progress)
        }
        
        // Restore recon stats
        if (data.reconStats) {
          setReconStats(data.reconStats)
          setBaseElapsedMs(data.baseElapsedMs || 0)
          setLastUpdateTime(Date.now())
        }
        
        // Restore credits
        if (data.creditsUsed !== undefined) {
          setCreditsUsed(data.creditsUsed)
        }
        
        return true
      }
    } catch (err) {
      console.error('[Cache] ❌ Failed to load cached stats:', err)
    }
    return false
  }
  
  // Save task stats to localStorage
  const saveCachedStats = (stats: {
    progress: number
    reconStats: { current: number; total: number; timeRunning: string }
    baseElapsedMs: number
    creditsUsed: number
  }) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(stats))
      console.log('[Cache] 💾 Saved stats to cache')
    } catch (err) {
      console.error('[Cache] ❌ Failed to save stats:', err)
    }
  }
  
  // Clear cached stats
  const clearCachedStats = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      console.log('[Cache] 🗑️ Cleared cached stats')
    } catch (err) {
      console.error('[Cache] ❌ Failed to clear cache:', err)
    }
  }

  // Cache key for task info
  const TASK_INFO_CACHE_KEY = `task_info_${id}`
  
  // Load cached task info
  const loadCachedTaskInfo = () => {
    try {
      const cached = localStorage.getItem(TASK_INFO_CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        const cacheAge = Date.now() - (data.timestamp || 0)
        
        // Cache valid for 30 seconds
        if (cacheAge < 30000) {
          console.log('[Cache] 📦 Using cached task info, age:', Math.round(cacheAge / 1000) + 's')
          return data.task
        } else {
          console.log('[Cache] ⏰ Cache expired, age:', Math.round(cacheAge / 1000) + 's')
        }
      }
    } catch (err) {
      console.error('[Cache] ❌ Failed to load cached task info:', err)
    }
    return null
  }
  
  // Save task info to cache
  const saveCachedTaskInfo = (task: any) => {
    try {
      localStorage.setItem(TASK_INFO_CACHE_KEY, JSON.stringify({
        task,
        timestamp: Date.now()
      }))
      console.log('[Cache] 💾 Saved task info to cache')
    } catch (err) {
      console.error('[Cache] ❌ Failed to save task info:', err)
    }
  }
  
  // Clear task info cache
  const clearCachedTaskInfo = () => {
    try {
      localStorage.removeItem(TASK_INFO_CACHE_KEY)
      console.log('[Cache] 🗑️ Cleared task info cache')
    } catch (err) {
      console.error('[Cache] ❌ Failed to clear task info cache:', err)
    }
  }

  // Fetch task data from external API
  const fetchTaskFromExternalAPI = async (): Promise<any | null> => {
    try {
      const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || 'http://localhost:8080'
      const url = `${externalApiDomain}/task/${id}`
      
      console.log('[External API] 🌐 Fetching task data from:', url)
      
      // Get Supabase session for access token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('[External API] ❌ No access token available')
        return null
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.error('[External API] ❌ HTTP error:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('[External API] ✅ Data received:', data)
      
      // Parse progress string "0/123" -> { current: 0, target: 123 }
      let progressData = { current: 0, target: 0 }
      if (data.progress && typeof data.progress === 'string') {
        const parts = data.progress.split('/')
        if (parts.length === 2) {
          progressData = {
            current: parseInt(parts[0]) || 0,
            target: parseInt(parts[1]) || 0
          }
        }
      }
      
      // Map status from external API to internal format
      let mappedStatus = data.status
      if (data.status === 'recon_running') {
        mappedStatus = 'running_recon'
      } else if (data.status === 'pending') {
        mappedStatus = 'pending'
      }
      // Other statuses: running, paused, complete, failed remain the same
      
      return {
        progress: progressData,
        credits: data.credits || 0,
        status: mappedStatus,
        source: 'external'
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[External API] ⏱️ Request timeout')
      } else {
        console.error('[External API] ❌ Request failed:', error)
      }
      return null
    }
  }

  // Fetch initial task data
  const fetchTaskData = async (shouldConnectSSE: boolean = false) => {
    setIsLoadingData(true)
    
    // Try to load from cache first
    const cachedTask = loadCachedTaskInfo()
    if (cachedTask) {
      console.log('[TaskDetail] 📦 Using cached task data')
      
      // Update UI with cached data
      setTaskName(cachedTask.name || '')
      setListsFile(cachedTask.file_name || '')
      setTaskStatus(cachedTask.status || 'pending')
      setProgress(prev => ({ ...prev, target: cachedTask.target || 0 }))
      setCreditsUsed(cachedTask.credits_used || 0)
      setFileId(cachedTask.file_id || '')
      
      setAiMode(cachedTask.ai_mode ?? true)
      setAutoDumper(cachedTask.auto_dumper ?? false)
      setPreset(cachedTask.preset || '')
      setParameterRiskFilter(cachedTask.parameter_risk_filter || 'medium-high')
      setAiSensitivityLevel(cachedTask.ai_sensitivity_level || 'medium')
      setResponsePatternDrift(cachedTask.response_pattern_drift ?? true)
      setBaselineProfiling(cachedTask.baseline_profiling ?? true)
      setStructuralChangeDetection(cachedTask.structural_change_detection ?? false)
      setUnionBased(cachedTask.union_based ?? true)
      setErrorBased(cachedTask.error_based ?? true)
      setBooleanBased(cachedTask.boolean_based ?? false)
      setTimeBased(cachedTask.time_based ?? false)
      
      setIsLoadingData(false)
      
      // Handle status-based actions
      if (cachedTask.status === 'running_recon') {
        const hasCachedData = loadCachedStats()
        if (!hasCachedData) {
          console.log('[TaskDetail] ℹ️ No cached stats data')
        }
        setShowStartLoader(true)
        setLoaderStep(3)
        if (shouldConnectSSE) {
          setTimeout(() => connectSSE(), 500)
        }
      } else if (cachedTask.status === 'running') {
        console.log('[TaskDetail] ▶️ Task is running (from cache), connecting SSE')
        if (shouldConnectSSE) {
          setTimeout(() => connectSSE(), 500)
        }
      }
      
      // Still fetch fresh data in background, but don't block UI
      fetchTaskDataFromAPI(shouldConnectSSE)
      return
    }
    
    // No cache, fetch from API
    await fetchTaskDataFromAPI(shouldConnectSSE)
  }
  
  // Fetch task data from API (external first, then Supabase fallback)
  const fetchTaskDataFromAPI = async (shouldConnectSSE: boolean = false) => {
    try {
      // Step 1: Try external API first
      const externalData = await fetchTaskFromExternalAPI()
      
      if (externalData) {
        console.log('[TaskDetail] ✅ Using external API data')
        
        // Update progress from external API
        setProgress({
          current: externalData.progress.current,
          target: externalData.progress.target
        })
        
        // Update credits from external API
        setCreditsUsed(externalData.credits)
        
        // Update status from external API
        setTaskStatus(externalData.status)
        
        // Cache the external data (simplified cache)
        saveCachedTaskInfo({
          status: externalData.status,
          target: externalData.progress.target,
          credits_used: externalData.credits,
          // Keep other fields from previous cache or defaults
          name: taskName || 'Task',
          file_name: listsFile || 'Unknown',
        })
        
        // Handle status-based actions
        if (externalData.status === 'running_recon') {
          console.log('[TaskDetail] 🔄 Status is running_recon, opening loader')
          const hasCachedData = loadCachedStats()
          if (!hasCachedData) {
            console.log('[TaskDetail] ℹ️ No cached stats data')
          }
          setShowStartLoader(true)
          setLoaderStep(3)
          if (shouldConnectSSE) {
            setTimeout(() => connectSSE(), 500)
          }
        } else if (externalData.status === 'running') {
          console.log('[TaskDetail] ▶️ Status is running, connecting SSE without loader')
          if (shouldConnectSSE) {
            setTimeout(() => connectSSE(), 500)
          }
        }
        
        // Still fetch full data from Supabase in background for other fields
        // Don't connect SSE again since we already connected above
        fetchFullTaskDataFromSupabase(false)
        return
      }
      
      // Step 2: Fallback to Supabase if external API failed
      console.log('[TaskDetail] ⚠️ External API failed, falling back to Supabase')
      await fetchFullTaskDataFromSupabase(shouldConnectSSE)
      
    } catch (err) {
      console.error("[TaskDetail] Fetch error:", err)
      toast.error("Please Try Again")
    } finally {
      setIsLoadingData(false)
    }
  }
  
  // Fetch full task data from Supabase
  const fetchFullTaskDataFromSupabase = async (shouldConnectSSE: boolean = false) => {
    try {
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Please Try Again')
      }

      const task = data.data
      
      // Save to cache
      saveCachedTaskInfo(task)
      // 更新任务基本信息
      setTaskName(task.name || '')
      setListsFile(task.file_name || '')
      setTaskStatus(task.status || 'pending')
      setProgress(prev => ({ ...prev, target: task.target || 0 }))
      setCreditsUsed(task.credits_used || 0)
      setFileId(task.file_id || '')
      
      // 更新任务设置
      setAiMode(task.ai_mode ?? true)
      setAutoDumper(task.auto_dumper ?? false)
      setPreset(task.preset || '')
      setParameterRiskFilter(task.parameter_risk_filter || 'medium-high')
      setAiSensitivityLevel(task.ai_sensitivity_level || 'medium')
      setResponsePatternDrift(task.response_pattern_drift ?? true)
      setBaselineProfiling(task.baseline_profiling ?? true)
      setStructuralChangeDetection(task.structural_change_detection ?? false)
      setUnionBased(task.union_based ?? true)
      setErrorBased(task.error_based ?? true)
      setBooleanBased(task.boolean_based ?? false)
      setTimeBased(task.time_based ?? false)

      // 检查任务状态，如果是 running_recon，自动打开 loader 并连接 SSE
      if (task.status === 'running_recon') {
        console.log('[TaskDetail] 🔄 Task is running_recon, auto-opening loader')
        
        // 先尝试从缓存加载数据
        const hasCachedData = loadCachedStats()
        
        if (!hasCachedData) {
          console.log('[TaskDetail] ℹ️ No cached data, starting fresh')
        }
        
        // 打开 multi-step loader，跳到 "Starting Recon" 步骤
        setShowStartLoader(true)
        setLoaderStep(3)
        
        // 自动连接 SSE
        if (shouldConnectSSE) {
          setTimeout(() => {
            connectSSE()
          }, 500)
        }
      } else if (task.status === 'running') {
        // 如果是 running 状态，不打开 loader，只连接 SSE
        console.log('[TaskDetail] ▶️ Task is running, connecting SSE without loader')
        if (shouldConnectSSE) {
          setTimeout(() => {
            connectSSE()
          }, 500)
        }
      } else if (task.status === 'complete' || task.status === 'failed') {
        // 任务完成或失败，清除所有缓存
        clearCachedStats()
        clearCachedTaskInfo()
      }

      // Task data loaded successfully
    } catch (err) {
      console.error("[TaskDetail] Fetch error:", err)
      toast.error("Please Try Again")
    } finally {
      setIsLoadingData(false)
    }
  }

  // Format elapsed milliseconds to readable time string
  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Animate time continuously
  React.useEffect(() => {
    if (baseElapsedMs > 0 && lastUpdateTime > 0) {
      // Clear previous interval
      if (timeAnimationInterval.current) {
        clearInterval(timeAnimationInterval.current)
      }

      // Start new interval to update time every second
      timeAnimationInterval.current = window.setInterval(() => {
        const now = Date.now()
        const additionalMs = now - lastUpdateTime
        const totalElapsed = baseElapsedMs + additionalMs
        
        setReconStats(prev => ({
          ...prev,
          timeRunning: formatElapsedTime(totalElapsed)
        }))
      }, 1000)

      return () => {
        if (timeAnimationInterval.current) {
          clearInterval(timeAnimationInterval.current)
        }
      }
    }
  }, [baseElapsedMs, lastUpdateTime])

  // Initial fetch - only run once on mount, after task validation
  React.useEffect(() => {
    if (!hasFetched.current && !isCheckingTask && !taskNotFound) {
      hasFetched.current = true
      fetchTaskData(true) // Fetch task data and auto-connect SSE if running_recon
      
      // Always try to connect SSE when entering the page
      console.log('[TaskDetail] 🔌 Auto-connecting SSE on page load')
      setTimeout(() => {
        connectSSE()
      }, 1000)
    }

    // Cleanup ONLY on unmount (when leaving the page)
    return () => {
      sseConnectionState.current = 'idle'
      sseConnectionId.current += 1
      if (sseAbortController.current) {
        sseAbortController.current.abort()
        console.log('[SSE] Connection closed - user left the page')
      }
      if (sseRetryTimer.current) {
        clearTimeout(sseRetryTimer.current)
        sseRetryTimer.current = null
        console.log('[SSE] Retry timer cleared')
      }
      if (timeAnimationInterval.current) {
        clearInterval(timeAnimationInterval.current)
      }
    }
  }, [isCheckingTask, taskNotFound])

  // Handle visibility change - keep connection alive when switching tabs
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[SSE] Tab hidden - keeping connection alive')
      } else {
        console.log('[SSE] Tab visible - connection still active')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // SSE connection function with retry
  const connectSSE = async () => {
    const timestamp = new Date().toISOString()
    if (sseConnectionState.current !== 'idle' && sseAbortController.current && !sseAbortController.current.signal.aborted) {
      console.log(`[SSE] ⏭️ [${timestamp}] Connection already active, skipping new connect`)
      return
    }
    console.log(`[SSE] 🚀 [${timestamp}] Starting SSE connection for task:`, id, 'Retry count:', sseRetryCount.current)
    sseConnectionState.current = 'connecting'
    const connectionId = ++sseConnectionId.current
    
    // Clear any existing retry timer
    if (sseRetryTimer.current) {
      console.log(`[SSE] ⏹️ [${timestamp}] Clearing existing retry timer`)
      clearTimeout(sseRetryTimer.current)
      sseRetryTimer.current = null
    }
    
    try {
      // Abort previous connection if exists
      if (sseAbortController.current) {
        console.log(`[SSE] ⚠️ [${timestamp}] Aborting previous connection`)
        sseAbortController.current.abort()
      }

      // Create new abort controller
      const localController = new AbortController()
      sseAbortController.current = localController
      console.log(`[SSE] 🆕 [${timestamp}] Created new abort controller`)
      console.log('[SSE] ✅ Created new AbortController')

      // Get Supabase session for access token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error('[SSE] ❌ No access token available')
        // Retry after 3 seconds
        scheduleSSERetry()
        return
      }
      console.log('[SSE] ✅ Access token obtained')

      const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || 'http://localhost:8080'
      const sseUrl = `${externalApiDomain}/sse/${id}`
      
      console.log('[SSE] 🔗 Connecting to:', sseUrl)

      const response = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
        },
        signal: localController.signal,
      })

      console.log('[SSE] 📡 Fetch response status:', response.status)

      if (!response.ok) {
        console.error('[SSE] ❌ Connection failed with status:', response.status)
        // Retry after delay
        if (connectionId === sseConnectionId.current) {
          sseConnectionState.current = 'idle'
          scheduleSSERetry(connectionId)
        }
        return
      }

      // Reset retry count on successful connection
      sseRetryCount.current = 0
      sseConnectionState.current = 'connected'

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        console.error('[SSE] ❌ No reader available')
        if (connectionId === sseConnectionId.current) {
          sseConnectionState.current = 'idle'
          scheduleSSERetry(connectionId)
        }
        return
      }

      console.log('[SSE] ✅ Connected successfully, starting to read stream...')

      // Read stream
      const readStream = async () => {
        console.log('[SSE] 📖 Starting stream reader loop')
        let currentEvent = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('[SSE] 🏁 Stream ended')
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            console.log('[SSE] 📦 Received chunk, length:', chunk.length)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                // Extract event type from SSE event field
                currentEvent = line.slice(7).trim()
                console.log('[SSE] 🏷️ Event type:', currentEvent)
              } else if (line.startsWith('data: ')) {
                const data = line.slice(6)
                console.log('[SSE] 📨 Raw data:', data)
                
                try {
                  const parsed = JSON.parse(data)
                  // Use event type from SSE event field if type is not in data
                  const eventType = parsed.type || currentEvent
                  console.log('[SSE] 📊 Parsed event:', {
                    type: eventType,
                    taskid: parsed.taskid,
                    data: parsed
                  })
                  
                  // Reset current event after processing
                  currentEvent = ''
                  
                  // Handle different SSE events
                  if (eventType === 'task_stats' && parsed.tasks && parsed.tasks.length > 0) {
                    console.log('[SSE] 📈 Processing task_stats event, tasks count:', parsed.tasks.length)
                    const taskData = parsed.tasks.find((t: any) => t.taskid === id)
                    
                    if (taskData) {
                      console.log('[SSE] ✅ Found matching task data:', {
                        taskid: taskData.taskid,
                        progress: taskData.progress,
                        groups_done: taskData.groups_done,
                        groups_total: taskData.groups_total,
                        elapsed_ms: taskData.elapsed_ms,
                        credits_used: taskData.credits_used
                      })
                      
                      // Calculate progress percent for multi-step loader
                      const progressPercent = Math.round((taskData.progress || 0) * 100)
                      console.log('[SSE] 🎯 Updating multi-step loader progress:', progressPercent + '%')
                      
                      // Update recon progress for multi-step loader ONLY
                      setReconProgress(progressPercent)
                      
                      // Update recon stats for multi-step loader ONLY
                      const elapsedMs = taskData.elapsed_ms || 0
                      setBaseElapsedMs(elapsedMs)
                      setLastUpdateTime(Date.now())
                      
                      const newReconStats = {
                        current: taskData.groups_done || 0,
                        total: taskData.groups_total || 0,
                        timeRunning: formatElapsedTime(elapsedMs)
                      }
                      setReconStats(newReconStats)
                      
                      // Save to cache (for multi-step loader state)
                      saveCachedStats({
                        progress: progressPercent,
                        reconStats: newReconStats,
                        baseElapsedMs: elapsedMs,
                        creditsUsed: taskData.credits_used || 0
                      })
                    } else {
                      console.log('[SSE] ⚠️ No matching task found for id:', id)
                    }
                  } else if (eventType === 'task_done') {
                    const timestamp = new Date().toISOString()
                    console.log(`[SSE] 🎉 [${timestamp}] Task done received:`, parsed)
                    console.log(`[SSE] 📍 [${timestamp}] Current taskDoneReceived state:`, taskDoneReceived)
                    
                    // Check if it's for this task
                    if (parsed.taskid === id) {
                      console.log(`[SSE] ✅ [${timestamp}] Task done matches current task`)
                      console.log(`[SSE] 🔍 [${timestamp}] Setting taskDoneReceived to true`)
                      setTaskDoneReceived(true)
                      setReconProgress(100)
                      
                      // Update status to "running" (In Progress) to avoid database query
                      console.log(`[SSE] 🔄 [${timestamp}] Updating status to running (In Progress)`)
                      setTaskStatus('running')
                      
                      // Update credits if credits_reward is provided
                      if (parsed.credits_reward !== undefined) {
                        console.log(`[SSE] 💰 [${timestamp}] Credits reward received:`, parsed.credits_reward)
                        setCreditsUsed(prev => prev + parsed.credits_reward)
                      }
                      
                      // Update progress current if success_count is provided
                      if (parsed.success_count !== undefined) {
                        console.log(`[SSE] 📊 [${timestamp}] Success count:`, parsed.success_count)
                        setProgress(prev => ({ ...prev, current: parsed.success_count }))
                      }
                      
                      // Clear cache when task is done
                      console.log(`[SSE] 🗑️ [${timestamp}] Clearing cache`)
                      clearCachedStats()
                      clearCachedTaskInfo()
                      
                      // Auto close loader after task done
                      console.log(`[SSE] 🔒 [${timestamp}] Scheduling auto-close loader in 2 seconds`)
                      setTimeout(() => {
                        console.log(`[SSE] 🎬 [${new Date().toISOString()}] Executing auto-close callback`)
                        setShowStartLoader(false)
                        setTaskDoneReceived(false)
                        setLoaderIsDone(false)
                        
                        // Only show toast once
                        if (!taskDoneToastShown.current) {
                          console.log(`[SSE] 🎉 [${new Date().toISOString()}] Showing completion toast (first time)`)
                          taskDoneToastShown.current = true
                          toast.success('Recon Completed Successfully')
                        } else {
                          console.log(`[SSE] ⏭️ [${new Date().toISOString()}] Skipping toast (already shown)`)
                        }
                      }, 2000)
                    } else {
                      console.log(`[SSE] ⚠️ [${timestamp}] Task done for different task:`, parsed.taskid, 'Expected:', id)
                    }
                  } else if (eventType === 'connected') {
                    console.log('[SSE] 🔌 Connection confirmed:', parsed)
                  } else if (eventType) {
                    console.log('[SSE] ❓ Unknown event type:', eventType)
                  }
                } catch (e) {
                  console.error('[SSE] ❌ JSON parse error:', e, 'Raw data:', data)
                }
              } else if (line.trim()) {
                console.log('[SSE] 📝 Non-data line:', line)
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[SSE] 🛑 Connection aborted by user/system')
            if (connectionId === sseConnectionId.current) {
              sseConnectionState.current = 'idle'
            }
          } else {
            console.error('[SSE] ❌ Read error:', error)
            // Retry on read error
            if (connectionId === sseConnectionId.current) {
              sseConnectionState.current = 'idle'
              scheduleSSERetry(connectionId)
            }
          }
        } finally {
          console.log('[SSE] 🔒 Releasing reader lock')
          reader.releaseLock()
          
          // If stream ended normally (not aborted), try to reconnect
          if (connectionId === sseConnectionId.current && !localController.signal.aborted) {
            console.log('[SSE] 🔄 Stream ended, attempting reconnect')
            sseConnectionState.current = 'idle'
            scheduleSSERetry(connectionId)
          }
        }
      }

      readStream()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SSE] 🛑 Connection aborted during setup')
        if (connectionId === sseConnectionId.current) {
          sseConnectionState.current = 'idle'
        }
      } else {
        console.error('[SSE] ❌ Connection error:', error)
        // Retry on error
        if (connectionId === sseConnectionId.current) {
          sseConnectionState.current = 'idle'
          scheduleSSERetry(connectionId)
        }
      }
    }
  }
  
  // Schedule SSE retry with exponential backoff
  const scheduleSSERetry = (connectionId?: number) => {
    if (connectionId !== undefined && connectionId !== sseConnectionId.current) {
      return
    }
    if (sseConnectionState.current !== 'idle') {
      return
    }
    const timestamp = new Date().toISOString()
    const maxRetries = 10
    if (sseRetryCount.current >= maxRetries) {
      console.log(`[SSE] ❌ [${timestamp}] Max retries reached, stopping reconnection attempts`)
      return
    }
    
    sseRetryCount.current++
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s, max 60s
    const delay = Math.min(3000 * Math.pow(2, sseRetryCount.current - 1), 60000)
    console.log(`[SSE] 🔄 [${timestamp}] Scheduling retry ${sseRetryCount.current}/${maxRetries} in ${delay}ms`)
    
    sseRetryTimer.current = window.setTimeout(() => {
      console.log(`[SSE] ⏰ [${new Date().toISOString()}] Retry timer fired, calling connectSSE()`)
      connectSSE()
    }, delay)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // Fetch settings when dialog opens
  React.useEffect(() => {
    if (showSettings) {
      fetchSettings()
    }
  }, [showSettings])

  const fetchSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Please Try Again')
      }

      const task = data.data
      
      // 更新所有设置状态
      setTaskName(task.name || '')
      setListsFile(task.file_name || '')
      setAiMode(task.ai_mode ?? true)
      setAutoDumper(task.auto_dumper ?? false)
      setPreset(task.preset || '')
      setParameterRiskFilter(task.parameter_risk_filter || 'medium-high')
      setAiSensitivityLevel(task.ai_sensitivity_level || 'medium')
      setResponsePatternDrift(task.response_pattern_drift ?? true)
      setBaselineProfiling(task.baseline_profiling ?? true)
      setStructuralChangeDetection(task.structural_change_detection ?? false)
      setUnionBased(task.union_based ?? true)
      setErrorBased(task.error_based ?? true)
      setBooleanBased(task.boolean_based ?? false)
      setTimeBased(task.time_based ?? false)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error("Please Try Again")
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleStart = async () => {
    setIsStarting(true)
    setShowStartLoader(true)
    setLoaderStep(0)
    setUploadProgress(0)
    setReconProgress(0)
    setReconStats({ current: 0, total: 0, timeRunning: '0s' })
    setTaskDoneReceived(false)
    setLoaderIsDone(false)
    taskDoneToastShown.current = false // Reset toast flag for new task
    
    try {
      // Step 1: Finding Server (simulate 1 second delay)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoaderStep(1)
      
      // Step 2: Uploading Files with progress
      await new Promise<void>((resolve) => {
        let progress = 0
        const uploadInterval = setInterval(() => {
          progress += 5
          setUploadProgress(progress)
          if (progress >= 100) {
            clearInterval(uploadInterval)
            resolve()
          }
        }, 100)
      })
      
      // Small delay before next step
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoaderStep(2)
      
      // Step 3: Removing Duplicates (simulate 1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLoaderStep(3)
      
      // Call the new unified start endpoint
      const response = await fetch(`/api/v1/tasks/${id}/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = data.error === 'Failed to generate download URL' 
          ? 'Please try again later' 
          : (data.error || 'Failed to start task')
        toast.error(errorMessage)
        setShowStartLoader(false)
        return
      }

      // Step 4: Starting Recon - progress will be controlled by SSE
      // Update task status
      setTaskStatus('running_recon')
      
      // Refresh task data to get updated information
      await fetchTaskData(false)
      
      // Note: Multi-step loader will stay open until task_done event is received via SSE
    } catch (error) {
      console.error('Start task error:', error)
      toast.error('Please Try Again')
      setShowStartLoader(false)
    } finally {
      setIsStarting(false)
    }
  }
  
  // Close loader when recon progress reaches 100 AND task_done is received
  React.useEffect(() => {
    if (reconProgress >= 100 && taskDoneReceived) {
      console.log('[SSE] ✅ Task completed: progress 100% and task_done received')
      setLoaderIsDone(true)
      const timer = setTimeout(() => {
        setShowStartLoader(false)
        setTaskDoneReceived(false) // Reset for next time
        setLoaderIsDone(false) // Reset for next time
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [reconProgress, taskDoneReceived])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          auto_dumper: autoDumper,
          preset: preset || null,
          ai_mode: aiMode,
          parameter_risk_filter: parameterRiskFilter,
          ai_sensitivity_level: aiSensitivityLevel,
          response_pattern_drift: responsePatternDrift,
          baseline_profiling: baselineProfiling,
          structural_change_detection: structuralChangeDetection,
          union_based: unionBased,
          error_based: errorBased,
          boolean_based: booleanBased,
          time_based: timeBased,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save settings')
      }

      toast.success("Settings saved successfully")
      setShowSettings(false)
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error("Please Try Again")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    setIsDeleting(true)
    
    try {
      const dbResponse = await fetch(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const dbData = await dbResponse.json()

      if (!dbResponse.ok || !dbData.success) {
        throw new Error(dbData.message || 'Failed to delete task')
      }
      
      toast.success("Task deleted successfully")
      setShowDeleteDialog(false)
      
      // 重定向到任务列表页面
      window.location.href = '/tasks'
    } catch (error) {
      console.error('Task deletion failed:', error)
      toast.error("Please Try Again")
    } finally {
      setIsDeleting(false)
    }
  }

  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const progressPercent = progress?.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0

  if (isCheckingTask) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading</span>
        </div>
      </div>
    )
  }

  if (taskNotFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="text-lg font-semibold">Invalid task</div>
        <div className="text-sm text-muted-foreground mt-2">
          The task ID is invalid or you do not have access to it.
        </div>
        <Link href="/tasks" className="mt-4">
          <Button variant="outline">Back to tasks</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Multi-step loader for task start */}
      <MultiStepLoader
        loadingStates={startLoadingStates}
        loading={showStartLoader}
        currentStep={loaderStep}
        externalProgress={loaderStep === 1 ? uploadProgress : loaderStep === 3 ? reconProgress : undefined}
        statsData={loaderStep === 3 ? reconStats : undefined}
        loop={false}
        isDone={loaderIsDone}
      />
      
      <div className="flex flex-1 flex-col min-w-0 font-[family-name:var(--font-inter)]">
      {/* Header */}
      <div className="flex flex-col border-b">
        <div className="h-16 px-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link href="/tasks">
              <Button variant="ghost" size="icon" className="size-8">
                <IconArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md border">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M3.757 4.5c.18.217.376.42.586.608.153-.61.354-1.175.596-1.678A5.53 5.53 0 0 0 3.757 4.5ZM8 1a6.994 6.994 0 0 0-7 7 7 7 0 1 0 7-7Zm0 1.5c-.476 0-1.091.386-1.633 1.427-.293.564-.531 1.267-.683 2.063A5.48 5.48 0 0 0 8 6.5a5.48 5.48 0 0 0 2.316-.51c-.152-.796-.39-1.499-.683-2.063C9.09 2.886 8.476 2.5 8 2.5Zm3.657 2.608a8.823 8.823 0 0 0-.596-1.678c.444.298.842.659 1.182 1.07-.18.217-.376.42-.586.608Zm-1.166 2.436A6.983 6.983 0 0 1 8 8a6.983 6.983 0 0 1-2.49-.456 10.703 10.703 0 0 0 .202 2.6c.72.231 1.49.356 2.288.356.798 0 1.568-.125 2.29-.356a10.705 10.705 0 0 0 .2-2.6Zm1.433 1.85a12.652 12.652 0 0 0 .018-2.609c.405-.276.78-.594 1.117-.947a5.48 5.48 0 0 1 .44 2.262 7.536 7.536 0 0 1-1.575 1.293Zm-2.172 2.435a9.046 9.046 0 0 1-3.504 0c.039.084.078.166.12.244C6.907 13.114 7.523 13.5 8 13.5s1.091-.386 1.633-1.427c.04-.078.08-.16.12-.244Zm1.31.74a8.5 8.5 0 0 0 .492-1.298c.457-.197.893-.43 1.307-.696a5.526 5.526 0 0 1-1.8 1.995Zm-6.123 0a8.507 8.507 0 0 1-.493-1.298 8.985 8.985 0 0 1-1.307-.696 5.526 5.526 0 0 0 1.8 1.995ZM2.5 8.1c.463.5.993.935 1.575 1.293a12.652 12.652 0 0 1-.018-2.608 7.037 7.037 0 0 1-1.117-.947 5.48 5.48 0 0 0-.44 2.262Z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-base font-medium font-[family-name:var(--font-inter)]">Tasks-{shortId}</p>
              {isLoadingData && currentPage === 1 ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconLoader2 size={12} className="animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </Badge>
              ) : taskStatus === "pending" ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconClock size={12} className="text-yellow-500" />
                  <span className="text-foreground">Pending</span>
                </Badge>
              ) : taskStatus === "running_recon" ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconLoader2 size={12} className="text-purple-500 animate-spin" />
                  <span className="text-foreground">Running Recon</span>
                </Badge>
              ) : taskStatus === "running" ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconLoader2 size={12} className="text-blue-500 animate-spin" />
                  <span className="text-foreground">In Progress</span>
                </Badge>
              ) : taskStatus === "paused" ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconClock size={12} className="text-orange-500" />
                  <span className="text-foreground">Paused</span>
                </Badge>
              ) : taskStatus === "failed" ? (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconAlertTriangle size={12} className="text-red-500" />
                  <span className="text-foreground">Failed</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
                  <IconCircleCheck size={12} className="text-emerald-500" />
                  <span className="text-foreground">Complete</span>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-muted/30">
              <IconCoins size={13} className="text-amber-500" />
              <span className="text-xs text-muted-foreground">Credits:</span>
              <span className="text-sm font-semibold font-[family-name:var(--font-jetbrains-mono)]">{formatCredits(creditsUsed)}</span>
            </div>
            <Button variant="outline" size="icon" className="size-7" onClick={handleStart} disabled={isStarting || taskStatus === "running" || taskStatus === "running_recon" || taskStatus === "complete" || taskStatus === "failed"}>
              {isStarting ? (
                <IconLoader2 size={12} className="animate-spin" />
              ) : (
                <IconPlayerPlay size={12} />
              )}
            </Button>
            <Button variant="outline" size="icon" className="size-7" onClick={() => setShowSettings(true)}>
              <IconSettings size={12} />
            </Button>
            <Button variant="outline" size="icon" className="size-7">
              <IconDownload size={12} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="size-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-950/20"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <IconLoader2 size={12} className="animate-spin" />
              ) : (
                <IconTrash size={12} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <IconDatabase className="size-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium font-[family-name:var(--font-inter)]">Progress</p>
                  <p className="text-xs text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
                    {progress?.target > 0 ? `${(progress?.current ?? 0).toLocaleString()} / ${(progress?.target ?? 0).toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <IconDownload className="size-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium font-[family-name:var(--font-inter)]">Total URLs</p>
                  <p className="text-xs text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
                    {totalItems.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <IconCircleCheck className="size-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium font-[family-name:var(--font-inter)]">Completion</p>
                  <p className="text-xs text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
                    {progressPercent}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {progress?.target > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium font-[family-name:var(--font-jetbrains-mono)]">
                  {progress?.current ?? 0} / {progress?.target ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">({progressPercent}%)</span>
              </div>
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-lg border overflow-hidden">
          {isLoadingData ? (
            <div className="flex items-center justify-center h-64">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalItems} items)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoadingData}
            >
              <IconChevronLeft className="size-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoadingData}
            >
              <IconChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconSettings className="size-5" />
              Task Settings
            </DialogTitle>
            <DialogDescription>
              Configure task settings for Tasks-{shortId}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
          <div className="space-y-6 py-4">
            {/* General Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">General</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lists">Lists</Label>
                  <div className="relative">
                    <IconList className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                    <Input
                      id="lists"
                      value={listsFile}
                      className="pl-10 bg-muted"
                      disabled
                    />
                  </div>
                </div>

                {autoDumper && (
                  <div className="space-y-2">
                    <Label htmlFor="preset" className="flex items-center gap-2">
                      <IconDatabase className="size-3.5 text-muted-foreground" />
                      Preset Format
                    </Label>
                    <Select value={preset} onValueChange={setPreset} disabled={isSaving}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto">
                        <SelectItem value="email:password">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">email:password</span>
                        </SelectItem>
                        <SelectItem value="username:password">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">username:password</span>
                        </SelectItem>
                        <SelectItem value="phone:password">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">phone:password</span>
                        </SelectItem>
                        <SelectItem value="email">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">email</span>
                        </SelectItem>
                        <SelectItem value="username">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">username</span>
                        </SelectItem>
                        <SelectItem value="phone">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">phone</span>
                        </SelectItem>
                        <SelectItem value="cc:cvv:exp">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">cc:cvv:exp</span>
                        </SelectItem>
                        <SelectItem value="name:cc:cvv:exp:address">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm">name:cc:cvv:exp:address</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Data extraction format</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <IconDatabase className="size-4 text-blue-500" />
                  <Label htmlFor="auto-dumper" className="cursor-pointer text-sm">Auto Dumper</Label>
                </div>
                <Switch id="auto-dumper" checked={autoDumper} onCheckedChange={setAutoDumper} disabled={isSaving} />
              </div>
            </div>

            <Separator />

            {/* Injection Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <IconDatabase className="size-4 text-blue-500" />
                  Injection Settings
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  type="button"
                  onClick={() => window.open('https://docs.example.com', '_blank')}
                >
                  <IconBook className="size-3.5" />
                  Docs
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="union-based" 
                    checked={unionBased} 
                    onCheckedChange={(checked) => setUnionBased(checked === true)} 
                    disabled={isSaving}
                  />
                  <Label htmlFor="union-based" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                    <IconGitMerge className="size-4 text-muted-foreground" />
                    Union-based
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="error-based" 
                    checked={errorBased} 
                    onCheckedChange={(checked) => setErrorBased(checked === true)} 
                    disabled={isSaving}
                  />
                  <Label htmlFor="error-based" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                    <IconAlertTriangle className="size-4 text-muted-foreground" />
                    Error-based
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="boolean-based" 
                    checked={booleanBased} 
                    onCheckedChange={(checked) => setBooleanBased(checked === true)} 
                    disabled={isSaving}
                  />
                  <Label htmlFor="boolean-based" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                    <IconToggleLeft className="size-4 text-muted-foreground" />
                    Boolean-based
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="time-based" 
                    checked={timeBased} 
                    onCheckedChange={(checked) => setTimeBased(checked === true)} 
                    disabled={isSaving}
                  />
                  <Label htmlFor="time-based" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                    <IconClock className="size-4 text-muted-foreground" />
                    Time-based
                  </Label>
                </div>
              </div>
            </div>

            {aiMode && (
              <>
                <Separator />

                {/* AI Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <IconBrain className="size-4 text-purple-500" />
                      SQLBot AI Settings
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      type="button"
                      onClick={() => window.open('https://docs.example.com', '_blank')}
                    >
                      <IconBook className="size-3.5" />
                      Docs
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="param-risk" className="flex items-center gap-2">
                        <IconShield className="size-3.5 text-muted-foreground" />
                        Parameter Risk Filtering
                      </Label>
                      <Select value={parameterRiskFilter} onValueChange={(v) => setParameterRiskFilter(v as "high" | "medium-high" | "all")} disabled={isSaving}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Risk Only</SelectItem>
                          <SelectItem value="medium-high">Medium & High Risk</SelectItem>
                          <SelectItem value="all">All Parameters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-sensitivity" className="flex items-center gap-2">
                        <IconAdjustments className="size-3.5 text-muted-foreground" />
                        AI Sensitivity Level
                      </Label>
                      <Select value={aiSensitivityLevel} onValueChange={(v) => setAiSensitivityLevel(v as "low" | "medium" | "high")} disabled={isSaving}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="response-drift" className="cursor-pointer text-xs flex items-center gap-1.5">
                        <IconCpu className="size-4 text-muted-foreground" />
                        Strategy Engine
                      </Label>
                      <Switch id="response-drift" checked={responsePatternDrift} onCheckedChange={setResponsePatternDrift} disabled={isSaving} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="baseline-profiling" className="cursor-pointer text-xs flex items-center gap-1.5">
                        <IconShield className="size-4 text-muted-foreground" />
                        Risk Filter Engine
                      </Label>
                      <Switch id="baseline-profiling" checked={baselineProfiling} onCheckedChange={setBaselineProfiling} disabled={isSaving} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="structural-change" className="cursor-pointer text-xs flex items-center gap-1.5">
                        <IconShieldCheck className="size-4 text-muted-foreground" />
                        Evasion Engine
                      </Label>
                      <Switch id="structural-change" checked={structuralChangeDetection} onCheckedChange={setStructuralChangeDetection} disabled={isSaving} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <IconAlertTriangle className="size-5" />
              Delete Task
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone and will permanently delete:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">•</div>
              <div>
                <span className="font-medium">Task: </span>
                <span className="text-muted-foreground">{taskName || 'Unnamed Task'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <IconTrash className="size-4 mr-2" />
                  Delete Task
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}
