// 服务器端速率限制 - 使用 Supabase 数据库
import { createClient } from '@/lib/supabase/client'

const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15, // 15分钟
  },
  register: {
    maxAttempts: 3,
    windowMinutes: 60, // 1小时
  },
}

// 获取客户端标识符（使用浏览器指纹 + IP 的组合）
function getClientIdentifier(): string {
  if (typeof window === 'undefined') return 'server'
  
  // 创建简单的浏览器指纹
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|')
  
  // 使用简单的哈希函数
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return `client_${Math.abs(hash).toString(36)}`
}

export async function checkRateLimit(
  action: 'login' | 'register'
): Promise<{ allowed: boolean; remainingTime?: number }> {
  try {
    const supabase = createClient()
    const config = RATE_LIMITS[action]
    const identifier = getClientIdentifier()

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action: action,
      p_max_attempts: config.maxAttempts,
      p_window_minutes: config.windowMinutes,
    })

    if (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true } // 如果出错，允许继续（fail open）
    }

    if (!data) {
      return { allowed: true }
    }

    return {
      allowed: data.allowed,
      remainingTime: data.remaining_minutes,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { allowed: true } // 如果出错，允许继续
  }
}

// 不再需要单独的 recordAttempt 函数，因为 checkRateLimit 会自动记录
export async function recordAttempt(action: 'login' | 'register'): Promise<void> {
  // 这个函数现在是空的，因为 checkRateLimit 已经记录了尝试
  // 保留这个函数是为了向后兼容
  return Promise.resolve()
}

export async function resetRateLimit(action: 'login' | 'register'): Promise<void> {
  // 服务器端的速率限制会自动过期，不需要手动重置
  // 保留这个函数是为了向后兼容
  return Promise.resolve()
}
