"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
            ? "Gebruiker kan direct inloggen met het opgegeven wachtwoord"
            : "Stuur een wachtwoord-reset email om de gebruiker toegang te geven"
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
          description: `${userName} ontvangt een email om het wachtwoord te resetten.`
        })
      } else {
        toast.error(result.error || "Kon reset email niet verzenden")
      }
    })
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
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
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
                Gebruikers
                <Badge variant="outline" className="ml-2">{users.length} actief</Badge>
              </CardTitle>
              <CardDescription>Beheer gebruikers en wijs rollen toe.</CardDescription>
            </div>
            <Button onClick={() => setIsAddUserOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nieuwe Gebruiker
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Geen gebruikers gevonden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gebruiker</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                          <AvatarFallback className="text-sm font-bold bg-primary/10">
                            {user.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.roleId || ""}
                        onValueChange={(v) => handleRoleChange(user.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>
                            {user.roleRef ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: user.roleRef.color }}
                                />
                                {user.roleRef.displayName}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Geen rol</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: role.color }}
                                />
                                {role.displayName}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.engineerType ? (
                        <Badge variant="outline" className="capitalize">
                          {user.engineerType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Nieuwe Gebruiker
            </DialogTitle>
            <DialogDescription>
              Maak een nieuwe gebruiker aan. Ze kunnen direct inloggen met het wachtwoord, 
              of later via een reset-email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Naam *</Label>
              <Input
                placeholder="Volledige naam"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                placeholder="naam@broersma-bouwadvies.nl"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={newUser.roleId}
                onValueChange={(v) => setNewUser({ ...newUser, roleId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer rol..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
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
              <Label>Engineer Type (optioneel)</Label>
              <Select
                value={newUser.engineerType || "_none"}
                onValueChange={(v) => setNewUser({ ...newUser, engineerType: v === "_none" ? "" : v as "rekenaar" | "tekenaar" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Niet van toepassing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Niet van toepassing</SelectItem>
                  <SelectItem value="rekenaar">Rekenaar</SelectItem>
                  <SelectItem value="tekenaar">Tekenaar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Wachtwoord (optioneel)</Label>
              <Input
                type="password"
                placeholder="Laat leeg voor reset-email"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Als je dit leeg laat, moet je handmatig een wachtwoord-reset sturen.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddUser} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker Bewerken</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={editingUser.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  E-mailadres kan niet worden gewijzigd.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Engineer Type</Label>
                <Select
                  value={editingUser.engineerType || "_none"}
                  onValueChange={(v) => setEditingUser({ 
                    ...editingUser, 
                    engineerType: v === "_none" ? null : v 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Niet van toepassing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Niet van toepassing</SelectItem>
                    <SelectItem value="rekenaar">Rekenaar</SelectItem>
                    <SelectItem value="tekenaar">Tekenaar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveUser} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gebruiker Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>{deletingUser?.name}</strong> wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
