import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // 从 user_profiles 表获取用户信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username, email, plan, credits, system_notification, privacy_mode, avatar_url, avatar_hash, max_tasks, subscription_days, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // 计算剩余天数
    let daysRemaining = null
    let isExpired = false
    if (profile.subscription_expires_at) {
      const expiresAt = new Date(profile.subscription_expires_at)
      const now = new Date()
      const diffTime = expiresAt.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      isExpired = daysRemaining <= 0
    }

    return NextResponse.json({
      username: profile.username || 'User',
      email: profile.email || user.email || 'user@example.com',
      plan: profile.plan || 'Free',
      credits: profile.credits || 0,
      notification: profile.system_notification,
      privacy: profile.privacy_mode,
      avatarUrl: profile.avatar_url,
      avatarHash: profile.avatar_hash,
      max_tasks: profile.max_tasks || 0,
      subscription_days: profile.subscription_days || 0,
      subscription_expires_at: profile.subscription_expires_at,
      days_remaining: daysRemaining,
      is_expired: isExpired,
    })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json()
    const { notification, privacy } = body

    // 更新 user_profiles 表
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        system_notification: notification,
        privacy_mode: privacy,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
