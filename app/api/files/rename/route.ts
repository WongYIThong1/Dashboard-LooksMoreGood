import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { oldName, newName } = body

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: 'Old name and new name are required' },
        { status: 400 }
      )
    }

    // 验证新文件名
    if (!newName.toLowerCase().endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Only .txt files are allowed' },
        { status: 400 }
      )
    }

    // 检查新文件名是否已存在
    const { data: existingFile } = await supabase
      .from('user_files')
      .select('id')
      .eq('user_id', user.id)
      .eq('filename', newName)
      .single()

    if (existingFile) {
      return NextResponse.json(
        { error: 'A file with this name already exists' },
        { status: 400 }
      )
    }

    // 获取旧文件信息
    const { data: oldFile, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('filename', oldName)
      .single()

    if (fileError || !oldFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // 在 Storage 中移动文件
    const oldPath = oldFile.file_path
    const newPath = `${user.id}/${newName}`

    const { error: moveError } = await supabase.storage
      .from('user-files')
      .move(oldPath, newPath)

    if (moveError) {
      console.error('Move error:', moveError)
      return NextResponse.json(
        { error: 'Failed to rename file in storage' },
        { status: 500 }
      )
    }

    // 更新数据库记录
    const { error: updateError } = await supabase
      .from('user_files')
      .update({
        filename: newName,
        file_path: newPath,
      })
      .eq('id', oldFile.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // 尝试回滚 Storage 操作
      await supabase.storage.from('user-files').move(newPath, oldPath)
      return NextResponse.json(
        { error: 'Failed to update file record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rename error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
