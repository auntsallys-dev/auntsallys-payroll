"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  Clock,
  ClipboardCheck,
  Timer,
  Settings,
  CalendarClock,
  FileText,
  ListChecks,
  Briefcase,
  Package,
  Wallet,
  Receipt,
  Landmark,
  UserCog,
  Cog,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavSubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard size={18} />,
      },
    ],
  },
  {
    title: "HRM",
    items: [
      {
        label: "Branch",
        href: "/branches",
        icon: <Building2 size={18} />,
      },
      {
        label: "Employees",
        href: "/employees",
        icon: <Users size={18} />,
      },
      {
        label: "Holidays",
        href: "/holidays",
        icon: <CalendarDays size={18} />,
      },
    ],
  },
  {
    title: "Attendance",
    items: [
      {
        label: "Attendance",
        icon: <ClipboardCheck size={18} />,
        subItems: [
          { label: "Admin", href: "/attendance?view=admin" },
          { label: "Employee", href: "/attendance?view=employee" },
        ],
      },
      {
        label: "Shift & Schedule",
        href: "/shifts",
        icon: <CalendarClock size={18} />,
      },
      {
        label: "Overtime",
        icon: <Timer size={18} />,
        subItems: [
          { label: "Admin", href: "/overtime?view=admin" },
          { label: "Employee", href: "/overtime?view=employee" },
        ],
      },
      {
        label: "Attendance Settings",
        href: "/settings?tab=attendance",
        icon: <Clock size={18} />,
      },
    ],
  },
  {
    title: "Leaves",
    items: [
      {
        label: "Leave Requests",
        href: "/leaves",
        icon: <FileText size={18} />,
      },
      {
        label: "Leave Types",
        href: "/leaves?tab=types",
        icon: <ListChecks size={18} />,
      },
    ],
  },
  {
    title: "Official Business",
    items: [
      {
        label: "OB Requests",
        href: "/official-business",
        icon: <Briefcase size={18} />,
      },
    ],
  },
  {
    title: "Assets",
    items: [
      {
        label: "Asset Management",
        href: "/assets",
        icon: <Package size={18} />,
      },
    ],
  },
  {
    title: "Finance & Accounts",
    items: [
      {
        label: "Payroll",
        href: "/payroll",
        icon: <Wallet size={18} />,
      },
      {
        label: "Payslip",
        href: "/payslips",
        icon: <Receipt size={18} />,
      },
      {
        label: "Bank",
        href: "/settings?tab=bank",
        icon: <Landmark size={18} />,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "User Management",
        href: "/users",
        icon: <UserCog size={18} />,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: <Cog size={18} />,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  function toggleExpand(label: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  function isActive(href: string): boolean {
    if (href.includes("?")) {
      const basePath = href.split("?")[0];
      return pathname === basePath || pathname.startsWith(basePath + "/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  function isSubItemActive(subItems: NavSubItem[]): boolean {
    return subItems.some((sub) => isActive(sub.href));
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-y-auto text-white" style={{background: 'linear-gradient(180deg, #0a5c5a 0%, #0ABAB5 100%)'}}>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/20 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          <span className="text-xl">🧺</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">
            Aunt Sally&apos;s
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/60">
            Payroll
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const hasSubItems = !!item.subItems && item.subItems.length > 0;
                const isExpanded = expandedItems[item.label] ?? false;
                const itemIsActive = item.href
                  ? isActive(item.href)
                  : hasSubItems && isSubItemActive(item.subItems!);

                return (
                  <li key={item.label}>
                    {hasSubItems ? (
                      <>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                            itemIsActive
                              ? "bg-white/20 text-white shadow-sm"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="flex-1 text-left">{item.label}</span>
                          {isExpanded ? (
                            <ChevronDown size={14} className="opacity-50" />
                          ) : (
                            <ChevronRight size={14} className="opacity-50" />
                          )}
                        </button>
                        {isExpanded && (
                          <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-4">
                            {item.subItems!.map((sub) => (
                              <li key={sub.label}>
                                <Link
                                  href={sub.href}
                                  className={cn(
                                    "block rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                                    isActive(sub.href)
                                      ? "bg-white/20 text-white"
                                      : "text-white/50 hover:bg-white/10 hover:text-white"
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href!}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                          itemIsActive
                            ? "bg-white/20 text-white shadow-sm"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/20 px-5 py-3">
        <p className="text-center text-[10px] text-white/30">
          &copy; 2026 Aunt Sally&apos;s Laundry
        </p>
      </div>
    </aside>
  );
}
