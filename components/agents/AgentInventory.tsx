"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search,
  Package,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { getAgentInventory } from "@/lib/actions/agents";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/dateUtils";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

// Meter types matching SalesBarchart
const METER_TYPES = [
  { key: "all", label: "All" },
  { key: "integrated", label: "Integrated" },
  { key: "split", label: "Split" },
  { key: "gas", label: "Gas" },
  { key: "water", label: "Water" },
  { key: "smart", label: "Smart" },
  { key: "3 phase", label: "3 Phase" },
] as const;

// Add cache interface
interface InventoryCache {
  [key: string]: {
    data: MeterInventory[];
    timestamp: number;
  };
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Initialize cache
const inventoryCache: InventoryCache = {};

interface AgentInventoryProps {
  readonly agentId: string;
  readonly agentName?: string;
}

interface MeterInventory {
  id: string;
  serial_number: string;
  type: string;
  assigned_at: Date | null;
}

export default function AgentInventory({
  agentId,
  agentName,
}: AgentInventoryProps) {
  const [inventory, setInventory] = useState<MeterInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // Check cache first
        const cachedData = inventoryCache[agentId];
        const now = Date.now();

        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          setInventory(cachedData.data);
          setIsLoading(false);
          return;
        }

        // If no cache or expired, fetch from API
        const data = await getAgentInventory(agentId);

        // Update cache
        inventoryCache[agentId] = {
          data: data || [],
          timestamp: now,
        };

        setInventory(data || []);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast.error("Failed to load inventory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [agentId]);

  // Get meter counts by type
  const meterCounts = useMemo(() => {
    return inventory.reduce(
      (acc, meter) => {
        const normalizedType = meter.type.toLowerCase();
        acc[normalizedType] = (acc[normalizedType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [inventory]);

  // Filter inventory based on search term and active tab
  const filteredInventory = useMemo(() => {
    return inventory.filter((meter) => {
      const matchesSearch = meter.serial_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTab =
        activeTab === "all" ||
        meter.type.toLowerCase() === activeTab.toLowerCase();
      return matchesSearch && matchesTab;
    });
  }, [inventory, searchTerm, activeTab]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInventory = filteredInventory.slice(startIndex, endIndex);

  // Reset to first page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Export functions
  const getExportData = () => {
    return filteredInventory.map((meter) => ({
      "Serial Number": meter.serial_number,
      Type: meter.type,
      "Assigned Date": meter.assigned_at
        ? formatDate(meter.assigned_at)
        : "N/A",
      Agent: agentName || "Unknown",
    }));
  };

  const handleExportCSV = () => {
    const exportData = getExportData();
    if (exportData.length === 0) {
      toast.error("No meters to export");
      return;
    }
    const filename = `agent-inventory-${agentName || agentId}-${new Date().toISOString().split("T")[0]}`;
    generateCSV(exportData, filename);
    toast.success(`Exported ${exportData.length} meters to CSV`);
  };

  const handleExportXLSX = () => {
    const exportData = getExportData();
    if (exportData.length === 0) {
      toast.error("No meters to export");
      return;
    }
    const filename = `agent-inventory-${agentName || agentId}-${new Date().toISOString().split("T")[0]}`;
    generateXLSX(exportData, filename, "Inventory");
    toast.success(`Exported ${exportData.length} meters to Excel`);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const exportData = filteredInventory;
      if (exportData.length === 0) {
        toast.error("No meters to export");
        return;
      }

      const headers = ["Serial Number", "Type", "Assigned Date"];
      const data = exportData.map((meter) => [
        meter.serial_number,
        meter.type,
        meter.assigned_at ? formatDate(meter.assigned_at) : "N/A",
      ]);

      const title = agentName
        ? `Agent Inventory - ${agentName}`
        : "Agent Inventory";

      const blob = await pdf(
        <TableReportPDF title={title} headers={headers} data={data} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agent-inventory-${agentName || agentId}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} meters to PDF`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='p-2'>
      {/* Header with Total and Export */}
      <div className='mb-4 p-4 bg-white rounded-lg border shadow-sm'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Package className='h-5 w-5 text-primary' />
            <h3 className='text-lg font-semibold text-primary'>
              Total Meters: {inventory.length}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 cursor-pointer'
                disabled={isExporting || filteredInventory.length === 0}>
                <Download className='h-4 w-4' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={handleExportCSV}
                className='cursor-pointer'>
                <FileText className='mr-2 h-4 w-4' />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportXLSX}
                className='cursor-pointer'>
                <FileSpreadsheet className='mr-2 h-4 w-4' />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                className='cursor-pointer'>
                <FileText className='mr-2 h-4 w-4 text-red-500' />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs for Meter Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-4'>
        <TabsList className='flex flex-wrap h-auto gap-1'>
          {METER_TYPES.map((type) => {
            const count =
              type.key === "all"
                ? inventory.length
                : meterCounts[type.key] || 0;
            return (
              <TabsTrigger
                key={type.key}
                value={type.key}
                className='cursor-pointer text-xs sm:text-sm px-2 sm:px-3'
                disabled={type.key !== "all" && count === 0}>
                {type.label}
                {count > 0 && (
                    <span className='ml-1 text-xs py-0'>{count}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className='relative mb-4'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-primary' />
        <Input
          placeholder='Search by serial number...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='pl-8'
        />
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <div className='overflow-auto'>
          <div className='min-w-[300px]'>
            {/* Desktop View */}
            <div className='hidden sm:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-primary'>
                      Serial Number
                    </TableHead>
                    <TableHead className='text-primary'>Type</TableHead>
                    <TableHead className='text-primary'>
                      Assigned Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className='text-center py-8 text-primary'>
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : currentInventory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className='text-center py-8 text-primary'>
                        {searchTerm || activeTab !== "all"
                          ? "No meters found matching filters"
                          : "No meters assigned"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentInventory.map((meter) => (
                      <TableRow key={meter.id}>
                        <TableCell className='font-medium'>
                          {meter.serial_number}
                        </TableCell>
                        <TableCell>{meter.type}</TableCell>
                        <TableCell>{formatDate(meter.assigned_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className='block sm:hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-primary'>
                      Serial Number
                    </TableHead>
                    <TableHead className='text-primary text-right'>
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className='text-center py-8 text-primary'>
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : currentInventory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className='text-center py-8 text-primary'>
                        {searchTerm || activeTab !== "all"
                          ? "No meters found matching filters"
                          : "No meters assigned"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentInventory.map((meter) => (
                      <TableRow key={meter.id}>
                        <TableCell>
                          <div className='font-medium'>
                            {meter.serial_number}
                          </div>
                          <div className='text-sm text-muted-foreground mt-1'>
                            Type: {meter.type}
                          </div>
                        </TableCell>
                        <TableCell className='text-right text-sm text-muted-foreground'>
                          {formatDate(meter.assigned_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4 flex justify-center'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, i, arr) => (
                  <span key={page}>
                    {i > 0 && arr[i - 1] !== page - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className='cursor-pointer'>
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </span>
                ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
