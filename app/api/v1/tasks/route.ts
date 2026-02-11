import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取用户的所有任务
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in GET /api/v1/tasks:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Fetching tasks for user:', user.id)

    // 获取用户任务列表，并关联文件名
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        user_files!tasks_file_id_fkey (
          filename
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    console.log('Tasks fetched:', tasks?.length || 0)

    // 转换数据格式
    const transformedTasks = (tasks || []).map((task: any) => ({
      id: task.id,
      name: task.name,
      status: task.status,
      found: task.found,
      target: task.target || null, // target 字段（目标数量），如果没有就是 null
      file: task.user_files?.filename || 'Unknown',
      started_time: task.started_at || null, // 使用 started_at 作为时间
    }))

    return NextResponse.json({
      success: true,
      tasks: transformedTasks,
    })
  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建新任务
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 获取用户的 plan 和 max_tasks
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('plan, max_tasks')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // 检查 Free plan 用户
    if (profile.plan === 'Free') {
      return NextResponse.json(
        { 
          success: false,
          code: 'FREE_PLAN_LIMIT',
          message: 'Free plan users cannot create tasks. Please upgrade to Pro or Pro+.' 
        },
        { status: 403 }
      )
    }

    // 检查任务数量限制
    const { count: taskCount, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Task count error:', countError)
      return NextResponse.json(
        { error: 'Failed to check task limit' },
        { status: 500 }
      )
    }

    const maxTasks = profile.max_tasks || 0
    if (taskCount !== null && taskCount >= maxTasks) {
      return NextResponse.json(
        { 
          success: false,
          code: 'TASK_LIMIT_REACHED',
          message: `Task limit reached. You have ${taskCount} of ${maxTasks} tasks. Please delete some tasks or upgrade your plan.` 
        },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const {
      name,
      file_id,
      auto_dumper = false,
      preset = null,
      ai_mode = true,
      parameter_risk_filter = 'medium-high',
      ai_sensitivity_level = 'medium',
      response_pattern_drift = true,
      baseline_profiling = true,
      structural_change_detection = false,
      injection_union = true,
      injection_error = true,
      injection_boolean = false,
      injection_timebased = false,
    } = body

    // 验证必填字段
    if (!name || !file_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name and file_id' },
        { status: 400 }
      )
    }

    // 验证文件是否存在且属于当前用户
    const { data: file, error: fileError } = await supabase
      .from('user_files')
      .select('id')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      )
    }

    // 创建任务
    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        file_id,
        name,
        status: 'pending',
        found: 0,
        target: null,
        auto_dumper,
        preset,
        ai_mode,
        parameter_risk_filter,
        ai_sensitivity_level,
        response_pattern_drift,
        baseline_profiling,
        structural_change_detection,
        injection_union,
        injection_error,
        injection_boolean,
        injection_timebased,
      })
      .select()
      .single()

    if (createError) {
      console.error('Task creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    console.log('Task created:', task.id)

    return NextResponse.json({
      success: true,
      task,
    })
  } catch (error) {
    console.error('Create task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
