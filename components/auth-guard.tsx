"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = React.useState(true)
  const [isAuthed, setIsAuthed] = React.useState(false)

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setIsAuthed(true)
        } else {
          // 未登录，保存重定向路径到 sessionStorage，然后重定向到登录页（不带参数）
          if (pathname !== '/login' && pathname !== '/register') {
            // 保存重定向路径到 sessionStorage
            sessionStorage.setItem('redirectAfterLogin', pathname)
          }
          // 使用 replace 重定向到登录页，不显示参数
          router.replace('/login')
          setIsAuthed(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // 出错时保存重定向路径并重定向到登录页
        if (pathname !== '/login' && pathname !== '/register') {
          sessionStorage.setItem('redirectAfterLogin', pathname)
        }
        router.replace('/login')
        setIsAuthed(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  // 不显示 loading，直接渲染内容（让各个组件自己处理 loading 状态）
  if (isChecking || !isAuthed) {
    return null
  }

  return <>{children}</>
}
