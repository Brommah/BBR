"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { getUsers } from "@/lib/db-actions"
import { Plus, Loader2, UserPlus } from "lucide-react"

interface UserWithPermissions {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
    permissions: {
        canEditLeads: boolean
        canViewFinancials: boolean
        canManageUsers: boolean
    }
}

// Derive permissions from role
function getPermissionsFromRole(role: string) {
    switch (role.toLowerCase()) {
        case 'admin':
            return { canEditLeads: true, canViewFinancials: true, canManageUsers: true }
        case 'engineer':
            return { canEditLeads: true, canViewFinancials: false, canManageUsers: false }
        case 'viewer':
        default:
            return { canEditLeads: false, canViewFinancials: false, canManageUsers: false }
    }
}

function formatRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export function UserPermissionsTable() {
    const [users, setUsers] = useState<UserWithPermissions[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'engineer' })
    const [isSaving, setIsSaving] = useState(false)

    // Load users from database
    useEffect(() => {
        async function loadUsers() {
            setIsLoading(true)
            const result = await getUsers()
            if (result.success && result.data) {
                const data = result.data as Array<{ id: string; name: string; email: string; role: string; avatar?: string }>
                setUsers(data.map(u => ({
                    ...u,
                    permissions: getPermissionsFromRole(u.role)
                })))
            }
            setIsLoading(false)
        }
        loadUsers()
    }, [])

    const togglePermission = (userId: string, key: keyof UserWithPermissions['permissions']) => {
        // In a real implementation, this would update the database
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { 
                    ...u, 
                    permissions: { ...u.permissions, [key]: !u.permissions[key] } 
                }
            }
            return u
        }))
        toast.success("Rechten bijgewerkt")
    }

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Vul alle velden in")
            return
        }

        setIsSaving(true)
        
        // In production, this would create the user in both Supabase Auth and your DB
        // For now, we show a message that this requires manual setup
        toast.info("Nieuwe gebruikers moeten via Supabase Dashboard worden aangemaakt", {
            description: "Ga naar Authentication > Users in Supabase"
        })
        
        setIsSaving(false)
        setIsAddUserOpen(false)
        setNewUser({ name: '', email: '', role: 'engineer' })
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
                            <Skeleton key={i} className="h-12 w-full" />
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
                                Gebruikersrechten (RBAC)
                                <Badge variant="outline" className="ml-2">{users.length} gebruikers</Badge>
                            </CardTitle>
                            <CardDescription>Beheer toegangsniveaus per medewerker.</CardDescription>
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
                            <p className="text-xs mt-1">Voeg gebruikers toe via de database</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Naam</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead className="text-center">Edit Leads</TableHead>
                                    <TableHead className="text-center">View Financials</TableHead>
                                    <TableHead className="text-center">Manage Users</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                                    {user.name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    {user.name}
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                user.role.toLowerCase() === 'admin' ? 'default' : 
                                                user.role.toLowerCase() === 'engineer' ? 'secondary' : 'outline'
                                            }>
                                                {formatRole(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch 
                                                checked={user.permissions.canEditLeads}
                                                onCheckedChange={() => togglePermission(user.id, 'canEditLeads')}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch 
                                                checked={user.permissions.canViewFinancials}
                                                onCheckedChange={() => togglePermission(user.id, 'canViewFinancials')}
                                                disabled={user.role.toLowerCase() === 'admin'}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch 
                                                checked={user.permissions.canManageUsers}
                                                onCheckedChange={() => togglePermission(user.id, 'canManageUsers')}
                                                disabled={user.role.toLowerCase() === 'admin'}
                                            />
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
                        <DialogTitle>Nieuwe Gebruiker Toevoegen</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Naam</label>
                            <Input 
                                placeholder="Volledige naam"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-mail</label>
                            <Input 
                                type="email"
                                placeholder="naam@broersma-bouwadvies.nl"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rol</label>
                            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="engineer">Engineer</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                            <strong>Let op:</strong> De gebruiker moet ook in Supabase Authentication worden aangemaakt 
                            om in te kunnen loggen. Gebruik dezelfde e-mail in beide systemen.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={handleAddUser} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Toevoegen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
