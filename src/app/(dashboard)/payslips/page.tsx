"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Receipt,
  Search,
  X,
  Loader2,
  FileText,
  User,
  Building2,
  CalendarDays,
  Banknote,
  TrendingDown,
  CircleDollarSign,
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
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollRunOption {
  id: string;
  name: string;
}

interface PayslipItem {
  id: string;
  payrollRunId: string;
  payrollRun: {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    status: string;
    payFrequency: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
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

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipItem | null>(null);

  const fetchPayrollRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll");
      if (!res.ok) return;
      const json = await res.json();
      const data = json.data || json;
      setPayrollRuns(
        data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))
      );
    } catch {
      // Silent fail for filter options
    }
  }, []);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRun && selectedRun !== "all") {
        params.set("payrollRunId", selectedRun);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const res = await fetch(`/api/payslips?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payslips");
      const json = await res.json();
      setPayslips(json.data || json);
    } catch {
      toast.error("Failed to load payslips");
    } finally {
      setLoading(false);
    }
  }, [selectedRun, searchQuery]);

  useEffect(() => {
    fetchPayrollRuns();
  }, [fetchPayrollRuns]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  // Filter payslips client-side as well for instant search feel
  const filteredPayslips = payslips.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase();
      const empId = p.employee.employeeId.toLowerCase();
      if (!name.includes(q) && !empId.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage employee payslips
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Payroll Run
          </label>
          <Select value={selectedRun} onValueChange={setSelectedRun}>
            <SelectTrigger>
              <SelectValue placeholder="All Payroll Runs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payroll Runs</SelectItem>
              {payrollRuns.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {run.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Payslips Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Total Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-sm text-gray-500">Loading payslips...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Receipt className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">No payslips found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {payslip.employee.lastName}, {payslip.employee.firstName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payslip.employee.employeeId}
                          {payslip.employee.department && (
                            <> &middot; {payslip.employee.department.name}</>
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div>
                        <p>{payslip.payrollRun.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payslip.payrollRun.periodStart)} -{" "}
                          {formatDate(payslip.payrollRun.periodEnd)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(payslip.grossPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700">
                      {formatCurrency(payslip.netPay)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          payslip.payrollRun.status === "paid"
                            ? "default"
                            : payslip.payrollRun.status === "approved"
                            ? "success"
                            : "info"
                        }
                      >
                        {payslip.payrollRun.status === "paid"
                          ? "Paid"
                          : payslip.payrollRun.status === "approved"
                          ? "Approved"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Payslip</h2>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-sm p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Company & Employee Info */}
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Employee Information
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {selectedPayslip.employee.firstName}{" "}
                          {selectedPayslip.employee.lastName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        ID: {selectedPayslip.employee.employeeId}
                      </p>
                      {selectedPayslip.employee.department && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {selectedPayslip.employee.department.name}
                            {selectedPayslip.employee.position && (
                              <> &middot; {selectedPayslip.employee.position.name}</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Period Information
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {formatDate(selectedPayslip.payrollRun.periodStart)} -{" "}
                          {formatDate(selectedPayslip.payrollRun.periodEnd)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Pay Date: {formatDate(selectedPayslip.payrollRun.payDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Days Worked: {selectedPayslip.daysWorked} | Hours:{" "}
                        {selectedPayslip.hoursWorked}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                    Earnings
                  </h3>
                </div>
                <div className="rounded-lg border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    <EarningsRow label="Basic Pay" amount={selectedPayslip.basicPay} />
                    <EarningsRow label="Overtime Pay" amount={selectedPayslip.overtimePay} />
                    <EarningsRow label="Night Differential" amount={selectedPayslip.nightDiffPay} />
                    <EarningsRow label="Holiday Pay" amount={selectedPayslip.holidayPay} />
                    <EarningsRow label="Allowances" amount={selectedPayslip.allowances} />
                    {selectedPayslip.thirteenthMonth > 0 && (
                      <EarningsRow label="13th Month Pay" amount={selectedPayslip.thirteenthMonth} />
                    )}
                    {selectedPayslip.otherEarnings > 0 && (
                      <EarningsRow label="Other Earnings" amount={selectedPayslip.otherEarnings} />
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-emerald-200 bg-emerald-50 px-4 py-3">
                    <span className="text-sm font-bold text-emerald-800">
                      GROSS PAY
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-800">
                      {formatCurrency(selectedPayslip.grossPay)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                    Deductions
                  </h3>
                </div>
                <div className="rounded-lg border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    <DeductionRow label="SSS Contribution" amount={selectedPayslip.sssContribution} />
                    <DeductionRow
                      label="PhilHealth Contribution"
                      amount={selectedPayslip.philhealthContribution}
                    />
                    <DeductionRow
                      label="Pag-IBIG Contribution"
                      amount={selectedPayslip.pagibigContribution}
                    />
                    <DeductionRow
                      label="Withholding Tax"
                      amount={selectedPayslip.withholdingTax}
                    />
                    {selectedPayslip.lateDeductions > 0 && (
                      <DeductionRow label="Late" amount={selectedPayslip.lateDeductions} />
                    )}
                    {selectedPayslip.undertimeDeductions > 0 && (
                      <DeductionRow
                        label="Undertime"
                        amount={selectedPayslip.undertimeDeductions}
                      />
                    )}
                    {selectedPayslip.absentDeductions > 0 && (
                      <DeductionRow label="Absent" amount={selectedPayslip.absentDeductions} />
                    )}
                    {selectedPayslip.loanDeductions > 0 && (
                      <DeductionRow label="Loans" amount={selectedPayslip.loanDeductions} />
                    )}
                    {selectedPayslip.otherDeductions > 0 && (
                      <DeductionRow
                        label="Other Deductions"
                        amount={selectedPayslip.otherDeductions}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-red-200 bg-red-50 px-4 py-3">
                    <span className="text-sm font-bold text-red-800">
                      TOTAL DEDUCTIONS
                    </span>
                    <span className="font-mono text-sm font-bold text-red-800">
                      {formatCurrency(selectedPayslip.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">NET PAY</p>
                    <p className="mt-0.5 text-xs text-emerald-600/70">
                      Gross Pay - Total Deductions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl font-bold text-emerald-800">
                      {formatCurrency(selectedPayslip.netPay)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
              <Button
                variant="outline"
                onClick={() => setSelectedPayslip(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EarningsRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-mono text-sm text-gray-800">
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

function DeductionRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-mono text-sm text-red-600">
        ({formatCurrency(amount)})
      </span>
    </div>
  );
}
