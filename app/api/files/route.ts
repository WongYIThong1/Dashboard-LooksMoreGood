import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取用户的所有文件
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const minimal = searchParams.get('minimal') === '1'

    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户文件列表
    let filesQuery = supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (typeFilter) {
      filesQuery = filesQuery.eq('file_type', typeFilter)
    }

    const { data: files, error: filesError } = await filesQuery

    if (filesError) {
      console.error('Files fetch error:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    if (minimal) {
      return NextResponse.json({
        files: (files || []).map(file => ({
          id: file.id,
          name: file.filename,
          type: file.file_type,
          modified: file.updated_at,
        })),
      })
    }

    // 获取存储配额信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('storage_used, storage_limit')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch storage info' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      files: (files || []).map(file => ({
        id: file.id,
        name: file.filename,
        size: file.file_size,
        type: file.file_type,
        lines: file.line_count,
        modified: file.updated_at,
      })),
      storage_used: profile?.storage_used || 0,
      storage_max: profile?.storage_limit || 0,
    })
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除文件
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('name')

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // 获取文件信息
    const { data: file, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('filename', filename)
      .single()

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // 从 Storage 删除文件
    const { error: storageError } = await supabase.storage
      .from('user-files')
      .remove([file.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      )
    }

    // 从数据库删除记录（触发器会自动更新 storage_used）
    const { error: dbError } = await supabase
      .from('user_files')
      .delete()
      .eq('id', file.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete file record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
