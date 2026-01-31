"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NumberTicker from "@/components/ui/number-ticker";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Droplets,
  Flame,
  Gauge,
  Activity,
  Calendar,
  Users,
} from "lucide-react";
import { useSalesChartData } from "./hooks/useSalesChartData";
import { formatChartDate } from "@/lib/utils/dateUtils";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SalesChartData {
  date: string;
  meter_type: string;
  total_amount: number;
  user_sales: Record<string, number>;
  user_names: string[];
}

interface ChartData {
  date: string;
  [key: string]: number | string | Record<string, number>;
}

interface MeterTypeConfig {
  label: string;
  icon: React.ElementType;
  gradient: [string, string];
  bgColor: string;
  textColor: string;
  borderColor: string;
}

// ============================================================================
// Constants & Configuration
// ============================================================================

const TIME_PERIODS = [
  { value: "7d", label: "7D", fullLabel: "Last 7 Days", days: 7 },
  { value: "30d", label: "30D", fullLabel: "Last 30 Days", days: 30 },
  { value: "90d", label: "3M", fullLabel: "Last 3 Months", days: 90 },
  { value: "180d", label: "6M", fullLabel: "Last 6 Months", days: 180 },
  { value: "365d", label: "1Y", fullLabel: "Last Year", days: 365 },
  { value: "all", label: "All", fullLabel: "All Time", days: 0 },
] as const;

type TimePeriod = (typeof TIME_PERIODS)[number]["value"];

const METER_TYPES: Record<string, MeterTypeConfig> = {
  integrated: {
    label: "Integrated",
    icon: Zap,
    gradient: ["#6366F1", "#A5B4FC"],
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
  split: {
    label: "Split",
    icon: Activity,
    gradient: ["#0EA5E9", "#7DD3FC"],
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
    borderColor: "border-sky-200",
  },
  gas: {
    label: "Gas",
    icon: Flame,
    gradient: ["#F59E0B", "#FCD34D"],
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  water: {
    label: "Water",
    icon: Droplets,
    gradient: ["#06B6D4", "#67E8F9"],
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
  },
  smart: {
    label: "Smart",
    icon: Gauge,
    gradient: ["#8B5CF6", "#C4B5FD"],
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
  },
  "3 phase": {
    label: "3 Phase",
    icon: Zap,
    gradient: ["#EF4444", "#FCA5A5"],
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

function TimePeriodSelector({
  value,
  onChange,
}: Readonly<{
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}>) {
  return (
    <div className='inline-flex items-center rounded-lg bg-muted p-1 gap-1'>
      {TIME_PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            "hover:bg-background/60 cursor-pointer",
            value === period.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
          title={period.fullLabel}>
          {period.label}
        </button>
      ))}
    </div>
  );
}

function MeterTypeCard({
  type,
  config,
  count,
  isActive,
  onClick,
  trend,
}: Readonly<{
  type: string;
  config: MeterTypeConfig;
  count: number;
  isActive: boolean;
  onClick: () => void;
  trend?: number;
}>) {
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer",
        "hover:shadow-md hover:scale-[1.02]",
        isActive
          ? `${config.bgColor} ${config.borderColor} shadow-sm`
          : "bg-card border-transparent hover:border-muted",
      )}>
      {/* Active indicator */}
      {isActive && (
        <div
          className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full'
          style={{ backgroundColor: config.gradient[0] }}
        />
      )}

      <div className='flex items-center gap-2 mb-2'>
        <div
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isActive ? config.bgColor : "bg-muted",
          )}>
          <Icon
            className={cn(
              "w-4 h-4",
              isActive ? config.textColor : "text-muted-foreground",
            )}
          />
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isActive ? config.textColor : "text-muted-foreground",
          )}>
          {config.label}
        </span>
      </div>

      <div className='flex items-end gap-2'>
        {count > 0 ? (
          <NumberTicker
            value={count}
            className={cn(
              "text-2xl font-bold tabular-nums",
              isActive ? "text-foreground" : "text-foreground/80",
            )}
          />
        ) : (
          <span className='text-2xl font-bold text-muted-foreground/50'>—</span>
        )}

        {trend !== undefined && trend !== 0 && count > 0 && (
          <Badge
            variant='secondary'
            className={cn(
              "text-xs font-medium",
              trend > 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700",
            )}>
            {trend > 0 ? (
              <TrendingUp className='w-3 h-3 mr-1' />
            ) : (
              <TrendingDown className='w-3 h-3 mr-1' />
            )}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>
    </button>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const userSales = data.payload.user_sales || {};
  const config = METER_TYPES[data.dataKey as string];

  return (
    <div className='bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 min-w-[200px]'>
      {/* Header */}
      <div className='flex items-center gap-2 pb-3 mb-3 border-b border-border'>
        <Calendar className='w-4 h-4 text-muted-foreground' />
        <span className='font-semibold'>{formatChartDate(label)}</span>
      </div>

      {/* Main stat */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <div
            className='w-3 h-3 rounded-full'
            style={{ backgroundColor: config?.gradient[0] || "#6366F1" }}
          />
          <span className='text-sm text-muted-foreground capitalize'>
            {config?.label || data.dataKey}
          </span>
        </div>
        <span className='text-lg font-bold'>{data.value}</span>
      </div>

      {/* Sellers breakdown */}
      {Object.keys(userSales).length > 0 && (
        <div className='pt-3 border-t border-border'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground mb-2'>
            <Users className='w-3 h-3' />
            <span>Sales by User</span>
          </div>
          <div className='space-y-1.5'>
            {Object.entries(userSales).map(([user, amount]) => (
              <div
                key={user}
                className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground truncate max-w-[120px]'>
                  {user}
                </span>
                <span className='font-medium tabular-nums'>
                  {amount as number}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className='relative mb-6'>
        <div className='w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center'>
          <BarChart3 className='w-12 h-12 text-muted-foreground/50' />
        </div>
        <div className='absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center'>
          <TrendingUp className='w-4 h-4 text-muted-foreground animate-pulse' />
        </div>
      </div>
      <h3 className='text-lg font-semibold text-foreground mb-2'>
        No Sales Data Yet
      </h3>
      <p className='text-sm text-muted-foreground text-center max-w-[280px]'>
        Your sales chart will come to life once transactions start flowing
        through.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className='flex flex-col h-full'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between mb-6'>
        <div className='h-7 w-32 bg-muted rounded-lg animate-pulse' />
        <div className='h-9 w-48 bg-muted rounded-lg animate-pulse' />
      </div>

      {/* Cards skeleton */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6'>
        {[1, 2, 3, 4, 5, 6].map((id, i) => (
          <div
            key={id}
            className='h-24 bg-muted rounded-xl animate-pulse'
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className='flex-1 bg-muted/30 rounded-xl animate-pulse' />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface SalesBarchartProps {
  readonly initialData?: SalesChartData[];
}

export function SalesBarchart({ initialData }: SalesBarchartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeType, setActiveType] =
    useState<keyof typeof METER_TYPES>("integrated");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Calculate days based on time period
  const days = useMemo(() => {
    const period = TIME_PERIODS.find((p) => p.value === timePeriod);
    return period?.days === 0 ? 3650 : period?.days || 30;
  }, [timePeriod]);

  // Fetch data
  const { data, isLoading } = useSalesChartData(days, initialData);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Process chart data
  useEffect(() => {
    if (!isMounted || !data?.length) {
      setChartData([]);
      return;
    }

    const processedData: Record<string, ChartData> = {};

    data.forEach((row) => {
      if (!processedData[row.date]) {
        processedData[row.date] = { date: row.date };
        Object.keys(METER_TYPES).forEach((key) => {
          processedData[row.date][key] = 0;
        });
      }

      const chartKey = Object.keys(METER_TYPES).find(
        (key) => key.toLowerCase() === row.meter_type.toLowerCase(),
      );

      if (chartKey) {
        processedData[row.date][chartKey] = row.total_amount;
        processedData[row.date].user_sales = row.user_sales;
      }
    });

    const sortedData = Object.values(processedData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    setChartData(sortedData);
  }, [data, isMounted]);

  // Calculate totals
  const totals = useMemo(() => {
    return Object.keys(METER_TYPES).reduce(
      (acc, key) => {
        acc[key] = chartData.reduce(
          (sum, day) => sum + ((day[key] as number) || 0),
          0,
        );
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [chartData]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return Object.values(totals).reduce((sum, val) => sum + val, 0);
  }, [totals]);

  const handleTimePeriodChange = useCallback((value: TimePeriod) => {
    setTimePeriod(value);
  }, []);

  const activeConfig = METER_TYPES[activeType];

  if (!isMounted || isLoading) {
    return (
      <Card className='w-full h-[87vh] p-6'>
        <LoadingSkeleton />
      </Card>
    );
  }

  return (
    <Card className='w-full h-[86vh] overflow-hidden'>
      <CardContent className='p-6 h-full flex flex-col'>
        {/* Header Section */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <div>
            <h2 className='text-xl font-bold text-foreground flex items-center gap-2'>
              <BarChart3 className='w-5 h-5 text-primary' />
              Sales Analytics
            </h2>
            {grandTotal > 0 && (
              <p className='text-sm text-muted-foreground mt-1'>
                <span className='font-semibold text-foreground'>
                  {grandTotal.toLocaleString()}
                </span>{" "}
                meters sold in selected period
              </p>
            )}
          </div>
          <TimePeriodSelector
            value={timePeriod}
            onChange={handleTimePeriodChange}
          />
        </div>

        {/* Meter Type Cards */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6'>
          {Object.entries(METER_TYPES).map(([type, config]) => (
            <MeterTypeCard
              key={type}
              type={type}
              config={config}
              count={totals[type] || 0}
              isActive={activeType === type}
              onClick={() => setActiveType(type)}
            />
          ))}
        </div>

        {/* Chart Section */}
        <div className='flex-1 min-h-0'>
          {chartData.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                onMouseLeave={() => setHoveredBar(null)}>
                <defs>
                  <linearGradient
                    id='activeGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'>
                    <stop
                      offset='0%'
                      stopColor={activeConfig.gradient[0]}
                      stopOpacity={1}
                    />
                    <stop
                      offset='100%'
                      stopColor={activeConfig.gradient[1]}
                      stopOpacity={0.8}
                    />
                  </linearGradient>
                  <linearGradient
                    id='hoverGradient'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'>
                    <stop
                      offset='0%'
                      stopColor={activeConfig.gradient[0]}
                      stopOpacity={1}
                    />
                    <stop
                      offset='100%'
                      stopColor={activeConfig.gradient[0]}
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--border))'
                  vertical={false}
                />
                <XAxis
                  dataKey='date'
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar
                  dataKey={activeType}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                  onMouseEnter={(_, index) => setHoveredBar(index)}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.date}
                      fill={
                        hoveredBar === index
                          ? "url(#hoverGradient)"
                          : "url(#activeGradient)"
                      }
                      style={{
                        filter:
                          hoveredBar === index
                            ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                            : "none",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
