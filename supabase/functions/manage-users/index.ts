import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  action: 'create'
  email: string
  password: string
  fullName: string
  fullNameAr?: string
  role: 'admin' | 'employee'
  department?: string
  phone?: string
}

interface UpdateRoleRequest {
  action: 'updateRole'
  userId: string
  newRole: 'admin' | 'employee'
}

interface ToggleActiveRequest {
  action: 'toggleActive'
  profileId: string
  isActive: boolean
}

interface DeleteUserRequest {
  action: 'delete'
  userId: string
  profileId: string
}

type RequestBody = CreateUserRequest | UpdateRoleRequest | ToggleActiveRequest | DeleteUserRequest

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get requesting user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create client with user's token to verify permissions
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: requestingUser } } = await supabaseClient.auth.getUser()
    if (!requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get requesting user's role and company
    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, company_id')
      .eq('user_id', requestingUser.id)
      .single()

    if (!requestingProfile?.company_id) {
      return new Response(JSON.stringify({ error: 'User has no company' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: requestingRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('company_id', requestingProfile.company_id)
      .single()

    const userRole = requestingRole?.role
    const companyId = requestingProfile.company_id

    // Parse request body
    const body: RequestBody = await req.json()
    console.log('Request action:', body.action, 'by role:', userRole)

    switch (body.action) {
      case 'create': {
        // Only super_admin and admin can create users
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Admin can only create employees
        if (userRole === 'admin' && body.role !== 'employee') {
          return new Response(JSON.stringify({ error: 'Admins can only create employees' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            full_name: body.fullName,
            full_name_ar: body.fullNameAr
          }
        })

        if (createError) {
          console.error('Create user error:', createError)
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: newUser.user.id,
            company_id: companyId,
            full_name: body.fullName,
            full_name_ar: body.fullNameAr,
            department: body.department,
            phone: body.phone,
            is_active: true
          })

        if (profileError) {
          console.error('Create profile error:', profileError)
          // Cleanup: delete auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
          return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            company_id: companyId,
            role: body.role
          })

        if (roleError) {
          console.error('Create role error:', roleError)
          return new Response(JSON.stringify({ error: roleError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User created successfully:', newUser.user.id)
        return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'updateRole': {
        // Only super_admin can change roles
        if (userRole !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Only super admin can change roles' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Cannot change to super_admin
        if (body.newRole === 'super_admin' as any) {
          return new Response(JSON.stringify({ error: 'Cannot assign super_admin role' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get target user's current role
        const { data: targetRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', body.userId)
          .eq('company_id', companyId)
          .single()

        if (targetRole?.role === 'super_admin') {
          return new Response(JSON.stringify({ error: 'Cannot change super_admin role' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: body.newRole })
          .eq('user_id', body.userId)
          .eq('company_id', companyId)

        if (updateError) {
          console.error('Update role error:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Role updated successfully for user:', body.userId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'toggleActive': {
        // Only super_admin and admin can toggle active
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ is_active: body.isActive })
          .eq('id', body.profileId)
          .eq('company_id', companyId)

        if (updateError) {
          console.error('Toggle active error:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User active status toggled:', body.profileId, body.isActive)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'delete': {
        // Only super_admin can delete users
        if (userRole !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Only super admin can delete users' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Cannot delete yourself
        if (body.userId === requestingUser.id) {
          return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if target is super_admin
        const { data: targetRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', body.userId)
          .eq('company_id', companyId)
          .single()

        if (targetRole?.role === 'super_admin') {
          return new Response(JSON.stringify({ error: 'Cannot delete super_admin' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Delete auth user (cascades to profile and roles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.userId)

        if (deleteError) {
          console.error('Delete user error:', deleteError)
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User deleted successfully:', body.userId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error: unknown) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})