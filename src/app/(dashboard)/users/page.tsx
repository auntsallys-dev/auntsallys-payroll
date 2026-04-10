"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Loader2,
  UserCog,
  X,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

const roleBadge: Record<string, { label: string; variant: "danger" | "info" | "warning" | "success" }> = {
  admin: { label: "Admin", variant: "danger" },
  hr: { label: "HR", variant: "info" },
  manager: { label: "Manager", variant: "warning" },
  employee: { label: "Employee", variant: "success" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("employee");
  const [formEmployeeId, setFormEmployeeId] = useState("none");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.data || json);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?limit=200");
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
      setEmployees(
        data.map((e: EmployeeOption) => ({
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          employeeId: e.employeeId,
        }))
      );
    } catch {
      // Silent fail for dropdown options
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, [fetchUsers, fetchEmployees]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormEmail("");
    setFormPassword("");
    setFormRole("employee");
    setFormEmployeeId("none");
    setShowModal(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormEmployeeId(user.employee?.id || "none");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingUser && (!formEmail || !formPassword)) {
      toast.error("Email and password are required");
      return;
    }
    if (editingUser && !formEmail) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        const body: Record<string, string> = { role: formRole };
        if (formPassword) body.password = formPassword;
        if (formEmployeeId !== "none") body.employeeId = formEmployeeId;

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update user");
        }
        toast.success("User updated successfully");
      } else {
        // Create new user
        const body: Record<string, string> = {
          email: formEmail,
          password: formPassword,
          role: formRole,
        };
        if (formEmployeeId !== "none") body.employeeId = formEmployeeId;

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create user");
        }
        toast.success("User created successfully");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Operation failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: UserRecord) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update user status");
      toast.success(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchUsers();
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const resetPassword = async (user: UserRecord) => {
    if (!confirm(`Reset password for ${user.email}? The new password will be "password123".`)) {
      return;
    }
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password123" }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      toast.success("Password reset successfully");
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No users found</p>
                    <Button size="sm" className="mt-3" onClick={openCreateModal}>
                      <Plus className="h-4 w-4" />
                      Add First User
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const role = roleBadge[user.role] || roleBadge.employee;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.employee
                              ? `${user.employee.firstName} ${user.employee.lastName}`
                              : "--"}
                          </p>
                          {user.employee && (
                            <p className="text-xs text-gray-500">
                              {user.employee.employeeId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={role.variant}>{role.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.isActive ? "success" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(user.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Edit User"
                            onClick={() => openEditModal(user)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title={user.isActive ? "Deactivate" : "Activate"}
                            onClick={() => toggleActive(user)}
                            disabled={actionLoading === user.id}
                            className={`rounded p-1.5 ${
                              user.isActive
                                ? "text-yellow-500 hover:bg-yellow-50 hover:text-yellow-700"
                                : "text-green-500 hover:bg-green-50 hover:text-green-700"
                            } disabled:opacity-50`}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            title="Reset Password"
                            onClick={() => resetPassword(user)}
                            disabled={actionLoading === user.id}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-sm p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="user@company.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editingUser}
              />
              <Input
                label={editingUser ? "New Password (leave blank to keep)" : "Password"}
                type="password"
                placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Link to Employee
                </label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Employee Link</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.lastName}, {emp.firstName} ({emp.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
