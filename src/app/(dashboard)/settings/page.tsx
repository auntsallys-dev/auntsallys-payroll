"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Wallet,
  Clock,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Hash,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Settings {
  [key: string]: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const json = await res.json();
      // Convert array of {key, value} to object
      const map: Settings = {};
      const data = json.settings || json.data || json;
      if (Array.isArray(data)) {
        data.forEach((s: { key: string; value: string }) => {
          map[s.key] = s.value;
        });
      } else if (typeof data === "object") {
        Object.assign(map, data);
      }
      setSettings(map);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSection = async (section: string, keys: string[]) => {
    setSavingSection(section);
    try {
      const payload = keys.map((key) => ({
        key,
        value: settings[key] || "",
        category: section,
      }));
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSection(null);
    }
  };

  const companyKeys = [
    "company_name",
    "company_address",
    "company_city",
    "company_province",
    "company_zip",
    "company_phone",
    "company_email",
    "company_tin",
    "company_logo",
  ];

  const payrollKeys = [
    "payroll_default_frequency",
    "payroll_working_days_per_month",
    "payroll_13th_month_auto",
    "payroll_sss_enabled",
    "payroll_philhealth_enabled",
    "payroll_pagibig_enabled",
  ];

  const attendanceKeys = [
    "attendance_grace_period",
    "attendance_gps_tracking",
    "attendance_photo_capture",
    "attendance_auto_overtime",
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure company, payroll, and attendance settings
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Company Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Company Name"
                    placeholder="Enter company name"
                    value={settings.company_name || ""}
                    onChange={(e) => updateSetting("company_name", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Address"
                    placeholder="Street address"
                    value={settings.company_address || ""}
                    onChange={(e) =>
                      updateSetting("company_address", e.target.value)
                    }
                  />
                </div>
                <Input
                  label="City"
                  placeholder="City"
                  value={settings.company_city || ""}
                  onChange={(e) => updateSetting("company_city", e.target.value)}
                />
                <Input
                  label="Province"
                  placeholder="Province"
                  value={settings.company_province || ""}
                  onChange={(e) =>
                    updateSetting("company_province", e.target.value)
                  }
                />
                <Input
                  label="ZIP Code"
                  placeholder="ZIP Code"
                  value={settings.company_zip || ""}
                  onChange={(e) => updateSetting("company_zip", e.target.value)}
                />
                <Input
                  label="Phone"
                  placeholder="+63 XXX XXX XXXX"
                  value={settings.company_phone || ""}
                  onChange={(e) =>
                    updateSetting("company_phone", e.target.value)
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="company@example.com"
                  value={settings.company_email || ""}
                  onChange={(e) =>
                    updateSetting("company_email", e.target.value)
                  }
                />
                <Input
                  label="TIN"
                  placeholder="XXX-XXX-XXX-XXX"
                  value={settings.company_tin || ""}
                  onChange={(e) => updateSetting("company_tin", e.target.value)}
                />
              </div>

              {/* Logo Upload Placeholder */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Company Logo
                </label>
                <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-4">
                <Button
                  onClick={() => saveSection("company", companyKeys)}
                  disabled={savingSection === "company"}
                >
                  {savingSection === "company" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Settings Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                Payroll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Default Pay Frequency
                  </label>
                  <Select
                    value={settings.payroll_default_frequency || "semi-monthly"}
                    onValueChange={(val) =>
                      updateSetting("payroll_default_frequency", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  label="Working Days per Month"
                  type="number"
                  placeholder="22"
                  value={settings.payroll_working_days_per_month || "22"}
                  onChange={(e) =>
                    updateSetting("payroll_working_days_per_month", e.target.value)
                  }
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Auto-Computation
                </h3>
                <ToggleSetting
                  label="Auto-compute 13th Month Pay"
                  description="Automatically compute 13th month pay based on year-to-date basic salary"
                  checked={settings.payroll_13th_month_auto === "true"}
                  onChange={(val) =>
                    updateSetting("payroll_13th_month_auto", val ? "true" : "false")
                  }
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Government Contributions
                </h3>
                <ToggleSetting
                  label="SSS Contribution"
                  description="Enable automatic SSS contribution deduction"
                  checked={settings.payroll_sss_enabled !== "false"}
                  onChange={(val) =>
                    updateSetting("payroll_sss_enabled", val ? "true" : "false")
                  }
                />
                <ToggleSetting
                  label="PhilHealth Contribution"
                  description="Enable automatic PhilHealth contribution deduction"
                  checked={settings.payroll_philhealth_enabled !== "false"}
                  onChange={(val) =>
                    updateSetting(
                      "payroll_philhealth_enabled",
                      val ? "true" : "false"
                    )
                  }
                />
                <ToggleSetting
                  label="Pag-IBIG Contribution"
                  description="Enable automatic Pag-IBIG contribution deduction"
                  checked={settings.payroll_pagibig_enabled !== "false"}
                  onChange={(val) =>
                    updateSetting(
                      "payroll_pagibig_enabled",
                      val ? "true" : "false"
                    )
                  }
                />
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-4">
                <Button
                  onClick={() => saveSection("payroll", payrollKeys)}
                  disabled={savingSection === "payroll"}
                >
                  {savingSection === "payroll" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Payroll Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Settings Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Attendance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Default Grace Period (minutes)"
                  type="number"
                  placeholder="15"
                  value={settings.attendance_grace_period || "15"}
                  onChange={(e) =>
                    updateSetting("attendance_grace_period", e.target.value)
                  }
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Tracking Options
                </h3>
                <ToggleSetting
                  label="Enable GPS Tracking"
                  description="Require GPS location data when employees clock in/out"
                  checked={settings.attendance_gps_tracking === "true"}
                  onChange={(val) =>
                    updateSetting(
                      "attendance_gps_tracking",
                      val ? "true" : "false"
                    )
                  }
                />
                <ToggleSetting
                  label="Enable Photo Capture"
                  description="Require selfie photo when employees clock in/out"
                  checked={settings.attendance_photo_capture === "true"}
                  onChange={(val) =>
                    updateSetting(
                      "attendance_photo_capture",
                      val ? "true" : "false"
                    )
                  }
                />
                <ToggleSetting
                  label="Auto-compute Overtime"
                  description="Automatically compute overtime based on clock-out time exceeding shift end"
                  checked={settings.attendance_auto_overtime === "true"}
                  onChange={(val) =>
                    updateSetting(
                      "attendance_auto_overtime",
                      val ? "true" : "false"
                    )
                  }
                />
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-4">
                <Button
                  onClick={() => saveSection("attendance", attendanceKeys)}
                  disabled={savingSection === "attendance"}
                >
                  {savingSection === "attendance" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Attendance Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          checked ? "bg-emerald-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
