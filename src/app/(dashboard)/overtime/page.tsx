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
  Timer,
  Loader2,
  Users,
  User,
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
interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
}

/* ---------- Helpers ---------- */
function statusBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

function computeHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const diff = endMin - startMin;
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

/* ---------- Mock data ---------- */
const mockEmployees: Employee[] = [
  { id: "1", name: "Maria Santos" },
  { id: "2", name: "Juan Dela Cruz" },
  { id: "3", name: "Ana Reyes" },
  { id: "4", name: "Pedro Garcia" },
  { id: "5", name: "Rosa Mendoza" },
];

const mockOvertimeRequests: OvertimeRequest[] = [
  { id: "1", employeeId: "1", employeeName: "Maria Santos", date: "2026-04-07", startTime: "18:00", endTime: "21:00", totalHours: 3, reason: "Quarter-end reporting", status: "approved", createdAt: "2026-04-06" },
  { id: "2", employeeId: "2", employeeName: "Juan Dela Cruz", date: "2026-04-08", startTime: "17:00", endTime: "20:00", totalHours: 3, reason: "System deployment", status: "pending", createdAt: "2026-04-07" },
  { id: "3", employeeId: "3", employeeName: "Ana Reyes", date: "2026-04-06", startTime: "18:00", endTime: "22:00", totalHours: 4, reason: "Client deadline", status: "approved", createdAt: "2026-04-05" },
  { id: "4", employeeId: "4", employeeName: "Pedro Garcia", date: "2026-04-09", startTime: "17:30", endTime: "19:30", totalHours: 2, reason: "Inventory count", status: "pending", createdAt: "2026-04-08" },
  { id: "5", employeeId: "5", employeeName: "Rosa Mendoza", date: "2026-04-05", startTime: "18:00", endTime: "20:00", totalHours: 2, reason: "Training preparation", status: "rejected", createdAt: "2026-04-04" },
];

const CURRENT_USER_ID = "1";

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
export default function OvertimePage() {
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* Modal */
  const [fileOtOpen, setFileOtOpen] = useState(false);

  /* File OT form */
  const [otEmployee, setOtEmployee] = useState("");
  const [otDate, setOtDate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otEnd, setOtEnd] = useState("");
  const [otReason, setOtReason] = useState("");

  /* ---------- Fetch data ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overtime");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data ?? [];
        setOvertimeRequests(
          items.map((r: Record<string, unknown>) => ({
            ...r,
            employeeName:
              r.employeeName ||
              ((r.employee as Record<string, string> | undefined)
                ? `${(r.employee as Record<string, string>).firstName} ${(r.employee as Record<string, string>).lastName}`
                : "Unknown"),
          }))
        );
      } else {
        setOvertimeRequests(mockOvertimeRequests);
      }
    } catch {
      setOvertimeRequests(mockOvertimeRequests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Filtered data ---------- */
  function filterRequests(requests: OvertimeRequest[]) {
    return requests.filter((r) => {
      if (searchQuery && !r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }

  const allFiltered = filterRequests(overtimeRequests);
  const myFiltered = filterRequests(
    overtimeRequests.filter((r) => r.employeeId === CURRENT_USER_ID)
  );

  /* ---------- Actions ---------- */
  async function handleApprove(id: string) {
    try {
      await fetch(`/api/overtime/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
    } catch {
      /* fallback */
    }
    setOvertimeRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    toast.success("Overtime request approved");
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/overtime/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    } catch {
      /* fallback */
    }
    setOvertimeRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    toast.success("Overtime request rejected");
  }

  async function handleFileOvertime() {
    if (!otEmployee || !otDate || !otStart || !otEnd || !otReason) {
      toast.error("Please fill in all fields");
      return;
    }
    const hours = computeHours(otStart, otEnd);
    if (hours <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    const emp = employees.find((e) => e.id === otEmployee);
    const newRequest: OvertimeRequest = {
      id: String(Date.now()),
      employeeId: otEmployee,
      employeeName: emp?.name ?? "",
      date: otDate,
      startTime: otStart,
      endTime: otEnd,
      totalHours: hours,
      reason: otReason,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (res.ok) {
        const data = await res.json();
        setOvertimeRequests((prev) => [data, ...prev]);
      } else {
        setOvertimeRequests((prev) => [newRequest, ...prev]);
      }
    } catch {
      setOvertimeRequests((prev) => [newRequest, ...prev]);
    }
    toast.success("Overtime request filed successfully");
    setFileOtOpen(false);
    setOtEmployee("");
    setOtDate("");
    setOtStart("");
    setOtEnd("");
    setOtReason("");
  }

  /* ---------- Render table ---------- */
  function renderTable(data: OvertimeRequest[], isAdmin: boolean) {
    if (data.length === 0) {
      return (
        <div className="flex h-32 items-center justify-center text-sm text-gray-400">
          No overtime requests found.
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.employeeName}</TableCell>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.startTime}</TableCell>
              <TableCell>{r.endTime}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <Clock size={12} />
                  {r.totalHours}h
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(r.status)}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </Badge>
              </TableCell>
              {isAdmin && (
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
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  /* ---------- Main render ---------- */
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overtime Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            File, track, and manage overtime requests.
          </p>
        </div>
        <Button onClick={() => setFileOtOpen(true)} className="gap-1.5">
          <Plus size={16} /> File Overtime
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin" className="gap-1.5">
            <Users size={14} /> Overtime Requests
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-1.5">
            <User size={14} /> My Overtime
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer size={18} className="text-emerald-600" />
                All Overtime Requests
              </CardTitle>
            </CardHeader>
            <CardContent>{renderTable(allFiltered, true)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                My Overtime Requests
              </CardTitle>
            </CardHeader>
            <CardContent>{renderTable(myFiltered, false)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== File Overtime Modal ========== */}
      <Modal
        open={fileOtOpen}
        onClose={() => setFileOtOpen(false)}
        title="File Overtime Request"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Employee</label>
            <select
              value={otEmployee}
              onChange={(e) => setOtEmployee(e.target.value)}
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
          <Input
            label="Date"
            type="date"
            value={otDate}
            onChange={(e) => setOtDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={otStart}
              onChange={(e) => setOtStart(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={otEnd}
              onChange={(e) => setOtEnd(e.target.value)}
            />
          </div>
          {otStart && otEnd && computeHours(otStart, otEnd) > 0 && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <Clock size={14} className="mb-0.5 mr-1 inline" />
              Total: <strong>{computeHours(otStart, otEnd)}</strong> hour(s)
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={otReason}
              onChange={(e) => setOtReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter reason for overtime..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFileOtOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileOvertime}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
