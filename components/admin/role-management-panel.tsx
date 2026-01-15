"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Plus,
  Loader2,
  Shield,
  Users,
  Pencil,
  Trash2,
  Lock,
  Check,
  X,
} from "lucide-react"
import {
  getRoles,
  getPermissionsByCategory,
  createRole,
  updateRole,
  updateRolePermissions,
  deleteRole,
  type RoleWithPermissions,
  type PermissionWithCategories,
} from "@/lib/rbac-actions"
import { cn } from "@/lib/utils"

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  leads: "Dossiers",
  quotes: "Offertes",
  team: "Team",
  admin: "Beheer",
  settings: "Instellingen",
  documents: "Documenten",
  time: "Uren",
}

// Color options for roles
const ROLE_COLORS = [
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Paars" },
  { value: "#3b82f6", label: "Blauw" },
  { value: "#10b981", label: "Groen" },
  { value: "#ef4444", label: "Rood" },
  { value: "#ec4899", label: "Roze" },
  { value: "#6b7280", label: "Grijs" },
]

export function RoleManagementPanel() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [permissions, setPermissions] = useState<Record<string, PermissionWithCategories[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
  const [deletingRole, setDeletingRole] = useState<RoleWithPermissions | null>(null)
  
  // Form states
  const [newRole, setNewRole] = useState({ name: "", displayName: "", description: "", color: "#6b7280" })
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [reassignRoleId, setReassignRoleId] = useState<string>("")

  // Load roles and permissions
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [rolesResult, permsResult] = await Promise.all([
        getRoles(),
        getPermissionsByCategory(),
      ])
      
      if (rolesResult.success && rolesResult.data) {
        setRoles(rolesResult.data)
      }
      if (permsResult.success && permsResult.data) {
        setPermissions(permsResult.data)
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleCreateRole = async () => {
    if (!newRole.displayName.trim()) {
      toast.error("Naam is verplicht")
      return
    }
    
    startTransition(async () => {
      const result = await createRole({
        name: newRole.displayName.toLowerCase().replace(/\s+/g, "-"),
        displayName: newRole.displayName,
        description: newRole.description || undefined,
        color: newRole.color,
        permissionIds: Array.from(selectedPermissions),
      })
      
      if (result.success) {
        toast.success("Rol aangemaakt")
        setIsCreateOpen(false)
        setNewRole({ name: "", displayName: "", description: "", color: "#6b7280" })
        setSelectedPermissions(new Set())
        const rolesResult = await getRoles()
        if (rolesResult.success && rolesResult.data) {
          setRoles(rolesResult.data)
        }
      } else {
        toast.error(result.error || "Kon rol niet aanmaken")
      }
    })
  }

  const handleEditRole = (role: RoleWithPermissions) => {
    setEditingRole(role)
    setSelectedPermissions(new Set(role.permissions.map(p => p.id)))
    setIsEditOpen(true)
  }

  const handleSavePermissions = async () => {
    if (!editingRole) return
    
    startTransition(async () => {
      await updateRole(editingRole.id, {
        displayName: editingRole.displayName,
        description: editingRole.description || undefined,
        color: editingRole.color,
      })
      
      const result = await updateRolePermissions(editingRole.id, Array.from(selectedPermissions))
      
      if (result.success) {
        toast.success("Rol bijgewerkt")
        setIsEditOpen(false)
        setEditingRole(null)
        const rolesResult = await getRoles()
        if (rolesResult.success && rolesResult.data) {
          setRoles(rolesResult.data)
        }
      } else {
        toast.error(result.error || "Kon rol niet bijwerken")
      }
    })
  }

  const handleDeleteRole = async () => {
    if (!deletingRole) return
    
    startTransition(async () => {
      const result = await deleteRole(
        deletingRole.id,
        deletingRole._count.users > 0 ? reassignRoleId : undefined
      )
      
      if (result.success) {
        toast.success("Rol verwijderd")
        setIsDeleteOpen(false)
        setDeletingRole(null)
        setReassignRoleId("")
        const rolesResult = await getRoles()
        if (rolesResult.success && rolesResult.data) {
          setRoles(rolesResult.data)
        }
      } else {
        toast.error(result.error || "Kon rol niet verwijderen")
      }
    })
  }

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions)
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId)
    } else {
      newSet.add(permissionId)
    }
    setSelectedPermissions(newSet)
  }

  const toggleCategoryPermissions = (category: string, allSelected: boolean) => {
    const categoryPerms = permissions[category] || []
    const newSet = new Set(selectedPermissions)
    
    categoryPerms.forEach(perm => {
      if (allSelected) {
        newSet.delete(perm.id)
      } else {
        newSet.add(perm.id)
      }
    })
    
    setSelectedPermissions(newSet)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Rollen & Rechten</h3>
              <p className="text-sm text-muted-foreground">{roles.length} rollen geconfigureerd</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Rol
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="card-tactile rounded-xl p-5 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}15` }}
                    >
                      <Shield className="w-6 h-6" style={{ color: role.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{role.displayName}</span>
                        {role.isSystem && (
                          <span className="pill-glass-slate px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Systeem
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {role.description || `${role.permissions.length} rechten`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditRole(role)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeletingRole(role)
                          setIsDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{role._count.users}</span>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${role.color}15`,
                      color: role.color 
                    }}
                  >
                    {role.permissions.length} rechten
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Nieuwe Rol Aanmaken
            </DialogTitle>
            <DialogDescription>
              Definieer een nieuwe rol met specifieke rechten.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Naam *</Label>
                <Input
                  placeholder="bijv. Stagiair"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kleur</Label>
                <Select
                  value={newRole.color}
                  onValueChange={(v) => setNewRole({ ...newRole, color: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_COLORS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: c.value }}
                          />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Beschrijving</Label>
              <Textarea
                placeholder="Korte beschrijving van deze rol..."
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rechten selecteren</Label>
              <ScrollArea className="h-[280px] rounded-xl border p-4 bg-muted/30">
                <PermissionSelector
                  permissions={permissions}
                  selectedPermissions={selectedPermissions}
                  onToggle={togglePermission}
                  onToggleCategory={toggleCategoryPermissions}
                />
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateRole} 
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${editingRole?.color}15` }}
              >
                <Shield className="w-4 h-4" style={{ color: editingRole?.color }} />
              </div>
              {editingRole?.displayName} bewerken
              {editingRole?.isSystem && (
                <span className="pill-glass-slate px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Systeem
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingRole && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Weergavenaam</Label>
                  <Input
                    value={editingRole.displayName}
                    onChange={(e) => setEditingRole({ ...editingRole, displayName: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Kleur</Label>
                  <Select
                    value={editingRole.color}
                    onValueChange={(v) => setEditingRole({ ...editingRole, color: v })}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: c.value }}
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Beschrijving</Label>
                <Textarea
                  value={editingRole.description || ""}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  className="rounded-xl resize-none"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center justify-between">
                  <span>Rechten</span>
                  <span className="pill-glass-emerald px-2 py-0.5 rounded-full text-xs">
                    {selectedPermissions.size} geselecteerd
                  </span>
                </Label>
                <ScrollArea className="h-[280px] rounded-xl border p-4 bg-muted/30">
                  <PermissionSelector
                    permissions={permissions}
                    selectedPermissions={selectedPermissions}
                    onToggle={togglePermission}
                    onToggleCategory={toggleCategoryPermissions}
                  />
                </ScrollArea>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
            <Button 
              onClick={handleSavePermissions} 
              disabled={isPending}
              className="rounded-xl"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Rol Verwijderen
            </DialogTitle>
            <DialogDescription>
              Weet je zeker dat je &quot;{deletingRole?.displayName}&quot; wilt verwijderen?
            </DialogDescription>
          </DialogHeader>
          
          {deletingRole && deletingRole._count.users > 0 && (
            <div className="py-4 space-y-4">
              <div className="text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <strong>Let op:</strong> {deletingRole._count.users} gebruiker(s) hebben deze rol.
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Verplaats naar</Label>
                <Select value={reassignRoleId} onValueChange={setReassignRoleId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecteer rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter(r => r.id !== deletingRole.id)
                      .map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.displayName}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
            <Button
              onClick={handleDeleteRole}
              disabled={isPending || (deletingRole?._count.users ?? 0) > 0 && !reassignRoleId}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Permission selector component with cards
function PermissionSelector({
  permissions,
  selectedPermissions,
  onToggle,
  onToggleCategory,
}: {
  permissions: Record<string, PermissionWithCategories[]>
  selectedPermissions: Set<string>
  onToggle: (id: string) => void
  onToggleCategory: (category: string, allSelected: boolean) => void
}) {
  return (
    <Accordion type="multiple" defaultValue={Object.keys(permissions)} className="w-full space-y-2">
      {Object.entries(permissions).map(([category, perms]) => {
        const selectedCount = perms.filter(p => selectedPermissions.has(p.id)).length
        const allSelected = selectedCount === perms.length
        const someSelected = selectedCount > 0 && selectedCount < perms.length
        
        return (
          <AccordionItem 
            key={category} 
            value={category}
            className="border rounded-lg px-3 data-[state=open]:bg-muted/30"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                  onCheckedChange={() => onToggleCategory(category, allSelected)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-medium">{CATEGORY_NAMES[category] || category}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  allSelected ? "pill-glass-emerald" : "pill-glass-slate"
                )}>
                  {selectedCount}/{perms.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-2 pb-3 pl-8">
                {perms.map(perm => (
                  <motion.div
                    key={perm.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onToggle(perm.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      selectedPermissions.has(perm.id) 
                        ? "bg-emerald-50 dark:bg-emerald-950/30" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      id={perm.id}
                      checked={selectedPermissions.has(perm.id)}
                      onCheckedChange={() => onToggle(perm.id)}
                    />
                    <label
                      htmlFor={perm.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <span className="font-medium">{perm.name}</span>
                      {perm.description && (
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          {perm.description}
                        </span>
                      )}
                    </label>
                    {selectedPermissions.has(perm.id) ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/20" />
                    )}
                  </motion.div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
