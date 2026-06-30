"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/components/shared/stat-card";
import type { DashboardRevenueSplit } from "@/lib/types";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

interface RevenueSplitCardProps {
  revenue: DashboardRevenueSplit | undefined;
  isLoading: boolean;
}

const PARTNER_COLORS = {
  interswitch: "#004B91",
  qriscorp: "#10B981",
};

const COMPONENT_COLORS = {
  applicationFee: "#004B91",
  interest: "#10B981",
  penalty: "#F59E0B",
  surcharge: "#EF4444",
  accrued: "#8B5CF6",
};

function DonutLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx: number; cy: number };
  total: number;
}) {
  const { cx = 0, cy = 0 } = viewBox ?? {};
  const label = formatCurrency(total, "UGX", true);

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        dy="-0.4em"
        fontSize={11}
        fill="var(--muted-foreground, #6b7280)"
        fontWeight={400}
      >
        Total
      </tspan>
      <tspan
        x={cx}
        dy="1.4em"
        fontSize={12}
        fill="var(--foreground, #111827)"
        fontWeight={600}
      >
        {label}
      </tspan>
    </text>
  );
}

export function RevenueSplitCard({
  revenue,
  isLoading,
}: RevenueSplitCardProps) {
  const [viewMode, setViewMode] = React.useState<"net" | "gross">("net");

  const isGross = viewMode === "gross";

  // Net = collected only  |  Gross = collected + accrued
  const totalEarnedRevenue = (revenue?.gross_revenue ?? 0) + (revenue?.accrued_revenue ?? 0);
  const totalInterswitch =
    (revenue?.interswitch_amount ?? 0) + (revenue?.accrued_interswitch_amount ?? 0);
  const totalQriscorp =
    (revenue?.qriscorp_amount ?? 0) + (revenue?.accrued_qriscorp_amount ?? 0);

  const partnerData = React.useMemo(() => {
    if (!revenue) return [];
    return isGross
      ? [
          {
            name: "Interswitch",
            label: `${revenue.interswitch_share_percent}%`,
            value: totalInterswitch,
            color: PARTNER_COLORS.interswitch,
          },
          {
            name: "Qriscorp",
            label: `${revenue.qriscorp_share_percent}%`,
            value: totalQriscorp,
            color: PARTNER_COLORS.qriscorp,
          },
        ]
      : [
          {
            name: "Interswitch",
            label: `${revenue.interswitch_share_percent}%`,
            value: revenue.interswitch_amount,
            color: PARTNER_COLORS.interswitch,
          },
          {
            name: "Qriscorp",
            label: `${revenue.qriscorp_share_percent}%`,
            value: revenue.qriscorp_amount,
            color: PARTNER_COLORS.qriscorp,
          },
        ];
  }, [isGross, revenue, totalInterswitch, totalQriscorp]);

  const componentData = React.useMemo(() => {
    if (!revenue) return [];
    const base = [
      {
        name: "Application Fee",
        value: revenue.application_fee_revenue,
        color: COMPONENT_COLORS.applicationFee,
      },
      {
        name: "Interest",
        value: revenue.interest_revenue,
        color: COMPONENT_COLORS.interest,
      },
      {
        name: "Penalty",
        value: revenue.penalty_revenue,
        color: COMPONENT_COLORS.penalty,
      },
      {
        name: "Surcharge",
        value: revenue.surcharge_revenue,
        color: COMPONENT_COLORS.surcharge,
      },
    ];

    if (isGross && revenue.accrued_revenue > 0) {
      base.push({
        name: "Accrued (uncollected)",
        value: revenue.accrued_revenue,
        color: COMPONENT_COLORS.accrued,
      });
    }

    return base.filter((item) => item.value > 0);
  }, [isGross, revenue]);

  if (isLoading || !revenue) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-50" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalComponentValue = componentData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const partnerTotal = partnerData.reduce((sum, p) => sum + p.value, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Split</CardTitle>
          {/* Net / Gross toggle */}
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <button
              onClick={() => setViewMode("net")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                !isGross
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Net
            </button>
            <button
              onClick={() => setViewMode("gross")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                isGross
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gross
            </button>
          </div>
        </div>
        <CardDescription>
          {isGross ? (
            <>
              Total earned{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(totalEarnedRevenue, "UGX", true)}
              </span>{" "}
              · Collected{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(revenue.gross_revenue, "UGX", true)}
              </span>{" "}
              · Accrued{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(revenue.accrued_revenue, "UGX", true)}
              </span>
            </>
          ) : (
            <>
              Collected{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(revenue.gross_revenue, "UGX", true)}
              </span>{" "}
              · Accrued{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(revenue.accrued_revenue, "UGX", true)}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Summary strip */}
        <div className="mb-4 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {isGross ? "Gross revenue" : "Net revenue"}
          </span>
          <span className="ml-auto text-sm font-semibold">
            {formatCurrency(
              isGross ? totalEarnedRevenue : revenue.qriscorp_amount,
              "UGX",
              true
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {isGross
              ? `(your ${revenue.qriscorp_share_percent}% share = ${formatCurrency(totalQriscorp, "UGX", true)})`
              : `(your ${revenue.qriscorp_share_percent}% share)`}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Partner donut with center label */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Partner share
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart key={`partner-${viewMode}`}>
                <Pie
                  data={partnerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={false}
                  isAnimationActive={false}
                >
                  {partnerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}

                  <DonutLabel total={partnerTotal} />
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0), "UGX", true),
                    String(name ?? ""),
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Inline legend */}
            <div className="mt-1 flex justify-center gap-4">
              {partnerData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {p.name}{" "}
                    <span className="font-medium text-foreground">
                      {p.label}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Component breakdown with progress bars */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              By component
            </p>
            {componentData.length > 0 ? (
              <div className="space-y-3">
                {componentData.map((item) => {
                  const pct =
                    totalComponentValue > 0
                      ? (item.value / totalComponentValue) * 100
                      : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {pct.toFixed(1)}%
                          </span>
                          <span className="w-20 sm:w-24 text-right font-medium tabular-nums">
                            {formatCurrency(item.value, "UGX", true)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-30 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No revenue this period
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}