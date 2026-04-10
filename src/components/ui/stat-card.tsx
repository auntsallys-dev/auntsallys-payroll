import * as React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

const colorVariants = {
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    value: "text-green-700",
    border: "border-green-200",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    value: "text-red-700",
    border: "border-red-200",
  },
  yellow: {
    bg: "bg-yellow-50",
    icon: "bg-yellow-100 text-yellow-600",
    value: "text-yellow-700",
    border: "border-yellow-200",
  },
  teal: {
    bg: "bg-teal-50",
    icon: "bg-teal-100 text-teal-600",
    value: "text-teal-700",
    border: "border-teal-200",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "bg-pink-100 text-pink-600",
    value: "text-pink-700",
    border: "border-pink-200",
  },
} as const;

export type StatCardColor = keyof typeof colorVariants;

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: StatCardColor;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon: Icon, color = "teal", ...props }, ref) => {
    const colors = colorVariants[color];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-white p-5 shadow-sm",
          colors.border,
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={cn("mt-2 text-3xl font-bold", colors.value)}>
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                colors.icon
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

export { StatCard };
