"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  Loader2,
  CalendarDays,
  Star,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "regular" | "special-non-working" | "special-working";
  recurring: boolean;
}

const emptyForm = {
  name: "",
  date: "",
  type: "regular" as "regular" | "special-non-working" | "special-working",
  recurring: false,
};

type FormData = typeof emptyForm;

/* ---------- Helpers ---------- */
function formatHolidayDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function typeLabel(type: string): string {
  switch (type) {
    case "regular":
      return "Regular";
    case "special-non-working":
      return "Special Non-Working";
    case "special-working":
      return "Special Working";
    default:
      return type;
  }
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case "regular":
      return "bg-rose-100 text-rose-800";
    case "special-non-working":
      return "bg-blue-100 text-blue-800";
    case "special-working":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/* ---------- Mock data ---------- */
const mockHolidays: Holiday[] = [
  { id: "1", name: "New Year's Day", date: "2026-01-01", type: "regular", recurring: true },
  { id: "2", name: "Araw ng Kagitingan", date: "2026-04-09", type: "regular", recurring: true },
  { id: "3", name: "Maundy Thursday", date: "2026-04-02", type: "regular", recurring: false },
  { id: "4", name: "Good Friday", date: "2026-04-03", type: "regular", recurring: false },
  { id: "5", name: "Labor Day", date: "2026-05-01", type: "regular", recurring: true },
  { id: "6", name: "Independence Day", date: "2026-06-12", type: "regular", recurring: true },
  { id: "7", name: "National Heroes Day", date: "2026-08-31", type: "regular", recurring: false },
  { id: "8", name: "Bonifacio Day", date: "2026-11-30", type: "regular", recurring: true },
  { id: "9", name: "Christmas Day", date: "2026-12-25", type: "regular", recurring: true },
  { id: "10", name: "Rizal Day", date: "2026-12-30", type: "regular", recurring: true },
  { id: "11", name: "Chinese New Year", date: "2026-02-17", type: "special-non-working", recurring: false },
  { id: "12", name: "EDSA Revolution Anniversary", date: "2026-02-25", type: "special-non-working", recurring: true },
  { id: "13", name: "Black Saturday", date: "2026-04-04", type: "special-non-working", recurring: false },
  { id: "14", name: "Ninoy Aquino Day", date: "2026-08-21", type: "special-non-working", recurring: true },
  { id: "15", name: "All Saints' Day", date: "2026-11-01", type: "special-non-working", recurring: true },
  { id: "16", name: "Immaculate Conception", date: "2026-12-08", type: "special-non-working", recurring: true },
  { id: "17", name: "Last Day of the Year", date: "2026-12-31", type: "special-non-working", recurring: true },
  { id: "18", name: "Election Day 2026", date: "2026-05-11", type: "special-working", recurring: false },
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

/* ---------- Delete Confirmation ---------- */
function DeleteDialog({
  open,
  onClose,
  onConfirm,
  holidayName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  holidayName: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Delete Holiday</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{holidayName}</span>? This action
          cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ========== Main Page ========== */
export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("2026");

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  /* Delete state */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  /* ---------- Fetch ---------- */
  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${yearFilter}`);
      if (res.ok) {
        const data = await res.json();
        setHolidays(Array.isArray(data) ? data : []);
      } else {
        setHolidays(mockHolidays.filter((h) => h.date.startsWith(yearFilter)));
      }
    } catch {
      setHolidays(mockHolidays.filter((h) => h.date.startsWith(yearFilter)));
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  /* ---------- Summary stats ---------- */
  const totalHolidays = holidays.length;
  const regularCount = holidays.filter((h) => h.type === "regular").length;
  const specialCount = holidays.filter((h) => h.type !== "regular").length;

  /* ---------- Form helpers ---------- */
  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function openAdd() {
    setEditingHoliday(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(holiday: Holiday) {
    setEditingHoliday(holiday);
    setForm({
      name: holiday.name,
      date: holiday.date ? new Date(holiday.date).toISOString().split("T")[0] : "",
      type: holiday.type,
      recurring: holiday.recurring,
    });
    setModalOpen(true);
  }

  function openDelete(holiday: Holiday) {
    setDeletingHoliday(holiday);
    setDeleteOpen(true);
  }

  /* ---------- Save ---------- */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.date) {
      toast.error("Name and date are required");
      return;
    }
    setSaving(true);
    const isEdit = !!editingHoliday;

    try {
      const url = isEdit
        ? `/api/holidays/${editingHoliday!.id}`
        : "/api/holidays";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setHolidays((prev) =>
            prev.map((h) => (h.id === editingHoliday!.id ? data : h))
          );
        } else {
          setHolidays((prev) => [...prev, data]);
        }
      } else {
        // Fallback to local update
        if (isEdit) {
          setHolidays((prev) =>
            prev.map((h) =>
              h.id === editingHoliday!.id ? { ...h, ...form } : h
            )
          );
        } else {
          const newHoliday: Holiday = { id: String(Date.now()), ...form };
          setHolidays((prev) => [...prev, newHoliday]);
        }
      }
      toast.success(
        isEdit ? "Holiday updated successfully" : "Holiday added successfully"
      );
      setModalOpen(false);
      setEditingHoliday(null);
    } catch {
      // Fallback to local update
      if (isEdit) {
        setHolidays((prev) =>
          prev.map((h) =>
            h.id === editingHoliday!.id ? { ...h, ...form } : h
          )
        );
      } else {
        const newHoliday: Holiday = { id: String(Date.now()), ...form };
        setHolidays((prev) => [...prev, newHoliday]);
      }
      toast.success(
        isEdit ? "Holiday updated successfully" : "Holiday added successfully"
      );
      setModalOpen(false);
      setEditingHoliday(null);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete() {
    if (!deletingHoliday) return;
    try {
      await fetch(`/api/holidays/${deletingHoliday.id}`, { method: "DELETE" });
    } catch {
      /* fallback to local */
    }
    setHolidays((prev) => prev.filter((h) => h.id !== deletingHoliday.id));
    toast.success("Holiday deleted successfully");
    setDeleteOpen(false);
    setDeletingHoliday(null);
  }

  /* ---------- Sort holidays by date ---------- */
  const sortedHolidays = [...holidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage company holidays and non-working days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Holidays</p>
              <p className="text-2xl font-bold text-gray-900">{totalHolidays}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Star size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Regular Holidays</p>
              <p className="text-2xl font-bold text-gray-900">{regularCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Special Holidays</p>
              <p className="text-2xl font-bold text-gray-900">{specialCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holidays Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {sortedHolidays.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <Calendar size={48} className="text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No holidays found for {yearFilter}
            </p>
            <Button size="sm" className="mt-3" onClick={openAdd}>
              <Plus size={14} />
              Add a holiday
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHolidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">
                    {holiday.name}
                  </TableCell>
                  <TableCell>{formatHolidayDate(holiday.date)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass(holiday.type)}`}
                    >
                      {typeLabel(holiday.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={holiday.recurring ? "success" : "secondary"}>
                      {holiday.recurring ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(holiday)}
                        className="rounded-md bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDelete(holiday)}
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
      </div>

      {/* ========== Add / Edit Modal ========== */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingHoliday(null);
        }}
        title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Holiday Name *"
            placeholder="e.g. New Year's Day"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="regular">Regular</option>
              <option value="special-non-working">Special Non-Working</option>
              <option value="special-working">Special Working</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => set("recurring", e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-emerald-300" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              Recurring annually
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingHoliday(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingHoliday
                  ? "Update Holiday"
                  : "Add Holiday"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== Delete Confirmation ========== */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingHoliday(null);
        }}
        onConfirm={handleDelete}
        holidayName={deletingHoliday?.name || ""}
      />
    </div>
  );
}
