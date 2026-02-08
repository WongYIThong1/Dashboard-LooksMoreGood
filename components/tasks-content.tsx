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
  IconSparkles,
  IconPencil,
  IconList,
  IconWorld,
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
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  pending: { icon: IconClock, label: "Pending", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-yellow-500" },
  running_recon: { icon: IconLoader2, label: "Running Recon", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-purple-500 animate-spin" },
  running: { icon: IconLoader2, label: "In Progress", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-blue-500 animate-spin" },
  paused: { icon: IconClock, label: "Paused", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-orange-500" },
  complete: { icon: IconCircleCheck, label: "Completed", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-emerald-500" },
  failed: { icon: IconAlertCircle, label: "Failed", className: "text-foreground border-border bg-transparent hover:bg-muted", iconClass: "text-red-500" },
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
    <div className="text-right text-muted-foreground flex items-center justify-end gap-1">
      <IconClock size={14} className="text-blue-500" />
      <span className="font-[family-name:var(--font-jetbrains-mono)]">{duration}</span>
    </div>
  )
}

const columns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
        <Badge variant="outline" className={config.className}>
          <StatusIcon size={12} className={config.iconClass} />
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "found",
    header: "Found",
    cell: ({ row }) => (
      <span className="text-foreground font-medium font-[family-name:var(--font-jetbrains-mono)]">{row.getValue("found")}</span>
    ),
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: ({ row }) => {
      const target = row.getValue("target") as string | null
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">{target || "-"}</span>
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
    header: () => <div className="text-right">Started / Duration</div>,
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
          <DropdownMenuItem asChild>
            <a href={`/tasks/1/${row.original.id}`}>View database</a>
          </DropdownMenuItem>
          <DropdownMenuItem>Pause</DropdownMenuItem>
          <DropdownMenuItem>Restart</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
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
  const [rowSelection, setRowSelection] = React.useState({})
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [aiMode, setAiMode] = React.useState(true)
  const [autoDumper, setAutoDumper] = React.useState(false)
  const [availableFiles, setAvailableFiles] = React.useState<Array<{ id: string; name: string }>>([])
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [taskName, setTaskName] = React.useState("")
  const [selectedFileId, setSelectedFileId] = React.useState("")
  const [webCrawler, setWebCrawler] = React.useState<"FullScan" | "Balance" | "Fast">("Balance")
  const [preset, setPreset] = React.useState("")
  
  // AI Settings
  const [parameterRiskFilter, setParameterRiskFilter] = React.useState<"high" | "medium-high" | "all">("medium-high")
  const [responsePatternDrift, setResponsePatternDrift] = React.useState(true)
  const [baselineProfiling, setBaselineProfiling] = React.useState(true)
  const [structuralChangeDetection, setStructuralChangeDetection] = React.useState(false)
  const [aiSensitivityLevel, setAiSensitivityLevel] = React.useState<"low" | "medium" | "high">("medium")

  React.useEffect(() => {
    fetchTasks()
  }, [])

  // Fetch files when dialog opens
  React.useEffect(() => {
    if (showCreateDialog) {
      fetchFiles()
    }
  }, [showCreateDialog])

  const fetchFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const response = await fetch('/api/v1/files', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data: { success: boolean; data?: { files: Array<{ id: string; name: string; type: string }> }; message?: string } = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch files')
      }

      if (data.data) {
        // 只显示 type 为 "urls" 的文件
        const urlsFiles = data.data.files
          .filter(file => file.type === 'urls')
          .map(file => ({
            id: file.id,
            name: file.name,
          }))
        
        setAvailableFiles(urlsFiles)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error("Failed to load files")
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
          web_crawler: webCrawler,
          auto_dumper: autoDumper,
          preset: preset || null,
          ai_mode: aiMode,
          parameter_risk_filter: parameterRiskFilter,
          ai_sensitivity_level: aiSensitivityLevel,
          response_pattern_drift: responsePatternDrift,
          baseline_profiling: baselineProfiling,
          structural_change_detection: structuralChangeDetection,
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
      setAiMode(true)
      setAutoDumper(false)
      setWebCrawler("Balance")
      setPreset("")
      setParameterRiskFilter("medium-high")
      setResponsePatternDrift(true)
      setBaselineProfiling(true)
      setStructuralChangeDetection(false)
      setAiSensitivityLevel("medium")
      
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
      const response = await fetch('/api/v1/tasks', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const data: { 
        success: boolean
        data?: Array<any>
        current_tasks?: number
        max_tasks?: number
        plan?: string
        message?: string 
      } = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch tasks')
      }

      if (data.data) {
        // 格式化任务数据以匹配 Task 接口
        const formattedTasks: Task[] = data.data.map((task: any) => {
          const isRunning = task.status === 'running' || task.status === 'running_recon'
          // API 返回的 started 字段是原始时间戳（started_at）
          const startedTimeRaw = task.started || null
          
          // 格式化开始时间
          let startedDisplay = '-'
          if (startedTimeRaw) {
            const formatted = formatStartedTime(startedTimeRaw)
            startedDisplay = formatted !== '-' ? formatted : '-'
          }
          
          return {
            id: task.id,
            name: task.name,
            status: task.status as TaskStatus,
            found: task.found || 0,
            target: task.target || null,
            file: task.file || '',
            started: startedDisplay,
            startedTime: startedTimeRaw || '',
            isRunning,
          }
        })
        
        setTasksData(formattedTasks)
      }

      // 更新任务配额信息
      if (typeof data.max_tasks === 'number') {
        setMaxTasks(data.max_tasks)
      }
      if (data.plan) {
        setUserPlan(data.plan)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error("Failed to load tasks")
      setTasksData([])
    } finally {
      setIsLoading(false)
    }
  }

  const table = useReactTable({
    data: tasksData,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex flex-col border-b">
        <div className="h-16 px-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-2 h-full">
            <span className="text-2xl font-bold">{tasksData.length}</span>
            <span className="text-lg text-muted-foreground">/ {maxTasks} tasks</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              className="h-9 gap-2" 
              onClick={() => {
                const canCreate = tasksData.length < maxTasks && userPlan !== 'Free'
                if (!canCreate) {
                  if (userPlan === 'Free') {
                    toast.error('Free plan users cannot create tasks. Please upgrade your plan.')
                  } else {
                    toast.error(`Task limit reached. You have ${tasksData.length} of ${maxTasks} tasks.`)
                  }
                  return
                }
                setShowCreateDialog(true)
              }}
              disabled={tasksData.length >= maxTasks || userPlan === 'Free'}
            >
              <IconPlus size={16} strokeWidth={3} />
              Create task
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
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
          </>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Configure your task settings below
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateTask} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <div className="relative">
                <IconPencil className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="task-name" 
                  placeholder="Enter task name" 
                  className="pl-10"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file">Lists</Label>
                <div className="relative">
                  <IconList className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                  <Select value={selectedFileId} onValueChange={setSelectedFileId} disabled={isCreating}>
                    <SelectTrigger className="w-full pl-10">
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

              <div className="space-y-2">
                <Label htmlFor="web-crawler">WebCrawler Mode</Label>
                <div className="relative">
                  <IconWorld className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                  <Select value={webCrawler} onValueChange={(v) => setWebCrawler(v as "FullScan" | "Balance" | "Fast")} disabled={isCreating}>
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="FullScan">FullScan</SelectItem>
                      <SelectItem value="Balance">Balance</SelectItem>
                      <SelectItem value="Fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <IconSparkles className="size-4 text-purple-500" />
                </div>
                <div>
                  <Label htmlFor="ai-mode" className="cursor-pointer">SQLBot Agent</Label>
                  <p className="text-xs text-muted-foreground">Enable AI-powered scanning</p>
                </div>
              </div>
              <Switch id="ai-mode" checked={aiMode} onCheckedChange={setAiMode} disabled={true} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <Label htmlFor="auto-dumper" className="cursor-pointer">Auto Dumper</Label>
                  <p className="text-xs text-muted-foreground">Automatically dump found data</p>
                </div>
              </div>
              <Switch id="auto-dumper" checked={autoDumper} onCheckedChange={setAutoDumper} disabled={isCreating} />
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
                  disabled={isCreating}
                />
                <p className="text-xs text-muted-foreground">Enter the column format for dumping</p>
              </div>
            )}

            {aiMode && (
              <div className="space-y-4 rounded-lg border p-4">
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
                    <Select value={parameterRiskFilter} onValueChange={(v) => setParameterRiskFilter(v as "high" | "medium-high" | "all")} disabled={isCreating}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
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
                    <Select value={aiSensitivityLevel} onValueChange={(v) => setAiSensitivityLevel(v as "low" | "medium" | "high")} disabled={isCreating}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
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
                    <Switch id="response-drift" checked={responsePatternDrift} onCheckedChange={setResponsePatternDrift} disabled={isCreating} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="baseline-profiling" className="cursor-pointer text-xs flex items-center gap-1.5">
                      <IconShield className="size-3 text-muted-foreground" />
                      Risk Filter Engine
                    </Label>
                    <Switch id="baseline-profiling" checked={baselineProfiling} onCheckedChange={setBaselineProfiling} disabled={isCreating} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="structural-change" className="cursor-pointer text-xs flex items-center gap-1.5">
                      <IconEye className="size-3 text-muted-foreground" />
                      Detection Agent
                    </Label>
                    <Switch id="structural-change" checked={structuralChangeDetection} onCheckedChange={setStructuralChangeDetection} disabled={isCreating} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
