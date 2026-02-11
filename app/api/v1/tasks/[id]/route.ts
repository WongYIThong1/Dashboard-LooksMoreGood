import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - 获取单个任务详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    if (taskError) {
      console.error('Task fetch error:', taskError)
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // 获取关联的文件信息
    const { data: file, error: fileError } = await supabase
      .from('user_files')
      .select('id, filename, file_type, line_count, file_path')
      .eq('id', task.file_id)
      .single()

    if (fileError) {
      console.error('File fetch error:', fileError)
    }

    // 转换数据格式以匹配前端期望
    const responseData = {
      id: task.id,
      name: task.name,
      status: task.status,
      file_id: task.file_id,
      file_name: file?.filename || 'Unknown',
      file_path: file?.file_path || '',
      target: task.target ? parseInt(task.target) : 0, // target 是目标数量（字符串转数字）
      credits_used: 0,
      ai_mode: task.ai_mode,
      auto_dumper: task.auto_dumper,
      preset: task.preset,
      parameter_risk_filter: task.parameter_risk_filter,
      ai_sensitivity_level: task.ai_sensitivity_level,
      response_pattern_drift: task.response_pattern_drift,
      baseline_profiling: task.baseline_profiling,
      structural_change_detection: task.structural_change_detection,
      union_based: task.injection_union,
      error_based: task.injection_error,
      boolean_based: task.injection_boolean,
      time_based: task.injection_timebased,
      created_at: task.created_at,
      updated_at: task.updated_at,
      started_at: task.started_at,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('Task detail API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除任务
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: taskId } = await params

    // 删除任务（只能删除自己的任务）
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Task delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Delete task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - 更新任务状态或设置
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: taskId } = await params
    const body = await request.json()
    const { status, action } = body

    // 验证任务属于当前用户
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    // 处理不同的操作
    if (action === 'pause') {
      updateData = { status: 'paused' }
    } else if (action === 'restart') {
      updateData = { 
        status: 'pending',
        started_at: null,
      }
    } else if (action === 'start') {
      updateData = { 
        status: 'running',
        started_at: new Date().toISOString(),
      }
    } else if (status) {
      updateData = { status }
    } else {
      // 如果没有 action 或 status，则更新任务设置
      const {
        auto_dumper,
        preset,
        ai_mode,
        parameter_risk_filter,
        ai_sensitivity_level,
        response_pattern_drift,
        baseline_profiling,
        structural_change_detection,
        union_based,
        error_based,
        boolean_based,
        time_based,
      } = body

      // 只更新提供的字段
      if (auto_dumper !== undefined) updateData.auto_dumper = auto_dumper
      if (preset !== undefined) updateData.preset = preset
      if (ai_mode !== undefined) updateData.ai_mode = ai_mode
      if (parameter_risk_filter !== undefined) updateData.parameter_risk_filter = parameter_risk_filter
      if (ai_sensitivity_level !== undefined) updateData.ai_sensitivity_level = ai_sensitivity_level
      if (response_pattern_drift !== undefined) updateData.response_pattern_drift = response_pattern_drift
      if (baseline_profiling !== undefined) updateData.baseline_profiling = baseline_profiling
      if (structural_change_detection !== undefined) updateData.structural_change_detection = structural_change_detection
      if (union_based !== undefined) updateData.injection_union = union_based
      if (error_based !== undefined) updateData.injection_error = error_based
      if (boolean_based !== undefined) updateData.injection_boolean = boolean_based
      if (time_based !== undefined) updateData.injection_timebased = time_based
    }

    // 如果没有要更新的数据，返回错误
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // 更新任务
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Task update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    })
  } catch (error) {
    console.error('Update task API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
