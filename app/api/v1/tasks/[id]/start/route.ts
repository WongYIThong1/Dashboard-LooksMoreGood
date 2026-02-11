import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - 启动任务
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取 session 来获取 access_token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      )
    }

    const { id: taskId } = await params

    // 获取用户 profile 检查 plan 和 credits
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plan, credits')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // 检查用户 plan（只允许 Pro 和 Pro+）
    if (profile.plan === 'Free') {
      return NextResponse.json(
        { success: false, error: 'Free plan users cannot start tasks. Please upgrade to Pro or Pro+.' },
        { status: 403 }
      )
    }

    // 检查 credits 是否足够（假设启动任务需要至少 1 credit）
    if (profile.credits < 1) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits. Please purchase more credits.' },
        { status: 403 }
      )
    }

    // 获取任务详情
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // 检查任务状态
    if (task.status === 'running' || task.status === 'running_recon') {
      return NextResponse.json(
        { success: false, error: 'Task is already running' },
        { status: 400 }
      )
    }

    // 获取文件信息
    const { data: file, error: fileError } = await supabase
      .from('user_files')
      .select('file_path')
      .eq('id', task.file_id)
      .single()

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // 生成 Supabase Storage 的下载 URL
    const { data: urlData } = await supabase
      .storage
      .from('user-files')
      .createSignedUrl(file.file_path, 3600 * 24 * 7) // 7天有效期

    if (!urlData?.signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    const downloadUrl = urlData.signedUrl

    // 映射 risk_filter 值
    let riskFilter = 'High'
    if (task.parameter_risk_filter === 'medium-high') {
      riskFilter = 'High-Med'
    } else if (task.parameter_risk_filter === 'all') {
      riskFilter = 'All'
    }

    // 映射 AI sensitivity 值
    let aiSensitivity = 'Medium'
    if (task.ai_sensitivity_level === 'low') {
      aiSensitivity = 'Low'
    } else if (task.ai_sensitivity_level === 'high') {
      aiSensitivity = 'High'
    }

    // 准备发送到外部服务器的数据
    const externalApiData = {
      taskname: task.name,
      download_url: downloadUrl,
      autodumper: task.auto_dumper || false,
      preset: task.preset || '',
      RiskFiltere: riskFilter,
      AISensitivity: aiSensitivity,
      EvasionEngine: task.evasion_engine || false,
      accesstoken: `Bearer ${session.access_token}`,
    }

    console.log('[START TASK] Sending to external API:', {
      taskId,
      url: `${process.env.EXTERNAL_API_DOMAIN}/start/${taskId}`,
      data: {
        ...externalApiData,
        accesstoken: '[REDACTED]', // 不记录 token
      },
    })

    // 发送到外部服务器
    const externalApiDomain = process.env.EXTERNAL_API_DOMAIN || 'http://localhost:8080'
    const externalResponse = await fetch(`${externalApiDomain}/start/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalApiData),
    })

    const externalData = await externalResponse.json()

    console.log('[START TASK] External API response:', {
      status: externalResponse.status,
      data: externalData,
    })

    if (!externalResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: externalData.error || 'Failed to start task on external server' 
        },
        { status: externalResponse.status }
      )
    }

    // 直接返回第三方 API 的响应，不更新数据库
    return NextResponse.json({
      success: true,
      message: 'success',
      taskid: taskId,
    })
  } catch (error) {
    console.error('Start task API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
