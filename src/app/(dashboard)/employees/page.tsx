"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Briefcase,
  CreditCard,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";

// ===== TYPES =====

interface Branch {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  positions?: Position[];
}

interface Position {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  civilStatus?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  avatar?: string;
  branchId?: string;
  branch?: Branch | null;
  departmentId?: string;
  department?: Department | null;
  positionId?: string;
  position?: Position | null;
  employmentType: string;
  dateHired: string;
  status: string;
  basicSalary: number;
  dailyRate: number;
  hourlyRate: number;
  payFrequency: string;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  tinNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  shiftId?: string;
  shift?: Shift | null;
  createdAt: string;
}

const emptyForm = {
  employeeId: "",
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  phone: "",
  gender: "",
  birthDate: "",
  civilStatus: "",
  address: "",
  city: "",
  province: "",
  branchId: "",
  departmentId: "",
  positionId: "",
  employmentType: "regular",
  dateHired: "",
  shiftId: "",
  basicSalary: 0,
  dailyRate: 0,
  payFrequency: "semi-monthly",
  sssNumber: "",
  philhealthNumber: "",
  pagibigNumber: "",
  tinNumber: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
};

type FormData = typeof emptyForm;

const STATUS_BADGES: Record<string, { variant: "success" | "danger" | "warning" | "info" | "secondary"; label: string }> = {
  active: { variant: "success", label: "Active" },
  resigned: { variant: "danger", label: "Resigned" },
  terminated: { variant: "danger", label: "Terminated" },
  "on-leave": { variant: "warning", label: "On Leave" },
};

// ===== MODAL COMPONENT =====

function EmployeeModal({
  open,
  onClose,
  onSave,
  initialData,
  branches,
  departments,
  shifts,
  isEditing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  initialData: FormData;
  branches: Branch[];
  departments: Department[];
  shifts: Shift[];
  isEditing: boolean;
}) {
  const [form, setForm] = useState<FormData>(initialData);
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData);
    setActiveTab("personal");
  }, [initialData, open]);

  if (!open) return null;

  const set = (field: keyof FormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedDepartment = departments.find((d) => d.id === form.departmentId);
  const positions = selectedDepartment?.positions ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.employeeId || !form.dateHired) {
      toast.error("Please fill all required fields: Employee ID, First Name, Last Name, Email, Date Hired");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "government", label: "Government IDs", icon: CreditCard },
    { id: "bank", label: "Bank Info", icon: Landmark },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Employee" : "Add Employee"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 bg-gray-50 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[55vh] overflow-y-auto p-6">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Employee ID *"
                  placeholder="EMP-0001"
                  value={form.employeeId}
                  onChange={(e) => set("employeeId", e.target.value)}
                  disabled={isEditing}
                />
                <Input
                  label="First Name *"
                  placeholder="Juan"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
                <Input
                  label="Last Name *"
                  placeholder="Dela Cruz"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
                <Input
                  label="Middle Name"
                  placeholder="Santos"
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="juan@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                <Input
                  label="Phone"
                  placeholder="09171234567"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.gender}
                    onChange={(e) => set("gender", e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <Input
                  label="Birth Date"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                />
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Civil Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.civilStatus}
                    onChange={(e) => set("civilStatus", e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address"
                    placeholder="123 Main St"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <Input
                  label="City"
                  placeholder="Manila"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
                <Input
                  label="Province"
                  placeholder="Metro Manila"
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                />
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === "employment" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Branch</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.branchId}
                    onChange={(e) => set("branchId", e.target.value)}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Department</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.departmentId}
                    onChange={(e) => {
                      set("departmentId", e.target.value);
                      set("positionId", "");
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Position</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.positionId}
                    onChange={(e) => set("positionId", e.target.value)}
                  >
                    <option value="">Select Position</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Employment Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.employmentType}
                    onChange={(e) => set("employmentType", e.target.value)}
                  >
                    <option value="regular">Regular</option>
                    <option value="probationary">Probationary</option>
                    <option value="contractual">Contractual</option>
                    <option value="part-time">Part-Time</option>
                  </select>
                </div>
                <Input
                  label="Date Hired *"
                  type="date"
                  value={form.dateHired}
                  onChange={(e) => set("dateHired", e.target.value)}
                />
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Shift</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.shiftId}
                    onChange={(e) => set("shiftId", e.target.value)}
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Basic Salary"
                  type="number"
                  placeholder="0.00"
                  value={form.basicSalary || ""}
                  onChange={(e) => set("basicSalary", parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="Daily Rate"
                  type="number"
                  placeholder="0.00"
                  value={form.dailyRate || ""}
                  onChange={(e) => set("dailyRate", parseFloat(e.target.value) || 0)}
                />
                <div className="w-full">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Pay Frequency</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                    value={form.payFrequency}
                    onChange={(e) => set("payFrequency", e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="semi-monthly">Semi-Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            )}

            {/* Government IDs Tab */}
            {activeTab === "government" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="SSS Number"
                  placeholder="00-0000000-0"
                  value={form.sssNumber}
                  onChange={(e) => set("sssNumber", e.target.value)}
                />
                <Input
                  label="PhilHealth Number"
                  placeholder="00-000000000-0"
                  value={form.philhealthNumber}
                  onChange={(e) => set("philhealthNumber", e.target.value)}
                />
                <Input
                  label="Pag-IBIG Number"
                  placeholder="0000-0000-0000"
                  value={form.pagibigNumber}
                  onChange={(e) => set("pagibigNumber", e.target.value)}
                />
                <Input
                  label="TIN"
                  placeholder="000-000-000-000"
                  value={form.tinNumber}
                  onChange={(e) => set("tinNumber", e.target.value)}
                />
              </div>
            )}

            {/* Bank Info Tab */}
            {activeTab === "bank" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Bank Name"
                  placeholder="BDO, BPI, Metrobank..."
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                />
                <Input
                  label="Account Number"
                  placeholder="0000000000"
                  value={form.bankAccountNumber}
                  onChange={(e) => set("bankAccountNumber", e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Account Name"
                    placeholder="Juan S. Dela Cruz"
                    value={form.bankAccountName}
                    onChange={(e) => set("bankAccountName", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== VIEW DETAIL MODAL =====

function EmployeeDetailModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  if (!open || !employee) return null;

  const statusBadge = STATUS_BADGES[employee.status] || { variant: "secondary" as const, label: employee.status };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Details</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Header Profile */}
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {employee.avatar && <AvatarImage src={employee.avatar} />}
              <AvatarFallback className="text-lg">
                {getInitials(`${employee.firstName} ${employee.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ""}{employee.lastName}
              </h3>
              <p className="text-sm text-gray-500">{employee.employeeId} &middot; {employee.position?.name || "No Position"}</p>
              <Badge variant={statusBadge.variant} className="mt-1">{statusBadge.label}</Badge>
            </div>
          </div>

          {/* Info Sections */}
          <div className="space-y-6">
            <Section title="Personal Information">
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone || "N/A"} />
              <InfoRow label="Gender" value={employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : "N/A"} />
              <InfoRow label="Birth Date" value={employee.birthDate ? formatDate(employee.birthDate) : "N/A"} />
              <InfoRow label="Civil Status" value={employee.civilStatus ? employee.civilStatus.charAt(0).toUpperCase() + employee.civilStatus.slice(1) : "N/A"} />
              <InfoRow label="Address" value={[employee.address, employee.city, employee.province].filter(Boolean).join(", ") || "N/A"} />
            </Section>

            <Section title="Employment">
              <InfoRow label="Branch" value={employee.branch?.name || "N/A"} />
              <InfoRow label="Department" value={employee.department?.name || "N/A"} />
              <InfoRow label="Position" value={employee.position?.name || "N/A"} />
              <InfoRow label="Employment Type" value={employee.employmentType.charAt(0).toUpperCase() + employee.employmentType.slice(1)} />
              <InfoRow label="Date Hired" value={formatDate(employee.dateHired)} />
              <InfoRow label="Shift" value={employee.shift ? `${employee.shift.name} (${employee.shift.startTime} - ${employee.shift.endTime})` : "N/A"} />
              <InfoRow label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
              <InfoRow label="Daily Rate" value={formatCurrency(employee.dailyRate)} />
              <InfoRow label="Pay Frequency" value={employee.payFrequency.charAt(0).toUpperCase() + employee.payFrequency.slice(1)} />
            </Section>

            <Section title="Government IDs">
              <InfoRow label="SSS" value={employee.sssNumber || "N/A"} />
              <InfoRow label="PhilHealth" value={employee.philhealthNumber || "N/A"} />
              <InfoRow label="Pag-IBIG" value={employee.pagibigNumber || "N/A"} />
              <InfoRow label="TIN" value={employee.tinNumber || "N/A"} />
            </Section>

            <Section title="Bank Information">
              <InfoRow label="Bank Name" value={employee.bankName || "N/A"} />
              <InfoRow label="Account Number" value={employee.bankAccountNumber || "N/A"} />
              <InfoRow label="Account Name" value={employee.bankAccountName || "N/A"} />
            </Section>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">{title}</h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}

// ===== MAIN PAGE =====

export default function EmployeesPage() {
  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // UI state
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Fetch reference data
  useEffect(() => {
    async function loadRefData() {
      try {
        const [brRes, deptRes, shiftRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/departments"),
          fetch("/api/shifts"),
        ]);
        if (brRes.ok) {
          const brData = await brRes.json();
          setBranches(Array.isArray(brData) ? brData : []);
        }
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(Array.isArray(deptData) ? deptData : []);
        }
        if (shiftRes.ok) {
          const shiftData = await shiftRes.json();
          setShifts(Array.isArray(shiftData) ? shiftData.filter((s: any) => s.isActive) : []);
        }
      } catch {
        // Reference data errors are non-critical
      }
    }
    loadRefData();
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(rowsPerPage));
      if (search) params.set("search", search);
      if (filterBranch) params.set("branch", filterBranch);
      if (filterDept) params.set("department", filterDept);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmployees(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filterBranch, filterDept, filterStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, filterBranch, filterDept, filterStatus, rowsPerPage]);

  // Open add modal
  function handleAdd() {
    setEditingEmployee(null);
    setModalOpen(true);
  }

  // Open edit modal
  function handleEdit(emp: Employee) {
    setEditingEmployee(emp);
    setModalOpen(true);
  }

  // Open detail view
  function handleView(emp: Employee) {
    setViewingEmployee(emp);
    setDetailOpen(true);
  }

  // Save handler
  async function handleSave(formData: FormData) {
    try {
      const isEdit = !!editingEmployee;
      const url = isEdit ? `/api/employees/${editingEmployee!.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, unknown> = { ...formData };
      // Clean up empty strings to null for optional fields
      Object.keys(body).forEach((key) => {
        if (body[key] === "") body[key] = null;
      });
      // Keep required fields as-is
      body.employeeId = formData.employeeId;
      body.firstName = formData.firstName;
      body.lastName = formData.lastName;
      body.email = formData.email;
      body.dateHired = formData.dateHired;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast.success(isEdit ? "Employee updated successfully" : "Employee added successfully");
      setModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to save employee");
      throw err;
    }
  }

  // Build form initial data
  function getFormData(): FormData {
    if (!editingEmployee) return { ...emptyForm };
    const emp = editingEmployee;
    return {
      employeeId: emp.employeeId || "",
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      middleName: emp.middleName || "",
      email: emp.email || "",
      phone: emp.phone || "",
      gender: emp.gender || "",
      birthDate: emp.birthDate ? emp.birthDate.split("T")[0] : "",
      civilStatus: emp.civilStatus || "",
      address: emp.address || "",
      city: emp.city || "",
      province: emp.province || "",
      branchId: emp.branchId || "",
      departmentId: emp.departmentId || "",
      positionId: emp.positionId || "",
      employmentType: emp.employmentType || "regular",
      dateHired: emp.dateHired ? emp.dateHired.split("T")[0] : "",
      shiftId: emp.shiftId || "",
      basicSalary: emp.basicSalary || 0,
      dailyRate: emp.dailyRate || 0,
      payFrequency: emp.payFrequency || "semi-monthly",
      sssNumber: emp.sssNumber || "",
      philhealthNumber: emp.philhealthNumber || "",
      pagibigNumber: emp.pagibigNumber || "",
      tinNumber: emp.tinNumber || "",
      bankName: emp.bankName || "",
      bankAccountNumber: emp.bankAccountNumber || "",
      bankAccountName: emp.bankAccountName || "",
    };
  }

  const startRow = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and their information
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
            <option value="on-leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <span>Loading employees...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={40} className="text-gray-300" />
                      <p className="text-gray-500">No employees found</p>
                      <Button size="sm" onClick={handleAdd}>
                        <Plus size={14} />
                        Add your first employee
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const badge = STATUS_BADGES[emp.status] || { variant: "secondary" as const, label: emp.status };
                  return (
                    <tr
                      key={emp.id}
                      className="border-b border-gray-200 transition-colors hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleView(emp)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{emp.employeeId}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {emp.avatar && <AvatarImage src={emp.avatar} />}
                            <AvatarFallback className="text-xs">
                              {getInitials(`${emp.firstName} ${emp.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">
                            {emp.lastName}, {emp.firstName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.branch?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.department?.name || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.position?.name || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleView(emp); }}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && employees.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select
                className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                Showing {startRow}-{endRow} of {total}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "dots")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("dots");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "dots" ? (
                    <span key={`dots-${idx}`} className="px-2 text-sm text-gray-400">...</span>
                  ) : (
                    <Button
                      key={item}
                      variant={page === item ? "default" : "outline"}
                      size="sm"
                      className="min-w-[2rem]"
                      onClick={() => setPage(item as number)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployeeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEmployee(null); }}
        onSave={handleSave}
        initialData={getFormData()}
        branches={branches}
        departments={departments}
        shifts={shifts}
        isEditing={!!editingEmployee}
      />

      <EmployeeDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setViewingEmployee(null); }}
        employee={viewingEmployee}
      />
    </div>
  );
}
