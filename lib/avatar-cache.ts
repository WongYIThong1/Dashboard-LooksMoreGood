// 头像缓存工具 - 参考 Discord 的快速加载机制

interface CachedAvatar {
  thumbnail: string // Base64 缩略图 (64x64)
  fullUrl: string // 完整图片 URL
  hash: string // 文件哈希
  cachedAt: number
}

const CACHE_PREFIX = 'avatar_cache_'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天

export function getCachedAvatar(userId: string): CachedAvatar | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${userId}`)
    if (!cached) return null

    const data: CachedAvatar = JSON.parse(cached)
    
    // 检查缓存是否过期
    const now = Date.now()
    if (now - data.cachedAt > CACHE_DURATION) {
      localStorage.removeItem(`${CACHE_PREFIX}${userId}`)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get cached avatar:', error)
    return null
  }
}

export function setCachedAvatar(
  userId: string,
  thumbnail: string,
  fullUrl: string,
  hash: string
): void {
  try {
    // 移除 URL 中的版本参数，只存储基础 URL
    const baseUrl = fullUrl.split('?')[0]
    
    const data: CachedAvatar = {
      thumbnail,
      fullUrl: baseUrl,
      hash,
      cachedAt: Date.now(),
    }
    localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache avatar:', error)
  }
}

export function clearCachedAvatar(userId: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${userId}`)
  } catch (error) {
    console.error('Failed to clear cached avatar:', error)
  }
}

// 生成缩略图 (64x64 Base64)
export async function generateThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // 设置缩略图尺寸
        canvas.width = 64
        canvas.height = 64

        // 绘制图片（居中裁剪）
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2
        ctx.drawImage(img, x, y, size, size, 0, 0, 64, 64)

        // 转换为 Base64（低质量）
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// 生成用户名的颜色（用于默认头像背景）
export function getUserColor(username: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
  ]
  
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}
