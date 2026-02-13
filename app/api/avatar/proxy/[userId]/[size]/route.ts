import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'

const VALID_SIZES = [64, 128, 256] as const
type ValidSize = typeof VALID_SIZES[number]

// 缓存配置：1年 + immutable
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Content-Type': 'image/webp',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; size: string }> }
) {
  const startTime = Date.now()
  let userId: string = ''
  let size: number = 0

  try {
    const resolvedParams = await params
    userId = resolvedParams.userId
    const sizeStr = resolvedParams.size
    size = parseInt(sizeStr, 10)

    console.log(`[Avatar Proxy] 📥 Request: userId=${userId}, size=${size}`)

    // 验证尺寸
    if (!VALID_SIZES.includes(size as ValidSize)) {
      console.log(`[Avatar Proxy] ❌ Invalid size: ${size}`)
      return NextResponse.json(
        { error: 'Invalid size. Must be 64, 128, or 256' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取用户头像信息
    const dbStart = Date.now()
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('avatar_url, avatar_hash, username')
      .eq('id', userId)
      .single()
    const dbTime = Date.now() - dbStart

    console.log(`[Avatar Proxy] 🗄️  DB query took: ${dbTime}ms`)

    if (profileError || !profile) {
      console.log(`[Avatar Proxy] ❌ User not found: ${userId}`, profileError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 如果没有头像，返回 404
    if (!profile.avatar_url) {
      console.log(`[Avatar Proxy] ❌ No avatar for user: ${userId}`)
      return NextResponse.json(
        { error: 'No avatar found' },
        { status: 404 }
      )
    }

    // 从 Supabase Storage 获取原始图片
    const filePath = profile.avatar_url.split('/avatars/')[1]
    if (!filePath) {
      console.log(`[Avatar Proxy] ❌ Invalid avatar URL: ${profile.avatar_url}`)
      return NextResponse.json(
        { error: 'Invalid avatar URL' },
        { status: 400 }
      )
    }

    console.log(`[Avatar Proxy] 📂 File path: ${filePath}`)

    // 生成 ETag（基于 hash + size）
    const etag = `"${profile.avatar_hash}-${size}"`

    // 检查 If-None-Match（ETag 缓存）
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      const totalTime = Date.now() - startTime
      console.log(`[Avatar Proxy] ✅ 304 Not Modified (ETag match) - Total: ${totalTime}ms`)
      return new NextResponse(null, {
        status: 304,
        headers: CACHE_HEADERS,
      })
    }

    const downloadStart = Date.now()
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('avatars')
      .download(filePath)
    const downloadTime = Date.now() - downloadStart

    console.log(`[Avatar Proxy] ⬇️  Download from Supabase took: ${downloadTime}ms`)

    if (downloadError || !fileData) {
      console.error(`[Avatar Proxy] ❌ Download error:`, downloadError)
      return NextResponse.json(
        { error: 'Failed to download avatar' },
        { status: 500 }
      )
    }

    // 转换为 Buffer
    const bufferStart = Date.now()
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const bufferTime = Date.now() - bufferStart
    console.log(`[Avatar Proxy] 🔄 Buffer conversion took: ${bufferTime}ms, size: ${buffer.length} bytes`)

    // 使用 sharp 处理图片：调整尺寸 + 转换为 WebP
    const sharpStart = Date.now()
    const processedImage = await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .webp({
        quality: 85,
        effort: 4,
      })
      .toBuffer()
    const sharpTime = Date.now() - sharpStart

    console.log(`[Avatar Proxy] 🖼️  Sharp processing took: ${sharpTime}ms, output: ${processedImage.length} bytes`)

    const totalTime = Date.now() - startTime
    console.log(`[Avatar Proxy] ✅ Success - Total: ${totalTime}ms (DB: ${dbTime}ms, Download: ${downloadTime}ms, Sharp: ${sharpTime}ms)`)

    // NextResponse expects a web Fetch BodyInit; copy Buffer into a Uint8Array to avoid SharedArrayBuffer typing.
    const body = new Uint8Array(processedImage)

    // 返回处理后的图片
    return new NextResponse(body, {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'ETag': etag,
        'Accept-Ranges': 'bytes',
        'X-Processing-Time': `${totalTime}ms`,
      },
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[Avatar Proxy] ❌ Error after ${totalTime}ms:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
