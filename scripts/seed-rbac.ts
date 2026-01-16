/**
 * Seed script for RBAC (Role-Based Access Control)
 * 
 * This script:
 * 1. Creates all Permission records
 * 2. Creates default Role records (Admin, Projectleider, Engineer)
 * 3. Assigns permissions to roles
 * 4. Migrates existing users to use the new roleId field
 * 
 * Run with: npx tsx scripts/seed-rbac.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Define all permissions
const PERMISSIONS = [
  // Leads
  { key: 'leads:view-all', name: 'Alle leads bekijken', description: 'Kan alle leads in het systeem zien', category: 'leads', sortOrder: 1 },
  { key: 'leads:view-own', name: 'Eigen leads bekijken', description: 'Kan alleen toegewezen leads zien', category: 'leads', sortOrder: 2 },
  { key: 'leads:view-offerte', name: 'Offerte fase bekijken', description: 'Kan leads in offerte fase zien', category: 'leads', sortOrder: 3 },
  { key: 'leads:create', name: 'Leads aanmaken', description: 'Kan nieuwe leads aanmaken', category: 'leads', sortOrder: 4 },
  { key: 'leads:edit', name: 'Leads bewerken', description: 'Kan lead gegevens bewerken', category: 'leads', sortOrder: 5 },
  { key: 'leads:delete', name: 'Leads verwijderen', description: 'Kan leads verwijderen', category: 'leads', sortOrder: 6 },
  { key: 'leads:assign', name: 'Team toewijzen', description: 'Kan teamleden aan leads toewijzen', category: 'leads', sortOrder: 7 },
  
  // Quotes
  { key: 'quotes:view', name: 'Offertes bekijken', description: 'Kan offertes bekijken', category: 'quotes', sortOrder: 10 },
  { key: 'quotes:submit', name: 'Offertes indienen', description: 'Kan offertes ter goedkeuring indienen', category: 'quotes', sortOrder: 11 },
  { key: 'quotes:approve', name: 'Offertes goedkeuren', description: 'Kan offertes goedkeuren', category: 'quotes', sortOrder: 12 },
  { key: 'quotes:reject', name: 'Offertes afwijzen', description: 'Kan offertes afwijzen met feedback', category: 'quotes', sortOrder: 13 },
  { key: 'quotes:feedback', name: 'Offerte feedback geven', description: 'Kan feedback geven op offertes', category: 'quotes', sortOrder: 14 },
  
  // Team management
  { key: 'team:view', name: 'Team bekijken', description: 'Kan teamleden zien', category: 'team', sortOrder: 20 },
  { key: 'team:manage-users', name: 'Gebruikers beheren', description: 'Kan gebruikers toevoegen, bewerken, verwijderen', category: 'team', sortOrder: 21 },
  { key: 'team:manage-roles', name: 'Rollen beheren', description: 'Kan rollen en rechten aanpassen', category: 'team', sortOrder: 22 },
  
  // Admin
  { key: 'admin:access', name: 'Admin console toegang', description: 'Kan de admin console openen', category: 'admin', sortOrder: 30 },
  { key: 'admin:manage-pricing', name: 'Tarieven beheren', description: 'Kan kostentarieven aanpassen', category: 'admin', sortOrder: 31 },
  { key: 'admin:view-financials', name: 'Financiën bekijken', description: 'Kan financiële overzichten zien', category: 'admin', sortOrder: 32 },
  { key: 'admin:manage-automations', name: 'Automations beheren', description: 'Kan email automations configureren', category: 'admin', sortOrder: 33 },
  
  // Settings
  { key: 'settings:view', name: 'Instellingen bekijken', description: 'Kan instellingen bekijken', category: 'settings', sortOrder: 40 },
  { key: 'settings:edit', name: 'Instellingen bewerken', description: 'Kan instellingen aanpassen', category: 'settings', sortOrder: 41 },
  
  // Documents
  { key: 'documents:view', name: 'Documenten bekijken', description: 'Kan documenten bekijken en downloaden', category: 'documents', sortOrder: 50 },
  { key: 'documents:upload', name: 'Documenten uploaden', description: 'Kan documenten uploaden', category: 'documents', sortOrder: 51 },
  { key: 'documents:delete', name: 'Documenten verwijderen', description: 'Kan documenten verwijderen', category: 'documents', sortOrder: 52 },
  
  // Time tracking
  { key: 'time:view-own', name: 'Eigen uren bekijken', description: 'Kan eigen uurregistratie zien', category: 'time', sortOrder: 60 },
  { key: 'time:view-all', name: 'Alle uren bekijken', description: 'Kan uurregistratie van iedereen zien', category: 'time', sortOrder: 61 },
  { key: 'time:register', name: 'Uren registreren', description: 'Kan uren registreren', category: 'time', sortOrder: 62 },
]

// Define default roles with their permissions
const DEFAULT_ROLES = [
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Volledige toegang tot alle functies.',
    color: '#f59e0b', // amber
    isSystem: true,
    permissions: [
      'leads:view-all', 'leads:view-offerte', 'leads:create', 'leads:edit', 'leads:delete', 'leads:assign',
      'quotes:view', 'quotes:submit', 'quotes:approve', 'quotes:reject', 'quotes:feedback',
      'team:view', 'team:manage-users', 'team:manage-roles',
      'admin:access', 'admin:manage-pricing', 'admin:view-financials', 'admin:manage-automations',
      'settings:view', 'settings:edit',
      'documents:view', 'documents:upload', 'documents:delete',
      'time:view-own', 'time:view-all', 'time:register',
    ]
  },
  {
    name: 'projectleider',
    displayName: 'Projectleider',
    description: 'Verantwoordelijk voor projectoplevering. Kan team toewijzen en offertes indienen.',
    color: '#8b5cf6', // purple
    isSystem: true,
    permissions: [
      'leads:view-own', 'leads:view-offerte', 'leads:create', 'leads:edit', 'leads:assign',
      'quotes:view', 'quotes:submit', 'quotes:feedback',
      'team:view',
      'admin:access', 'admin:view-financials',
      'settings:view',
      'documents:view', 'documents:upload',
      'time:view-own', 'time:view-all', 'time:register',
    ]
  },
  {
    name: 'engineer',
    displayName: 'Engineer',
    description: 'Rekenaar of Tekenaar. Voert werk uit op toegewezen projecten.',
    color: '#3b82f6', // blue
    isSystem: true,
    permissions: [
      'leads:view-own',
      'quotes:view',
      'team:view',
      'settings:view',
      'documents:view', 'documents:upload',
      'time:view-own', 'time:register',
    ]
  }
]

// Map legacy role string to new role name
const LEGACY_ROLE_MAP: Record<string, string> = {
  'admin': 'admin',
  'projectleider': 'projectleider',
  'engineer': 'engineer',
  'viewer': 'engineer', // Migrate viewers to engineers
}

async function seedRBAC() {
  console.log('🔐 Seeding RBAC system...\n')

  // Step 1: Create all permissions
  console.log('1️⃣ Creating permissions...')
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
        sortOrder: perm.sortOrder,
      },
      create: perm,
    })
    console.log(`   ✓ ${perm.key}`)
  }
  console.log(`   Created ${PERMISSIONS.length} permissions\n`)

  // Step 2: Create default roles
  console.log('2️⃣ Creating default roles...')
  const roleMap = new Map<string, string>() // name -> id
  
  for (const roleData of DEFAULT_ROLES) {
    const { permissions: permissionKeys, ...roleFields } = roleData
    
    // Create or update the role
    const role = await prisma.role.upsert({
      where: { name: roleFields.name },
      update: {
        displayName: roleFields.displayName,
        description: roleFields.description,
        color: roleFields.color,
        isSystem: roleFields.isSystem,
      },
      create: roleFields,
    })
    
    roleMap.set(role.name, role.id)
    console.log(`   ✓ ${role.displayName} (${role.name})`)
    
    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true, key: true },
    })
    
    // Clear existing role permissions and add new ones
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    })
    
    for (const perm of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        }
      })
    }
    console.log(`     → ${permissions.length} permissions assigned`)
  }
  console.log('')

  // Step 3: Migrate existing users
  console.log('3️⃣ Migrating existing users...')
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, roleId: true }
  })
  
  let migratedCount = 0
  for (const user of users) {
    if (user.roleId) {
      console.log(`   ⏭ ${user.name} - already migrated`)
      continue
    }
    
    const newRoleName = LEGACY_ROLE_MAP[user.role] || 'engineer'
    const newRoleId = roleMap.get(newRoleName)
    
    if (newRoleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: newRoleId }
      })
      console.log(`   ✓ ${user.name}: ${user.role} → ${newRoleName}`)
      migratedCount++
    } else {
      console.log(`   ⚠ ${user.name}: Could not find role ${newRoleName}`)
    }
  }
  console.log(`   Migrated ${migratedCount} users\n`)

  // Step 4: Summary
  console.log('📊 Summary:')
  const permCount = await prisma.permission.count()
  const roleCount = await prisma.role.count()
  const userCount = await prisma.user.count({ where: { deletedAt: null, roleId: { not: null } } })
  
  console.log(`   Permissions: ${permCount}`)
  console.log(`   Roles: ${roleCount}`)
  console.log(`   Users with roles: ${userCount}`)
  
  console.log('\n✅ RBAC seeding complete!')
}

seedRBAC()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
