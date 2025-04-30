import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"

export default function SuperAdminUsersPage() {
  // Mock data for super admin users
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@electivepro.com",
      role: "Super Admin",
      lastActive: "2 hours ago",
      status: "active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@electivepro.com",
      role: "Super Admin",
      lastActive: "1 day ago",
      status: "active",
    },
    {
      id: 3,
      name: "Robert Johnson",
      email: "robert.johnson@electivepro.com",
      role: "Support Admin",
      lastActive: "3 days ago",
      status: "active",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@electivepro.com",
      role: "Support Admin",
      lastActive: "1 week ago",
      status: "inactive",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Users</h1>
        <p className="text-muted-foreground">Manage super admin and support users</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" />
        </div>
        <Button asChild>
          <Link href="/super-admin/users/invite">Invite User</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All System Users</CardTitle>
          <CardDescription>A list of all super admin and support users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Last Active</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-5 items-center px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm">{user.email}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === "Super Admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{user.lastActive}</div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/super-admin/users/${user.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/super-admin/users/${user.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
