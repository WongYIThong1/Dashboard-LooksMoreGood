import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in POST /api/files/upload:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Upload request from user:', user.id)

    // 获取用户配额信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('storage_used, storage_limit, plan')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    console.log('User profile:', { plan: profile.plan, storage_used: profile.storage_used, storage_limit: profile.storage_limit })

    // 检查用户计划
    if (profile.plan === 'Free') {
      console.log('Upload blocked: Free plan user')
      return NextResponse.json(
        { error: 'Free plan users cannot upload files. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // 检查存储配额
    if (profile.storage_limit === 0) {
      console.log('Upload blocked: No storage quota')
      return NextResponse.json(
        { error: 'Storage quota is not set. Please contact support.' },
        { status: 403 }
      )
    }

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string

    if (!file) {
      console.log('Upload blocked: No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('File details:', { name: file.name, size: file.size, type: fileType })

    if (!fileType || !['data', 'urls'].includes(fileType)) {
      console.log('Upload blocked: Invalid file type')
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.name.toLowerCase().endsWith('.txt')) {
      console.log('Upload blocked: Not a .txt file')
      return NextResponse.json(
        { error: 'Only .txt files are allowed' },
        { status: 400 }
      )
    }

    // 检查文件大小 - 最高 5GB
    const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > maxSize) {
      console.log('Upload blocked: File too large')
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5GB.' },
        { status: 400 }
      )
    }

    // 检查是否会超过配额
    if (profile.storage_used + file.size > profile.storage_limit) {
      console.log('Upload blocked: Storage quota exceeded')
      return NextResponse.json(
        { error: 'Storage quota exceeded. Please delete some files or upgrade your plan.' },
        { status: 403 }
      )
    }

    // 读取文件内容计算行数
    const text = await file.text()
    const lineCount = text.split('\n').length

    // 如果是 URLs 类型，检查行数限制
    if (fileType === 'urls' && lineCount > 10000) {
      console.log('Upload blocked: Too many lines for URLs type')
      return NextResponse.json(
        { error: 'URLs files are limited to 10,000 lines maximum.' },
        { status: 400 }
      )
    }

    console.log('File line count:', lineCount)

    // 上传到 Storage
    const filePath = `${user.id}/${file.name}`
    console.log('Uploading to storage:', filePath)
    
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('File uploaded to storage successfully')

    // 保存到数据库（触发器会自动更新 storage_used）
    const { error: dbError } = await supabase
      .from('user_files')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'text/plain',
        file_type: fileType,
        line_count: lineCount,
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      // 如果数据库插入失败，删除已上传的文件
      await supabase.storage.from('user-files').remove([filePath])
      return NextResponse.json(
        { error: `Failed to save file record: ${dbError.message}` },
        { status: 500 }
      )
    }

    console.log('File record saved to database successfully')

    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      lines: lineCount,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
