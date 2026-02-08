"use client"

import * as React from "react"
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconDownload,
  IconTrash,
  IconCalendar,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

// Mock history data
interface HistoryData {
  id: string
  taskName: string
  status: "completed" | "failed" | "cancelled"
  injected: number
  dumped: number
  duration: string
  startedAt: string
  completedAt: string
}

const historyData: HistoryData[] = [
  { id: "1", taskName: "Task #1", status: "completed", injected: 500, dumped: 15420, duration: "2h 34m", startedAt: "2026-01-11 14:00", completedAt: "2026-01-11 16:34" },
  { id: "2", taskName: "Task #2", status: "completed", injected: 320, dumped: 8932, duration: "1h 12m", startedAt: "2026-01-11 10:00", completedAt: "2026-01-11 11:12" },
  { id: "3", taskName: "Task #3", status: "failed", injected: 45, dumped: 0, duration: "15m", startedAt: "2026-01-10 22:00", completedAt: "2026-01-10 22:15" },
  { id: "4", taskName: "Task #4", status: "completed", injected: 890, dumped: 45123, duration: "4h 56m", startedAt: "2026-01-10 08:00", completedAt: "2026-01-10 12:56" },
  { id: "5", taskName: "Task #5", status: "cancelled", injected: 120, dumped: 3200, duration: "45m", startedAt: "2026-01-09 16:00", completedAt: "2026-01-09 16:45" },
  { id: "6", taskName: "Task #6", status: "completed", injected: 650, dumped: 28901, duration: "3h 20m", startedAt: "2026-01-09 09:00", completedAt: "2026-01-09 12:20" },
  { id: "7", taskName: "Task #7", status: "completed", injected: 420, dumped: 12345, duration: "2h 10m", startedAt: "2026-01-08 14:30", completedAt: "2026-01-08 16:40" },
  { id: "8", taskName: "Task #8", status: "failed", injected: 80, dumped: 0, duration: "25m", startedAt: "2026-01-08 10:00", completedAt: "2026-01-08 10:25" },
  { id: "9", taskName: "Task #9", status: "completed", injected: 780, dumped: 34567, duration: "3h 45m", startedAt: "2026-01-07 11:00", completedAt: "2026-01-07 14:45" },
  { id: "10", taskName: "Task #10", status: "completed", injected: 560, dumped: 21098, duration: "2h 55m", startedAt: "2026-01-07 07:00", completedAt: "2026-01-07 09:55" },
  { id: "11", taskName: "Task #11", status: "cancelled", injected: 200, dumped: 5600, duration: "1h 05m", startedAt: "2026-01-06 15:00", completedAt: "2026-01-06 16:05" },
  { id: "12", taskName: "Task #12", status: "completed", injected: 920, dumped: 52340, duration: "5h 12m", startedAt: "2026-01-06 08:00", completedAt: "2026-01-06 13:12" },
]

const statusConfig = {
  completed: { icon: IconCircleCheck, label: "Completed", color: "text-emerald-500" },
  failed: { icon: IconAlertTriangle, label: "Failed", color: "text-red-500" },
  cancelled: { icon: IconClock, label: "Cancelled", color: "text-yellow-500" },
}

// Stats calculation
const stats = {
  total: historyData.length,
  completed: historyData.filter(h => h.status === "completed").length,
  failed: historyData.filter(h => h.status === "failed").length,
  totalDumped: historyData.reduce((acc, h) => acc + h.dumped, 0),
}

const columns: ColumnDef<HistoryData>[] = [
  {
    accessorKey: "taskName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Task
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium font-[family-name:var(--font-inter)]">{row.getValue("taskName")}</span>
    ),
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
        <Badge variant="outline" className="bg-transparent border-border">
          <StatusIcon size={12} className={config.color} />
          <span className="text-foreground">{config.label}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "injected",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Injected
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-[family-name:var(--font-jetbrains-mono)]">
        {(row.getValue("injected") as number).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "dumped",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Dumped
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-[family-name:var(--font-jetbrains-mono)]">
        {(row.getValue("dumped") as number).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "duration",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Duration
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
        {row.getValue("duration")}
      </span>
    ),
  },
  {
    accessorKey: "completedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Completed
        {column.getIsSorted() === "asc" ? (
          <IconSortAscending size={14} className="ml-1" />
        ) : column.getIsSorted() === "desc" ? (
          <IconSortDescending size={14} className="ml-1" />
        ) : (
          <IconArrowsSort size={14} className="ml-1 opacity-50" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)] text-sm">
        {row.getValue("completedAt")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <IconDotsVertical size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <IconDownload size={14} className="mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500">
            <IconTrash size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function HistoryContent() {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "completedAt", desc: true }
  ])

  const table = useReactTable({
    data: historyData,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col min-w-0 p-6 font-[family-name:var(--font-inter)]">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <IconCalendar className="size-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <IconCircleCheck className="size-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">{stats.failed}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <IconAlertTriangle className="size-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Dumped</p>
                <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">
                  {stats.totalDumped.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <IconDownload className="size-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <div className="rounded-lg border overflow-hidden">
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
                  No history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <IconChevronLeft className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <IconChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
