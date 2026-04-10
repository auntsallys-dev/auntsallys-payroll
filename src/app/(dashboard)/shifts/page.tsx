"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  CalendarClock,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Moon,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ===== TYPES =====

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  gracePeriod: number;
  isNightShift: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { employees: number };
}

const emptyShiftForm = {
  name: "",
  startTime: "08:00",
  endTime: "17:00",
  breakMinutes: 60,
  gracePeriod: 15,
  isNightShift: false,
};

type ShiftForm = typeof emptyShiftForm;

// ===== MODAL =====

function ShiftModal({
  open,
  onClose,
  onSave,
  initialData,
  isEditing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: ShiftForm) => void;
  initialData: ShiftForm;
  isEditing: boolean;
}) {
  const [form, setForm] = useState<ShiftForm>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData);
  }, [initialData, open]);

  if (!open) return null;

  function set<K extends keyof ShiftForm>(field: K, value: ShiftForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime) {
      toast.error("Name, Start Time, and End Time are required");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Shift" : "Add Shift"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Shift Name *"
            placeholder="Morning Shift, Night Shift..."
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
            <Input
              label="End Time *"
              type="time"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Break (minutes)"
              type="number"
              min={0}
              value={form.breakMinutes}
              onChange={(e) => set("breakMinutes", parseInt(e.target.value) || 0)}
            />
            <Input
              label="Grace Period (minutes)"
              type="number"
              min={0}
              value={form.gracePeriod}
              onChange={(e) => set("gracePeriod", parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={form.isNightShift}
                onChange={(e) => set("isNightShift", e.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 peer-focus:ring-offset-2" />
            </label>
            <div>
              <span className="text-sm font-medium text-gray-700">Night Shift</span>
              <p className="text-xs text-gray-400">Enable for shifts between 10 PM - 6 AM (night differential)</p>
            </div>
          </div>

          {/* Computed info */}
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Shift:</span>{" "}
              {(() => {
                const [sh, sm] = form.startTime.split(":").map(Number);
                const [eh, em] = form.endTime.split(":").map(Number);
                let totalMin = (eh * 60 + em) - (sh * 60 + sm);
                if (totalMin < 0) totalMin += 24 * 60; // overnight
                const workMin = totalMin - form.breakMinutes;
                const hours = Math.floor(workMin / 60);
                const mins = workMin % 60;
                return `${totalMin / 60} hrs total, ${hours}h ${mins > 0 ? `${mins}m` : ""} working (excl. break)`;
              })()}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Shift" : "Add Shift"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== CONFIRM DELETE MODAL =====

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Deactivate</Button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Shift | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shifts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  function handleAdd() {
    setEditingShift(null);
    setModalOpen(true);
  }

  function handleEdit(shift: Shift) {
    setEditingShift(shift);
    setModalOpen(true);
  }

  async function handleSave(formData: ShiftForm) {
    try {
      const isEdit = !!editingShift;
      const url = isEdit ? `/api/shifts/${editingShift!.id}` : "/api/shifts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save shift");
      }

      toast.success(isEdit ? "Shift updated successfully" : "Shift created successfully");
      setModalOpen(false);
      setEditingShift(null);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save shift");
      throw err;
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/shifts/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deactivate shift");
      }

      toast.success("Shift deactivated");
      setDeleteConfirm(null);
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate shift");
    }
  }

  function getFormData(): ShiftForm {
    if (!editingShift) return { ...emptyShiftForm };
    return {
      name: editingShift.name,
      startTime: editingShift.startTime,
      endTime: editingShift.endTime,
      breakMinutes: editingShift.breakMinutes,
      gracePeriod: editingShift.gracePeriod,
      isNightShift: editingShift.isNightShift,
    };
  }

  function formatShiftDuration(startTime: string, endTime: string, breakMinutes: number): string {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let totalMin = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMin < 0) totalMin += 24 * 60;
    const workMin = totalMin - breakMinutes;
    const hours = Math.floor(workMin / 60);
    const mins = workMin % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shifts & Schedule</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage work shifts and schedules for your employees
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          Add Shift
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <CalendarClock size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Shifts</p>
              <p className="text-2xl font-bold text-teal-700">{shifts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Shifts</p>
              <p className="text-2xl font-bold text-green-700">{shifts.filter((s) => s.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Moon size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Night Shifts</p>
              <p className="text-2xl font-bold text-yellow-700">{shifts.filter((s) => s.isNightShift).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">End Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Working Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Break (min)</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grace Period (min)</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Night Shift</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employees</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <span>Loading shifts...</span>
                    </div>
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarClock size={40} className="text-gray-300" />
                      <p>No shifts configured</p>
                      <Button size="sm" onClick={handleAdd}>
                        <Plus size={14} />
                        Add your first shift
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${shift.isNightShift ? "bg-indigo-100" : "bg-amber-100"}`}>
                          {shift.isNightShift ? (
                            <Moon size={16} className="text-indigo-600" />
                          ) : (
                            <Clock size={16} className="text-amber-600" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{shift.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{shift.startTime}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{shift.endTime}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatShiftDuration(shift.startTime, shift.endTime, shift.breakMinutes)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{shift.breakMinutes}</td>
                    <td className="px-4 py-3 text-gray-600">{shift.gracePeriod}</td>
                    <td className="px-4 py-3">
                      {shift.isNightShift ? (
                        <Badge variant="info">Yes</Badge>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{shift._count?.employees ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {shift.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(shift)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        {shift.isActive && (
                          <button
                            onClick={() => setDeleteConfirm(shift)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Deactivate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ShiftModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingShift(null); }}
        onSave={handleSave}
        initialData={getFormData()}
        isEditing={!!editingShift}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Deactivate Shift"
        message={`Are you sure you want to deactivate "${deleteConfirm?.name}"? Employees assigned to this shift will not be affected.`}
      />
    </div>
  );
}
