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
  Briefcase,
  MapPin,
  Loader2,
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

/* ---------- Types ---------- */
interface OBRequest {
  id: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  destination: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
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

/* ---------- Mock data ---------- */
const mockOBRequests: OBRequest[] = [
  { id: "1", employeeName: "Maria Santos", date: "2026-04-08", startTime: "09:00", endTime: "12:00", destination: "BIR Main Office", purpose: "Tax filing and document submission", status: "approved", createdAt: "2026-04-06" },
  { id: "2", employeeName: "Juan Dela Cruz", date: "2026-04-09", startTime: "13:00", endTime: "17:00", destination: "Client Office - Makati", purpose: "Project presentation and requirements gathering", status: "pending", createdAt: "2026-04-07" },
  { id: "3", employeeName: "Ana Reyes", date: "2026-04-10", startTime: "10:00", endTime: "15:00", destination: "SSS Branch Office", purpose: "Employee benefits processing", status: "pending", createdAt: "2026-04-08" },
  { id: "4", employeeName: "Pedro Garcia", date: "2026-04-07", startTime: "08:00", endTime: "11:00", destination: "Warehouse - Pasig", purpose: "Inventory audit and reconciliation", status: "approved", createdAt: "2026-04-05" },
  { id: "5", employeeName: "Rosa Mendoza", date: "2026-04-06", startTime: "14:00", endTime: "17:00", destination: "PhilHealth Office", purpose: "Claims processing", status: "rejected", createdAt: "2026-04-04" },
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
export default function OfficialBusinessPage() {
  const [obRequests, setObRequests] = useState<OBRequest[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* Modal */
  const [fileOBOpen, setFileOBOpen] = useState(false);

  /* File OB form */
  const [obDate, setObDate] = useState("");
  const [obStart, setObStart] = useState("");
  const [obEnd, setObEnd] = useState("");
  const [obDestination, setObDestination] = useState("");
  const [obPurpose, setObPurpose] = useState("");

  /* ---------- Fetch data ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/official-business");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.data ?? [];
        setObRequests(
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
        setObRequests(mockOBRequests);
      }
    } catch {
      setObRequests(mockOBRequests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Filtered data ---------- */
  const filteredRequests = obRequests.filter((r) => {
    if (searchQuery && !r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.destination.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  /* ---------- Actions ---------- */
  async function handleApprove(id: string) {
    try {
      await fetch(`/api/official-business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
    } catch {
      /* fallback */
    }
    setObRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    toast.success("OB request approved");
  }

  async function handleReject(id: string) {
    try {
      await fetch(`/api/official-business/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
    } catch {
      /* fallback */
    }
    setObRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    toast.success("OB request rejected");
  }

  async function handleFileOB() {
    if (!obDate || !obStart || !obEnd || !obDestination || !obPurpose) {
      toast.error("Please fill in all fields");
      return;
    }

    const newRequest: OBRequest = {
      id: String(Date.now()),
      employeeName: "Current User",
      date: obDate,
      startTime: obStart,
      endTime: obEnd,
      destination: obDestination,
      purpose: obPurpose,
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const res = await fetch("/api/official-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (res.ok) {
        const data = await res.json();
        setObRequests((prev) => [data, ...prev]);
      } else {
        setObRequests((prev) => [newRequest, ...prev]);
      }
    } catch {
      setObRequests((prev) => [newRequest, ...prev]);
    }
    toast.success("OB request filed successfully");
    setFileOBOpen(false);
    setObDate("");
    setObStart("");
    setObEnd("");
    setObDestination("");
    setObPurpose("");
  }

  /* ---------- Stats ---------- */
  const pendingCount = obRequests.filter((r) => r.status === "pending").length;
  const approvedCount = obRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = obRequests.filter((r) => r.status === "rejected").length;

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
          <h1 className="text-2xl font-bold text-gray-900">Official Business</h1>
          <p className="mt-1 text-sm text-gray-500">
            File and manage official business requests.
          </p>
        </div>
        <Button onClick={() => setFileOBOpen(true)} className="gap-1.5">
          <Plus size={16} /> File OB
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Check size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-xl font-bold text-gray-900">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <X size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
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
            placeholder="Search employee or destination..."
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-600" />
            OB Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              No official business requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employeeName}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.startTime}</TableCell>
                    <TableCell>{r.endTime}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" />
                        {r.destination}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.purpose}</TableCell>
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

      {/* ========== File OB Modal ========== */}
      <Modal
        open={fileOBOpen}
        onClose={() => setFileOBOpen(false)}
        title="File Official Business"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={obDate}
            onChange={(e) => setObDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={obStart}
              onChange={(e) => setObStart(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={obEnd}
              onChange={(e) => setObEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Destination</label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={obDestination}
                onChange={(e) => setObDestination(e.target.value)}
                placeholder="Enter destination..."
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Purpose</label>
            <textarea
              value={obPurpose}
              onChange={(e) => setObPurpose(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Describe the purpose of official business..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFileOBOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileOB}>Submit OB Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
