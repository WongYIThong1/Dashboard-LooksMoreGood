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

  // 构建带版本控制的 URL
  const buildVersionedUrl = React.useCallback((url: string, hash?: string | null) => {
    if (!url) return null
    
    // 移除已有的查询参数
    const baseUrl = url.split('?')[0]
    
    // 添加版本参数（hash）和缓存破坏参数
    const params = new URLSearchParams()
    if (hash) {
      params.set('v', hash)
    }
    // 添加一个随机参数来防止过度缓存（仅在开发环境或首次加载时）
    if (process.env.NODE_ENV === 'development') {
      params.set('_', Date.now().toString())
    }
    
    return `${baseUrl}?${params.toString()}`
  }, [])

  React.useEffect(() => {
    // 重置状态
    setImageError(false)
    setIsLoading(true)
    
    if (!avatarUrl) {
      setIsLoading(false)
      setImageSrc(null)
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const loadImage = async () => {
      try {
        // 1. 先尝试从加密缓存加载缩略图（仅在有缓存且 hash 匹配时）
        const cached = await getCachedAvatar(userId)
        if (cached && cached.hash === avatarHash && isMounted) {
          setImageSrc(cached.thumbnail)
          setShowThumbnail(true)
        }

        // 2. 构建完整图片 URL
        const versionedUrl = buildVersionedUrl(avatarUrl, avatarHash)
        if (!versionedUrl) {
          throw new Error('Invalid avatar URL')
        }

        // 3. 加载完整图片
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          
          // 设置 crossOrigin 以支持 CORS
          img.crossOrigin = "anonymous"
          
          img.onload = () => {
            if (isMounted && !abortController.signal.aborted) {
              setImageSrc(versionedUrl)
              setShowThumbnail(false)
              setIsLoading(false)
              setImageError(false)
              resolve()
            }
          }
          
          img.onerror = () => {
            if (!abortController.signal.aborted) {
              reject(new Error('Failed to load image'))
            }
          }
          
          // 监听 abort 信号
          abortController.signal.addEventListener('abort', () => {
            img.src = '' // 取消加载
            reject(new Error('Image loading aborted'))
          })
          
          img.src = versionedUrl
        })
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error('Avatar loading error:', error)
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
  }, [userId, avatarUrl, avatarHash, buildVersionedUrl])

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
