"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  Clock,
  Timer,
  Moon,
  AlertTriangle,
  ArrowDownRight,
  Search,
  Check,
  X,
  Plus,
  CalendarDays,
  MapPin,
  Monitor,
  Coffee,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getInitials, formatDate, formatTime } from "@/lib/utils";

// ===== TYPES =====

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes: number;
  status: string;
  lateMinutes: number;
  undertimeMinutes: number;
  nightDiffMinutes: number;
  productionHours: number;
  location?: string;
  device?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    avatar?: string;
    department?: { name: string };
  };
  shift?: {
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface AttendanceRequest {
  id: string;
  employeeId: string;
  date: string;
  requestType: string;
  requestedTime: string;
  reason: string;
  status: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    avatar?: string;
  };
  createdAt: string;
}

interface TodayAttendance {
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  lateMinutes: number;
  undertimeMinutes: number;
  nightDiffMinutes: number;
  productionHours: number;
  status: string;
}

const STATUS_COLORS: Record<string, { variant: "success" | "danger" | "warning" | "info" | "secondary"; label: string }> = {
  present: { variant: "success", label: "Present" },
  late: { variant: "warning", label: "Late" },
  absent: { variant: "danger", label: "Absent" },
  "half-day": { variant: "info", label: "Half Day" },
  "on-leave": { variant: "secondary", label: "On Leave" },
  holiday: { variant: "info", label: "Holiday" },
  "rest-day": { variant: "secondary", label: "Rest Day" },
};

const REQUEST_STATUS: Record<string, { variant: "success" | "danger" | "warning" | "secondary"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
};

// ===== LIVE CLOCK HOOK =====

function useLiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 18 ? "Good Afternoon" : "Good Evening";

  const dateStr = now.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return { greeting, dateStr, timeStr, now };
}

// ===== REQUEST ATTENDANCE MODAL =====

function RequestAttendanceModal({
  open,
  onClose,
  onSubmit,
  employeeDbId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employeeDbId: string;
}) {
  const [date, setDate] = useState("");
  const [requestType, setRequestType] = useState("clock-in");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate("");
      setRequestType("clock-in");
      setRequestedTime("");
      setReason("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !requestedTime || !reason) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      const requestedDateTime = new Date(`${date}T${requestedTime}`);
      const res = await fetch("/api/attendance/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeDbId,
          date,
          requestType,
          requestedTime: requestedDateTime.toISOString(),
          reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit request");
      }

      toast.success("Attendance request submitted");
      onSubmit();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Request Attendance</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Request Type *</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
            >
              <option value="clock-in">Clock In</option>
              <option value="clock-out">Clock Out</option>
              <option value="correction">Correction</option>
            </select>
          </div>
          <Input label="Requested Time *" type="time" value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Reason *</label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              rows={3}
              placeholder="Why are you requesting this attendance record?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====

export default function AttendancePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userEmployeeId = (session?.user as any)?.employeeId || "";

  // Clock state
  const { greeting, dateStr, timeStr } = useLiveClock();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [selectedBreak, setSelectedBreak] = useState("lunch");

  // Stats
  const [statsHoursToday, setStatsHoursToday] = useState("0.00");
  const [statsHoursWeek, setStatsHoursWeek] = useState("0.00");
  const [statsHoursMonth, setStatsHoursMonth] = useState("0.00");
  const [statsNightDiff, setStatsNightDiff] = useState("0 min");
  const [statsLate, setStatsLate] = useState("0 min");
  const [statsUndertime, setStatsUndertime] = useState("0 min");

  // Attendance table
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attTotal, setAttTotal] = useState(0);
  const [attPage, setAttPage] = useState(1);
  const [attRowsPerPage, setAttRowsPerPage] = useState(10);
  const [attSearch, setAttSearch] = useState("");
  const [attStatus, setAttStatus] = useState("");
  const [attStartDate, setAttStartDate] = useState("");
  const [attEndDate, setAttEndDate] = useState("");
  const [attLoading, setAttLoading] = useState(true);

  // Attendance requests
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(true);

  // Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Fetch today's attendance for the logged-in user
  const fetchTodayAttendance = useCallback(async () => {
    if (!userEmployeeId) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const params = new URLSearchParams({
        employeeId: userEmployeeId,
        startDate: today.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        limit: "1",
      });
      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const rec = data.data[0];
          setTodayAttendance({
            clockIn: rec.clockIn,
            clockOut: rec.clockOut,
            breakStart: rec.breakStart,
            breakEnd: rec.breakEnd,
            lateMinutes: rec.lateMinutes || 0,
            undertimeMinutes: rec.undertimeMinutes || 0,
            nightDiffMinutes: rec.nightDiffMinutes || 0,
            productionHours: rec.productionHours || 0,
            status: rec.status,
          });
          setStatsHoursToday(String(rec.productionHours?.toFixed(2) || "0.00"));
        } else {
          setTodayAttendance(null);
          setStatsHoursToday("0.00");
        }
      }
    } catch {
      // silent
    }
  }, [userEmployeeId]);

  // Fetch monthly stats
  const fetchStats = useCallback(async () => {
    if (!userEmployeeId) return;
    try {
      const now = new Date();
      // Week start (Monday)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);

      // Month start
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch week records
      const weekParams = new URLSearchParams({
        employeeId: userEmployeeId,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
        limit: "100",
      });
      const weekRes = await fetch(`/api/attendance?${weekParams.toString()}`);
      if (weekRes.ok) {
        const weekData = await weekRes.json();
        const weekHours = (weekData.data || []).reduce(
          (sum: number, r: any) => sum + (r.productionHours || 0),
          0
        );
        setStatsHoursWeek(weekHours.toFixed(2));
      }

      // Fetch month records
      const monthParams = new URLSearchParams({
        employeeId: userEmployeeId,
        startDate: monthStart.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
        limit: "100",
      });
      const monthRes = await fetch(`/api/attendance?${monthParams.toString()}`);
      if (monthRes.ok) {
        const monthData = await monthRes.json();
        const records = monthData.data || [];
        const monthHours = records.reduce(
          (sum: number, r: any) => sum + (r.productionHours || 0),
          0
        );
        const nightDiff = records.reduce(
          (sum: number, r: any) => sum + (r.nightDiffMinutes || 0),
          0
        );
        const late = records.reduce(
          (sum: number, r: any) => sum + (r.lateMinutes || 0),
          0
        );
        const undertime = records.reduce(
          (sum: number, r: any) => sum + (r.undertimeMinutes || 0),
          0
        );
        setStatsHoursMonth(monthHours.toFixed(2));
        setStatsNightDiff(`${nightDiff} min`);
        setStatsLate(`${late} min`);
        setStatsUndertime(`${undertime} min`);
      }
    } catch {
      // silent
    }
  }, [userEmployeeId]);

  useEffect(() => {
    fetchTodayAttendance();
    fetchStats();
  }, [fetchTodayAttendance, fetchStats]);

  // Fetch attendance records (admin view)
  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const params = new URLSearchParams({
        view: "admin",
        page: String(attPage),
        limit: String(attRowsPerPage),
      });
      if (attStartDate) params.set("startDate", attStartDate);
      if (attEndDate) params.set("endDate", attEndDate);
      if (attStatus) params.set("status", attStatus);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let records = data.data || [];
        // Client-side search filter
        if (attSearch) {
          const q = attSearch.toLowerCase();
          records = records.filter(
            (r: AttendanceRecord) =>
              r.employee?.firstName?.toLowerCase().includes(q) ||
              r.employee?.lastName?.toLowerCase().includes(q) ||
              r.employee?.employeeId?.toLowerCase().includes(q)
          );
        }
        setAttendanceRecords(records);
        setAttTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setAttLoading(false);
    }
  }, [attPage, attRowsPerPage, attStartDate, attEndDate, attStatus, attSearch]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Fetch attendance requests
  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const res = await fetch("/api/attendance/requests");
      if (res.ok) {
        const data = await res.json();
        // The API returns either an array or an object with data property
        const items = Array.isArray(data) ? data : data.data || [];
        // We need to fetch employee info for each request
        const enriched = await Promise.all(
          items.map(async (req: any) => {
            if (!req.employee) {
              try {
                const empRes = await fetch(`/api/employees/${req.employeeId}`);
                if (empRes.ok) {
                  const emp = await empRes.json();
                  return {
                    ...req,
                    employee: {
                      id: emp.id,
                      firstName: emp.firstName,
                      lastName: emp.lastName,
                      employeeId: emp.employeeId,
                      avatar: emp.avatar,
                    },
                  };
                }
              } catch {
                // ignore
              }
            }
            return req;
          })
        );
        setRequests(enriched);
      }
    } catch {
      toast.error("Failed to load attendance requests");
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Clock actions
  async function handleClock(action: "clock-in" | "clock-out") {
    if (!userEmployeeId) {
      toast.error("No employee record linked to your account");
      return;
    }
    setClockLoading(true);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: userEmployeeId,
          action,
          device: "Web Browser",
          location: "Office",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action}`);
      }

      toast.success(action === "clock-in" ? "Clocked in successfully" : "Clocked out successfully");
      fetchTodayAttendance();
      fetchStats();
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    } finally {
      setClockLoading(false);
    }
  }

  async function handleBreakAction(action: "break-start" | "break-end") {
    if (!userEmployeeId) return;
    setClockLoading(true);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: userEmployeeId,
          action,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process break");
      }

      toast.success(action === "break-start" ? "Break started" : "Break ended");
      fetchTodayAttendance();
    } catch (err: any) {
      toast.error(err.message || "Failed to process break");
    } finally {
      setClockLoading(false);
    }
  }

  // Handle request approve/reject
  async function handleRequestAction(requestId: string, status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/attendance/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedBy: session?.user?.name || "Admin",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update request");
      }

      toast.success(`Request ${status}`);
      fetchRequests();
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.message || "Failed to update request");
    }
  }

  const isClockedIn = !!todayAttendance?.clockIn && !todayAttendance?.clockOut;
  const isClockedOut = !!todayAttendance?.clockOut;
  const isOnBreak = !!todayAttendance?.breakStart && !todayAttendance?.breakEnd;

  const clockStatus = isClockedOut
    ? "Clocked Out"
    : isClockedIn
    ? isOnBreak
      ? "On Break"
      : "Clocked In"
    : "Not Clocked In";

  const clockStatusColor = isClockedOut
    ? "text-gray-500"
    : isClockedIn
    ? "text-emerald-600"
    : "text-red-500";

  const attTotalPages = Math.max(1, Math.ceil(attTotal / attRowsPerPage));

  return (
    <div className="space-y-6">
      {/* Top Section: Clock Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Greeting + Clock */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg bg-emerald-100 text-emerald-800">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{greeting}, {userName.split(" ")[0]}</h2>
              <p className="text-sm text-gray-500">{dateStr}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-700">{timeStr}</p>
              <p className={`mt-1 text-sm font-medium ${clockStatusColor}`}>
                {clockStatus}
                {todayAttendance?.clockIn && (
                  <span className="ml-2 text-gray-400">
                    (In: {formatTime(todayAttendance.clockIn)}
                    {todayAttendance.clockOut && ` | Out: ${formatTime(todayAttendance.clockOut)}`})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              {/* Break selector */}
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedBreak}
                  onChange={(e) => setSelectedBreak(e.target.value)}
                >
                  <option value="lunch">Lunch Break</option>
                  <option value="short">Short Break</option>
                  <option value="merienda">Merienda Break</option>
                </select>
                {isClockedIn && !isClockedOut && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBreakAction(isOnBreak ? "break-end" : "break-start")}
                    disabled={clockLoading}
                  >
                    <Coffee size={14} />
                    {isOnBreak ? "End Break" : "Start Break"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleClock("clock-in")}
                disabled={clockLoading || isClockedIn || isClockedOut}
              >
                <Clock size={16} />
                Clock In
              </Button>
              <Button
                variant="outline"
                onClick={() => handleClock("clock-out")}
                disabled={clockLoading || !isClockedIn || isClockedOut}
              >
                <Clock size={16} />
                Clock Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Hours Today"
            value={statsHoursToday}
            subtitle="hrs"
            icon={Clock}
            color="green"
          />
          <StatCard
            title="Hours Week"
            value={statsHoursWeek}
            subtitle="hrs"
            icon={Timer}
            color="teal"
          />
          <StatCard
            title="Hours Month"
            value={statsHoursMonth}
            subtitle="hrs"
            icon={CalendarDays}
            color="green"
          />
          <StatCard
            title="Night Diff"
            value={statsNightDiff}
            subtitle="this month"
            icon={Moon}
            color="yellow"
          />
          <StatCard
            title="Late"
            value={statsLate}
            subtitle="this month"
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Undertime"
            value={statsUndertime}
            subtitle="this month"
            icon={ArrowDownRight}
            color="pink"
          />
        </div>
      </div>

      {/* Tabs: Attendance / Attendance Requests */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="attendance">
              <ClipboardCheck size={16} className="mr-1.5" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="requests">
              <CalendarDays size={16} className="mr-1.5" />
              Attendance Requests
              {requests.filter((r) => r.status === "pending").length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {requests.filter((r) => r.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setRequestModalOpen(true)} size="sm">
            <Plus size={14} />
            Request Attendance
          </Button>
        </div>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Filters */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search employee..."
                    value={attSearch}
                    onChange={(e) => setAttSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Input
                  type="date"
                  value={attStartDate}
                  onChange={(e) => { setAttStartDate(e.target.value); setAttPage(1); }}
                  className="w-auto"
                />
                <span className="text-sm text-gray-400">to</span>
                <Input
                  type="date"
                  value={attEndDate}
                  onChange={(e) => { setAttEndDate(e.target.value); setAttPage(1); }}
                  className="w-auto"
                />
                <select
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={attStatus}
                  onChange={(e) => { setAttStatus(e.target.value); setAttPage(1); }}
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clock In</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Break</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clock Out</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Late</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Prod. Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attLoading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                          <span>Loading attendance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-16 text-center text-gray-500">
                        <ClipboardCheck size={40} className="mx-auto mb-2 text-gray-300" />
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((rec) => {
                      const st = STATUS_COLORS[rec.status] || { variant: "secondary" as const, label: rec.status };
                      return (
                        <tr key={rec.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {rec.employee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  {rec.employee.avatar && <AvatarImage src={rec.employee.avatar} />}
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(`${rec.employee.firstName} ${rec.employee.lastName}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {rec.employee.firstName} {rec.employee.lastName}
                                  </p>
                                  <p className="text-[10px] text-gray-400">{rec.employee.employeeId}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(rec.date)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {rec.shift ? `${rec.shift.name} (${rec.shift.startTime}-${rec.shift.endTime})` : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {rec.clockIn ? formatTime(rec.clockIn) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{rec.breakMinutes} min</td>
                          <td className="px-4 py-3 text-gray-600">
                            {rec.clockOut ? formatTime(rec.clockOut) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {rec.lateMinutes > 0 ? (
                              <span className="text-red-600 font-medium">{rec.lateMinutes} min</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {rec.location ? (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {rec.location}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {rec.device ? (
                              <span className="flex items-center gap-1">
                                <Monitor size={12} />
                                {rec.device}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {rec.productionHours > 0 ? `${rec.productionHours.toFixed(2)} hrs` : "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!attLoading && attendanceRecords.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rows per page:</span>
                  <select
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={attRowsPerPage}
                    onChange={(e) => { setAttRowsPerPage(Number(e.target.value)); setAttPage(1); }}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">
                    Showing {Math.min((attPage - 1) * attRowsPerPage + 1, attTotal)}-{Math.min(attPage * attRowsPerPage, attTotal)} of {attTotal}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setAttPage((p) => Math.max(1, p - 1))} disabled={attPage <= 1}>
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: attTotalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === attTotalPages || Math.abs(p - attPage) <= 1)
                    .reduce<(number | "dots")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("dots");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "dots" ? (
                        <span key={`d-${idx}`} className="px-2 text-sm text-gray-400">...</span>
                      ) : (
                        <Button key={item} variant={attPage === item ? "default" : "outline"} size="sm" className="min-w-[2rem]" onClick={() => setAttPage(item as number)}>
                          {item}
                        </Button>
                      )
                    )}
                  <Button variant="outline" size="sm" onClick={() => setAttPage((p) => Math.min(attTotalPages, p + 1))} disabled={attPage >= attTotalPages}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Attendance Requests Tab */}
        <TabsContent value="requests">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Requested Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reqLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                          <span>Loading requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                        <CalendarDays size={40} className="mx-auto mb-2 text-gray-300" />
                        No attendance requests
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => {
                      const rs = REQUEST_STATUS[req.status] || { variant: "secondary" as const, label: req.status };
                      return (
                        <tr key={req.id} className="border-b border-gray-200 transition-colors hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {req.employee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  {req.employee.avatar && <AvatarImage src={req.employee.avatar} />}
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(`${req.employee.firstName} ${req.employee.lastName}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-gray-900">
                                  {req.employee.firstName} {req.employee.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">{req.employeeId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(req.date)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="info">
                              {req.requestType === "clock-in" ? "Clock In" : req.requestType === "clock-out" ? "Clock Out" : "Correction"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{formatTime(req.requestedTime)}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-gray-600" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={rs.variant}>{rs.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {req.status === "pending" ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRequestAction(req.id, "approved")}
                                  className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleRequestAction(req.id, "rejected")}
                                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Attendance Modal */}
      <RequestAttendanceModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={fetchRequests}
        employeeDbId={userEmployeeId}
      />
    </div>
  );
}
