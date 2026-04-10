"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Phone,
  MapPin,
  MoreVertical,
  LayoutGrid,
  List,
  Loader2,
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
interface Branch {
  id: string;
  name: string;
  type: "main" | "sub";
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
}

const emptyForm = {
  name: "",
  type: "sub" as "main" | "sub",
  phone: "",
  email: "",
  address: "",
  city: "",
  province: "",
  zipCode: "",
};

type FormData = typeof emptyForm;

/* ---------- Mock data ---------- */
const mockBranches: Branch[] = [
  {
    id: "1",
    name: "Aunt Sally's Main",
    type: "main",
    phone: "09171234567",
    email: "main@auntsallys.com",
    address: "123 Main Street",
    city: "Manila",
    province: "Metro Manila",
    zipCode: "1000",
  },
  {
    id: "2",
    name: "SM North Branch",
    type: "sub",
    phone: "09179876543",
    email: "smnorth@auntsallys.com",
    address: "SM North EDSA",
    city: "Quezon City",
    province: "Metro Manila",
    zipCode: "1105",
  },
  {
    id: "3",
    name: "Makati Branch",
    type: "sub",
    phone: "09175556789",
    email: "makati@auntsallys.com",
    address: "Ayala Avenue",
    city: "Makati",
    province: "Metro Manila",
    zipCode: "1226",
  },
  {
    id: "4",
    name: "Cebu Branch",
    type: "sub",
    phone: "09173334444",
    email: "cebu@auntsallys.com",
    address: "Colon Street",
    city: "Cebu City",
    province: "Cebu",
    zipCode: "6000",
  },
];

/* ---------- Branch Card Menu ---------- */
function CardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

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
  branchName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  branchName: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Delete Branch</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{branchName}</span>? This action
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
export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  /* Delete state */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  /* ---------- Fetch ---------- */
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : []);
      } else {
        setBranches(mockBranches);
      }
    } catch {
      setBranches(mockBranches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  /* ---------- Filter ---------- */
  const filtered = branches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.province.toLowerCase().includes(q)
    );
  });

  /* ---------- Form helpers ---------- */
  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function openAdd() {
    setEditingBranch(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      type: branch.type,
      phone: branch.phone,
      email: branch.email,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      zipCode: branch.zipCode,
    });
    setModalOpen(true);
  }

  function openDelete(branch: Branch) {
    setDeletingBranch(branch);
    setDeleteOpen(true);
  }

  /* ---------- Save ---------- */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Branch name is required");
      return;
    }
    setSaving(true);
    const isEdit = !!editingBranch;

    try {
      const url = isEdit
        ? `/api/branches/${editingBranch!.id}`
        : "/api/branches";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setBranches((prev) =>
            prev.map((b) => (b.id === editingBranch!.id ? data : b))
          );
        } else {
          setBranches((prev) => [...prev, data]);
        }
      } else {
        // Fallback to local update
        if (isEdit) {
          setBranches((prev) =>
            prev.map((b) =>
              b.id === editingBranch!.id ? { ...b, ...form } : b
            )
          );
        } else {
          const newBranch: Branch = { id: String(Date.now()), ...form };
          setBranches((prev) => [...prev, newBranch]);
        }
      }
      toast.success(isEdit ? "Branch updated successfully" : "Branch added successfully");
      setModalOpen(false);
      setEditingBranch(null);
    } catch {
      // Fallback to local update
      if (isEdit) {
        setBranches((prev) =>
          prev.map((b) =>
            b.id === editingBranch!.id ? { ...b, ...form } : b
          )
        );
      } else {
        const newBranch: Branch = { id: String(Date.now()), ...form };
        setBranches((prev) => [...prev, newBranch]);
      }
      toast.success(isEdit ? "Branch updated successfully" : "Branch added successfully");
      setModalOpen(false);
      setEditingBranch(null);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Delete ---------- */
  async function handleDelete() {
    if (!deletingBranch) return;
    try {
      await fetch(`/api/branches/${deletingBranch.id}`, { method: "DELETE" });
    } catch {
      /* fallback to local */
    }
    setBranches((prev) => prev.filter((b) => b.id !== deletingBranch.id));
    toast.success("Branch deleted successfully");
    setDeleteOpen(false);
    setDeletingBranch(null);
  }

  /* ---------- Branch icon colors ---------- */
  const iconColors = [
    "bg-emerald-100 text-emerald-600",
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
    "bg-cyan-100 text-cyan-600",
  ];

  function getIconColor(index: number) {
    return iconColors[index % iconColors.length];
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your company branches and locations
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} />
          Add Branch
        </Button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md p-2 transition-colors ${
              viewMode === "list"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white">
          <Building2 size={48} className="text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No branches found</p>
          <Button size="sm" className="mt-3" onClick={openAdd}>
            <Plus size={14} />
            Add your first branch
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* ===== GRID VIEW ===== */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((branch, idx) => (
            <div
              key={branch.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getIconColor(idx)}`}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {branch.name}
                    </h3>
                    <Badge
                      variant={branch.type === "main" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {branch.type === "main" ? "Main" : "Sub"}
                    </Badge>
                  </div>
                </div>
                <CardMenu
                  onEdit={() => openEdit(branch)}
                  onDelete={() => openDelete(branch)}
                />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="shrink-0 text-gray-400" />
                  <span>{branch.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="shrink-0 text-gray-400" />
                  <span className="truncate">
                    {[branch.address, branch.city].filter(Boolean).join(", ") ||
                      "No address"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== LIST VIEW ===== */
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={branch.type === "main" ? "default" : "secondary"}
                    >
                      {branch.type === "main" ? "Main" : "Sub"}
                    </Badge>
                  </TableCell>
                  <TableCell>{branch.phone || "-"}</TableCell>
                  <TableCell>{branch.email || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {branch.address || "-"}
                  </TableCell>
                  <TableCell>{branch.city || "-"}</TableCell>
                  <TableCell>{branch.province || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(branch)}
                        className="rounded-md bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openDelete(branch)}
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
        </div>
      )}

      {/* ========== Add / Edit Modal ========== */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBranch(null);
        }}
        title={editingBranch ? "Edit Branch" : "Add Branch"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Branch Name *"
            placeholder="e.g. SM North Branch"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
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
              <option value="main">Main</option>
              <option value="sub">Sub</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              placeholder="09171234567"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="branch@auntsallys.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <Input
            label="Address"
            placeholder="123 Main Street"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <Input
              label="Zip Code"
              placeholder="1000"
              value={form.zipCode}
              onChange={(e) => set("zipCode", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                setEditingBranch(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingBranch
                  ? "Update Branch"
                  : "Add Branch"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========== Delete Confirmation ========== */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingBranch(null);
        }}
        onConfirm={handleDelete}
        branchName={deletingBranch?.name || ""}
      />
    </div>
  );
}
