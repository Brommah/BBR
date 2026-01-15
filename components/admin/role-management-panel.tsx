"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
        // Reload roles
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
      // Update role info
      await updateRole(editingRole.id, {
        displayName: editingRole.displayName,
        description: editingRole.description || undefined,
        color: editingRole.color,
      })
      
      // Update permissions
      const result = await updateRolePermissions(editingRole.id, Array.from(selectedPermissions))
      
      if (result.success) {
        toast.success("Rol bijgewerkt")
        setIsEditOpen(false)
        setEditingRole(null)
        // Reload roles
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
        // Reload roles
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Rollen & Rechten
                <Badge variant="outline" className="ml-2">{roles.length} rollen</Badge>
              </CardTitle>
              <CardDescription>Beheer rollen en hun rechten in het systeem.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nieuwe Rol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map(role => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${role.color}20` }}
                  >
                    <Shield className="w-5 h-5" style={{ color: role.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.displayName}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Lock className="w-3 h-3" />
                          Systeem
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description || `${role.permissions.length} rechten`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{role._count.users} gebruikers</span>
                  </div>
                  <Badge variant="outline">{role.permissions.length} rechten</Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nieuwe Rol Aanmaken</DialogTitle>
            <DialogDescription>
              Maak een nieuwe rol aan en wijs rechten toe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  placeholder="bijv. Stagiair"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kleur</Label>
                <Select
                  value={newRole.color}
                  onValueChange={(v) => setNewRole({ ...newRole, color: v })}
                >
                  <SelectTrigger>
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
              <Label>Beschrijving</Label>
              <Textarea
                placeholder="Korte beschrijving van deze rol..."
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Rechten</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
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
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreateRole} disabled={isPending}>
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
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: `${editingRole?.color}20` }}
              >
                <Shield className="w-4 h-4" style={{ color: editingRole?.color }} />
              </div>
              {editingRole?.displayName} bewerken
              {editingRole?.isSystem && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Lock className="w-3 h-3" />
                  Systeem
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingRole && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weergavenaam</Label>
                  <Input
                    value={editingRole.displayName}
                    onChange={(e) => setEditingRole({ ...editingRole, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kleur</Label>
                  <Select
                    value={editingRole.color}
                    onValueChange={(v) => setEditingRole({ ...editingRole, color: v })}
                  >
                    <SelectTrigger>
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
                <Label>Beschrijving</Label>
                <Textarea
                  value={editingRole.description || ""}
                  onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Rechten ({selectedPermissions.size} geselecteerd)</Label>
                <ScrollArea className="h-[300px] rounded-md border p-4">
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
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSavePermissions} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Rol Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de rol &quot;{deletingRole?.displayName}&quot; wilt verwijderen?
            </DialogDescription>
          </DialogHeader>
          
          {deletingRole && deletingRole._count.users > 0 && (
            <div className="py-4 space-y-4">
              <div className="text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>Let op:</strong> Er zijn {deletingRole._count.users} gebruiker(s) met deze rol.
                Selecteer een rol om ze naar toe te verplaatsen.
              </div>
              
              <div className="space-y-2">
                <Label>Verplaats gebruikers naar</Label>
                <Select value={reassignRoleId} onValueChange={setReassignRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter(r => r.id !== deletingRole.id)
                      .map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.displayName}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={isPending || (deletingRole?._count.users ?? 0) > 0 && !reassignRoleId}
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

// Permission selector component
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
    <Accordion type="multiple" defaultValue={Object.keys(permissions)} className="w-full">
      {Object.entries(permissions).map(([category, perms]) => {
        const selectedCount = perms.filter(p => selectedPermissions.has(p.id)).length
        const allSelected = selectedCount === perms.length
        const someSelected = selectedCount > 0 && selectedCount < perms.length
        
        return (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  onCheckedChange={() => onToggleCategory(category, allSelected)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="font-medium">{CATEGORY_NAMES[category] || category}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedCount}/{perms.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-8">
                {perms.map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-center gap-3 py-1"
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
                        <span className="text-muted-foreground ml-2">
                          - {perm.description}
                        </span>
                      )}
                    </label>
                    {selectedPermissions.has(perm.id) ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/30" />
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
