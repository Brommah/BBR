"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Plus,
  Loader2,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Key,
  Users,
  Calculator,
  PenTool,
} from "lucide-react"
import {
  getRoles,
  getUsersWithRoles,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  sendPasswordReset,
  type RoleWithPermissions,
  type UserWithRole,
} from "@/lib/rbac-actions"
import { cn } from "@/lib/utils"

export function UserPermissionsTable() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null)
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    roleId: "",
    engineerType: "" as "" | "rekenaar" | "tekenaar",
    password: "",
  })

  // Load users and roles
  async function loadData() {
    setIsLoading(true)
    const [usersResult, rolesResult] = await Promise.all([
      getUsersWithRoles(),
      getRoles(),
    ])
    
    if (usersResult.success && usersResult.data) {
      setUsers(usersResult.data)
    }
    if (rolesResult.success && rolesResult.data) {
      setRoles(rolesResult.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.roleId) {
      toast.error("Vul alle verplichte velden in")
      return
    }
    
    startTransition(async () => {
      const result = await createUser({
        name: newUser.name,
        email: newUser.email,
        roleId: newUser.roleId,
        engineerType: newUser.engineerType || undefined,
        password: newUser.password || undefined,
      })
      
      if (result.success) {
        toast.success("Gebruiker aangemaakt", {
          description: newUser.password 
            ? "Gebruiker kan direct inloggen"
            : "Stuur een wachtwoord-reset email"
        })
        setIsAddUserOpen(false)
        setNewUser({ name: "", email: "", roleId: "", engineerType: "", password: "" })
        loadData()
      } else {
        toast.error(result.error || "Kon gebruiker niet aanmaken")
      }
    })
  }

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user)
    setIsEditUserOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    startTransition(async () => {
      const result = await updateUser(editingUser.id, {
        name: editingUser.name,
        engineerType: editingUser.engineerType as "rekenaar" | "tekenaar" | null,
      })
      
      if (result.success) {
        toast.success("Gebruiker bijgewerkt")
        setIsEditUserOpen(false)
        setEditingUser(null)
        loadData()
      } else {
        toast.error(result.error || "Kon gebruiker niet bijwerken")
      }
    })
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, roleId)
      
      if (result.success) {
        toast.success("Rol gewijzigd")
        loadData()
      } else {
        toast.error(result.error || "Kon rol niet wijzigen")
      }
    })
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    
    startTransition(async () => {
      const result = await deleteUser(deletingUser.id)
      
      if (result.success) {
        toast.success("Gebruiker verwijderd")
        setIsDeleteOpen(false)
        setDeletingUser(null)
        loadData()
      } else {
        toast.error(result.error || "Kon gebruiker niet verwijderen")
      }
    })
  }

  const handlePasswordReset = async (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await sendPasswordReset(userId)
      
      if (result.success) {
        toast.success("Wachtwoord-reset verzonden", {
          description: `${userName} ontvangt een email.`
        })
      } else {
        toast.error(result.error || "Kon reset email niet verzenden")
      }
    })
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
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
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold">Team Leden</h3>
              <p className="text-sm text-muted-foreground">{users.length} actieve gebruikers</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddUserOpen(true)} 
            className="gap-2 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Gebruiker
          </Button>
        </div>

        {/* User Cards Grid */}
        {users.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-tactile rounded-xl text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Geen gebruikers gevonden</p>
            <Button 
              onClick={() => setIsAddUserOpen(true)} 
              variant="outline" 
              className="mt-4"
            >
              Eerste gebruiker toevoegen
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-tactile rounded-xl p-5 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    {/* Large Avatar with Status */}
                    <div className="relative">
                      <Avatar className={cn(
                        "w-14 h-14 border-2 border-card",
                        user.roleRef && "avatar-status-online"
                      )}>
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                        <AvatarFallback 
                          className="text-lg font-bold"
                          style={{ 
                            background: user.roleRef 
                              ? `linear-gradient(135deg, ${user.roleRef.color}20, ${user.roleRef.color}40)`
                              : 'var(--muted)',
                            color: user.roleRef?.color || 'var(--muted-foreground)'
                          }}
                        >
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.engineerType && (
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-card",
                          user.engineerType === 'rekenaar' ? "bg-blue-500" : "bg-violet-500"
                        )}>
                          {user.engineerType === 'rekenaar' 
                            ? <Calculator className="w-3 h-3 text-white" />
                            : <PenTool className="w-3 h-3 text-white" />
                          }
                        </div>
                      )}
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handlePasswordReset(user.id, user.name)}
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Wachtwoord resetten
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeletingUser(user)
                            setIsDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* User Info */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    {/* Role Selector */}
                    <Select
                      value={user.roleId || ""}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-9 rounded-lg">
                        <SelectValue>
                          {user.roleRef ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: user.roleRef.color }}
                              />
                              <span className="text-sm">{user.roleRef.displayName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Geen rol</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              {role.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/30 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              Nieuwe Gebruiker
            </DialogTitle>
            <DialogDescription>
              Voeg een nieuw teamlid toe aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Naam *</Label>
              <Input
                placeholder="Volledige naam"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">E-mail *</Label>
              <Input
                type="email"
                placeholder="naam@broersma-bouwadvies.nl"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rol *</Label>
              <Select
                value={newUser.roleId}
                onValueChange={(v) => setNewUser({ ...newUser, roleId: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecteer rol..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        {role.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Specialisatie</Label>
              <Select
                value={newUser.engineerType || "_none"}
                onValueChange={(v) => setNewUser({ ...newUser, engineerType: v === "_none" ? "" : v as "rekenaar" | "tekenaar" })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Niet van toepassing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Niet van toepassing</SelectItem>
                  <SelectItem value="rekenaar">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-500" />
                      Rekenaar
                    </div>
                  </SelectItem>
                  <SelectItem value="tekenaar">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-violet-500" />
                      Tekenaar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Wachtwoord</Label>
              <Input
                type="password"
                placeholder="Optioneel - anders via reset-email"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Leeg laten = handmatig wachtwoord-reset sturen
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
            <Button 
              onClick={handleAddUser} 
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gebruiker Bewerken</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              {/* Avatar Preview */}
              <div className="flex justify-center">
                <Avatar className="w-20 h-20 border-2 border-card">
                  {editingUser.avatar && <AvatarImage src={editingUser.avatar} alt={editingUser.name} />}
                  <AvatarFallback 
                    className="text-2xl font-bold"
                    style={{ 
                      background: editingUser.roleRef 
                        ? `linear-gradient(135deg, ${editingUser.roleRef.color}20, ${editingUser.roleRef.color}40)`
                        : 'var(--muted)',
                      color: editingUser.roleRef?.color || 'var(--muted-foreground)'
                    }}
                  >
                    {getInitials(editingUser.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Naam</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">E-mail</Label>
                <Input 
                  value={editingUser.email} 
                  disabled 
                  className="h-11 rounded-xl bg-muted" 
                />
                <p className="text-xs text-muted-foreground">
                  E-mailadres kan niet worden gewijzigd.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Specialisatie</Label>
                <Select
                  value={editingUser.engineerType || "_none"}
                  onValueChange={(v) => setEditingUser({ 
                    ...editingUser, 
                    engineerType: v === "_none" ? null : v 
                  })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Niet van toepassing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Niet van toepassing</SelectItem>
                    <SelectItem value="rekenaar">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-blue-500" />
                        Rekenaar
                      </div>
                    </SelectItem>
                    <SelectItem value="tekenaar">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-violet-500" />
                        Tekenaar
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} className="rounded-xl">
              Annuleren
            </Button>
            <Button onClick={handleSaveUser} disabled={isPending} className="rounded-xl">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{deletingUser?.name}</strong> wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
