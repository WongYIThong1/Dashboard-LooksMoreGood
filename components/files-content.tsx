"use client"

import * as React from "react"
import {
  IconFile,
  IconDownload,
  IconTrash,
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconLoader2,
  IconUpload,
  IconCloudUpload,
  IconX,
  IconPencil,
  IconShield,
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
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

interface FileData {
  id: string
  name: string
  size: string
  sizeBytes: number
  type: string
  lines: number | null
  modified: string
}

interface ApiFile {
  id: string
  name: string
  size: number
  type: string
  lines: number | null
  modified: string
}

interface FilesResponse {
  files: ApiFile[]
  storage_used: number
  storage_max: number
}

const ALLOWED_EXTENSION = ".txt"

export function FilesContent() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [filesData, setFilesData] = React.useState<FileData[]>([])
  const [storageUsed, setStorageUsed] = React.useState(0)
  const [storageMax, setStorageMax] = React.useState(0)
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [showRenameDialog, setShowRenameDialog] = React.useState(false)
  const [renameOldName, setRenameOldName] = React.useState("")
  const [renameNewName, setRenameNewName] = React.useState("")
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null)
  const [userPlan, setUserPlan] = React.useState<string | null>(null)
  const [fileType, setFileType] = React.useState<"urls" | "data">("data")
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = React.useState(false)

  React.useEffect(() => {
    fetchFiles()
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'GET',
      })

      const data = await response.json()

      if (response.ok) {
        setUserPlan(data.plan || 'Free')
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  // 检查是否可以上传
  const canUpload = (): { allowed: boolean; reason?: string } => {
    // 检查用户计划
    if (userPlan === 'Free') {
      return { allowed: false, reason: 'Free plan users cannot upload files. Please upgrade your plan.' }
    }

    // 检查存储配额
    if (storageMax === 0) {
      return { allowed: false, reason: 'Storage quota is not set. Please contact support.' }
    }

    // 检查存储是否已满
    if (storageUsed >= storageMax) {
      return { allowed: false, reason: 'Storage quota exceeded. Please delete some files or upgrade your plan.' }
    }

    return { allowed: true }
  }

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/files', {
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Fetch files error:', data)
        throw new Error(data.error || 'Failed to fetch files')
      }

      const data = await response.json()
      console.log('Files data:', data)

      // 更新文件列表
      const formattedFiles: FileData[] = (data.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: file.type,
        lines: file.lines,
        modified: file.modified,
      }))
      
      setFilesData(formattedFiles)
      
      // 更新存储信息
      const usedBytes = Math.max(0, Number(data.storage_used ?? 0))
      const totalBytes = Math.max(0, Number(data.storage_limit ?? data.storage_max ?? 0))
      
      console.log('Storage info:', { usedBytes, totalBytes })
      
      setStorageUsed(usedBytes)
      setStorageMax(totalBytes)
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast.error(error instanceof Error ? error.message : "Failed to load files")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (fileName: string) => {
    try {
      const response = await fetch(`/api/files/download?name=${encodeURIComponent(fileName)}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download file')
    }
  }

  const handleDeleteClick = (fileName: string) => {
    setFileToDelete(fileName)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    setIsDeleting(fileToDelete)
    try {
      const response = await fetch(`/api/files?name=${encodeURIComponent(fileToDelete)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file')
      }

      toast.success('File deleted successfully')
      setShowDeleteDialog(false)
      setFileToDelete(null)
      fetchFiles()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete file')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleBatchDelete = async () => {
    const selectedRows = table.getSelectedRowModel().rows
    if (selectedRows.length === 0) return

    setIsBatchDeleting(true)
    const fileNames = selectedRows.map(row => row.getValue("name") as string)
    
    try {
      const response = await fetch('/api/files/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileNames }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete files')
      }

      const { success, failed } = data
      
      if (failed > 0) {
        toast.warning(`Deleted ${success} files, ${failed} failed`)
      } else {
        toast.success(`Successfully deleted ${success} file${success > 1 ? 's' : ''}`)
      }
      
      setShowBatchDeleteDialog(false)
      setRowSelection({})
      fetchFiles()
    } catch (error) {
      console.error('Batch delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete files')
    } finally {
      setIsBatchDeleting(false)
    }
  }

  const handleRenameClick = (fileName: string) => {
    setRenameOldName(fileName)
    setRenameNewName(fileName)
    setShowRenameDialog(true)
  }

  const handleRename = async () => {
    if (!renameNewName.trim()) {
      toast.error('File name cannot be empty')
      return
    }

    if (!renameNewName.toLowerCase().endsWith('.txt')) {
      toast.error('Only .txt files are allowed')
      return
    }

    if (renameNewName === renameOldName) {
      setShowRenameDialog(false)
      return
    }

    setIsRenaming(true)
    try {
      const response = await fetch('/api/files/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldName: renameOldName,
          newName: renameNewName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rename file')
      }

      toast.success('File renamed successfully')
      setShowRenameDialog(false)
      fetchFiles()
    } catch (error) {
      console.error('Rename error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to rename file')
    } finally {
      setIsRenaming(false)
    }
  }

  const columns: ColumnDef<FileData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
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
      <div className="flex items-center gap-2">
        <IconFile size={16} className="text-muted-foreground" />
        <span className="font-medium font-[family-name:var(--font-inter)]">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "size",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Size
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
      <span className="font-[family-name:var(--font-jetbrains-mono)] text-muted-foreground">
        {row.getValue("size")}
      </span>
    ),
    sortingFn: (rowA, rowB) => rowA.original.sizeBytes - rowB.original.sizeBytes,
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
      const displayType = type === "urls" ? "URLs" : type === "data" ? "Data" : type.toUpperCase()
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-inter)]">
          {displayType}
        </span>
      )
    },
  },
  {
    accessorKey: "lines",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Lines
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
      const lines = row.getValue("lines") as number | null
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
          {lines !== null ? lines.toLocaleString() : "-"}
        </span>
      )
    },
  },
  {
    accessorKey: "modified",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Modified
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
      const modifiedDate = row.getValue("modified") as string
      return (
        <span className="text-muted-foreground font-[family-name:var(--font-jetbrains-mono)] text-sm">
          {formatDate(modifiedDate)}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const fileName = row.getValue("name") as string
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <IconDotsVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownload(fileName)}>
              <IconDownload size={14} className="mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRenameClick(fileName)}>
              <IconPencil size={14} className="mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => handleDeleteClick(fileName)}
            >
              <IconTrash size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatStorageSize(bytes: number): string {
  // 验证输入（防止负数或 NaN）
  const safeBytes = Math.max(0, Number(bytes) || 0)
  const gb = safeBytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

function getFileType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "text/csv": "CSV",
    "application/json": "JSON",
    "text/plain": "TXT",
    "text/html": "HTML",
    "application/sql": "SQL",
    "text/sql": "SQL",
  }
  return typeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "FILE"
}

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    // 如果是今天，显示时间
    if (diffDays === 0) {
      if (diffMins < 1) {
        return 'Just now'
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      } else {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      }
    }

    // 如果是昨天
    if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    }

    // 如果是一周内
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    }

    // 超过一周，显示完整日期
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const validateSelectedFile = (file: File): boolean => {
    const fileName = file.name || ""
    const isTxt = fileName.toLowerCase().endsWith(ALLOWED_EXTENSION)
    if (!isTxt) {
      toast.error("Only .txt files are allowed.")
      return false
    }
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (validateSelectedFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateSelectedFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!validateSelectedFile(selectedFile)) return

    // 检查是否可以上传
    const uploadCheck = canUpload()
    if (!uploadCheck.allowed) {
      toast.error(uploadCheck.reason || 'Upload not allowed')
      return
    }

    // 检查文件大小是否会超过配额
    const fileSize = selectedFile.size
    if (storageUsed + fileSize > storageMax) {
      toast.error('File size exceeds available storage quota')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', fileType)

      console.log('Uploading file:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: fileType,
      })

      setUploadProgress(20)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(60)

      if (!response.ok) {
        const data = await response.json()
        console.error('Upload error response:', data)
        throw new Error(data.error || 'Failed to upload file')
      }

      const data = await response.json()
      console.log('Upload success:', data)

      setUploadProgress(100)
      toast.success(`Uploaded successfully (${data.lines} lines)`)
      setSelectedFile(null)
      setShowUploadDialog(false)
      fetchFiles()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleCloseUploadDialog = () => {
    if (!isUploading) {
      setShowUploadDialog(false)
      setSelectedFile(null)
      setFileType("data") // 重置 type
    }
  }

  const table = useReactTable({
    data: filesData,
    columns,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  // 计算使用百分比，确保值在 0-100 之间
  const usagePercent = storageMax > 0 
    ? Math.min(100, Math.max(0, (storageUsed / storageMax) * 100))
    : 0

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 p-6 font-[family-name:var(--font-inter)]">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Files</h1>
        <Button 
          onClick={() => {
            const check = canUpload()
            if (!check.allowed) {
              toast.error(check.reason || 'Upload not allowed')
              return
            }
            setShowUploadDialog(true)
          }}
          disabled={!canUpload().allowed}
        >
          <IconUpload size={16} className="mr-2" />
          Upload
        </Button>
      </div>

      {/* Storage Card */}
      <Card className="rounded-xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-lg font-semibold font-[family-name:var(--font-jetbrains-mono)]">
                  {formatStorageSize(storageUsed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold font-[family-name:var(--font-jetbrains-mono)]">
                  {formatStorageSize(storageMax)}
                </p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground font-[family-name:var(--font-jetbrains-mono)]">
              {usagePercent.toFixed(1)}%
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Files Table */}
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  className="h-[450px]"
                >
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    {/* Icon */}
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 mb-4">
                      <IconFile className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
                    </div>

                    {/* Text */}
                    <h3 className="text-lg font-semibold tracking-tight mb-2">
                      No files uploaded
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-[420px]">
                      Upload your first file to get started
                    </p>

                    {/* Action */}
                    {canUpload().allowed ? (
                      <Button 
                        onClick={() => setShowUploadDialog(true)}
                        size="sm"
                      >
                        <IconUpload size={16} className="mr-2" />
                        Upload File
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                        <IconShield size={16} />
                        <span>{canUpload().reason || 'Upgrade to upload files'}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} file(s) selected
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

      {/* Batch Actions Floating Bar */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                {table.getSelectedRowModel().rows.length} selected
              </span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBatchDeleteDialog(true)}
              >
                <IconTrash size={16} className="mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={handleCloseUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload a .txt file to your storage
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!selectedFile ? (
              <>
                {/* File Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFileType("data")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                        fileType === "data"
                          ? "border-primary bg-accent"
                          : "border-input hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <IconFile size={18} className={fileType === "data" ? "text-primary" : "text-muted-foreground"} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Data</p>
                        <p className="text-xs text-muted-foreground">Text data</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFileType("urls")}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                        fileType === "urls"
                          ? "border-primary bg-accent"
                          : "border-input hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <svg 
                        className={`size-[18px] ${fileType === "urls" ? "text-primary" : "text-muted-foreground"}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium">URLs</p>
                        <p className="text-xs text-muted-foreground">Web links</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Drop zone */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Choose File</Label>
                  <div
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? "border-primary bg-accent"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex size-12 items-center justify-center rounded-full border border-dashed">
                      <IconUpload className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isDragging ? "Drop file here" : "Choose file or drag & drop"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        .txt files only (max 5GB)
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Selected file */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected File</Label>
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-background">
                      <IconFile size={20} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • {fileType === "urls" ? "URLs" : "Data"}
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                        }}
                      >
                        <IconX size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Upload progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploading</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </>
            )}

            {/* Warning message */}
            {!canUpload().allowed && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-900 dark:bg-yellow-900/20">
                <IconShield size={16} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-500" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  {canUpload().reason}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCloseUploadDialog}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || !canUpload().allowed}
            >
              {isUploading ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconPencil size={20} />
              Rename File
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="old-name">Current Name</Label>
                <Input
                  id="old-name"
                  value={renameOldName}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-name">New Name</Label>
                <Input
                  id="new-name"
                  value={renameNewName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameNewName(e.target.value)}
                  placeholder="Enter new file name"
                  className="mt-1"
                  disabled={isRenaming}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && !isRenaming) {
                      handleRename()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  File must end with .txt extension
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || !renameNewName.trim() || renameNewName === renameOldName}
            >
              {isRenaming ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Renaming...
                </>
              ) : (
                <>
                  <IconPencil size={16} className="mr-2" />
                  Rename
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">"{fileToDelete}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {table.getSelectedRowModel().rows.length} files</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to delete these files? This action cannot be undone.</p>
                {table.getSelectedRowModel().rows.length <= 5 ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {table.getSelectedRowModel().rows.map((row) => (
                      <li key={row.id} className="font-medium text-foreground">
                        • {row.getValue("name")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 space-y-1 text-sm">
                    {table.getSelectedRowModel().rows.slice(0, 3).map((row) => (
                      <div key={row.id} className="font-medium text-foreground">
                        • {row.getValue("name")}
                      </div>
                    ))}
                    <div className="text-muted-foreground">
                      and {table.getSelectedRowModel().rows.length - 3} more...
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchDeleting ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Deleting
                </>
              ) : (
                'Delete All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
