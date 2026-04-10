"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Filter,
  X,
  Package,
  Laptop,
  Monitor,
  Smartphone,
  Armchair,
  Car,
  Edit,
  Trash2,
  UserPlus,
  RotateCcw,
  Loader2,
  Hash,
  Tag,
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
type AssetCategory = "Laptop" | "Monitor" | "Phone" | "Furniture" | "Vehicle";
type AssetCondition = "New" | "Good" | "Fair" | "Poor";
type AssetStatus = "available" | "assigned" | "maintenance" | "disposed";

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  condition: AssetCondition;
  status: AssetStatus;
  notes: string;
}

interface AssetAssignment {
  id: string;
  assetId: string;
  assetName: string;
  assetCode: string;
  employeeName: string;
  employeeId: string;
  assignedDate: string;
  returnedDate: string | null;
  condition: AssetCondition;
  notes: string;
}

interface Employee {
  id: string;
  name: string;
}

/* ---------- Helpers ---------- */
function assetStatusVariant(status: AssetStatus) {
  switch (status) {
    case "available":
      return "success" as const;
    case "assigned":
      return "info" as const;
    case "maintenance":
      return "warning" as const;
    case "disposed":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

function conditionVariant(condition: AssetCondition) {
  switch (condition) {
    case "New":
      return "success" as const;
    case "Good":
      return "info" as const;
    case "Fair":
      return "warning" as const;
    case "Poor":
      return "danger" as const;
    default:
      return "secondary" as const;
  }
}

function categoryIcon(category: AssetCategory) {
  switch (category) {
    case "Laptop":
      return <Laptop size={14} />;
    case "Monitor":
      return <Monitor size={14} />;
    case "Phone":
      return <Smartphone size={14} />;
    case "Furniture":
      return <Armchair size={14} />;
    case "Vehicle":
      return <Car size={14} />;
    default:
      return <Package size={14} />;
  }
}

function generateAssetCode(category: AssetCategory): string {
  const prefix = {
    Laptop: "LAP",
    Monitor: "MON",
    Phone: "PHN",
    Furniture: "FUR",
    Vehicle: "VEH",
  };
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix[category]}-${num}`;
}

/* ---------- Mock data ---------- */
const mockEmployees: Employee[] = [
  { id: "1", name: "Maria Santos" },
  { id: "2", name: "Juan Dela Cruz" },
  { id: "3", name: "Ana Reyes" },
  { id: "4", name: "Pedro Garcia" },
  { id: "5", name: "Rosa Mendoza" },
];

const mockAssets: Asset[] = [
  { id: "1", assetCode: "LAP-1001", name: "MacBook Pro 14\"", category: "Laptop", brand: "Apple", model: "M3 Pro", serialNumber: "C02X12345678", purchaseDate: "2025-06-15", purchasePrice: 125000, condition: "Good", status: "assigned", notes: "Issued to dev team" },
  { id: "2", assetCode: "LAP-1002", name: "ThinkPad X1 Carbon", category: "Laptop", brand: "Lenovo", model: "Gen 11", serialNumber: "PF3ABCDE", purchaseDate: "2025-08-20", purchasePrice: 85000, condition: "New", status: "available", notes: "" },
  { id: "3", assetCode: "MON-2001", name: "UltraSharp 27\"", category: "Monitor", brand: "Dell", model: "U2723QE", serialNumber: "CN0DELL27001", purchaseDate: "2025-03-10", purchasePrice: 32000, condition: "Good", status: "assigned", notes: "4K monitor" },
  { id: "4", assetCode: "PHN-3001", name: "iPhone 15 Pro", category: "Phone", brand: "Apple", model: "A3090", serialNumber: "DNQX12345", purchaseDate: "2025-11-01", purchasePrice: 72000, condition: "New", status: "available", notes: "For management" },
  { id: "5", assetCode: "FUR-4001", name: "Ergonomic Chair", category: "Furniture", brand: "Herman Miller", model: "Aeron", serialNumber: "HM-AE-0051", purchaseDate: "2024-12-01", purchasePrice: 65000, condition: "Fair", status: "maintenance", notes: "Gas lift needs replacement" },
  { id: "6", assetCode: "VEH-5001", name: "Company Van", category: "Vehicle", brand: "Toyota", model: "HiAce", serialNumber: "JTFHX123456", purchaseDate: "2024-01-15", purchasePrice: 1800000, condition: "Good", status: "assigned", notes: "For deliveries" },
  { id: "7", assetCode: "LAP-1003", name: "Dell Latitude 5540", category: "Laptop", brand: "Dell", model: "5540", serialNumber: "SVC-DL5540-01", purchaseDate: "2025-02-28", purchasePrice: 62000, condition: "Poor", status: "disposed", notes: "Screen damaged beyond repair" },
];

const mockAssignments: AssetAssignment[] = [
  { id: "1", assetId: "1", assetName: "MacBook Pro 14\"", assetCode: "LAP-1001", employeeName: "Maria Santos", employeeId: "1", assignedDate: "2025-07-01", returnedDate: null, condition: "Good", notes: "Primary work laptop" },
  { id: "2", assetId: "3", assetName: "UltraSharp 27\"", assetCode: "MON-2001", employeeName: "Maria Santos", employeeId: "1", assignedDate: "2025-07-01", returnedDate: null, condition: "Good", notes: "Desk monitor" },
  { id: "3", assetId: "6", assetName: "Company Van", assetCode: "VEH-5001", employeeName: "Pedro Garcia", employeeId: "4", assignedDate: "2024-02-01", returnedDate: null, condition: "Good", notes: "Assigned for logistics" },
  { id: "4", assetId: "7", assetName: "Dell Latitude 5540", assetCode: "LAP-1003", employeeName: "Juan Dela Cruz", employeeId: "2", assignedDate: "2025-03-15", returnedDate: "2026-01-10", condition: "Poor", notes: "Returned - screen damage" },
];

/* ---------- Modal Component ---------- */
function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative z-10 w-full rounded-xl bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
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
export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [loading, setLoading] = useState(true);

  /* Filters - assets */
  const [searchAsset, setSearchAsset] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /* Modals */
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);

  /* Asset form */
  const [afCode, setAfCode] = useState("");
  const [afName, setAfName] = useState("");
  const [afCategory, setAfCategory] = useState<AssetCategory>("Laptop");
  const [afBrand, setAfBrand] = useState("");
  const [afModel, setAfModel] = useState("");
  const [afSerial, setAfSerial] = useState("");
  const [afPurchaseDate, setAfPurchaseDate] = useState("");
  const [afPrice, setAfPrice] = useState("");
  const [afCondition, setAfCondition] = useState<AssetCondition>("New");
  const [afNotes, setAfNotes] = useState("");

  /* Assign form */
  const [assignEmployee, setAssignEmployee] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  /* ---------- Fetch data ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetRes, assignRes] = await Promise.allSettled([
        fetch("/api/assets"),
        fetch("/api/assets/assign"),
      ]);

      if (assetRes.status === "fulfilled" && assetRes.value.ok) {
        const json = await assetRes.value.json();
        setAssets(Array.isArray(json) ? json : json.data ?? []);
      } else {
        setAssets(mockAssets);
      }

      if (assignRes.status === "fulfilled" && assignRes.value.ok) {
        const json = await assignRes.value.json();
        setAssignments(Array.isArray(json) ? json : json.data ?? []);
      } else {
        setAssignments(mockAssignments);
      }
    } catch {
      setAssets(mockAssets);
      setAssignments(mockAssignments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Filtered assets ---------- */
  const filteredAssets = assets.filter((a) => {
    if (
      searchAsset &&
      !a.name.toLowerCase().includes(searchAsset.toLowerCase()) &&
      !a.assetCode.toLowerCase().includes(searchAsset.toLowerCase()) &&
      !a.serialNumber.toLowerCase().includes(searchAsset.toLowerCase())
    )
      return false;
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  /* ---------- Asset CRUD ---------- */
  function openAddAsset() {
    setEditingAsset(null);
    const code = generateAssetCode("Laptop");
    setAfCode(code);
    setAfName("");
    setAfCategory("Laptop");
    setAfBrand("");
    setAfModel("");
    setAfSerial("");
    setAfPurchaseDate("");
    setAfPrice("");
    setAfCondition("New");
    setAfNotes("");
    setAssetModalOpen(true);
  }

  function openEditAsset(asset: Asset) {
    setEditingAsset(asset);
    setAfCode(asset.assetCode);
    setAfName(asset.name);
    setAfCategory(asset.category);
    setAfBrand(asset.brand);
    setAfModel(asset.model);
    setAfSerial(asset.serialNumber);
    setAfPurchaseDate(asset.purchaseDate);
    setAfPrice(String(asset.purchasePrice));
    setAfCondition(asset.condition);
    setAfNotes(asset.notes);
    setAssetModalOpen(true);
  }

  async function handleSaveAsset() {
    if (!afCode || !afName || !afBrand || !afModel) {
      toast.error("Please fill in the required fields");
      return;
    }
    const payload = {
      assetCode: afCode,
      name: afName,
      category: afCategory,
      brand: afBrand,
      model: afModel,
      serialNumber: afSerial,
      purchaseDate: afPurchaseDate,
      purchasePrice: parseFloat(afPrice) || 0,
      condition: afCondition,
      notes: afNotes,
      status: editingAsset ? editingAsset.status : ("available" as AssetStatus),
    };

    if (editingAsset) {
      try {
        await fetch(`/api/assets/${editingAsset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* fallback */
      }
      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? { ...a, ...payload } : a))
      );
      toast.success("Asset updated");
    } else {
      const newAsset: Asset = { id: String(Date.now()), ...payload };
      try {
        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setAssets((prev) => [...prev, data]);
        } else {
          setAssets((prev) => [...prev, newAsset]);
        }
      } catch {
        setAssets((prev) => [...prev, newAsset]);
      }
      toast.success("Asset added");
    }
    setAssetModalOpen(false);
  }

  async function handleDeleteAsset(id: string) {
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
    } catch {
      /* fallback */
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Asset deleted");
  }

  /* ---------- Assign asset ---------- */
  function openAssignModal(asset: Asset) {
    setAssigningAsset(asset);
    setAssignEmployee("");
    setAssignNotes("");
    setAssignModalOpen(true);
  }

  async function handleAssignAsset() {
    if (!assigningAsset || !assignEmployee) {
      toast.error("Please select an employee");
      return;
    }
    const emp = employees.find((e) => e.id === assignEmployee);
    const newAssignment: AssetAssignment = {
      id: String(Date.now()),
      assetId: assigningAsset.id,
      assetName: assigningAsset.name,
      assetCode: assigningAsset.assetCode,
      employeeName: emp?.name ?? "",
      employeeId: assignEmployee,
      assignedDate: new Date().toISOString().split("T")[0],
      returnedDate: null,
      condition: assigningAsset.condition,
      notes: assignNotes,
    };

    try {
      const res = await fetch("/api/assets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: assigningAsset.id, employeeId: assignEmployee }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments((prev) => [data, ...prev]);
      } else {
        setAssignments((prev) => [newAssignment, ...prev]);
      }
    } catch {
      setAssignments((prev) => [newAssignment, ...prev]);
    }

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assigningAsset.id ? { ...a, status: "assigned" as AssetStatus } : a
      )
    );

    toast.success(`Asset assigned to ${emp?.name}`);
    setAssignModalOpen(false);
  }

  /* ---------- Return asset ---------- */
  async function handleReturnAsset(assignment: AssetAssignment) {
    const today = new Date().toISOString().split("T")[0];
    try {
      await fetch("/api/assets/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: assignment.assetId, employeeId: assignment.employeeId }),
      });
    } catch {
      /* fallback */
    }

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignment.id ? { ...a, returnedDate: today } : a
      )
    );

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assignment.assetId ? { ...a, status: "available" as AssetStatus } : a
      )
    );

    toast.success("Asset returned successfully");
  }

  /* ---------- Stats ---------- */
  const availableCount = assets.filter((a) => a.status === "available").length;
  const assignedCount = assets.filter((a) => a.status === "assigned").length;
  const maintenanceCount = assets.filter((a) => a.status === "maintenance").length;
  const disposedCount = assets.filter((a) => a.status === "disposed").length;

  /* ---------- Auto-generate code on category change ---------- */
  function handleCategoryChange(cat: AssetCategory) {
    setAfCategory(cat);
    if (!editingAsset) {
      setAfCode(generateAssetCode(cat));
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track company assets, assignments, and maintenance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Package size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-xl font-bold text-gray-900">{availableCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <UserPlus size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned</p>
              <p className="text-xl font-bold text-gray-900">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <RotateCcw size={18} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Maintenance</p>
              <p className="text-xl font-bold text-gray-900">{maintenanceCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Trash2 size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Disposed</p>
              <p className="text-xl font-bold text-gray-900">{disposedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets" className="gap-1.5">
            <Package size={14} /> Assets
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5">
            <UserPlus size={14} /> Assignments
          </TabsTrigger>
        </TabsList>

        {/* =================== Assets Tab =================== */}
        <TabsContent value="assets">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>All Assets</CardTitle>
              <Button onClick={openAddAsset} className="gap-1.5">
                <Plus size={16} /> Add Asset
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
                    placeholder="Search name, code, serial..."
                    value={searchAsset}
                    onChange={(e) => setSearchAsset(e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Phone">Phone</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicle">Vehicle</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag size={14} className="text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="disposed">Disposed</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {filteredAssets.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No assets found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand / Model</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-gray-600">
                            <Hash size={12} />
                            {a.assetCode}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            {categoryIcon(a.category)}
                            {a.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          {a.brand} {a.model}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{a.serialNumber}</TableCell>
                        <TableCell>
                          <Badge variant={conditionVariant(a.condition)}>{a.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assetStatusVariant(a.status)}>
                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditAsset(a)}
                              className="rounded-md bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            {a.status === "available" && (
                              <button
                                onClick={() => openAssignModal(a)}
                                className="rounded-md bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100"
                                title="Assign"
                              >
                                <UserPlus size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAsset(a.id)}
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

        {/* =================== Assignments Tab =================== */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-600" />
                Asset Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  No asset assignments found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Returned Date</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{a.assetName}</span>
                            <br />
                            <span className="font-mono text-xs text-gray-400">{a.assetCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{a.employeeName}</TableCell>
                        <TableCell>{a.assignedDate}</TableCell>
                        <TableCell>
                          {a.returnedDate ? (
                            a.returnedDate
                          ) : (
                            <Badge variant="info">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={conditionVariant(a.condition)}>{a.condition}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm text-gray-500">
                          {a.notes || "--"}
                        </TableCell>
                        <TableCell>
                          {!a.returnedDate ? (
                            <button
                              onClick={() => handleReturnAsset(a)}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                            >
                              <RotateCcw size={12} />
                              Return
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Returned</span>
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
      </Tabs>

      {/* ========== Add/Edit Asset Modal ========== */}
      <Modal
        open={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        title={editingAsset ? "Edit Asset" : "Add Asset"}
        wide
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Asset Code</label>
              <input
                type="text"
                value={afCode}
                onChange={(e) => setAfCode(e.target.value)}
                readOnly={!editingAsset}
                className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Input
              label="Name"
              value={afName}
              onChange={(e) => setAfName(e.target.value)}
              placeholder="e.g. MacBook Pro 14 inch"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={afCategory}
                onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Laptop">Laptop</option>
                <option value="Monitor">Monitor</option>
                <option value="Phone">Phone</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicle">Vehicle</option>
              </select>
            </div>
            <Input
              label="Brand"
              value={afBrand}
              onChange={(e) => setAfBrand(e.target.value)}
              placeholder="e.g. Apple"
            />
            <Input
              label="Model"
              value={afModel}
              onChange={(e) => setAfModel(e.target.value)}
              placeholder="e.g. M3 Pro"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Serial Number"
              value={afSerial}
              onChange={(e) => setAfSerial(e.target.value)}
              placeholder="Serial number..."
            />
            <Input
              label="Purchase Date"
              type="date"
              value={afPurchaseDate}
              onChange={(e) => setAfPurchaseDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Price"
              type="number"
              value={afPrice}
              onChange={(e) => setAfPrice(e.target.value)}
              placeholder="0.00"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Condition</label>
              <select
                value={afCondition}
                onChange={(e) => setAfCondition(e.target.value as AssetCondition)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={afNotes}
              onChange={(e) => setAfNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssetModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset}>
              {editingAsset ? "Update" : "Add"} Asset
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========== Assign Asset Modal ========== */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Asset"
      >
        <div className="space-y-4">
          {assigningAsset && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">{assigningAsset.name}</p>
              <p className="mt-0.5 font-mono text-xs text-gray-400">{assigningAsset.assetCode}</p>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Assign To</label>
            <select
              value={assignEmployee}
              onChange={(e) => setAssignEmployee(e.target.value)}
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
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Assignment notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignAsset}>Assign Asset</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
