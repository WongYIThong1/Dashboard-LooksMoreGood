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
    let riskFilter = 'high'
    if (task.parameter_risk_filter === 'medium-high') {
      riskFilter = 'high&low'
    } else if (task.parameter_risk_filter === 'all') {
      riskFilter = 'all'
    }

    // 准备发送到外部服务器的数据
    const externalApiData = {
      task_name: task.name,
      download_url: downloadUrl,
      auto_dumper: task.auto_dumper || false,
      preset: task.preset || '',
      risk_filter: riskFilter,
      sensitivity: task.ai_sensitivity_level || 'medium',
    }

    console.log('[START TASK] Sending to external API:', {
      taskId,
      url: `${process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN}/start/${taskId}`,
      data: externalApiData,
    })

    // 发送到外部服务器
    const externalApiDomain = process.env.NEXT_PUBLIC_EXTERNAL_API_DOMAIN || 'http://localhost:8080'
    const externalResponse = await fetch(`${externalApiDomain}/start/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(externalApiData),
    })

    const externalData = await externalResponse.json()

    console.log('[START TASK] External API response:', {
      status: externalResponse.status,
      data: externalData,
    })

    if (!externalResponse.ok) {
      throw new Error(externalData.error || 'Failed to start task on external server')
    }

    // 更新任务状态为 running_recon
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'running_recon',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update task status:', updateError)
      // 不返回错误，因为外部服务器已经启动了任务
    }

    return NextResponse.json({
      success: true,
      status: externalData.status || 'recon_running',
      task_id: taskId,
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
