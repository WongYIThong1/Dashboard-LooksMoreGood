"use client"

import * as React from "react"
import {
  IconPlus,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconList,
  IconBook,
  IconX,
  IconShield,
  IconSparkles,
  IconAdjustments,
  IconCpu,
  IconShieldCheck,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

type TaskStatus = "pending" | "running_recon" | "running" | "paused" | "complete" | "failed"

type UrlsFile = { id: string; name: string; type?: string }

interface Task {
  id: string
  name: string
  status: TaskStatus
  found: number
  target: string | null
  file: string
  started: string
  startedTime: string
  isRunning: boolean
}

interface ApiTask {
  id: string
  name: string
  status: string
  found: number
  target: string | null
  file: string
  started_time: string | null
}

const statusConfig = {
  pending: { icon: IconClock, label: "Pending", dotClass: "bg-muted-foreground" },
  running_recon: { icon: IconLoader2, label: "Running recon", dotClass: "bg-blue-500" },
  running: { icon: IconLoader2, label: "Running", dotClass: "bg-blue-500" },
  paused: { icon: IconClock, label: "Paused", dotClass: "bg-orange-500" },
  complete: { icon: IconCircleCheck, label: "Complete", dotClass: "bg-emerald-500" },
  failed: { icon: IconAlertCircle, label: "Failed", dotClass: "bg-red-500" },
}

// Component for running task duration that updates every second
function RunningDuration({ startedTime }: { startedTime: string }) {
  const [duration, setDuration] = React.useState("")

  React.useEffect(() => {
    const calculateDuration = () => {
      const date = new Date(startedTime)
      if (isNaN(date.getTime())) {
        setDuration("-")
        return
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffSecs / 60)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffSecs < 60) {
        setDuration(`${diffSecs}s`)
      } else if (diffMins < 60) {
        setDuration(`${diffMins}m ${diffSecs % 60}s`)
      } else if (diffHours < 24) {
        setDuration(`${diffHours}h ${diffMins % 60}m`)
      } else {
        setDuration(`${diffDays}d ${diffHours % 24}h`)
      }
    }

    // Calculate immediately
    calculateDuration()

    // Update every second
    const interval = setInterval(calculateDuration, 1000)

    return () => clearInterval(interval)
  }, [startedTime])

  return (
    <div className="text-right text-muted-foreground font-mono">{duration}</div>
  )
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "name",
    header: "Task",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const config = statusConfig[status as TaskStatus] || statusConfig.pending
      const StatusIcon = config.icon
      return (
        <Badge variant="outline" className="bg-transparent">
          <span className={`size-1.5 rounded-full ${config.dotClass}`} />
          <span className="text-foreground">{config.label}</span>
          {(status === "running" || status === "running_recon") && (
            <StatusIcon size={12} className="text-muted-foreground animate-spin" />
          )}
        </Badge>
      )
    },
  },
  {
    accessorKey: "found",
    header: "Found",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.getValue("found")}</span>
    ),
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: ({ row }) => {
      const target = row.getValue("target") as string | null
      return (
        <span className="font-mono text-sm text-muted-foreground">{target || "-"}</span>
      )
    },
  },
  {
    accessorKey: "file",
    header: "File",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("file")}</span>
    ),
  },
  {
    accessorKey: "started",
    header: () => <div className="text-right">Started</div>,
    cell: ({ row }) => {
      const isRunning = row.original.isRunning
      const startedTime = row.original.startedTime
      
      // For running tasks, use a component that updates every second
      if (isRunning && startedTime && startedTime !== '-') {
        return <RunningDuration startedTime={startedTime} />
      }
      
      const startedValue = row.original.started || row.getValue("started") || '-'
      const displayValue = startedValue && startedValue !== '' && startedValue !== 'null' ? startedValue : '-'
      return (
        <div className="text-right text-muted-foreground">
          <span>{displayValue}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-8 p-0"
            size="icon"
          >
            <IconDotsVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/tasks/${row.original.id}`}>View details</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function TasksContent() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [tasksData, setTasksData] = React.useState<Task[]>([])
  const [maxTasks, setMaxTasks] = React.useState(0)
  const [userPlan, setUserPlan] = React.useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [autoDumper, setAutoDumper] = React.useState(false)
  const [availableFiles, setAvailableFiles] = React.useState<UrlsFile[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [taskName, setTaskName] = React.useState("")
  const [selectedFileId, setSelectedFileId] = React.useState("")
  const [preset, setPreset] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | TaskStatus>("all")
  const [createAdvanced, setCreateAdvanced] = React.useState<string[]>([])
  const aiMode = true

  React.useEffect(() => {
    if (!showCreateDialog) setCreateAdvanced([])
  }, [showCreateDialog])

  // AI Settings
  const [responsePatternDrift, setResponsePatternDrift] = React.useState(true)
  const [structuralChangeDetection, setStructuralChangeDetection] = React.useState(false)
  const [aiSensitivityLevel, setAiSensitivityLevel] = React.useState<"low" | "medium" | "high">("medium")
  const [antiBanEngine, setAntiBanEngine] = React.useState(false)
  const [payloadEngine, setPayloadEngine] = React.useState(false)
  const antiBanAvailable = false

  // Injection Settings
  const [injectionUnion, setInjectionUnion] = React.useState(true)
  const [injectionError, setInjectionError] = React.useState(true)
  const [injectionBoolean, setInjectionBoolean] = React.useState(false)
  const [injectionTimebased, setInjectionTimebased] = React.useState(false)
  const hasLoadedFilesRef = React.useRef(false)

  React.useEffect(() => {
    fetchTasks()
  }, [])

  // Fetch files when dialog opens
  React.useEffect(() => {
    if (showCreateDialog) {
      if (!hasLoadedFilesRef.current) {
        fetchFiles()
      }
    }
  }, [showCreateDialog])

  const fetchFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const response = await fetch('/api/files?type=urls&minimal=1', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      const urlsFiles = (data.files || []).map((file: UrlsFile) => ({ id: file.id, name: file.name }))
      
      setAvailableFiles(urlsFiles)
      hasLoadedFilesRef.current = true
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error("Please Try Again")
      setAvailableFiles([])
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!taskName.trim()) {
      toast.error("Please enter a task name")
      return
    }

    if (!selectedFileId) {
      toast.error("Please select a file")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: taskName.trim(),
          file_id: selectedFileId,
          auto_dumper: autoDumper,
          preset: preset || null,
          ai_mode: true,
          ai_sensitivity_level: aiSensitivityLevel,
          response_pattern_drift: responsePatternDrift,
          structural_change_detection: structuralChangeDetection,
          anti_ban_engine: antiBanAvailable ? antiBanEngine : false,
          payload_engine: payloadEngine,
          injection_union: injectionUnion,
          injection_error: injectionError,
          injection_boolean: injectionBoolean,
          injection_timebased: injectionTimebased,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // 处理特定的错误代码
        if (response.status === 403) {
          const errorCode = data.code
          if (errorCode === 'FREE_PLAN_LIMIT') {
            throw new Error('Free plan users cannot create tasks. Please upgrade your plan.')
          } else if (errorCode === 'TASK_LIMIT_REACHED') {
            throw new Error(data.message || 'Task limit reached. Please delete some tasks or upgrade your plan.')
          }
        }
        throw new Error(data.message || 'Failed to create task')
      }

      toast.success('Task created successfully')
      setShowCreateDialog(false)
      setTaskName("")
      setSelectedFileId("")
      setAutoDumper(false)
      setPreset("")
      setResponsePatternDrift(true)
      setStructuralChangeDetection(false)
      setAiSensitivityLevel("medium")
      setAntiBanEngine(false)
      setPayloadEngine(false)
      setInjectionUnion(true)
      setInjectionError(true)
      setInjectionBoolean(false)
      setInjectionTimebased(false)
      
      // 刷新任务列表
      fetchTasks()
    } catch (error) {
      console.error('Create task error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to create task")
    } finally {
      setIsCreating(false)
    }
  }

  const formatTimeAgo = (dateString: string | null | undefined): string => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs}s`
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s`
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`
    return `${diffDays}d ${diffHours % 24}h`
  }

  const formatStartedTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      // Run in parallel to reduce initial page wait time.
      const [settingsResponse, tasksResponse] = await Promise.all([
        fetch('/api/settings', { method: 'GET' }),
        fetch('/api/v1/tasks', { method: 'GET' }),
      ])
      const [settingsData, tasksData] = await Promise.all([
        settingsResponse.json(),
        tasksResponse.json(),
      ])

      if (!settingsResponse.ok) {
        throw new Error(settingsData.error || 'Failed to fetch user info')
      }

      // 设置用户计划和任务限制
      setUserPlan(settingsData.plan || 'Free')
      setMaxTasks(settingsData.max_tasks || 0)

      if (!tasksResponse.ok) {
        throw new Error(tasksData.error || 'Failed to fetch tasks')
      }

      // Transform API data to match frontend format
      const transformedTasks: Task[] = (tasksData.tasks || []).map((task: ApiTask) => {
        const isRunning = task.status === 'running' || task.status === 'running_recon'
        return {
          id: task.id,
          name: task.name,
          status: task.status as TaskStatus,
          found: task.found,
          target: task.target,
          file: task.file,
          started: formatTimeAgo(task.started_time),
          startedTime: task.started_time || '-',
          isRunning,
        }
      })

      setTasksData(transformedTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error("Please Try Again")
      setTasksData([])
      setMaxTasks(0)
      setUserPlan('Free')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasksData.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.target || "").toLowerCase().includes(q) ||
        (t.file || "").toLowerCase().includes(q)
      )
    })
  }, [tasksData, query, statusFilter])

  const usagePercent =
    maxTasks > 0 ? Math.min(100, Math.round((tasksData.length / maxTasks) * 100)) : 0

  const table = useReactTable({
    data: filteredTasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Quiet header row (outer breadcrumb header already exists) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="text-lg font-semibold tracking-tight">Tasks</div>
              <div className="text-sm text-muted-foreground">
                {maxTasks > 0 ? (
                  <>
                    <span className="font-mono text-foreground">
                      {tasksData.length}/{maxTasks}
                    </span>{" "}
                    used
                    <span className="mx-2 text-muted-foreground/60">•</span>
                    <span className="font-mono">{Math.max(0, maxTasks - tasksData.length)}</span>{" "}
                    remaining
                  </>
                ) : (
                  <>{tasksData.length} tasks</>
                )}
              </div>
              {maxTasks > 0 && (
                <div className="pt-2 max-w-[320px]">
                  <Progress value={usagePercent} className="h-1" />
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => {
                if (userPlan === "Free") {
                  toast.error("Free plan users cannot create tasks. Please upgrade to Pro or Pro+.")
                  return
                }
                if (tasksData.length >= maxTasks) {
                  toast.error(
                    `Task limit reached. You have ${tasksData.length} of ${maxTasks} tasks. Please delete some tasks or upgrade your plan.`
                  )
                  return
                }
                setShowCreateDialog(true)
              }}
              disabled={userPlan === "Free" || (maxTasks > 0 && tasksData.length >= maxTasks)}
            >
              <IconPlus className="size-4" />
              Create task
            </Button>
          </div>

      {/* Table Section */}
          <div className="space-y-3">
            {/* Toolbar (not inside a card) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    table.setPageIndex(0)
                  }}
                  placeholder="Search task name, target, file..."
                  className="h-9 max-w-[420px]"
                />
                <div className="text-sm text-muted-foreground">
                  {table.getPrePaginationRowModel().rows.length} results
                </div>
              </div>

              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as typeof statusFilter)
                  table.setPageIndex(0)
                }}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running_recon">Running recon</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table (integrated, minimal chrome) */}
            <div className="border-y">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="bg-muted/30 hover:bg-muted/30"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={[
                              "text-xs font-medium text-muted-foreground",
                              header.column.id === "started" ? "text-right" : "",
                            ].join(" ")}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
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
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length} className="h-[400px]">
                          <div className="flex flex-col items-center justify-center text-center py-12">
                            <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 mb-4">
                              <IconList className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold tracking-tight mb-2">No tasks yet</h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-[420px]">
                              Create your first task to start scanning
                            </p>
                            {(userPlan === "Pro" || userPlan === "Pro+") &&
                              tasksData.length < maxTasks && (
                                <Button onClick={() => setShowCreateDialog(true)} size="sm">
                                  <IconPlus className="size-4" />
                                  Create task
                                </Button>
                              )}
                            {userPlan === "Free" && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                                <IconShield className="size-4" />
                                <span>Upgrade to Pro or Pro+ to create tasks</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {table.getRowModel().rows?.length > 0 && (
              <div className="flex items-center justify-between py-1">
                <div className="text-sm text-muted-foreground">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto scrollbar-hide data-[state=open]:duration-200">
          <DialogHeader className="flex-row items-start justify-between motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-reduce:animate-none">
            <div className="space-y-1 text-left">
              <DialogTitle>Create new task</DialogTitle>
              <DialogDescription>Configure settings and start scanning.</DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={() => window.open('https://docs.example.com', '_blank')}
            >
              <IconBook className="size-4" />
              Docs
            </Button>
          </DialogHeader>
          
          <form
            onSubmit={handleCreateTask}
            className="space-y-6 py-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-reduce:animate-none"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task name</Label>
                <Input
                  id="task-name"
                  placeholder="e.g. My first scan"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Lists</Label>
                <Select value={selectedFileId} onValueChange={setSelectedFileId} disabled={isCreating}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingFiles ? "Loading..." : "Select a file"} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)]">
                    {availableFiles.length > 0 ? (
                      availableFiles.map((file) => (
                        <SelectItem key={file.id} value={file.id}>{file.name}</SelectItem>
                      ))
                    ) : (
                      <div className="py-2 px-2 text-sm text-muted-foreground">No URLs files found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI is the product: make it visible, but still minimal */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <IconSparkles className="size-4 text-muted-foreground" />
                    <div className="text-sm font-medium">AI settings</div>
                    <Badge variant="outline" className="bg-transparent text-[10px] font-mono">enabled</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    SQLBot AI is always on. Strategy + Evasion are the core engines, then use AI tuning for extra power.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ai-sensitivity" className="flex items-center gap-2">
                    <IconAdjustments className="size-4 text-muted-foreground" />
                    AI sensitivity
                  </Label>
                  <Select
                    value={aiSensitivityLevel}
                    onValueChange={(v) => setAiSensitivityLevel(v as "low" | "medium" | "high")}
                    disabled={isCreating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Higher sensitivity can increase findings but may cost more credits.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Engines</Label>
                  <div className="grid gap-2">
                    <div className="flex items-start justify-between rounded-lg border bg-background p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="response-drift" className="cursor-pointer text-sm flex items-center gap-2 flex-wrap">
                          <IconCpu className="size-4 text-muted-foreground" />
                          <span className="whitespace-nowrap">Strategy Engine</span>
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">Recommended</Badge>
                        </Label>
                        <div className="text-xs text-muted-foreground">Adapts strategy based on responses.</div>
                      </div>
                      <Switch
                        id="response-drift"
                        checked={responsePatternDrift}
                        onCheckedChange={setResponsePatternDrift}
                        disabled={isCreating}
                      />
                    </div>

                    <div className="flex items-start justify-between rounded-lg border bg-background p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="structural-change" className="cursor-pointer text-sm flex items-center gap-2 flex-wrap">
                          <IconShieldCheck className="size-4 text-muted-foreground" />
                          <span className="whitespace-nowrap">Evasion Engine</span>
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">Recommended</Badge>
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-600 border-amber-300/70">Costs credits</Badge>
                        </Label>
                        <div className="text-xs text-muted-foreground">Smarter WAF bypass with stronger evasion capability. This engine consumes credits when enabled.</div>
                      </div>
                      <Switch
                        id="structural-change"
                        checked={structuralChangeDetection}
                        onCheckedChange={setStructuralChangeDetection}
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="auto-dumper" className="cursor-pointer">Auto dumper</Label>
                  <div className="text-xs text-muted-foreground">Automatically dump found data.</div>
                </div>
                <Switch id="auto-dumper" checked={autoDumper} onCheckedChange={setAutoDumper} disabled={isCreating} />
              </div>

              {autoDumper && (
                <div className="space-y-2">
                  <Label htmlFor="preset">Preset format</Label>
                  <Select value={preset} onValueChange={setPreset} disabled={isCreating}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="email:password">
                        <span className="font-mono text-sm">email:password</span>
                      </SelectItem>
                      <SelectItem value="username:password">
                        <span className="font-mono text-sm">username:password</span>
                      </SelectItem>
                      <SelectItem value="phone:password">
                        <span className="font-mono text-sm">phone:password</span>
                      </SelectItem>
                      <SelectItem value="email">
                        <span className="font-mono text-sm">email</span>
                      </SelectItem>
                      <SelectItem value="username">
                        <span className="font-mono text-sm">username</span>
                      </SelectItem>
                      <SelectItem value="phone">
                        <span className="font-mono text-sm">phone</span>
                      </SelectItem>
                      <SelectItem value="cc:cvv:exp">
                        <span className="font-mono text-sm">cc:cvv:exp</span>
                      </SelectItem>
                      <SelectItem value="name:cc:cvv:exp:address">
                        <span className="font-mono text-sm">name:cc:cvv:exp:address</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Accordion
              type="multiple"
              value={createAdvanced}
              onValueChange={(v) => setCreateAdvanced(v as string[])}
              className="rounded-lg border px-4"
            >
              <AccordionItem value="ai-tuning">
                <AccordionTrigger>Advanced: AI tuning</AccordionTrigger>
                <AccordionContent>
                  {createAdvanced.includes("ai-tuning") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="anti-ban-engine" className="cursor-pointer text-sm flex items-center gap-2">
                            <IconShield className="size-4 text-muted-foreground" />
                            AntiBan engine
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Currently unavailable</Badge>
                          </Label>
                          <div className="text-xs text-muted-foreground">Temporarily unavailable in current version.</div>
                        </div>
                        <Switch
                          id="anti-ban-engine"
                          checked={antiBanEngine}
                          onCheckedChange={setAntiBanEngine}
                          disabled
                        />
                      </div>

                      <div className="flex items-start justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="payload-engine" className="cursor-pointer text-sm flex items-center gap-2">
                            <IconSparkles className="size-4 text-muted-foreground" />
                            Payload engine
                          </Label>
                          <div className="text-xs text-muted-foreground">Expands payload generation depth and variation. No credits cost.</div>
                        </div>
                        <Switch
                          id="payload-engine"
                          checked={payloadEngine}
                          onCheckedChange={setPayloadEngine}
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="injection">
                <AccordionTrigger>Advanced: injection settings</AccordionTrigger>
                <AccordionContent>
                  {createAdvanced.includes("injection") && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="injection-union"
                          checked={injectionUnion}
                          onCheckedChange={(checked) => setInjectionUnion(checked === true)}
                          disabled={isCreating}
                        />
                        <Label htmlFor="injection-union" className="cursor-pointer text-sm font-normal">
                          Union-based
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="injection-error"
                          checked={injectionError}
                          onCheckedChange={(checked) => setInjectionError(checked === true)}
                          disabled={isCreating}
                        />
                        <Label htmlFor="injection-error" className="cursor-pointer text-sm font-normal">
                          Error-based
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="injection-boolean"
                          checked={injectionBoolean}
                          onCheckedChange={(checked) => setInjectionBoolean(checked === true)}
                          disabled={isCreating}
                        />
                        <Label htmlFor="injection-boolean" className="cursor-pointer text-sm font-normal inline-flex items-center gap-2">
                          Boolean-based
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-600 border-amber-300/70">Costs credits</Badge>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="injection-timebased"
                          checked={injectionTimebased}
                          onCheckedChange={(checked) => setInjectionTimebased(checked === true)}
                          disabled={isCreating}
                        />
                        <Label htmlFor="injection-timebased" className="cursor-pointer text-sm font-normal inline-flex items-center gap-2">
                          Time-based
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-600 border-amber-300/70">Costs credits</Badge>
                        </Label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Boolean-based and Time-based checks consume extra credits when enabled.
                    </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
                <IconX className="size-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconPlus className="size-4" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
