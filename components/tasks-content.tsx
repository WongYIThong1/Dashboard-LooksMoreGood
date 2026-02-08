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
  IconShieldCheck,
  IconBolt,
  IconBulb,
  IconCpu,
  IconDatabase,
  IconGitMerge,
  IconAlertTriangle,
  IconToggleLeft,
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
  const [preset, setPreset] = React.useState("")
  
  // AI Settings
  const [parameterRiskFilter, setParameterRiskFilter] = React.useState<"high" | "medium-high" | "all">("medium-high")
  const [responsePatternDrift, setResponsePatternDrift] = React.useState(true)
  const [baselineProfiling, setBaselineProfiling] = React.useState(true)
  const [structuralChangeDetection, setStructuralChangeDetection] = React.useState(false)
  const [aiSensitivityLevel, setAiSensitivityLevel] = React.useState<"low" | "medium" | "high">("medium")

  // Injection Settings
  const [injectionUnion, setInjectionUnion] = React.useState(true)
  const [injectionError, setInjectionError] = React.useState(true)
  const [injectionBoolean, setInjectionBoolean] = React.useState(false)
  const [injectionTimebased, setInjectionTimebased] = React.useState(false)

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
      const response = await fetch('/api/files', {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      // 只显示 type 为 "urls" 的文件
      const urlsFiles = (data.files || [])
        .filter((file: any) => file.type === 'urls')
        .map((file: any) => ({
          id: file.id,
          name: file.name,
        }))
      
      console.log('Loaded URLs files:', urlsFiles)
      setAvailableFiles(urlsFiles)
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
          auto_dumper: autoDumper,
          preset: preset || null,
          ai_mode: aiMode,
          parameter_risk_filter: parameterRiskFilter,
          ai_sensitivity_level: aiSensitivityLevel,
          response_pattern_drift: responsePatternDrift,
          baseline_profiling: baselineProfiling,
          structural_change_detection: structuralChangeDetection,
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
      setAiMode(true)
      setAutoDumper(false)
      setPreset("")
      setParameterRiskFilter("medium-high")
      setResponsePatternDrift(true)
      setBaselineProfiling(true)
      setStructuralChangeDetection(false)
      setAiSensitivityLevel("medium")
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
      // Fetch user settings (plan and max_tasks)
      const settingsResponse = await fetch('/api/settings', {
        method: 'GET',
      })

      const settingsData = await settingsResponse.json()

      if (!settingsResponse.ok) {
        throw new Error(settingsData.error || 'Failed to fetch user info')
      }

      // 设置用户计划和任务限制
      setUserPlan(settingsData.plan || 'Free')
      setMaxTasks(settingsData.max_tasks || 0)

      // Fetch tasks from API
      const tasksResponse = await fetch('/api/v1/tasks', {
        method: 'GET',
      })

      const tasksData = await tasksResponse.json()

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
      toast.error("Failed to load tasks")
      setTasksData([])
      setMaxTasks(0)
      setUserPlan('Free')
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
    <div className="flex flex-1 flex-col min-w-0 p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor your scanning tasks
            </p>
          </div>
          <Button 
            size="default"
            onClick={() => {
              // 检查用户计划
              if (userPlan === 'Free') {
                toast.error('Free plan users cannot create tasks. Please upgrade to Pro or Pro+.')
                return
              }

              // 检查是否达到任务限制
              if (tasksData.length >= maxTasks) {
                toast.error(`Task limit reached. You have ${tasksData.length} of ${maxTasks} tasks. Please delete some tasks or upgrade your plan.`)
                return
              }

              setShowCreateDialog(true)
            }}
            disabled={userPlan === 'Free' || tasksData.length >= maxTasks}
          >
            <IconPlus size={16} className="mr-2" />
            Create Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold mt-1">{tasksData.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <IconList className="size-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {maxTasks - tasksData.length} slots available
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold mt-1">
                  {tasksData.filter(t => t.status === 'running' || t.status === 'running_recon').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <IconLoader2 className="size-5 text-blue-500 animate-spin" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active scans
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1">
                  {tasksData.filter(t => t.status === 'complete').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/10">
                <IconCircleCheck className="size-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Successfully finished
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Found</p>
                <p className="text-2xl font-bold mt-1">
                  {tasksData.reduce((sum, t) => sum + t.found, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <IconSparkles className="size-5 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Vulnerabilities detected
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
                  className="h-[400px]"
                >
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 mb-4">
                      <IconList className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">
                      No tasks yet
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-[420px]">
                      Create your first task to start scanning
                    </p>
                    {(userPlan === 'Pro' || userPlan === 'Pro+') && tasksData.length < maxTasks && (
                      <Button 
                        onClick={() => setShowCreateDialog(true)}
                        size="sm"
                      >
                        <IconPlus size={16} className="mr-2" />
                        Create Task
                      </Button>
                    )}
                    {userPlan === 'Free' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                        <IconShield size={16} />
                        <span>Upgrade to Pro or Pro+ to create tasks</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {table.getRowModel().rows?.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected
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
                <Label htmlFor="preset" className="flex items-center gap-2">
                  <IconDatabase className="size-3.5 text-muted-foreground" />
                  Preset Format
                </Label>
                <Select value={preset} onValueChange={setPreset} disabled={isCreating}>
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

            <div className="space-y-4 rounded-lg border p-4">
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
                      <IconCpu className="size-4 text-muted-foreground" />
                      Strategy Engine
                    </Label>
                    <Switch id="response-drift" checked={responsePatternDrift} onCheckedChange={setResponsePatternDrift} disabled={isCreating} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="baseline-profiling" className="cursor-pointer text-xs flex items-center gap-1.5">
                      <IconShield className="size-4 text-muted-foreground" />
                      Risk Filter Engine
                    </Label>
                    <Switch id="baseline-profiling" checked={baselineProfiling} onCheckedChange={setBaselineProfiling} disabled={isCreating} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor="structural-change" className="cursor-pointer text-xs flex items-center gap-1.5">
                      <IconShieldCheck className="size-4 text-muted-foreground" />
                      Evasion Engine
                    </Label>
                    <Switch id="structural-change" checked={structuralChangeDetection} onCheckedChange={setStructuralChangeDetection} disabled={isCreating} />
                  </div>
                </div>
              </div>

            <div className="space-y-4 rounded-lg border p-4">
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
                      id="injection-union" 
                      checked={injectionUnion} 
                      onCheckedChange={setInjectionUnion} 
                      disabled={isCreating}
                    />
                    <Label htmlFor="injection-union" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                      <IconGitMerge className="size-4 text-muted-foreground" />
                      Union-based
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="injection-error" 
                      checked={injectionError} 
                      onCheckedChange={setInjectionError} 
                      disabled={isCreating}
                    />
                    <Label htmlFor="injection-error" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                      <IconAlertTriangle className="size-4 text-muted-foreground" />
                      Error-based
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="injection-boolean" 
                      checked={injectionBoolean} 
                      onCheckedChange={setInjectionBoolean} 
                      disabled={isCreating}
                    />
                    <Label htmlFor="injection-boolean" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                      <IconToggleLeft className="size-4 text-muted-foreground" />
                      Boolean-based
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="injection-timebased" 
                      checked={injectionTimebased} 
                      onCheckedChange={setInjectionTimebased} 
                      disabled={isCreating}
                    />
                    <Label htmlFor="injection-timebased" className="cursor-pointer text-sm font-normal flex items-center gap-1.5">
                      <IconClock className="size-4 text-muted-foreground" />
                      Time-based
                    </Label>
                  </div>
                </div>
              </div>

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
