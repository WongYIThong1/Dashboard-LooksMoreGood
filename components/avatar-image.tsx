"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCachedAvatar, getUserColor } from "@/lib/avatar-cache"
import { cn } from "@/lib/utils"

interface AvatarImageProps {
  userId: string
  avatarUrl?: string | null
  avatarHash?: string | null
  username: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarImageComponent({
  userId,
  avatarUrl,
  avatarHash,
  username,
  size = "md",
  className,
}: AvatarImageProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showThumbnail, setShowThumbnail] = React.useState(true)
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }

  const initials = username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const bgColor = getUserColor(username)

  // 构建 Image Proxy URL（使用路径而非 query）
  const buildProxyUrl = React.useCallback((userId: string, sizeNum: number) => {
    // 使用我们自己的 Image Proxy API
    return `/api/avatar/proxy/${userId}/${sizeNum}`
  }, [])

  React.useEffect(() => {
    // 重置状态
    setImageError(false)
    setIsLoading(true)
    
    if (!avatarUrl) {
      console.log(`[AvatarImage] No avatar URL for user: ${userId}`)
      setIsLoading(false)
      setImageSrc(null)
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const loadImage = async () => {
      const loadStart = Date.now()
      console.log(`[AvatarImage] 🚀 Loading avatar for user: ${userId}, size: ${size}, hash: ${avatarHash}`)

      try {
        // 1. 先尝试从加密缓存加载缩略图（仅在有缓存且 hash 匹配时）
        const cacheStart = Date.now()
        const cached = await getCachedAvatar(userId)
        const cacheTime = Date.now() - cacheStart

        if (cached && cached.hash === avatarHash && isMounted) {
          console.log(`[AvatarImage] ✅ Cache hit (${cacheTime}ms) - showing thumbnail`)
          setImageSrc(cached.thumbnail)
          setShowThumbnail(true)
        } else {
          console.log(`[AvatarImage] ❌ Cache miss or hash mismatch (${cacheTime}ms)`)
        }

        // 2. 根据尺寸选择合适的图片大小
        const sizeMap = { sm: 64, md: 128, lg: 256 }
        const targetSize = sizeMap[size]

        // 3. 构建 Image Proxy URL（路径级别的缓存）
        const proxyUrl = buildProxyUrl(userId, targetSize)
        console.log(`[AvatarImage] 📡 Fetching from proxy: ${proxyUrl}`)

        // 4. 加载完整图片
        const imgStart = Date.now()
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          
          img.onload = () => {
            if (isMounted && !abortController.signal.aborted) {
              const imgTime = Date.now() - imgStart
              const totalTime = Date.now() - loadStart
              console.log(`[AvatarImage] ✅ Image loaded (${imgTime}ms) - Total: ${totalTime}ms`)
              setImageSrc(proxyUrl)
              setShowThumbnail(false)
              setIsLoading(false)
              setImageError(false)
              resolve()
            }
          }
          
          img.onerror = (e) => {
            if (!abortController.signal.aborted) {
              const imgTime = Date.now() - imgStart
              console.error(`[AvatarImage] ❌ Image load failed (${imgTime}ms):`, e)
              reject(new Error('Failed to load image'))
            }
          }
          
          // 监听 abort 信号
          abortController.signal.addEventListener('abort', () => {
            img.src = '' // 取消加载
            reject(new Error('Image loading aborted'))
          })
          
          img.src = proxyUrl
        })
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          const totalTime = Date.now() - loadStart
          console.error(`[AvatarImage] ❌ Avatar loading error (${totalTime}ms):`, error)
          setImageError(true)
          setImageSrc(null)
          setIsLoading(false)
        }
      }
    }

    loadImage()

    // 清理函数
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [userId, avatarUrl, avatarHash, size, buildProxyUrl])

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-lg", className)}>
      {imageSrc && avatarUrl && !imageError ? (
        <AvatarImage
          src={imageSrc}
          alt={username}
          className={cn(
            "object-cover",
            showThumbnail && "blur-sm scale-105 transition-all duration-300"
          )}
          loading="lazy"
          onError={() => {
            // 如果 img 标签加载失败，显示 fallback
            setImageError(true)
            setImageSrc(null)
          }}
        />
      ) : null}
      <AvatarFallback
        className="rounded-lg text-white font-semibold"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
