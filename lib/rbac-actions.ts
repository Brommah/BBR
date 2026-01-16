"use server"

/**
 * @fileoverview RBAC Server Actions
 * 
 * Database-driven Role-Based Access Control management.
 * All user, role, and permission management from the Admin Console.
 */

import prisma from './db'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from './email'

// ============================================================
// Types
// ============================================================

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface RoleWithPermissions {
  id: string
  name: string
  displayName: string
  description: string | null
  color: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  permissions: {
    id: string
    key: string
    name: string
    category: string
  }[]
  _count: {
    users: number
  }
}

export interface PermissionWithCategories {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  sortOrder: number
}

export interface UserWithRole {
  id: string
  name: string
  email: string
  role: string
  roleId: string | null
  roleRef: {
    id: string
    name: string
    displayName: string
    color: string
  } | null
  engineerType: string | null
  avatar: string | null
  createdAt: Date
  permissionOverrides: {
    permissionId: string
    granted: boolean
    permission: {
      key: string
      name: string
    }
  }[]
}

// ============================================================
// Validation helpers
// ============================================================

function validateString(value: string | undefined | null, maxLength: number): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLength) return null
  return trimmed
}

function validateId(id: string | undefined | null): string | null {
  if (!id || typeof id !== 'string') return null
  // CUID format check
  if (!/^c[a-z0-9]{24}$/.test(id)) return null
  return id
}

// ============================================================
// Permission Management
// ============================================================

/**
 * Get all permissions grouped by category
 */
export async function getPermissions(): Promise<ActionResult<PermissionWithCategories[]>> {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    })
    return { success: true, data: permissions }
  } catch (error) {
    console.error('[RBAC] Error fetching permissions:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

/**
 * Get permissions grouped by category for UI display
 */
export async function getPermissionsByCategory(): Promise<ActionResult<Record<string, PermissionWithCategories[]>>> {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    })
    
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = []
      }
      acc[perm.category].push(perm)
      return acc
    }, {} as Record<string, PermissionWithCategories[]>)
    
    return { success: true, data: grouped }
  } catch (error) {
    console.error('[RBAC] Error fetching permissions by category:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

// ============================================================
// Role Management
// ============================================================

/**
 * Get all roles with their permission counts and user counts
 */
export async function getRoles(): Promise<ActionResult<RoleWithPermissions[]>> {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                key: true,
                name: true,
                category: true,
              }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    // Transform to flatten permissions
    const transformed = roles.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
    }))
    
    return { success: true, data: transformed }
  } catch (error) {
    console.error('[RBAC] Error fetching roles:', error)
    return { success: false, error: 'Failed to load roles' }
  }
}

/**
 * Get a single role with all its permissions
 */
export async function getRole(id: string): Promise<ActionResult<RoleWithPermissions>> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid role ID' }
  
  try {
    const role = await prisma.role.findUnique({
      where: { id: validId },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                key: true,
                name: true,
                category: true,
              }
            }
          }
        },
        _count: {
          select: { users: true }
        }
      }
    })
    
    if (!role) {
      return { success: false, error: 'Role not found' }
    }
    
    const transformed = {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
    }
    
    return { success: true, data: transformed }
  } catch (error) {
    console.error('[RBAC] Error fetching role:', error)
    return { success: false, error: 'Failed to load role' }
  }
}

/**
 * Create a new custom role
 */
export async function createRole(data: {
  name: string
  displayName: string
  description?: string
  color?: string
  permissionIds?: string[]
}): Promise<ActionResult<{ id: string }>> {
  const name = validateString(data.name, 50)
  const displayName = validateString(data.displayName, 100)
  
  if (!name) return { success: false, error: 'Role name is required' }
  if (!displayName) return { success: false, error: 'Display name is required' }
  
  // Check for duplicate name
  const existing = await prisma.role.findUnique({ where: { name } })
  if (existing) {
    return { success: false, error: 'A role with this name already exists' }
  }
  
  try {
    const role = await prisma.role.create({
      data: {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        displayName,
        description: data.description?.trim() || null,
        color: data.color || '#6b7280',
        isSystem: false,
      }
    })
    
    // Add permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map(permId => ({
          roleId: role.id,
          permissionId: permId,
        }))
      })
    }
    
    return { success: true, data: { id: role.id } }
  } catch (error) {
    console.error('[RBAC] Error creating role:', error)
    return { success: false, error: 'Failed to create role' }
  }
}

/**
 * Update a role's basic info
 */
export async function updateRole(
  id: string,
  data: {
    displayName?: string
    description?: string
    color?: string
  }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid role ID' }
  
  try {
    const updateData: Record<string, unknown> = {}
    
    if (data.displayName !== undefined) {
      const displayName = validateString(data.displayName, 100)
      if (!displayName) return { success: false, error: 'Invalid display name' }
      updateData.displayName = displayName
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null
    }
    
    if (data.color !== undefined) {
      updateData.color = data.color
    }
    
    await prisma.role.update({
      where: { id: validId },
      data: updateData
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error updating role:', error)
    return { success: false, error: 'Failed to update role' }
  }
}

/**
 * Update a role's permissions (replace all)
 */
export async function updateRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  const validId = validateId(roleId)
  if (!validId) return { success: false, error: 'Invalid role ID' }
  
  try {
    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: validId }
    })
    
    // Add new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permId => ({
          roleId: validId,
          permissionId: permId,
        }))
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error updating role permissions:', error)
    return { success: false, error: 'Failed to update permissions' }
  }
}

/**
 * Delete a custom role (system roles cannot be deleted)
 */
export async function deleteRole(
  id: string,
  reassignToRoleId?: string
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid role ID' }
  
  try {
    const role = await prisma.role.findUnique({
      where: { id: validId },
      include: { _count: { select: { users: true } } }
    })
    
    if (!role) {
      return { success: false, error: 'Role not found' }
    }
    
    if (role.isSystem) {
      return { success: false, error: 'Cannot delete system roles' }
    }
    
    // If role has users, reassign them
    if (role._count.users > 0) {
      if (!reassignToRoleId) {
        return { success: false, error: `Cannot delete role with ${role._count.users} users. Reassign them first.` }
      }
      
      const validReassignId = validateId(reassignToRoleId)
      if (!validReassignId) return { success: false, error: 'Invalid reassign role ID' }
      
      await prisma.user.updateMany({
        where: { roleId: validId },
        data: { roleId: validReassignId }
      })
    }
    
    // Delete role (permissions cascade)
    await prisma.role.delete({
      where: { id: validId }
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error deleting role:', error)
    return { success: false, error: 'Failed to delete role' }
  }
}

// ============================================================
// User Management
// ============================================================

/**
 * Get all users with their roles and permission overrides
 */
export async function getUsersWithRoles(): Promise<ActionResult<UserWithRole[]>> {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        roleRef: {
          select: {
            id: true,
            name: true,
            displayName: true,
            color: true,
          }
        },
        permissionOverrides: {
          include: {
            permission: {
              select: {
                key: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return { success: true, data: users as UserWithRole[] }
  } catch (error) {
    console.error('[RBAC] Error fetching users with roles:', error)
    return { success: false, error: 'Failed to load users' }
  }
}

/**
 * Get effective permissions for a user (role permissions + overrides)
 */
export async function getUserEffectivePermissions(userId: string): Promise<ActionResult<string[]>> {
  const validId = validateId(userId)
  if (!validId) return { success: false, error: 'Invalid user ID' }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: validId },
      include: {
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: { select: { key: true } }
              }
            }
          }
        },
        permissionOverrides: {
          include: {
            permission: { select: { key: true } }
          }
        }
      }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Start with role permissions
    const permissionSet = new Set<string>()
    
    if (user.roleRef) {
      for (const rp of user.roleRef.permissions) {
        permissionSet.add(rp.permission.key)
      }
    }
    
    // Apply overrides
    for (const override of user.permissionOverrides) {
      if (override.granted) {
        permissionSet.add(override.permission.key)
      } else {
        permissionSet.delete(override.permission.key)
      }
    }
    
    return { success: true, data: Array.from(permissionSet) }
  } catch (error) {
    console.error('[RBAC] Error fetching user permissions:', error)
    return { success: false, error: 'Failed to load permissions' }
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string,
  roleId: string
): Promise<ActionResult> {
  const validUserId = validateId(userId)
  const validRoleId = validateId(roleId)
  
  if (!validUserId) return { success: false, error: 'Invalid user ID' }
  if (!validRoleId) return { success: false, error: 'Invalid role ID' }
  
  try {
    // Get the role to update legacy field too
    const role = await prisma.role.findUnique({ where: { id: validRoleId } })
    if (!role) {
      return { success: false, error: 'Role not found' }
    }
    
    await prisma.user.update({
      where: { id: validUserId },
      data: { 
        roleId: validRoleId,
        role: role.name // Keep legacy field in sync
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error updating user role:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}

/**
 * Set a permission override for a user
 */
export async function setUserPermissionOverride(
  userId: string,
  permissionId: string,
  granted: boolean
): Promise<ActionResult> {
  const validUserId = validateId(userId)
  const validPermId = validateId(permissionId)
  
  if (!validUserId) return { success: false, error: 'Invalid user ID' }
  if (!validPermId) return { success: false, error: 'Invalid permission ID' }
  
  try {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: validUserId,
          permissionId: validPermId,
        }
      },
      update: { granted },
      create: {
        userId: validUserId,
        permissionId: validPermId,
        granted,
      }
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error setting permission override:', error)
    return { success: false, error: 'Failed to set permission override' }
  }
}

/**
 * Remove a permission override (revert to role default)
 */
export async function removeUserPermissionOverride(
  userId: string,
  permissionId: string
): Promise<ActionResult> {
  const validUserId = validateId(userId)
  const validPermId = validateId(permissionId)
  
  if (!validUserId) return { success: false, error: 'Invalid user ID' }
  if (!validPermId) return { success: false, error: 'Invalid permission ID' }
  
  try {
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId: validUserId,
          permissionId: validPermId,
        }
      }
    }).catch(() => {
      // Ignore if doesn't exist
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error removing permission override:', error)
    return { success: false, error: 'Failed to remove permission override' }
  }
}

/**
 * Generate a random temporary password
 */
function generateTemporaryPassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let retVal = ""
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n))
  }
  return retVal
}

/**
 * Create a new user (in both Supabase Auth and local database)
 */
export async function createUser(data: {
  name: string
  email: string
  roleId: string
  engineerType?: 'rekenaar' | 'tekenaar'
  password?: string // If not provided, a random one will be generated and emailed
}): Promise<ActionResult<{ id: string }>> {
  const name = validateString(data.name, 200)
  const email = validateString(data.email, 255)?.toLowerCase()
  const validRoleId = validateId(data.roleId)
  
  if (!name) return { success: false, error: 'Name is required' }
  if (!email) return { success: false, error: 'Email is required' }
  if (!validRoleId) return { success: false, error: 'Role is required' }
  
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'A user with this email already exists' }
  }
  
  // Get role for legacy field
  const role = await prisma.role.findUnique({ where: { id: validRoleId } })
  if (!role) {
    return { success: false, error: 'Role not found' }
  }

  // Use provided password or generate a temporary one
  const password = data.password || generateTemporaryPassword()
  
  try {
    // Create in Supabase Auth if SUPABASE_SERVICE_ROLE_KEY is available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role: role.name,
        }
      })
      
      if (authError) {
        console.error('[RBAC] Supabase auth error:', authError)
        return { success: false, error: `Auth error: ${authError.message}` }
      }
      
      console.log('[RBAC] Created Supabase user:', authData.user?.id)
    } else {
      console.warn('[RBAC] Supabase service key not available, creating local user only')
    }
    
    // Create in local database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        roleId: validRoleId,
        role: role.name,
        engineerType: data.engineerType || null,
      }
    })

    // Send welcome email with password
    await sendWelcomeEmail({
      to: email,
      name,
      password,
      role: role.displayName,
      sentBy: 'Admin'
    })
    
    return { success: true, data: { id: user.id } }
  } catch (error) {
    console.error('[RBAC] Error creating user:', error)
    return { success: false, error: 'Failed to create user' }
  }
}

/**
 * Update a user's basic info
 */
export async function updateUser(
  id: string,
  data: {
    name?: string
    engineerType?: 'rekenaar' | 'tekenaar' | null
  }
): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid user ID' }
  
  try {
    const updateData: Record<string, unknown> = {}
    
    if (data.name !== undefined) {
      const name = validateString(data.name, 200)
      if (!name) return { success: false, error: 'Invalid name' }
      updateData.name = name
    }
    
    if (data.engineerType !== undefined) {
      updateData.engineerType = data.engineerType
    }
    
    await prisma.user.update({
      where: { id: validId },
      data: updateData
    })
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error updating user:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

/**
 * Delete (soft-delete) a user
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  const validId = validateId(id)
  if (!validId) return { success: false, error: 'Invalid user ID' }
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: validId },
      select: { email: true }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    // Soft delete in local database
    await prisma.user.update({
      where: { id: validId },
      data: { deletedAt: new Date() }
    })
    
    // Disable in Supabase Auth if service key is available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      // Get auth user by email
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const authUser = authUsers?.users?.find(u => u.email === user.email)
      
      if (authUser) {
        // Delete from Supabase Auth
        await supabaseAdmin.auth.admin.deleteUser(authUser.id)
        console.log('[RBAC] Deleted Supabase auth user:', authUser.id)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error deleting user:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

/**
 * Send password reset email to user
 */
export async function sendPasswordReset(userId: string): Promise<ActionResult> {
  const validId = validateId(userId)
  if (!validId) return { success: false, error: 'Invalid user ID' }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: validId },
      select: { email: true }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: 'Supabase not configured' }
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login/reset-password`,
    })
    
    if (error) {
      console.error('[RBAC] Password reset error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error sending password reset:', error)
    return { success: false, error: 'Failed to send password reset' }
  }
}

/**
 * Send password reset email to user by email address
 */
export async function sendPasswordResetByEmail(email: string): Promise<ActionResult> {
  const validEmail = validateString(email, 255)?.toLowerCase()
  if (!validEmail) return { success: false, error: 'Invalid email address' }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { success: false, error: 'Supabase not configured' }
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(validEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login/reset-password`,
    })
    
    if (error) {
      console.error('[RBAC] Password reset error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('[RBAC] Error sending password reset by email:', error)
    return { success: false, error: 'Failed to send password reset' }
  }
}
