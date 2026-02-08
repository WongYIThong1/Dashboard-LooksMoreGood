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
      .select('username, email, plan, credits, system_notification, privacy_mode, avatar_url, avatar_hash')
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

    return NextResponse.json({
      username: profile.username || 'User',
      email: profile.email || user.email || 'user@example.com',
      plan: profile.plan || 'Free',
      credits: profile.credits || 0,
      notification: profile.system_notification,
      privacy: profile.privacy_mode,
      avatarUrl: profile.avatar_url,
      avatarHash: profile.avatar_hash,
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
