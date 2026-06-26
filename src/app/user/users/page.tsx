"use client";

import * as React from "react";
import {
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  Mail,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  RefreshCw,
  Filter,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  DropdownMenuSeparator,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApi, useMutation } from "@/hooks/use-api";
import { usersApi } from "@/lib/api";
import type { User, UserCreate } from "@/lib/types";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWritePermission } from "@/hooks/use-write-permission";
import { useApiAuth } from "@/hooks/use-api-auth";


// Helper to get full name
function getFullName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
}

// Helper to get initials
function getInitials(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.username.substring(0, 2).toUpperCase();
}

// Helper to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const PROTECTED_ADMIN_EMAIL = "admin@qriscorp.com";

function isProtectedUser(user: User): boolean {
  return user.email === PROTECTED_ADMIN_EMAIL;
}

export default function UsersPage() {
  const { accessToken, isReady } = useApiAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null);
  const [editUser, setEditUser] = React.useState<User | null>(null);
  const [createRole, setCreateRole] = React.useState<User["role"]>("user");
  const [editRole, setEditRole] = React.useState<User["role"]>("user");
  const [viewUser, setViewUser] = React.useState<User | null>(null);
  const { canWrite, writeDisabled, writeTooltip, requireWrite } = useWritePermission("users");

  React.useEffect(() => {
    if (editUser) {
      setEditRole(editUser.role || "user");
    }
  }, [editUser]);

  // Fetch users from API
  const { data: usersData, isLoading, error, refetch } = useApi(
    () => {
      if (!accessToken) {
        throw new Error("No access token available");
      }
      return usersApi.list({ page, page_size: pageSize });
    },
    [page, pageSize, accessToken],
    { cacheKey: `users-${page}`, enabled: isReady }
  );

  const users = usersData?.data || [];
  const totalPages = usersData?.total_pages || 1;
  const totalItems = usersData?.total || 0;

  const handleWriteError = (err: any): boolean => {
    if (err?.status === 403 || /write access|explicit grant|super admin/i.test(err?.message || "")) {
      toast.error("Write access required", {
        description: "This action requires write access granted by a super admin.",
      });
      return true;
    }
    return false;
  };

  // Create user mutation
  const createUser = useMutation(
    (data: UserCreate) => usersApi.create(data),
    {
      onSuccess: () => {
        toast.success("User created successfully!");
        setIsAddOpen(false);
        refetch();
      },
      onError: (err) => {
        if (!handleWriteError(err)) {
          console.error("Create user error:", err);
          toast.error("Failed to create user");
        }
      },
    }
  );

  // Update user mutation (for toggling active status)
  const updateUser = useMutation(
    ({ id, data }: { id: string; data: Partial<User> }) => usersApi.update(id, data),
    {
      onSuccess: () => {
        toast.success("User updated successfully!");
        refetch();
      },
      onError: (err) => {
        if (!handleWriteError(err)) {
          console.error("Update user error:", err);
          toast.error("Failed to update user");
        }
      },
    }
  );

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (id: string) => usersApi.delete(id),
    {
      onSuccess: () => {
        toast.success("User deleted successfully!");
        setDeleteUser(null);
        refetch();
      },
      onError: (err) => {
        if (!handleWriteError(err)) {
          console.error("Delete user error:", err);
          toast.error("Failed to delete user");
        }
      },
    }
  );

  // Filter users by search query and filters (client-side)
  const filteredUsers = React.useMemo(() => {
    let result = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        getFullName(u).toLowerCase().includes(query) ||
        u.phone_number?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => 
        statusFilter === "active" ? u.is_active : !u.is_active
      );
    }

    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!requireWrite()) return;
    const formData = new FormData(e.currentTarget);
    const role = (formData.get("role") as User["role"]) || createRole;
    createUser.mutate({
      agent_id: formData.get("agent_id") as string,
      first_name: formData.get("fname") as string,
      last_name: formData.get("lname") as string,
      email: formData.get("u_email") as string,
      username: formData.get("username") as string,
      phone_number: formData.get("phone") as string,
      password: formData.get("password") as string,
      is_admin: role === "super_admin",
      is_active: formData.get("is_active") === "on",
      role,
    });
  };

  const handleToggleActive = (user: User) => {
    if (!requireWrite()) return;
    updateUser.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    });
  };

  const handleToggleAdmin = (user: User) => {
    if (!requireWrite()) return;
    const isNowAdmin = user.role !== "super_admin";
    updateUser.mutate({
      id: user.id,
      data: { is_admin: isNowAdmin, role: isNowAdmin ? "super_admin" : "user" },
    });
  };

  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!requireWrite() || !editUser) return;
    const formData = new FormData(e.currentTarget);
    updateUser.mutate({
      id: editUser.id,
      data: {
        first_name: formData.get("fname") as string,
        last_name: formData.get("lname") as string,
        email: formData.get("u_email") as string,
        phone_number: formData.get("phone") as string,
        is_admin: editRole === "super_admin",
        role: editRole,
        is_active: formData.get("is_active") === "on",
      },
    });
    setEditUser(null);
  };

  const handleDeleteUser = () => {
    if (!requireWrite() || !deleteUser) return;
    deleteUserMutation.mutate(deleteUser.id);
  };

  return (
    <div className="space-y-6">
      {!canWrite && <WriteAccessAlert tabLabel="user administration" />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
          <p className="text-muted-foreground">Manage administrative access and system roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={canWrite && isAddOpen} onOpenChange={(open) => {
            if (!canWrite) return;
            setIsAddOpen(open);
            if (open) setCreateRole("user");
          }}>
            <DialogTrigger asChild>
              <Button
                className={writeDisabled ? "bg-[#004B91]/70 hover:bg-[#003B71]/70" : "bg-[#004B91] hover:bg-[#003B71]"}
                aria-disabled={writeDisabled}
                title={writeTooltip}
                onClick={() => {
                  if (!canWrite) {
                    toast.error("View-only access", {
                      description: "Creating users requires write access granted by a super admin.",
                    });
                  }
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            {canWrite && (
              <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>
                  Assign a system role to a new team member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fname">First Name</Label>
                    <Input id="fname" name="fname" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lname">Last Name</Label>
                    <Input id="lname" name="lname" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder="john_doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent_id">Agent ID</Label>
                  <Input id="agent_id" name="agent_id" placeholder="3ISO0001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="u_email">Email Address</Label>
                  <Input id="u_email" name="u_email" type="email" placeholder="john@interswitch.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+256700123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={createRole} onValueChange={(value) => setCreateRole(value as User["role"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" name="is_active" defaultChecked />
                  <Label htmlFor="is_active">Active Account</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUser.isLoading || writeDisabled}>
                    {createUser.isLoading ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
            )}
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, username, or phone..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <Shield className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#004B91] text-white text-[10px]">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{getFullName(user)}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.phone_number || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "border-none",
                      user.role === "super_admin"
                        ? "bg-[#004B91] text-white hover:bg-[#004B91]"
                        : user.role === "user"
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                    )}>
                      {user.role === "super_admin" ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Super Admin
                        </>
                      ) : user.role === "user" ? (
                        "User"
                      ) : user.role === "agent" ? (
                        "Agent"
                      ) : (
                        user.is_admin ? "Admin" : "Staff"
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "border-none",
                      user.is_active 
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                    )}>
                      {user.is_active ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isProtectedUser(user) ? (
                          <DropdownMenuItem onClick={() => setViewUser(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(user)}
                              disabled={writeDisabled}
                              title={writeTooltip}
                            >
                              {user.is_active ? (
                                <><XCircle className="w-4 h-4 mr-2" />Deactivate</>
                              ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleAdmin(user)}
                              disabled={writeDisabled}
                              title={writeTooltip}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {user.role === "super_admin" ? "Remove Super Admin" : "Make Super Admin"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setEditUser(user)}
                              disabled={writeDisabled}
                              title={writeTooltip}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteUser(user)}
                              disabled={writeDisabled}
                              title={writeTooltip}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && filteredUsers.length > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Edit User Dialog */}
      <Dialog open={canWrite && !!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the details and permissions for {editUser ? getFullName(editUser) : "this user"}.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <form onSubmit={handleEditUser} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_fname">First Name</Label>
                  <Input id="edit_fname" name="fname" defaultValue={editUser.first_name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_lname">Last Name</Label>
                  <Input id="edit_lname" name="lname" defaultValue={editUser.last_name} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email Address</Label>
                <Input id="edit_email" name="u_email" type="email" defaultValue={editUser.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone Number</Label>
                <Input id="edit_phone" name="phone" type="tel" defaultValue={editUser.phone_number} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as User["role"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit_is_active" name="is_active" defaultChecked={editUser.is_active} />
                <Label htmlFor="edit_is_active">Active Account</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUser.isLoading || writeDisabled}>
                  {updateUser.isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Viewing details for {viewUser ? getFullName(viewUser) : "this user"}.
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[#004B91] text-white text-sm">
                    {getInitials(viewUser)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getFullName(viewUser)}</p>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-medium">{viewUser.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Agent ID</p>
                  <p className="font-medium">{viewUser.agent_id || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewUser.phone_number || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(viewUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge className={cn(
                    "border-none mt-1",
                    viewUser.role === "super_admin"
                      ? "bg-[#004B91] text-white hover:bg-[#004B91]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                  )}>
                    {viewUser.role === "super_admin" ? "Super Admin" : viewUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={cn(
                    "border-none mt-1",
                    viewUser.is_active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                  )}>
                    {viewUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setViewUser(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteUser ? getFullName(deleteUser) : "this user"}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
