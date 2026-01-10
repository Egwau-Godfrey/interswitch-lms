"use client";

import * as React from "react";
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  UserCog, 
  Mail, 
  Phone,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const initialUsers = [
  { id: "1", username: "admin_jake", email: "jake@interswitch.com", role: "Admin", status: "active", name: "Jake Adams" },
  { id: "2", username: "staff_mary", email: "mary@interswitch.com", role: "Staff", status: "active", name: "Mary Obi" },
  { id: "3", username: "manager_sam", email: "sam@interswitch.com", role: "Admin", status: "inactive", name: "Sam Chen" },
];

export default function UsersPage() {
  const [users, setUsers] = React.useState(initialUsers);
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
          <p className="text-muted-foreground">Manage administrative access and system roles.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#004B91] hover:bg-[#003B71]">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Assign administrative privileges to a new team member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input id="fname" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input id="lname" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="u_email">Email Address</Label>
                <Input id="u_email" type="email" placeholder="john@interswitch.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_admin" />
                  <Label htmlFor="is_admin">Super Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" defaultChecked />
                  <Label htmlFor="is_active">Active Account</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("User created successfully!"); setIsAddOpen(false); }}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#004B91] text-white text-[10px]">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                    {user.role === "Admin" && <Shield className="w-3 h-3 mr-1" />}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "border-none",
                    user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                  )}>
                    {user.status === "active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
