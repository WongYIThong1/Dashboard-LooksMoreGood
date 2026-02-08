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
  web_crawler: "FullScan" | "Balance" | "Fast"
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

const statusConfig = {
  complete: { icon: IconCircleCheck, label: "Complete", color: "text-emerald-500", iconClass: "" },
  dumping: { icon: IconLoader2, label: "Dumping", color: "text-blue-500", iconClass: "animate-spin" },
  failed: { icon: IconAlertTriangle, label: "Failed", color: "text-red-500", iconClass: "" },
  queue: { icon: IconClock, label: "Queue", color: "text-yellow-500", iconClass: "" },
}

const columns: ColumnDef<TableRowData>[] = [
  {
    accessorKey: "country",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Country
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const country = row.getValue("country") as string
      return (
        <span className="font-medium font-[family-name:var(--font-inter)]">{country || "-"}</span>
      )
    },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Domain
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const domain = row.getValue("domain") as string
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-inter)]">{domain || "-"}</span>
      )
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return type !== "-" ? (
        <Badge variant="outline" className="font-[family-name:var(--font-inter)]">{type}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "database",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Database
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const database = row.getValue("database") as string
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-inter)]">{database || "-"}</span>
      )
    },
  },
  {
    accessorKey: "rows",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rows
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const rows = row.getValue("rows") as number
      return (
        <span className="font-medium font-[family-name:var(--font-jetbrains-mono)]">
          {rows > 0 ? rows.toLocaleString() : "-"}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig
      const config = statusConfig[status]
      const StatusIcon = config.icon
      return (
        <Badge variant="outline" className="bg-transparent border-border font-[family-name:var(--font-inter)]">
          <StatusIcon size={12} className={`${config.color} ${config.iconClass}`} />
          <span className="text-foreground">{config.label}</span>
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <IconDotsVertical size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/tasks/1/${row.original.id}`}>View</a>
          </DropdownMenuItem>
          <DropdownMenuItem>Download</DropdownMenuItem>
          <DropdownMenuItem>Retry</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function TaskDetailContent({ id }: TaskDetailContentProps) {
  const shortId = id.split("-")[0]

  // Data state
  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [isCheckingTask, setIsCheckingTask] = React.useState(true)
  const [taskNotFound, setTaskNotFound] = React.useState(false)
  const [taskStatus, setTaskStatus] = React.useState<"pending" | "running_recon" | "running" | "paused" | "complete" | "failed">("pending")
  const [progress, setProgress] = React.useState({ target: 0, current: 0 })
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
  const [webCrawler, setWebCrawler] = React.useState<"FullScan" | "Balance" | "Fast">("Balance")
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
  const hasFetched = React.useRef(false)
  
  // Data storage
  const [tableData, setTableData] = React.useState<TableRowData[]>([])
  
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

  // Fetch initial task data
  const fetchTaskData = async (shouldConnectSSE: boolean = false) => {
    setIsLoadingData(true)
    try {
      const response = await fetch(`/api/v1/tasks/${id}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch task data')
      }

      const task = data.data
      
      // 更新任务基本信息
      setTaskName(task.name || '')
      setListsFile(task.file_name || '')
      setTaskStatus(task.status || 'pending')
      setProgress(prev => ({ ...prev, target: task.target || 0 }))
      setFileId(task.file_id || '')
      
      // 更新任务设置
      setWebCrawler(task.web_crawler || 'Balance')
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

      // Task data loaded successfully
    } catch (err) {
      console.error("[TaskDetail] Fetch error:", err)
      toast.error("Failed to load task data")
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial fetch - only run once on mount, after task validation
  React.useEffect(() => {
    if (!hasFetched.current && !isCheckingTask && !taskNotFound) {
      hasFetched.current = true
      fetchTaskData(false) // Fetch task data, auto-connect SSE based on status
    }
  }, [isCheckingTask, taskNotFound])

  // Handle page change (client-side only, no server request)
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
        throw new Error(data.message || 'Failed to fetch task settings')
      }

      const task = data.data
      
      // 更新所有设置状态
      setTaskName(task.name || '')
      setListsFile(task.file_name || '')
      setWebCrawler(task.web_crawler || 'Balance')
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
      toast.error("Failed to load settings")
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleStart = async () => {
    setIsStarting(true)
    try {
      // 首先获取文件的签名 URL
      if (!fileId) {
        toast.error('File information not available')
        return
      }

      const signedUrlResponse = await fetch(`/api/v1/files/${fileId}/signed-url`, {
        method: 'GET',
        credentials: 'include',
      })

      const signedUrlData = await signedUrlResponse.json()

      if (!signedUrlResponse.ok || !signedUrlData.success) {
        toast.error('Failed to generate download URL')
        return
      }

      const downloadUrl = signedUrlData.data.signed_url

      // 调用 start 接口，传递 downloadurl
      const response = await fetch(`/api/v1/start/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          downloadurl: downloadUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 处理错误响应
        const errorCode = data.error
        let errorMessage = 'Please Try Again'
        
        switch (errorCode) {
          case 'user_not_authenticated':
            errorMessage = 'User Not Authenticated'
            break
          case 'task_id_is_required':
            errorMessage = 'Task ID Close'
            break
          case 'task_not_found':
            errorMessage = 'Task Not Found'
            break
          case 'task_not_owned_by_user':
            errorMessage = 'Task Not Owned By User'
            break
          case 'downloadurl is required':
            errorMessage = 'Download URL is required'
            break
          case 'downloadurl must be a valid URL':
            errorMessage = 'Invalid download URL'
            break
          case 'Invalid JSON format':
            errorMessage = 'Invalid request format'
            break
          default:
            errorMessage = 'Please Try Again'
        }
        
        toast.error(errorMessage)
        return
      }

      toast.success('Task Started Successfully')
      
      // 更新任务状态
      setTaskStatus('running_recon')
    } catch (error) {
      console.error('Start task error:', error)
      toast.error('Please Try Again')
    } finally {
      setIsStarting(false)
    }
  }

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
          web_crawler: webCrawler,
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
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTask = async () => {
    setIsDeleting(true)
    console.log('[DELETE TASK] ========== Starting Delete Task ==========')
    console.log('[DELETE TASK] Task ID:', id)
    
    try {
      // 1. 先删除数据库中的任务
      console.log('[DELETE TASK] Step 1: Deleting from database...')
      const dbResponse = await fetch(`/api/v1/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const dbData = await dbResponse.json()
      console.log('[DELETE TASK] Database response:', {
        status: dbResponse.status,
        ok: dbResponse.ok,
        data: dbData
      })

      if (!dbResponse.ok || !dbData.success) {
        console.error('[DELETE TASK] ❌ Database delete failed')
        throw new Error(dbData.message || 'Failed to delete task')
      }

      console.log('[DELETE TASK] ✅ Database delete successful')

      // 2. 尝试删除 Redis 中的任务（非阻塞，失败不影响整体流程）
      console.log('[DELETE TASK] Step 2: Deleting from Redis...')
      try {
        // 获取当前 session 的 access token
        console.log('[DELETE TASK] Getting access token...')
        const authResponse = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (authResponse.ok) {
          const authData = await authResponse.json()
          const accessToken = authData.access_token
          
          console.log('[DELETE TASK] Access token retrieved:', accessToken ? 'Yes' : 'No')
          
          if (accessToken) {
            const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || 'http://localhost:8080'
            const redisDeleteUrl = `${externalApiDomain}/api/v1/delete/${id}`
            
            console.log('[DELETE TASK] Calling Redis delete API:', redisDeleteUrl)
            
            const redisResponse = await fetch(redisDeleteUrl, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            })
            
            console.log('[DELETE TASK] Redis response:', {
              status: redisResponse.status,
              ok: redisResponse.ok,
              statusText: redisResponse.statusText
            })
            
            if (redisResponse.ok) {
              const redisData = await redisResponse.json().catch(() => ({}))
              console.log('[DELETE TASK] ✅ Redis delete successful:', redisData)
            } else {
              const errorText = await redisResponse.text().catch(() => 'Unknown error')
              console.warn('[DELETE TASK] ⚠️ Redis delete failed:', errorText)
            }
          } else {
            console.warn('[DELETE TASK] ⚠️ No access token available for Redis delete')
          }
        } else {
          console.warn('[DELETE TASK] ⚠️ Failed to get auth info:', authResponse.status)
        }
      } catch (redisError) {
        // Redis 删除失败不影响整体流程，只记录日志
        console.warn('[DELETE TASK] ⚠️ Redis delete error (non-critical):', redisError)
      }

      console.log('[DELETE TASK] ✅ Task deletion completed successfully')
      console.log('[DELETE TASK] ==========================================')
      
      toast.success("Task deleted successfully")
      setShowDeleteDialog(false)
      
      // 重定向到任务列表页面
      window.location.href = '/tasks'
    } catch (error) {
      console.error('[DELETE TASK] ❌ Task deletion failed:', error)
      console.log('[DELETE TASK] ==========================================')
      toast.error("Failed to delete task")
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
          <div className="flex items-center gap-1">
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
                    {(progress?.current ?? 0).toLocaleString()} / {(progress?.target ?? 0).toLocaleString()}
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

                <div className="space-y-2">
                  <Label htmlFor="web-crawler">WebCrawler Mode</Label>
                  <div className="relative">
                    <IconWorld className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                    <Select value={webCrawler} onValueChange={(v) => setWebCrawler(v as "FullScan" | "Balance" | "Fast")} disabled={isSaving}>
                      <SelectTrigger className="w-full pl-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FullScan">FullScan</SelectItem>
                        <SelectItem value="Balance">Balance</SelectItem>
                        <SelectItem value="Fast">Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {autoDumper && (
                  <div className="space-y-2">
                    <Label htmlFor="preset">Preset</Label>
                    <Input
                      id="preset"
                      placeholder="email:password"
                      className="font-[family-name:var(--font-jetbrains-mono)]"
                      value={preset}
                      onChange={(e) => setPreset(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <IconSparkles className="size-4 text-purple-500" />
                    <Label htmlFor="ai-mode" className="cursor-pointer text-sm">SQLBot Agent</Label>
                  </div>
                  <Switch id="ai-mode" checked={aiMode} onCheckedChange={setAiMode} disabled={true} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <IconDatabase className="size-4 text-blue-500" />
                    <Label htmlFor="auto-dumper" className="cursor-pointer text-sm">Auto Dumper</Label>
                  </div>
                  <Switch id="auto-dumper" checked={autoDumper} onCheckedChange={setAutoDumper} disabled={isSaving} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Injection Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Injection Settings</h4>
                  <span className="text-xs text-muted-foreground">Recommended: Union & Error only</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => window.open('https://docs.example.com', '_blank')}
                >
                  <IconBook className="size-3.5" />
                  Docs
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="union-based" className="cursor-pointer text-xs">Union</Label>
                  <Switch id="union-based" checked={unionBased} onCheckedChange={setUnionBased} disabled={isSaving} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="error-based" className="cursor-pointer text-xs">Error</Label>
                  <Switch id="error-based" checked={errorBased} onCheckedChange={setErrorBased} disabled={isSaving} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="boolean-based" className="cursor-pointer text-xs">Boolean</Label>
                  <Switch id="boolean-based" checked={booleanBased} onCheckedChange={setBooleanBased} disabled={isSaving} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="time-based" className="cursor-pointer text-xs">Time</Label>
                  <Switch id="time-based" checked={timeBased} onCheckedChange={setTimeBased} disabled={isSaving} />
                </div>
              </div>
            </div>

            {aiMode && (
              <>
                <Separator />

                {/* AI Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <IconSparkles className="size-4 text-purple-500" />
                      SQLbot Agent Settings
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
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
                        <IconBrain className="size-3 text-muted-foreground" />
                        Strategy Engine
                      </Label>
                      <Switch id="response-drift" checked={responsePatternDrift} onCheckedChange={setResponsePatternDrift} disabled={isSaving} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="baseline-profiling" className="cursor-pointer text-xs flex items-center gap-1.5">
                        <IconShield className="size-3 text-muted-foreground" />
                        Risk Filter Engine
                      </Label>
                      <Switch id="baseline-profiling" checked={baselineProfiling} onCheckedChange={setBaselineProfiling} disabled={isSaving} />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor="structural-change" className="cursor-pointer text-xs flex items-center gap-1.5">
                        <IconEye className="size-3 text-muted-foreground" />
                        Detection Agent
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
  )
}
