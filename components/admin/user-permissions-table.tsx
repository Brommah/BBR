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
import { useState } from "react"

interface UserRole {
    id: string
    name: string
    email: string
    role: "Admin" | "Engineer" | "Viewer"
    permissions: {
        canEditLeads: boolean
        canViewFinancials: boolean
        canManageUsers: boolean
    }
}

const mockUsers: UserRole[] = [
    {
        id: "1",
        name: "Roina",
        email: "roina@broersma.nl",
        role: "Admin",
        permissions: { canEditLeads: true, canViewFinancials: true, canManageUsers: true }
    },
    {
        id: "2",
        name: "Angelo",
        email: "angelo@broersma.nl",
        role: "Engineer",
        permissions: { canEditLeads: true, canViewFinancials: false, canManageUsers: false }
    },
    {
        id: "3",
        name: "Venka",
        email: "venka@broersma.nl",
        role: "Engineer",
        permissions: { canEditLeads: true, canViewFinancials: false, canManageUsers: false }
    },
    {
        id: "4",
        name: "Stagiair",
        email: "intern@broersma.nl",
        role: "Viewer",
        permissions: { canEditLeads: false, canViewFinancials: false, canManageUsers: false }
    }
]

export function UserPermissionsTable() {
    const [users, setUsers] = useState<UserRole[]>(mockUsers)

    const togglePermission = (userId: string, key: keyof UserRole['permissions']) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                return { 
                    ...u, 
                    permissions: { ...u.permissions, [key]: !u.permissions[key] } 
                }
            }
            return u
        }))
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <CardTitle>Gebruikersrechten (RBAC)</CardTitle>
                        <CardDescription>Beheer toegangsniveaus per medewerker.</CardDescription>
                    </div>
                    <Button>Nieuwe Gebruiker</Button>
                </div>
            </CardHeader>
            <CardContent>
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
                                    {user.name}
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Engineer' ? 'secondary' : 'outline'}>
                                        {user.role}
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
                                        disabled={user.role === 'Admin'} // Admins always have access
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch 
                                        checked={user.permissions.canManageUsers}
                                        onCheckedChange={() => togglePermission(user.id, 'canManageUsers')}
                                        disabled={user.role === 'Admin'}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
