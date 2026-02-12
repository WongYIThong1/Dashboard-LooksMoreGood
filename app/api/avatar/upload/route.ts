import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    console.log('[Avatar Upload] 📤 Starting upload process')
    
    const supabase = await createClient()
    
    // 获取当前用户
    const authStart = Date.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authTime = Date.now() - authStart
    
    console.log(`[Avatar Upload] 🔐 Auth check took: ${authTime}ms`)
    
    if (authError || !user) {
      console.log('[Avatar Upload] ❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[Avatar Upload] ✅ User authenticated: ${user.id}`)

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('avatar') as File
    const hash = formData.get('hash') as string

    if (!file) {
      console.log('[Avatar Upload] ❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!hash) {
      console.log('[Avatar Upload] ❌ No hash provided')
      return NextResponse.json(
        { error: 'No hash provided' },
        { status: 400 }
      )
    }

    console.log(`[Avatar Upload] 📁 File: ${file.name}, size: ${file.size} bytes, type: ${file.type}, hash: ${hash}`)

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      console.log(`[Avatar Upload] ❌ Invalid file type: ${file.type}`)
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log(`[Avatar Upload] ❌ File too large: ${file.size} bytes`)
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    // 删除旧头像（如果存在）
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/avatars/')[1]
      if (oldPath) {
        console.log(`[Avatar Upload] 🗑️  Deleting old avatar: ${oldPath}`)
        await supabase.storage.from('avatars').remove([oldPath])
      }
    }

    // 上传新头像（使用 hash 作为文件名）
    const fileExt = file.name.split('.').pop() || 'webp'
    const filePath = `${user.id}/${hash}.${fileExt}`
    
    console.log(`[Avatar Upload] ⬆️  Uploading to: ${filePath}`)
    
    const uploadStart = Date.now()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: 'public, max-age=31536000, immutable', // 1年缓存 + immutable
        upsert: false,
        contentType: file.type,
      })
    const uploadTime = Date.now() - uploadStart

    console.log(`[Avatar Upload] ⬆️  Upload took: ${uploadTime}ms`)

    if (uploadError) {
      console.error('[Avatar Upload] ❌ Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      )
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      console.log('[Avatar Upload] ❌ Failed to get public URL')
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    const publicUrl = urlData.publicUrl
    console.log(`[Avatar Upload] 🔗 Public URL: ${publicUrl}`)

    // 更新数据库
    const dbStart = Date.now()
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: publicUrl,
        avatar_hash: hash,
        avatar_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    const dbTime = Date.now() - dbStart

    console.log(`[Avatar Upload] 🗄️  DB update took: ${dbTime}ms`)

    if (updateError) {
      console.error('[Avatar Upload] ❌ Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    const totalTime = Date.now() - startTime
    console.log(`[Avatar Upload] ✅ Success - Total: ${totalTime}ms (Auth: ${authTime}ms, Upload: ${uploadTime}ms, DB: ${dbTime}ms)`)

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      hash,
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[Avatar Upload] ❌ Error after ${totalTime}ms:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取当前头像
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (profile?.avatar_url) {
      // 从 URL 提取文件路径
      const filePath = profile.avatar_url.split('/avatars/')[1]
      if (filePath) {
        await supabase.storage.from('avatars').remove([filePath])
      }
    }

    // 更新数据库（清除头像）
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        avatar_url: null,
        avatar_hash: null,
        avatar_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
