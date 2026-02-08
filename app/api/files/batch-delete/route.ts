import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in DELETE /api/files/batch-delete:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fileNames } = body

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: 'File names array is required' },
        { status: 400 }
      )
    }

    console.log(`Batch delete request from user ${user.id} for ${fileNames.length} files`)

    let successCount = 0
    let failedCount = 0

    // 批量删除文件
    for (const fileName of fileNames) {
      try {
        // 获取文件信息
        const { data: file, error: fileError } = await supabase
          .from('user_files')
          .select('*')
          .eq('user_id', user.id)
          .eq('filename', fileName)
          .single()

        if (fileError || !file) {
          console.error(`File not found: ${fileName}`)
          failedCount++
          continue
        }

        // 从 Storage 删除文件
        const { error: storageError } = await supabase.storage
          .from('user-files')
          .remove([file.file_path])

        if (storageError) {
          console.error(`Storage delete error for ${fileName}:`, storageError)
          failedCount++
          continue
        }

        // 从数据库删除记录（触发器会自动更新 storage_used）
        const { error: dbError } = await supabase
          .from('user_files')
          .delete()
          .eq('id', file.id)

        if (dbError) {
          console.error(`Database delete error for ${fileName}:`, dbError)
          failedCount++
          continue
        }

        successCount++
      } catch (error) {
        console.error(`Error deleting ${fileName}:`, error)
        failedCount++
      }
    }

    console.log(`Batch delete completed: ${successCount} success, ${failedCount} failed`)

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      total: fileNames.length,
    })
  } catch (error) {
    console.error('Batch delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
