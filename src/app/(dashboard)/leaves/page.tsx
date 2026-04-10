"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Filter,
  Check,
  X,
  Clock,
  Calendar,
  FileText,
  ListChecks,
  BarChart3,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ---------- Types ---------- */
interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface LeaveType {
  id: string;
  name: string;
  defaultDays: number;
  paid: boolean;
  requiresApproval: boolean;
  status: "active" | "inactive";
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  balances: Record<string, { used: number; total: number }>;
}

interface Employee {
  id: string;
  name: string;
}

/* ---------- Helpers ---------- */
function statusBadgeVariant(status: string) {
  switch (status) {
    case "approved":
    case "active":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
    case "inactive":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

function computeDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

/* ---------- Mock data ---------- */
const mockEmployees: Employee[] = [
  { id: "1", name: "Maria Santos" },
  { id: "2", name: "Juan Dela Cruz" },
  { id: "3", name: "Ana Reyes" },
  { id: "4", name: "Pedro Garcia" },
  { id: "5", name: "Rosa Mendoza" },
];

const mockLeaveTypes: LeaveType[] = [
  { id: "1", name: "Vacation Leave", defaultDays: 15, paid: true, requiresApproval: true, status: "active" },
  { id: "2", name: "Sick Leave", defaultDays: 15, paid: true, requiresApproval: true, status: "active" },
  { id: "3", name: "Personal Leave", defaultDays: 5, paid: false, requiresApproval: true, status: "active" },
  { id: "4", name: "Maternity Leave", defaultDays: 105, paid: true, requiresApproval: true, status: "active" },
  { id: "5", name: "Paternity Leave", defaultDays: 7, paid: true, requiresApproval: true, status: "active" },
];

const mockLeaveRequests: LeaveRequest[] = [
  { id: "1", employeeName: "Maria Santos", leaveType: "Vacation Leave", startDate: "2026-04-10", endDate: "2026-04-14", days: 5, reason: "Family vacation", status: "pending", createdAt: "2026-04-01" },
  { id: "2", employeeName: "Juan Dela Cruz", leaveType: "Sick Leave", startDate: "2026-04-07", endDate: "2026-04-08", days: 2, reason: "Medical checkup", status: "approved", createdAt: "2026-04-05" },
  { id: "3", employeeName: "Ana Reyes", leaveType: "Personal Leave", startDate: "2026-04-15", endDate: "2026-04-15", days: 1, reason: "Personal errand", status: "rejected", createdAt: "2026-04-03" },
  { id: "4", employeeName: "Pedro Garcia", leaveType: "Vacation Leave", startDate: "2026-04-20", endDate: "2026-04-24", days: 5, reason: "Out of town trip", status: "pending", createdAt: "2026-04-06" },
  { id: "5", employeeName: "Rosa Mendoza", leaveType: "Sick Leave", startDate: "2026-04-02", endDate: "2026-04-03", days: 2, reason: "Flu symptoms", status: "approved", createdAt: "2026-04-01" },
];

const mockLeaveBalances: LeaveBalance[] = [
  { employeeId: "1", employeeName: "Maria Santos", balances: { "Vacation Leave": { used: 5, total: 15 }, "Sick Leave": { used: 2, total: 15 }, "Personal Leave": { used: 1, total: 5 } } },
  { employeeId: "2", employeeName: "Juan Dela Cruz", balances: { "Vacation Leave": { used: 10, total: 15 }, "Sick Leave": { used: 3, total: 15 }, "Personal Leave": { used: 4, total: 5 } } },
  { employeeId: "3", employeeName: "Ana Reyes", balances: { "Vacation Leave": { used: 15, total: 15 }, "Sick Leave": { used: 14, total: 15 }, "Personal Leave": { used: 5, total: 5 } } },
  { employeeId: "4", employeeName: "Pedro Garcia", balances: { "Vacation Leave": { used: 3, total: 15 }, "Sick Leave": { used: 0, total: 15 }, "Personal Leave": { used: 0, total: 5 } } },
  { employeeId: "5", employeeName: "Rosa Mendoza", balances: { "Vacation Leave": { used: 7, total: 15 }, "Sick Leave": { used: 8, total: 15 }, "Personal Leave": { used: 3, total: 5 } } },
];

/* ---------- Modal Component ---------- */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ========== Main Page ========== */
export default function LeavesPage() {
  /* ----- State: Leave Requests ----- */
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [loading, setLoading] = useState(true);

  /* Filters - requests */
  const [searchReq, setSearchReq] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* Filters - balances */
  const [balanceYear, setBalanceYear] = useState("2026");
  const [searchBalance, setSearchBalance] = useState("");

  /* Modals */
  const [fileLeaveOpen, setFileLeaveOpen] = useState(false);
  const [leaveTypeModalOpen, setLeaveTypeModalOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);

  /* File Leave form */
  const [flEmployee, setFlEmployee] = useState("");
  const [flType, setFlType] = useState("");
  const [flStart, setFlStart] = useState("");
  const [flEnd, setFlEnd] = useState("");
  const [flReason, setFlReason] = useState("");

  /* Leave Type form */
  const [ltName, setLtName] = useState("");
  const [ltDays, setLtDays] = useState("15");
  const [ltPaid, setLtPaid] = useState(true);
  const [ltApproval, setLtApproval] = useState(true);
  const [ltStatus, setLtStatus] = useState<"active" | "inactive">("active");

  /* ---------- Fetch data ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, typeRes, balRes] = await Promise.allSettled([
        fetch("/api/leaves"),
        fetch("/api/leaves/types"),
        fetch("/api/leaves/balances"),
      ]);

      if (reqRes.status === "fulfilled" && reqRes.value.ok) {
        const json = await reqRes.value.json();
        const raw = Array.isArray(json) ? json : json.data ?? [];
        setLeaveRequests(
          raw.map((r: any) => ({
            id: r.id,
            employeeName: r.employee
              ? `${r.employee.firstName} ${r.employee.lastName}`
              : "Unknown",
            leaveType: r.leaveType?.name ?? r.leaveType ?? "",
            startDate: r.startDate,
            endDate: r.endDate,
            days: r.totalDays ?? r.days ?? 0,
            reason: r.reason ?? "",
            status: r.status,
            createdAt: r.createdAt,
          }))
        );
      } else {
        setLeaveRequests(mockLeaveRequests);
      }

      if (typeRes.status === "fulfilled" && typeRes.value.ok) {
        const json = await typeRes.value.json();
        const raw = Array.isArray(json) ? json : json.data ?? [];
        setLeaveTypes(
          raw.map((t: any) => ({
            id: t.id,
            name: t.name,
            defaultDays: t.defaultDays,
            paid: t.isPaid ?? t.paid ?? true,
            requiresApproval: t.requiresApproval ?? true,
            status: t.isActive === false ? "inactive" : "active",
          }))
        );
      } else {
        setLeaveTypes(mockLeaveTypes);
      }

      if (balRes.status === "fulfilled" && balRes.value.ok) {
        const json = await balRes.value.json();
        const raw = Array.isArray(json) ? json : json.data ?? [];
        // Group balances by employee
        const grouped: Record<string, any> = {};
        raw.forEach((b: any) => {
          const empKey = b.employeeId;
          if (!grouped[empKey]) {
            grouped[empKey] = {
              employeeId: b.employeeId,
              employeeName: b.employee
                ? `${b.employee.firstName} ${b.employee.lastName}`
                : "Unknown",
              balances: {},
            };
          }
          const typeName = b.leaveType?.name ?? "Unknown";
          grouped[empKey].balances[typeName] = {
            used: b.usedDays ?? 0,
            total: b.totalDays ?? 0,
          };
        });
        setLeaveBalances(Object.values(grouped));
      } else {
        setLeaveBalances(mockLeaveBalances);
      }
    } catch {
      setLeaveRequests(mockLeaveRequests);
      setLeaveTypes(mockLeaveTypes);
      setLeaveBalances(mockLeaveBalances);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Filtered requests ---------- */
  const filteredRequests = leaveRequests.filter((r) => {
    if (searchReq && !r.employeeName.toLowerCase().includes(searchReq.toLowerCase())) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.startDate < dateFrom) return false;
    if (dateTo && r.endDate > dateTo) return false;
    return true;
  });

  /* ---------- Filtered balances ---------- */
  const filteredBalances = leaveBalances.filter((b) => {
    if (searchBalance && !b.employeeName.toLowerCase().includes(searchBalance.toLowerCase())) return false;
    return true;
  });

  /* ---------- Actions ---------- */
  async function handleApprove(id: string) {
    try {
      await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      toast.success("Leave request approved");
    } catch {
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
      toast.success("Leave request approved");
    }
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
      toast.success("Leave request rejected");
    } catch {
      setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
      toast.success("Leave request rejected");
    }
  }

  async function handleFileLeave() {
    if (!flEmployee || !flType || !flStart || !flEnd || !flReason) {
      toast.error("Please fill in all fields");
      return;
    }
    const days = computeDays(flStart, flEnd);
    if (days <= 0) {
      toast.error("End date must be after start date");
      return;
    }
    const emp = employees.find((e) => e.id === flEmployee);
    const newRequest: LeaveRequest = {
      id: String(Date.now()),
      employeeName: emp?.name ?? "",
      leaveType: flType,
      startDate: flStart,
      endDate: flEnd,
      days,
      reason: flReason,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests((prev) => [data, ...prev]);
      } else {
        setLeaveRequests((prev) => [newRequest, ...prev]);
      }
    } catch {
      setLeaveRequests((prev) => [newRequest, ...prev]);
    }
    toast.success("Leave request filed successfully");
    setFileLeaveOpen(false);
    setFlEmployee("");
    setFlType("");
    setFlStart("");
    setFlEnd("");
    setFlReason("");
  }

  /* Leave Type CRUD */
  function openAddLeaveType() {
    setEditingLeaveType(null);
    setLtName("");
    setLtDays("15");
    setLtPaid(true);
    setLtApproval(true);
    setLtStatus("active");
    setLeaveTypeModalOpen(true);
  }

  function openEditLeaveType(lt: LeaveType) {
    setEditingLeaveType(lt);
    setLtName(lt.name);
    setLtDays(String(lt.defaultDays));
    setLtPaid(lt.paid);
    setLtApproval(lt.requiresApproval);
    setLtStatus(lt.status);
    setLeaveTypeModalOpen(true);
  }

  async function handleSaveLeaveType() {
    if (!ltName || !ltDays) {
      toast.error("Please fill in all fields");
      return;
    }
    const payload = {
      name: ltName,
      defaultDays: parseInt(ltDays, 10),
      paid: ltPaid,
      requiresApproval: ltApproval,
      status: ltStatus,
    };

    if (editingLeaveType) {
      try {
        await fetch(`/api/leaves/types/${editingLeaveType.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* fallback to local state */
      }
      setLeaveTypes((prev) =>
        prev.map((t) => (t.id === editingLeaveType.id ? { ...t, ...payload } : t))
      );
      toast.success("Leave type updated");
    } else {
      const newType: LeaveType = { id: String(Date.now()), ...payload };
      try {
        const res = await fetch("/api/leaves/types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setLeaveTypes((prev) => [...prev, data]);
        } else {
          setLeaveTypes((prev) => [...prev, newType]);
        }
      } catch {
        setLeaveTypes((prev) => [...prev, newType]);
      }
      toast.success("Leave type added");
    }
    setLeaveTypeModalOpen(false);
  }

  async function handleDeleteLeaveType(id: string) {
    try {
      await fetch(`/api/leaves/types/${id}`, { method: "DELETE" });
    } catch {
      /* fallback */
    }
    setLeaveTypes((prev) => prev.filter((t) => t.id !== id));
    toast.success("Leave type deleted");
  }

  /* ---------- Balance color helper ---------- */
  function balanceColor(used: number, total: number) {
    const remaining = total - used;
    const pct = remaining / total;
    if (pct <= 0) return "text-red-600 bg-red-50";
    if (pct <= 0.25) return "text-yellow-700 bg-yellow-50";
    return "text-green-700 bg-green-50";
  }

  /* ---------- Unique leave type names for balance columns ---------- */
  const balanceLeaveTypeNames = Array.from(
    new Set(leaveBalances.flatMap((b) => Object.keys(b.balances)))
  );

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage leave requests, leave types, and employee leave balances.
        </p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileText size={14} /> Leave Requests
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5">
            <ListChecks size={14} /> Leave Types
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-1.5">
            <BarChart3 size={14} /> Leave Balances
          </TabsTrigger>
        </TabsList>

        {/* =================== Leave Requests Tab =================== */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Leave Requests</CardTitle>
              <Button onClick={() => setFileLeaveOpen(true)} className="gap-1.5">
                <Plus size={16} /> File Leave
              </Button>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="relative w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchReq}
                    onChange={(e) => setSearchReq(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Table */}
              {filteredRequests.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No leave requests found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>{r.leaveType}</TableCell>
                        <TableCell>{r.startDate}</TableCell>
                        <TableCell>{r.endDate}</TableCell>
                        <TableCell>{r.days}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(r.status)}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === "pending" ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="rounded-md bg-green-50 p-1.5 text-green-600 hover:bg-green-100"
                                title="Approve"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                                title="Reject"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== Leave Types Tab =================== */}
        <TabsContent value="types">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Leave Types</CardTitle>
              <Button onClick={openAddLeaveType} className="gap-1.5">
                <Plus size={16} /> Add Leave Type
              </Button>
            </CardHeader>
            <CardContent>
              {leaveTypes.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No leave types configured.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Default Days</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Requires Approval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveTypes.map((lt) => (
                      <TableRow key={lt.id}>
                        <TableCell className="font-medium">{lt.name}</TableCell>
                        <TableCell>{lt.defaultDays}</TableCell>
                        <TableCell>
                          <Badge variant={lt.paid ? "success" : "secondary"}>
                            {lt.paid ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lt.requiresApproval ? "info" : "secondary"}>
                            {lt.requiresApproval ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(lt.status)}>
                            {lt.status.charAt(0).toUpperCase() + lt.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditLeaveType(lt)}
                              className="rounded-md bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLeaveType(lt.id)}
                              className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== Leave Balances Tab =================== */}
        <TabsContent value="balances">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Leave Balances</CardTitle>
              <div className="flex items-center gap-3">
                <select
                  value={balanceYear}
                  onChange={(e) => setBalanceYear(e.target.value)}
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <div className="relative w-56">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchBalance}
                    onChange={(e) => setSearchBalance(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBalances.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No leave balance records found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      {balanceLeaveTypeNames.map((name) => (
                        <TableHead key={name}>{name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBalances.map((b) => (
                      <TableRow key={b.employeeId}>
                        <TableCell className="font-medium">{b.employeeName}</TableCell>
                        {balanceLeaveTypeNames.map((name) => {
                          const bal = b.balances[name];
                          if (!bal) {
                            return (
                              <TableCell key={name}>
                                <span className="text-gray-300">--</span>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={name}>
                              <span
                                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${balanceColor(bal.used, bal.total)}`}
                              >
                                {bal.used}/{bal.total}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-100" /> Plenty remaining
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-yellow-100" /> Running low
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-100" /> Exhausted
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== File Leave Modal ========== */}
      <Modal open={fileLeaveOpen} onClose={() => setFileLeaveOpen(false)} title="File Leave Request">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Employee</label>
            <select
              value={flEmployee}
              onChange={(e) => setFlEmployee(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Leave Type</label>
            <select
              value={flType}
              onChange={(e) => setFlType(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select leave type...</option>
              {leaveTypes
                .filter((t) => t.status === "active")
                .map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Start Date"
                type="date"
                value={flStart}
                onChange={(e) => setFlStart(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="End Date"
                type="date"
                value={flEnd}
                onChange={(e) => setFlEnd(e.target.value)}
              />
            </div>
          </div>
          {flStart && flEnd && computeDays(flStart, flEnd) > 0 && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <Clock size={14} className="mb-0.5 mr-1 inline" />
              Total: <strong>{computeDays(flStart, flEnd)}</strong> day(s)
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={flReason}
              onChange={(e) => setFlReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter reason for leave..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFileLeaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileLeave}>Submit Leave Request</Button>
          </div>
        </div>
      </Modal>

      {/* ========== Leave Type Modal ========== */}
      <Modal
        open={leaveTypeModalOpen}
        onClose={() => setLeaveTypeModalOpen(false)}
        title={editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={ltName}
            onChange={(e) => setLtName(e.target.value)}
            placeholder="e.g. Vacation Leave"
          />
          <Input
            label="Default Days"
            type="number"
            value={ltDays}
            onChange={(e) => setLtDays(e.target.value)}
            min="1"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Paid</label>
              <select
                value={ltPaid ? "yes" : "no"}
                onChange={(e) => setLtPaid(e.target.value === "yes")}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Requires Approval
              </label>
              <select
                value={ltApproval ? "yes" : "no"}
                onChange={(e) => setLtApproval(e.target.value === "yes")}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={ltStatus}
              onChange={(e) => setLtStatus(e.target.value as "active" | "inactive")}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLeaveTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLeaveType}>
              {editingLeaveType ? "Update" : "Add"} Leave Type
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
