import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schemas
const createUserSchema = z.object({
  action: z.literal('create'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(val => val.trim()),
  fullNameAr: z.string().max(100, 'Arabic name too long').optional().transform(val => val?.trim()),
  role: z.enum(['admin', 'employee']),
  department: z.string().max(50, 'Department name too long').optional(),
  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Invalid phone format')
    .max(20, 'Phone number too long')
    .optional()
    .transform(val => val?.trim())
})

const updateRoleSchema = z.object({
  action: z.literal('updateRole'),
  userId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(['admin', 'employee'])
})

const toggleActiveSchema = z.object({
  action: z.literal('toggleActive'),
  profileId: z.string().uuid('Invalid profile ID'),
  isActive: z.boolean()
})

const deleteUserSchema = z.object({
  action: z.literal('delete'),
  userId: z.string().uuid('Invalid user ID'),
  profileId: z.string().uuid('Invalid profile ID')
})

const updateProfileSchema = z.object({
  action: z.literal('updateProfile'),
  profileId: z.string().uuid('Invalid profile ID'),
  fullName: z.string().min(2).max(100).optional().transform(val => val?.trim()),
  fullNameAr: z.string().max(100).optional().transform(val => val?.trim()),
  department: z.string().max(50).optional(),
  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Invalid phone format')
    .max(20)
    .optional()
    .transform(val => val?.trim())
})

// Helper to sanitize string inputs (remove zero-width chars, normalize unicode)
function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return input
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .normalize('NFC') // Normalize unicode
    .trim()
}

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
    const rawBody = await req.json()
    console.log('Request action:', rawBody.action, 'by role:', userRole)

    // Determine which schema to use based on action
    let validatedBody: any

    switch (rawBody.action) {
      case 'create': {
        const validation = createUserSchema.safeParse(rawBody)
        if (!validation.success) {
          console.error('Validation error:', validation.error.format())
          return new Response(JSON.stringify({ 
            error: 'Validation error',
            details: validation.error.errors.map(e => e.message).join(', ')
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        validatedBody = validation.data

        // Sanitize string inputs
        validatedBody.fullName = sanitizeString(validatedBody.fullName)
        validatedBody.fullNameAr = sanitizeString(validatedBody.fullNameAr)

        // Only super_admin and admin can create users
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Admin can only create employees
        if (userRole === 'admin' && validatedBody.role !== 'employee') {
          return new Response(JSON.stringify({ error: 'Admins can only create employees' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: validatedBody.email,
          password: validatedBody.password,
          email_confirm: true,
          user_metadata: {
            full_name: validatedBody.fullName,
            full_name_ar: validatedBody.fullNameAr
          }
        })

        if (createError) {
          console.error('Create user error:', createError)
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create or update profile (upsert to handle trigger-created profiles)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: newUser.user.id,
            company_id: companyId,
            full_name: validatedBody.fullName,
            full_name_ar: validatedBody.fullNameAr,
            department: validatedBody.department,
            phone: validatedBody.phone,
            is_active: true
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
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
            role: validatedBody.role
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
        const validation = updateRoleSchema.safeParse(rawBody)
        if (!validation.success) {
          return new Response(JSON.stringify({ 
            error: 'Validation error',
            details: validation.error.errors.map(e => e.message).join(', ')
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        validatedBody = validation.data

        // Only super_admin can change roles
        if (userRole !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Only super admin can change roles' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get target user's current role
        const { data: targetRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', validatedBody.userId)
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
          .update({ role: validatedBody.newRole })
          .eq('user_id', validatedBody.userId)
          .eq('company_id', companyId)

        if (updateError) {
          console.error('Update role error:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Role updated successfully for user:', validatedBody.userId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'toggleActive': {
        const validation = toggleActiveSchema.safeParse(rawBody)
        if (!validation.success) {
          return new Response(JSON.stringify({ 
            error: 'Validation error',
            details: validation.error.errors.map(e => e.message).join(', ')
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        validatedBody = validation.data

        // Only super_admin and admin can toggle active
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ is_active: validatedBody.isActive })
          .eq('id', validatedBody.profileId)
          .eq('company_id', companyId)

        if (updateError) {
          console.error('Toggle active error:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User active status toggled:', validatedBody.profileId, validatedBody.isActive)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'delete': {
        const validation = deleteUserSchema.safeParse(rawBody)
        if (!validation.success) {
          return new Response(JSON.stringify({ 
            error: 'Validation error',
            details: validation.error.errors.map(e => e.message).join(', ')
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        validatedBody = validation.data

        // Only super_admin can delete users
        if (userRole !== 'super_admin') {
          return new Response(JSON.stringify({ error: 'Only super admin can delete users' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Cannot delete yourself
        if (validatedBody.userId === requestingUser.id) {
          return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if target is super_admin
        const { data: targetRole } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', validatedBody.userId)
          .eq('company_id', companyId)
          .single()

        if (targetRole?.role === 'super_admin') {
          return new Response(JSON.stringify({ error: 'Cannot delete super_admin' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Delete auth user (cascades to profile and roles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(validatedBody.userId)

        if (deleteError) {
          console.error('Delete user error:', deleteError)
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('User deleted successfully:', validatedBody.userId)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'updateProfile': {
        const validation = updateProfileSchema.safeParse(rawBody)
        if (!validation.success) {
          return new Response(JSON.stringify({ 
            error: 'Validation error',
            details: validation.error.errors.map(e => e.message).join(', ')
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        validatedBody = validation.data

        // Sanitize string inputs
        validatedBody.fullName = sanitizeString(validatedBody.fullName)
        validatedBody.fullNameAr = sanitizeString(validatedBody.fullNameAr)

        // Only super_admin and admin can update profiles
        if (userRole !== 'super_admin' && userRole !== 'admin') {
          return new Response(JSON.stringify({ error: 'Permission denied' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const updateData: Record<string, any> = {}
        if (validatedBody.fullName !== undefined) updateData.full_name = validatedBody.fullName
        if (validatedBody.fullNameAr !== undefined) updateData.full_name_ar = validatedBody.fullNameAr
        if (validatedBody.department !== undefined) updateData.department = validatedBody.department
        if (validatedBody.phone !== undefined) updateData.phone = validatedBody.phone

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', validatedBody.profileId)
          .eq('company_id', companyId)

        if (updateError) {
          console.error('Update profile error:', updateError)
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Profile updated successfully:', validatedBody.profileId)
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
    // Return generic error message to avoid leaking internal details
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
