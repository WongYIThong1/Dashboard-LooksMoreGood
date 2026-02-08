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

  React.useEffect(() => {
    if (!avatarUrl) {
      setIsLoading(false)
      setImageSrc(null)
      return
    }

    // 添加 hash 参数作为版本控制，强制浏览器在头像更新时重新加载
    const versionedUrl = avatarHash 
      ? `${avatarUrl}?v=${avatarHash}`
      : avatarUrl

    // 1. 先尝试从缓存加载缩略图
    const cached = getCachedAvatar(userId)
    if (cached && cached.hash === avatarHash) {
      setImageSrc(cached.thumbnail)
      setShowThumbnail(true)
      
      // 2. 然后加载完整图片（带版本参数）
      const img = new Image()
      img.onload = () => {
        setImageSrc(versionedUrl)
        setShowThumbnail(false)
        setIsLoading(false)
      }
      img.onerror = () => {
        setImageSrc(null)
        setIsLoading(false)
      }
      img.src = versionedUrl
    } else {
      // 直接加载完整图片（带版本参数）
      const img = new Image()
      img.onload = () => {
        setImageSrc(versionedUrl)
        setIsLoading(false)
      }
      img.onerror = () => {
        setImageSrc(null)
        setIsLoading(false)
      }
      img.src = versionedUrl
    }
  }, [userId, avatarUrl, avatarHash])

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-lg", className)}>
      {imageSrc && avatarUrl ? (
        <AvatarImage
          src={imageSrc}
          alt={username}
          className={cn(
            "object-cover",
            showThumbnail && "blur-sm scale-105 transition-all duration-300"
          )}
          loading="lazy"
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
