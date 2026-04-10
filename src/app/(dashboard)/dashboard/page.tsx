"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  UserCheck,
  Clock,
  UserMinus,
  Pencil,
  UserPlus,
  Building2,
  Download,
  ChevronDown,
  Cake,
  ClipboardCheck,
  LogIn,
  Eye,
  Gift,
  CalendarDays,
} from "lucide-react";
import { formatDate, formatTime, getInitials } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  lateMinutes: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    avatar: string | null;
  };
}

interface BirthdayEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  birthDate: string;
  avatar: string | null;
  department: { name: string } | null;
}

interface DashboardData {
  totalEmployees: number;
  presentToday: number;
  lateArrivals: number;
  onLeave: number;
  recentAttendance: AttendanceRecord[];
  upcomingBirthdays: BirthdayEmployee[];
}

// ── Skeleton Component ───────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`}
    />
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function DashboardStatCard({
  icon: Icon,
  count,
  label,
  rate,
  color,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
  rate: number;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const palette = {
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      bar: "bg-blue-500",
      rateText: "text-blue-600",
      border: "border-blue-100",
    },
    green: {
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      bar: "bg-green-500",
      rateText: "text-green-600",
      border: "border-green-100",
    },
    yellow: {
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
      bar: "bg-yellow-500",
      rateText: "text-yellow-600",
      border: "border-yellow-100",
    },
    purple: {
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      bar: "bg-purple-500",
      rateText: "text-purple-600",
      border: "border-purple-100",
    },
  };

  const c = palette[color];

  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{count}</p>
          <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${c.iconText}`} />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-semibold ${c.rateText}`}>{rate}%</span>
          <span className="text-gray-400">rate</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Avatar Helper ────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  size = "sm",
}: {
  name: string;
  avatar: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700`}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const userName = session?.user?.name || "Admin";

  // Compute rates
  const totalEmp = data?.totalEmployees || 1;
  const presentRate = data
    ? Math.round((data.presentToday / totalEmp) * 100)
    : 0;
  const lateRate = data
    ? Math.round((data.lateArrivals / totalEmp) * 100)
    : 0;
  const leaveRate = data
    ? Math.round((data.onLeave / totalEmp) * 100)
    : 0;

  // Today's birthdays vs upcoming
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const todayBirthdays = (data?.upcomingBirthdays ?? []).filter((emp) => {
    const bd = new Date(emp.birthDate);
    const bdStr = `${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;
    return bdStr === todayStr;
  });

  const upcomingBirthdays = (data?.upcomingBirthdays ?? []).filter((emp) => {
    const bd = new Date(emp.birthDate);
    const bdStr = `${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;
    return bdStr !== todayStr;
  });

  // Late attendance records
  const lateRecords = (data?.recentAttendance ?? []).filter(
    (r) => r.status === "late"
  );

  const years = [2024, 2025, 2026, 2027];

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <Skeleton className="h-24 w-full rounded-xl" />
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
        {/* Bottom cards skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top bar: Year selector + Export ────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <button
            onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {selectedYear}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {yearDropdownOpen && (
            <div className="absolute right-0 z-20 mt-1 w-28 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setSelectedYear(y);
                    setYearDropdownOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 ${
                    y === selectedYear
                      ? "bg-emerald-50 font-semibold text-emerald-700"
                      : "text-gray-700"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
          <Download size={14} />
          Export
        </button>
      </div>

      {/* ── Welcome Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-600 p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              Welcome Back, {userName}
              <button className="rounded-full p-1 text-emerald-200 hover:bg-white/10 hover:text-white">
                <Pencil size={14} />
              </button>
            </h2>
            <p className="mt-0.5 text-sm text-emerald-100">
              Here&apos;s what&apos;s happening with your team today.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50">
            <UserPlus size={16} />
            Add Employee
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
            <Building2 size={16} />
            Add Branches
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          icon={Users}
          count={data?.totalEmployees ?? 0}
          label="Total Employees"
          rate={100}
          color="blue"
        />
        <DashboardStatCard
          icon={UserCheck}
          count={data?.presentToday ?? 0}
          label="Present Today"
          rate={presentRate}
          color="green"
        />
        <DashboardStatCard
          icon={Clock}
          count={data?.lateArrivals ?? 0}
          label="Late Arrivals"
          rate={lateRate}
          color="yellow"
        />
        <DashboardStatCard
          icon={UserMinus}
          count={data?.onLeave ?? 0}
          label="Employees on Leave"
          rate={leaveRate}
          color="purple"
        />
      </div>

      {/* ── Bottom 3 Sections ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Birthdays ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-3.5">
            <Cake size={18} className="text-white" />
            <h3 className="text-sm font-bold text-white">Birthdays</h3>
          </div>
          <div className="p-5">
            {/* Today */}
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <Gift size={14} className="text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Today
                </p>
              </div>
              {todayBirthdays.length === 0 ? (
                <p className="text-sm text-gray-400">No birthdays today</p>
              ) : (
                <div className="space-y-2.5">
                  {todayBirthdays.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3">
                      <Avatar
                        name={`${emp.firstName} ${emp.lastName}`}
                        avatar={emp.avatar}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(emp.birthDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <CalendarDays size={14} className="text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Upcoming Birthdays
                </p>
              </div>
              {upcomingBirthdays.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No upcoming birthdays
                </p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingBirthdays.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3">
                      <Avatar
                        name={`${emp.firstName} ${emp.lastName}`}
                        avatar={emp.avatar}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(emp.birthDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Attendance ─────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-3.5">
            <ClipboardCheck size={18} className="text-white" />
            <h3 className="text-sm font-bold text-white">Attendance</h3>
          </div>
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Attendance
            </p>
            <div className="space-y-3">
              {/* Present */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {data?.presentToday ?? 0}
                </span>
              </div>
              {/* Late */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-600">Late</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {data?.lateArrivals ?? 0}
                </span>
              </div>
              {/* On Leave */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-600">On Leave</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {data?.onLeave ?? 0}
                </span>
              </div>
              {/* Absent (computed) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {Math.max(
                    0,
                    (data?.totalEmployees ?? 0) -
                      (data?.presentToday ?? 0) -
                      (data?.onLeave ?? 0)
                  )}
                </span>
              </div>
            </div>

            {/* Simple bar visualization */}
            <div className="mt-5">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                {data && data.totalEmployees > 0 && (
                  <>
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${((data.presentToday - data.lateArrivals) / data.totalEmployees) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-yellow-500"
                      style={{
                        width: `${(data.lateArrivals / data.totalEmployees) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(data.onLeave / data.totalEmployees) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-400"
                      style={{
                        width: `${(Math.max(0, data.totalEmployees - data.presentToday - data.onLeave) / data.totalEmployees) * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-gray-400">
              Total: {data?.totalEmployees ?? 0} employees
            </p>
          </div>
        </div>

        {/* ── Clock-In / Out ─────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-400 px-5 py-3.5">
            <LogIn size={18} className="text-white" />
            <h3 className="text-sm font-bold text-white">Clock-In/Out</h3>
          </div>
          <div className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
              Late
            </p>
            {lateRecords.length === 0 ? (
              <p className="text-sm text-gray-400">No late arrivals today</p>
            ) : (
              <div className="space-y-3">
                {lateRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3"
                  >
                    <Avatar
                      name={`${record.employee.firstName} ${record.employee.lastName}`}
                      avatar={record.employee.avatar}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {record.employee.firstName}{" "}
                        {record.employee.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {record.clockIn
                          ? formatTime(record.clockIn)
                          : "No clock-in"}{" "}
                        &middot; {record.lateMinutes}min late
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100">
                <Eye size={14} />
                View All Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
