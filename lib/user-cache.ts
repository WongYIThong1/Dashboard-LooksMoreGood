// 用户信息缓存工具

interface CachedUserInfo {
  username: string
  email: string
  cachedAt: number
}

const CACHE_KEY = 'user_info_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

export function getCachedUserInfo(): CachedUserInfo | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedUserInfo = JSON.parse(cached)
    
    // 检查缓存是否过期
    const now = Date.now()
    if (now - data.cachedAt > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get cached user info:', error)
    return null
  }
}

export function setCachedUserInfo(username: string, email: string): void {
  try {
    const data: CachedUserInfo = {
      username,
      email,
      cachedAt: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache user info:', error)
  }
}

export function clearCachedUserInfo(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Failed to clear cached user info:', error)
  }
}
