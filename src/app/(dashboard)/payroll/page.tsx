"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Eye,
  Play,
  CheckCircle2,
  Banknote,
  Wallet,
  CircleDollarSign,
  Clock,
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
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
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollRun {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  payFrequency: string;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;
  processedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
}

const statusBadge: Record<string, { label: string; variant: "secondary" | "info" | "success" | "default" | "danger" }> = {
  draft: { label: "Draft", variant: "secondary" },
  processing: { label: "Processing", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  paid: { label: "Paid", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export default function PayrollPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formPeriodStart, setFormPeriodStart] = useState("");
  const [formPeriodEnd, setFormPeriodEnd] = useState("");
  const [formPayDate, setFormPayDate] = useState("");
  const [formFrequency, setFormFrequency] = useState("semi-monthly");

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll");
      if (!res.ok) throw new Error("Failed to fetch payroll runs");
      const json = await res.json();
      setRuns(json.data || json);
    } catch {
      toast.error("Failed to load payroll runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleCreate = async () => {
    if (!formName || !formPeriodStart || !formPeriodEnd || !formPayDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          periodStart: formPeriodStart,
          periodEnd: formPeriodEnd,
          payDate: formPayDate,
          payFrequency: formFrequency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payroll run");
      }
      toast.success("Payroll run created");
      setShowCreateModal(false);
      resetForm();
      fetchRuns();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create payroll run";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPeriodStart("");
    setFormPeriodEnd("");
    setFormPayDate("");
    setFormFrequency("semi-monthly");
  };

  const handleProcess = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payroll/${id}/process`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to process payroll");
      toast.success("Payroll processing started");
      fetchRuns();
    } catch {
      toast.error("Failed to process payroll");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve payroll");
      toast.success("Payroll approved");
      fetchRuns();
    } catch {
      toast.error("Failed to approve payroll");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) throw new Error("Failed to mark as paid");
      toast.success("Payroll marked as paid");
      fetchRuns();
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setActionLoading(null);
    }
  };

  // Summary calculations
  const totalRuns = runs.length;
  const totalDisbursed = runs
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.totalNetPay, 0);
  const pendingApproval = runs.filter((r) => r.status === "processing").length;
  const latestRun = runs.length > 0
    ? runs.reduce((latest, r) =>
        new Date(r.createdAt) > new Date(latest.createdAt) ? r : latest
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage payroll runs, processing, and disbursements
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Create Payroll Run
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payroll Runs"
          value={totalRuns}
          icon={Wallet}
          color="teal"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          icon={CircleDollarSign}
          color="green"
        />
        <StatCard
          title="Pending Approval"
          value={pendingApproval}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Latest Run Date"
          value={latestRun ? formatDate(latestRun.createdAt) : "N/A"}
          icon={CalendarDays}
          color="teal"
        />
      </div>

      {/* Payroll Runs Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="text-center">Employees</TableHead>
                <TableHead className="text-right">Total Gross</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-sm text-gray-500">Loading payroll runs...</p>
                  </TableCell>
                </TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <Wallet className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No payroll runs yet</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Create First Run
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => {
                  const badge = statusBadge[run.status] || statusBadge.draft;
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium text-gray-900">
                        {run.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(run.payDate)}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {run.payFrequency}
                      </TableCell>
                      <TableCell className="text-center">
                        {run.employeeCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(run.totalGross)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(run.totalNetPay)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="View Details"
                            onClick={() => router.push(`/payroll/${run.id}`)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {run.status === "draft" && (
                            <button
                              title="Process Payroll"
                              onClick={() => handleProcess(run.id)}
                              disabled={actionLoading === run.id}
                              className="rounded p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                            >
                              {actionLoading === run.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {run.status === "processing" && (
                            <button
                              title="Approve Payroll"
                              onClick={() => handleApprove(run.id)}
                              disabled={actionLoading === run.id}
                              className="rounded p-1.5 text-green-500 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                            >
                              {actionLoading === run.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {run.status === "approved" && (
                            <button
                              title="Mark as Paid"
                              onClick={() => handleMarkPaid(run.id)}
                              disabled={actionLoading === run.id}
                              className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                            >
                              {actionLoading === run.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Banknote className="h-4 w-4" />
                              )}
                            </button>
                          )}
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

      {/* Create Payroll Run Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Payroll Run
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="rounded-sm p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Payroll Run Name"
                placeholder='e.g. "March 16-31, 2026"'
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Period Start"
                  type="date"
                  value={formPeriodStart}
                  onChange={(e) => setFormPeriodStart(e.target.value)}
                />
                <Input
                  label="Period End"
                  type="date"
                  value={formPeriodEnd}
                  onChange={(e) => setFormPeriodEnd(e.target.value)}
                />
              </div>
              <Input
                label="Pay Date"
                type="date"
                value={formPayDate}
                onChange={(e) => setFormPayDate(e.target.value)}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Pay Frequency
                </label>
                <Select value={formFrequency} onValueChange={setFormFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Payroll Run
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
