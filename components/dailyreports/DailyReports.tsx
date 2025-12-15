"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesData } from "./hooks/useSalesData";
import {
  useRemainingMetersByType,
  useAgentInventory,
  useFaultyMetersByType,
} from "./hooks/useReportsData";
import { SalesTable } from "./SalesTable";
import { DailyReportsFilters } from "./DailyReportsFilters";
import { DailyReportsSummary } from "./DailyReportsSummary";
import type {
  DateRange,
  SaleWithMeters,
} from "@/components/dailyreports/types";
import { ErrorBoundary } from "./ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Package, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { pdf } from "@react-pdf/renderer";
import StockSummaryPDF from "@/components/sharedcomponents/StockSummaryPDF";
import SalesBreakdownPDF from "@/components/sharedcomponents/SalesBreakdownPDF";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/utils/dateUtils";

interface DailyReportsProps {
  selectedDateRange: DateRange | null;
  setSelectedDateRange: (range: DateRange | null) => void;
}

const METER_TYPES = [
  "integrated",
  "split",
  "gas",
  "water",
  "smart",
  "3 phase",
] as const;
type MeterType = (typeof METER_TYPES)[number];

interface RemainingMetersByType {
  type: MeterType;
  remaining_meters: number;
}

interface AgentInventory {
  type: MeterType;
  with_agents: number;
}

interface FaultyMetersByType {
  type: MeterType;
  faulty_count: number;
}

export default function DailyReports({
  selectedDateRange,
  setSelectedDateRange,
}: DailyReportsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUser, setSearchUser] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const itemsPerPage = 10;

  const { salesData, isLoading, isFetching, isError, error, refetch } =
    useSalesData();

  // Use React Query hooks instead of useEffect - shares cache with parent
  const remainingMetersQuery = useRemainingMetersByType();
  const agentInventoryQuery = useAgentInventory();
  const faultyMetersQuery = useFaultyMetersByType();

  // Normalize data with memoization
  const remainingMetersByType = useMemo(() => {
    const rawData = remainingMetersQuery.data || [];
    return METER_TYPES.map((type) => {
      const existing = rawData.find(
        (meter: any) => meter.type.toLowerCase() === type.toLowerCase()
      );
      return {
        type: type,
        remaining_meters: existing?.remaining_meters || 0,
      };
    });
  }, [remainingMetersQuery.data]);

  const agentInventory = useMemo(() => {
    const rawData = agentInventoryQuery.data || [];
    return METER_TYPES.map((type) => {
      const existing = rawData.find(
        (inventory: any) => inventory.type.toLowerCase() === type.toLowerCase()
      );
      return {
        type: type,
        with_agents: existing?.with_agents || 0,
      };
    });
  }, [agentInventoryQuery.data]);

  const faultyMetersByType = useMemo(() => {
    const rawData = faultyMetersQuery.data || [];
    return METER_TYPES.map((type) => {
      const existing = rawData.find(
        (faulty: any) => faulty.type.toLowerCase() === type.toLowerCase()
      );
      return {
        type: type,
        faulty_count: existing?.faulty_count || 0,
      };
    });
  }, [faultyMetersQuery.data]);

  // Memoize filtered sales
  const filteredSales = useMemo(() => {
    let filtered = salesData.todaySales as SaleWithMeters[];

    if (searchUser) {
      filtered = filtered.filter((sale) =>
        sale.user_name.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter(
        (sale) => sale.meter_type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    return filtered;
  }, [salesData.todaySales, searchUser, selectedType]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const currentItems = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchUser(value);
    setCurrentPage(1);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchUser("");
    setSelectedType("all");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = () => {
    return searchUser || selectedType !== "all";
  };

  // Prepare stock summary data
  const stockData = useMemo(() => {
    return METER_TYPES.map((type) => {
      const remaining = remainingMetersByType.find((r) => r.type === type);
      const agents = agentInventory.find((a) => a.type === type);
      const faulty = faultyMetersByType.find((f) => f.type === type);
      const inStock = remaining?.remaining_meters || 0;
      const withAgents = agents?.with_agents || 0;
      const faultyCount = faulty?.faulty_count || 0;
      return {
        type,
        inStock,
        withAgents,
        faulty: faultyCount,
        total: inStock + withAgents + faultyCount,
      };
    });
  }, [remainingMetersByType, agentInventory, faultyMetersByType]);

  const stockTotals = useMemo(() => {
    return stockData.reduce(
      (acc, item) => ({
        inStock: acc.inStock + item.inStock,
        withAgents: acc.withAgents + item.withAgents,
        faulty: acc.faulty + item.faulty,
        total: acc.total + item.total,
      }),
      { inStock: 0, withAgents: 0, faulty: 0, total: 0 }
    );
  }, [stockData]);

  // Prepare sales summary data
  const meterTypeSummary = useMemo(() => {
    const summary: { [key: string]: { count: number; earnings: number } } = {};
    filteredSales.forEach((sale) => {
      const type = sale.meter_type;
      if (!summary[type]) {
        summary[type] = { count: 0, earnings: 0 };
      }
      summary[type].count += sale.batch_amount;
      summary[type].earnings += sale.total_price;
    });
    return Object.entries(summary).map(([type, data]) => ({
      type,
      count: data.count,
      earnings: data.earnings,
    }));
  }, [filteredSales]);

  // Stock Summary Export Handlers
  const handleExportStockPDF = async () => {
    const blob = await pdf(
      <StockSummaryPDF data={stockData} totals={stockTotals} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-summary-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportStockCSV = () => {
    const csvData: Array<{
      "Meter Type": string;
      "In Stock": number;
      "With Agents": number;
      Faulty: number;
      Total: number;
    }> = stockData.map((item) => ({
      "Meter Type": item.type,
      "In Stock": item.inStock,
      "With Agents": item.withAgents,
      Faulty: item.faulty,
      Total: item.total,
    }));
    csvData.push({
      "Meter Type": "TOTAL",
      "In Stock": stockTotals.inStock,
      "With Agents": stockTotals.withAgents,
      Faulty: stockTotals.faulty,
      Total: stockTotals.total,
    });
    generateCSV(csvData, "stock_summary");
  };

  const handleExportStockXLSX = () => {
    const xlsxData: Array<{
      "Meter Type": string;
      "In Stock": number;
      "With Agents": number;
      Faulty: number;
      Total: number;
    }> = stockData.map((item) => ({
      "Meter Type": item.type,
      "In Stock": item.inStock,
      "With Agents": item.withAgents,
      Faulty: item.faulty,
      Total: item.total,
    }));
    xlsxData.push({
      "Meter Type": "TOTAL",
      "In Stock": stockTotals.inStock,
      "With Agents": stockTotals.withAgents,
      Faulty: stockTotals.faulty,
      Total: stockTotals.total,
    });
    generateXLSX(xlsxData, "stock_summary", "Stock Summary");
  };

  // Sales Breakdown Export Handlers
  const handleExportSalesPDF = async () => {
    const dataToExport = hasActiveFilters() ? currentItems : filteredSales;

    const salesRecords = dataToExport.map((sale) => ({
      seller: sale.user_name,
      meterType: sale.meter_type,
      quantity: sale.batch_amount,
      unitPrice: sale.unit_price,
      totalPrice: sale.total_price,
      time: formatTime(sale.sale_date),
      customerType:
        sale.customer_type
          ?.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") || "",
      county: sale.customer_county || "",
      recipient: sale.recipient,
    }));

    const totalEarnings = dataToExport.reduce(
      (sum, sale) => sum + sale.total_price,
      0
    );
    const totalMeters = dataToExport.reduce(
      (sum, sale) => sum + sale.batch_amount,
      0
    );

    const blob = await pdf(
      <SalesBreakdownPDF
        sales={salesRecords}
        totalEarnings={totalEarnings}
        totalMeters={totalMeters}
        meterTypeSummary={meterTypeSummary}
        reportTitle='Sales Breakdown Report'
        dateRange={
          selectedDateRange
            ? `${formatDate(selectedDateRange.startDate)} - ${formatDate(selectedDateRange.endDate)}`
            : "Today"
        }
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-breakdown-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSalesCSV = () => {
    const dataToExport = hasActiveFilters() ? currentItems : filteredSales;

    const csvData = dataToExport.map((sale) => ({
      Seller: sale.user_name,
      "Meter Type": sale.meter_type,
      Quantity: sale.batch_amount,
      "Unit Price": sale.unit_price,
      "Total Price": sale.total_price,
      Time: formatTime(sale.sale_date),
      "Customer Type": sale.customer_type
        ?.split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      County: sale.customer_county,
      Recipient: sale.recipient,
    }));

    generateCSV(csvData, "sales_breakdown");
  };

  const handleExportSalesXLSX = () => {
    const dataToExport = hasActiveFilters() ? currentItems : filteredSales;

    const xlsxData = dataToExport.map((sale) => ({
      Seller: sale.user_name,
      "Meter Type": sale.meter_type,
      Quantity: sale.batch_amount,
      "Unit Price": sale.unit_price,
      "Total Price": sale.total_price,
      Time: formatTime(sale.sale_date),
      "Customer Type": sale.customer_type
        ?.split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      County: sale.customer_county,
      Recipient: sale.recipient,
    }));

    generateXLSX(xlsxData, "sales_breakdown", "Sales Breakdown");
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetch({ throwOnError: true }),
        agentInventoryQuery.refetch({
          cancelRefetch: false,
          throwOnError: true,
        }),
        faultyMetersQuery.refetch({
          cancelRefetch: false,
          throwOnError: true,
        }),
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const isRefreshing =
    (isFetching && !isLoading) ||
    agentInventoryQuery.isFetching ||
    remainingMetersQuery.isFetching ||
    faultyMetersQuery.isFetching;

  if (isError) {
    return (
      <div className='text-center py-8 text-red-500'>
        Error loading data: {error?.message}
      </div>
    );
  }

  return (
    <div className='w-full h-full'>
      <ErrorBoundary>
        <Card className='col-span-full shadow-md hover:shadow-xl'>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle>
                {selectedDateRange ? selectedDateRange.label : "Today's Sales"}
                {selectedDateRange && (
                  <span className='text-sm text-muted-foreground ml-2'>
                    ({formatDate(selectedDateRange.startDate)} -{" "}
                    {formatDate(selectedDateRange.endDate)})
                  </span>
                )}
              </CardTitle>
              <Button
                variant='outline'
                size='icon'
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className='cursor-pointer'>
                <RefreshCw
                  className={cn(
                    "h-4 w-4 transition-transform",
                    (isLoading || isRefreshing) && "animate-spin"
                  )}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='mb-6'>
              <div className='flex flex-col sm:flex-row gap-4 mb-2 justify-between'>
                <DailyReportsFilters
                  searchUser={searchUser}
                  selectedType={selectedType}
                  onSearchChange={handleSearchChange}
                  onTypeChange={handleTypeChange}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={!!searchUser || selectedType !== "all"}
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='cursor-pointer'>
                      <Download className='mr-2 h-4 w-4' />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-48'>
                    <DropdownMenuLabel className='flex items-center gap-2'>
                      <Package className='h-4 w-4' />
                      Stock Summary
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={handleExportStockPDF}
                      className='cursor-pointer pl-6'>
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportStockCSV}
                      className='cursor-pointer pl-6'>
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportStockXLSX}
                      className='cursor-pointer pl-6'>
                      XLSX
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className='flex items-center gap-2'>
                      <ShoppingCart className='h-4 w-4' />
                      Sales Breakdown
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={handleExportSalesPDF}
                      className='cursor-pointer pl-6'>
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportSalesCSV}
                      className='cursor-pointer pl-6'>
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportSalesXLSX}
                      className='cursor-pointer pl-6'>
                      XLSX
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <SalesTable
              sales={currentItems}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        <DailyReportsSummary
          totalEarnings={filteredSales.reduce(
            (sum, sale) => sum + sale.total_price,
            0
          )}
          remainingMetersByType={remainingMetersByType}
          agentInventory={agentInventory}
          faultyMetersByType={faultyMetersByType}
        />
      </ErrorBoundary>
    </div>
  );
}
