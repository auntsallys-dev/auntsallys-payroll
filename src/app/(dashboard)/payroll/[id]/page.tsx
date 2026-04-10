"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Banknote,
  Download,
  Loader2,
  CalendarDays,
  Users,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollItem {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string } | null;
    position?: { name: string } | null;
  };
  basicPay: number;
  overtimePay: number;
  nightDiffPay: number;
  holidayPay: number;
  allowances: number;
  thirteenthMonth: number;
  otherEarnings: number;
  grossPay: number;
  sssContribution: number;
  philhealthContribution: number;
  pagibigContribution: number;
  withholdingTax: number;
  lateDeductions: number;
  undertimeDeductions: number;
  absentDeductions: number;
  loanDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  daysWorked: number;
  hoursWorked: number;
}

interface PayrollRunDetail {
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
  items: PayrollItem[];
}

const statusBadge: Record<string, { label: string; variant: "secondary" | "info" | "success" | "default" | "danger" }> = {
  draft: { label: "Draft", variant: "secondary" },
  processing: { label: "Processing", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  paid: { label: "Paid", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [run, setRun] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/payroll/${id}`);
      if (!res.ok) throw new Error("Failed to fetch payroll details");
      const data = await res.json();
      setRun(data);
    } catch {
      toast.error("Failed to load payroll details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleProcess = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}/process`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to process payroll");
      toast.success("Payroll processing started");
      fetchDetail();
    } catch {
      toast.error("Failed to process payroll");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve payroll");
      toast.success("Payroll approved");
      fetchDetail();
    } catch {
      toast.error("Failed to approve payroll");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) throw new Error("Failed to mark as paid");
      toast.success("Payroll marked as paid");
      fetchDetail();
    } catch {
      toast.error("Failed to mark as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    toast.success("Export feature coming soon!");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">Payroll run not found</p>
        <Button variant="outline" onClick={() => router.push("/payroll")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Payroll
        </Button>
      </div>
    );
  }

  const badge = statusBadge[run.status] || statusBadge.draft;
  const items = run.items || [];

  // Compute totals from items
  const totals = items.reduce(
    (acc, item) => ({
      basicPay: acc.basicPay + item.basicPay,
      overtimePay: acc.overtimePay + item.overtimePay,
      nightDiffPay: acc.nightDiffPay + item.nightDiffPay,
      holidayPay: acc.holidayPay + item.holidayPay,
      allowances: acc.allowances + item.allowances,
      grossPay: acc.grossPay + item.grossPay,
      sss: acc.sss + item.sssContribution,
      philhealth: acc.philhealth + item.philhealthContribution,
      pagibig: acc.pagibig + item.pagibigContribution,
      tax: acc.tax + item.withholdingTax,
      lateUT: acc.lateUT + item.lateDeductions + item.undertimeDeductions + item.absentDeductions,
      other: acc.other + item.loanDeductions + item.otherDeductions,
      totalDeductions: acc.totalDeductions + item.totalDeductions,
      netPay: acc.netPay + item.netPay,
    }),
    {
      basicPay: 0,
      overtimePay: 0,
      nightDiffPay: 0,
      holidayPay: 0,
      allowances: 0,
      grossPay: 0,
      sss: 0,
      philhealth: 0,
      pagibig: 0,
      tax: 0,
      lateUT: 0,
      other: 0,
      totalDeductions: 0,
      netPay: 0,
    }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/payroll")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{run.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Payroll Run Details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {run.status === "draft" && (
            <Button
              onClick={handleProcess}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Process
            </Button>
          )}
          {run.status === "processing" && (
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>
          )}
          {run.status === "approved" && (
            <Button
              onClick={handleMarkPaid}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Banknote className="h-4 w-4" />
              )}
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Run Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Period</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Pay Date:</span>
              <span className="text-xs font-medium text-gray-700">
                {formatDate(run.payDate)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Employees</p>
                <p className="mt-1 text-3xl font-bold text-teal-700">
                  {run.employeeCount}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Gross</p>
                <p className="mt-1 text-xl font-bold text-green-700">
                  {formatCurrency(run.totalGross)}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CircleDollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Deductions: {formatCurrency(run.totalDeductions)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Net Pay</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">
                  {formatCurrency(run.totalNetPay)}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs capitalize text-gray-500">
              {run.payFrequency} pay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Items Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Payroll Breakdown
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Detailed employee payroll items for this run
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="sticky left-0 bg-gray-50 whitespace-nowrap">Employee</TableHead>
                <TableHead className="text-right whitespace-nowrap">Basic Pay</TableHead>
                <TableHead className="text-right whitespace-nowrap">OT Pay</TableHead>
                <TableHead className="text-right whitespace-nowrap">Night Diff</TableHead>
                <TableHead className="text-right whitespace-nowrap">Holiday Pay</TableHead>
                <TableHead className="text-right whitespace-nowrap">Allowances</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold text-emerald-700">Gross Pay</TableHead>
                <TableHead className="text-right whitespace-nowrap">SSS</TableHead>
                <TableHead className="text-right whitespace-nowrap">PhilHealth</TableHead>
                <TableHead className="text-right whitespace-nowrap">Pag-IBIG</TableHead>
                <TableHead className="text-right whitespace-nowrap">Tax</TableHead>
                <TableHead className="text-right whitespace-nowrap">Late/UT/Abs</TableHead>
                <TableHead className="text-right whitespace-nowrap">Other</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold text-red-700">Total Ded.</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold text-emerald-700">Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="py-12 text-center">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      No payroll items yet. Process the payroll to generate items.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="sticky left-0 bg-white whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.employee.lastName}, {item.employee.firstName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.employee.employeeId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.basicPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.overtimePay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.nightDiffPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.holidayPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.allowances)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700">
                        {formatCurrency(item.grossPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(item.sssContribution)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(item.philhealthContribution)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(item.pagibigContribution)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(item.withholdingTax)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(
                          item.lateDeductions + item.undertimeDeductions + item.absentDeductions
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatCurrency(item.loanDeductions + item.otherDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-red-700">
                        {formatCurrency(item.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700">
                        {formatCurrency(item.netPay)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <TableCell className="sticky left-0 bg-gray-50 text-gray-900">
                      TOTALS
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(totals.basicPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(totals.overtimePay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(totals.nightDiffPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(totals.holidayPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(totals.allowances)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-700">
                      {formatCurrency(totals.grossPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.sss)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.philhealth)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.pagibig)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.tax)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.lateUT)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(totals.other)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-700">
                      {formatCurrency(totals.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-700">
                      {formatCurrency(totals.netPay)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
