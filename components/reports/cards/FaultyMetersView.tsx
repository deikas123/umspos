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
import React, { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Trash2,
  RotateCcw,
  Archive,
} from "lucide-react";
import {
  getFaultyMeters,
  binFaultyMeter,
  restoreBinnedMeter,
} from "@/lib/actions/reports";
import { EmptyState } from "./EmptyState";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDate } from "@internationalized/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateFaultyMeterStatus } from "@/lib/actions/meters";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/utils/rolePermissions";
import { formatDate, formatISODate } from "@/lib/utils/dateUtils";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface FaultyMeter {
  id: string;
  serial_number: string;
  type: string;
  returned_by: string | null;
  returned_at: Date | null;
  returner_name: string | null;
  fault_description: string | null;
  status: string | null;
  original_sale_id: string | null;
  is_binned: boolean | null;
  binned_at: Date | null;
  binned_by: string | null;
  binned_by_name: string | null;
}

// Helper component props
interface MeterActionsCellProps {
  readonly meter: FaultyMeter;
  readonly activeTab: "active" | "binned";
  readonly userRole: string | null | undefined;
  readonly isUpdating: boolean;
  readonly binningMeterId: string | null;
  readonly onStatusUpdate: (
    meter: FaultyMeter,
    status: "repaired" | "unrepairable" | "pending"
  ) => void;
  readonly onBin: (meter: FaultyMeter) => void;
  readonly onRestore: (meter: FaultyMeter) => void;
}

// Helper component for rendering action buttons
function MeterActionsCell({
  meter,
  activeTab,
  userRole,
  isUpdating,
  binningMeterId,
  onStatusUpdate,
  onBin,
  onRestore,
}: MeterActionsCellProps) {
  const userIsAdmin = isAdmin(userRole);

  if (activeTab === "binned") {
    if (!userIsAdmin) {
      return <span className='text-muted-foreground text-sm'>—</span>;
    }
    return (
      <Button
        variant='outline'
        size='sm'
        className='cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50'
        onClick={() => onRestore(meter)}
        disabled={isUpdating}>
        <RotateCcw className='h-4 w-4 mr-1' />
        Restore
      </Button>
    );
  }

  if (!userIsAdmin) {
    return <span className='text-muted-foreground text-sm'>—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='cursor-pointer'
          disabled={isUpdating || binningMeterId !== null}>
          {binningMeterId === meter.id ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            "Actions"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => onStatusUpdate(meter, "repaired")}
          disabled={meter.status === "repaired" || isUpdating}
          className='cursor-pointer'>
          <span className='text-green-600'>Mark as Repaired</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusUpdate(meter, "unrepairable")}
          disabled={meter.status === "unrepairable" || isUpdating}
          className='cursor-pointer'>
          <span className='text-red-600'>Mark as Unrepairable</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusUpdate(meter, "pending")}
          disabled={meter.status === "pending" || isUpdating}
          className='cursor-pointer'>
          <span className='text-yellow-600'>Mark as Pending</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onBin(meter)}
          disabled={isUpdating}
          className='cursor-pointer text-red-600 focus:text-red-600'>
          <Trash2 className='h-4 w-4 mr-2' />
          Send to Bin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function FaultyMetersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"active" | "binned">("active");
  const [binningMeterId, setBinningMeterId] = useState<string | null>(null);
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const {
    data: faultyMeters,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<FaultyMeter[]>({
    queryKey: ["faultyMeters"],
    queryFn: getFaultyMeters,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const handleRefresh = async () => {
    try {
      await refetch({ throwOnError: true });
      toast.success("Faulty meters data refreshed");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      toast.error("Failed to refresh data");
    }
  };

  const isRefreshing = isFetching && !isLoading;

  // Separate active and binned meters
  const activeMeters = faultyMeters?.filter((meter) => !meter.is_binned) || [];
  const binnedMeters = faultyMeters?.filter((meter) => meter.is_binned) || [];

  const currentMetersForTab =
    activeTab === "active" ? activeMeters : binnedMeters;

  const filteredMeters = currentMetersForTab.filter((meter) => {
    const matchesSearch =
      searchTerm === "" ||
      meter.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meter.returner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false) ||
      meter.fault_description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false;

    const matchesDate =
      !selectedDate ||
      !meter.returned_at ||
      formatISODate(meter.returned_at) ===
        `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

    const matchesStatus =
      !selectedStatus ||
      selectedStatus === "all" ||
      !meter.status ||
      meter.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Helper function to format the date column based on tab
  const getDisplayDate = (meter: FaultyMeter): string => {
    if (activeTab === "binned") {
      return meter.binned_at ? formatDate(meter.binned_at) : "-";
    }
    return meter.returned_at ? formatDate(meter.returned_at) : "-";
  };

  const handleStatusUpdate = async (
    meter: FaultyMeter,
    newStatus: "repaired" | "unrepairable" | "pending"
  ) => {
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    try {
      setIsUpdating(true);
      await updateFaultyMeterStatus(
        {
          id: meter.id,
          serial_number: meter.serial_number,
          type: meter.type,
          status: newStatus,
        },
        user.id,
        user.name || user.email || "System User"
      );

      await refetch({ throwOnError: true }); // Refresh the data

      toast.success(
        newStatus === "repaired"
          ? "Meter has been restored to inventory"
          : `Meter has been marked as ${newStatus}`
      );
    } catch (error) {
      console.error("Failed to update meter status:", error);
      toast.error("Failed to update meter status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBinMeter = async (meter: FaultyMeter) => {
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    try {
      setBinningMeterId(meter.id);
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 600));

      await binFaultyMeter(
        meter.id,
        user.id,
        user.name || user.email || "System User"
      );
      await refetch({ throwOnError: true });

      toast.success(`Meter ${meter.serial_number} has been sent to bin`);
    } catch (error) {
      console.error("Failed to bin meter:", error);
      toast.error("Failed to send meter to bin");
    } finally {
      setBinningMeterId(null);
    }
  };

  const handleRestoreMeter = async (meter: FaultyMeter) => {
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    try {
      setIsUpdating(true);
      await restoreBinnedMeter(meter.id, user.id);
      await refetch({ throwOnError: true });

      toast.success(`Meter ${meter.serial_number} has been restored from bin`);
    } catch (error) {
      console.error("Failed to restore meter:", error);
      toast.error("Failed to restore meter from bin");
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className='p-4 text-center text-red-500 flex items-center justify-center gap-2'>
        <AlertCircle className='h-4 w-4' />
        Failed to load faulty meters data
      </div>
    );
  }

  const hasActiveFilters = () => {
    return (
      searchTerm || selectedDate || (selectedStatus && selectedStatus !== "all")
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate(null);
    setSelectedStatus("all");
  };

  // Pagination logic
  const totalPages = Math.ceil((filteredMeters?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMeters = filteredMeters?.slice(startIndex, endIndex);

  const handleExportCSV = () => {
    if (!filteredMeters || filteredMeters.length === 0) return;
    const data = filteredMeters.map((m, index) => ({
      "#": index + 1,
      "Serial Number": m.serial_number,
      Type: m.type,
      Status: m.status || "-",
      "Returned By": m.returner_name,
      "Fault Description": m.fault_description || "-",
      Date: m.returned_at ? formatDate(m.returned_at) : "-",
    }));
    generateCSV(data, "faulty_meters");
  };

  const handleExportXLSX = () => {
    if (!filteredMeters || filteredMeters.length === 0) return;
    const data = filteredMeters.map((m, index) => ({
      "#": index + 1,
      "Serial Number": m.serial_number,
      Type: m.type,
      Status: m.status || "-",
      "Returned By": m.returner_name,
      "Fault Description": m.fault_description || "-",
      Date: m.returned_at ? formatDate(m.returned_at) : "-",
    }));
    generateXLSX(data, "faulty_meters", "Faulty Meters");
  };

  const handleExportPDF = async () => {
    if (!filteredMeters || filteredMeters.length === 0) return;
    const headers = [
      "#",
      "Serial Number",
      "Type",
      "Status",
      "Returned By",
      "Date",
    ];
    const data = filteredMeters.map((m, index) => [
      String(index + 1),
      m.serial_number,
      m.type,
      m.status || "-",
      m.returner_name || "-",
      m.returned_at ? formatDate(m.returned_at) : "-",
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Faulty Meters Report'
        headers={headers}
        data={data}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "faulty_meters.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <div className='flex-none bg-gray-50 pb-4 pt-2 px-6 border-b border-gray-200'>
        <div className='flex justify-between items-center mb-4 pr-12'>
          <h2 className='flex items-center gap-2 text-2xl font-bold'>
            <AlertTriangle className='h-5 w-5 text-yellow-500' />
            Faulty Meters
          </h2>
          <div className='flex items-center gap-2'>
            {filteredMeters && filteredMeters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='hover:bg-gray-100 cursor-pointer'>
                    <Download className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <File className='h-4 w-4 mr-2' />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportXLSX}>
                    <FileSpreadsheet className='h-4 w-4 mr-2' />
                    Export as XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className='h-4 w-4 mr-2' />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant='outline'
              size='icon'
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing || isUpdating}
              aria-label='Refresh faulty meters data'
              className='hover:bg-gray-100 cursor-pointer'>
              <RefreshCw
                className={cn(
                  "h-4 w-4 transition-transform",
                  (isLoading || isRefreshing) && "animate-spin"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Tabs for Active/Binned */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "active" | "binned");
            setCurrentPage(1);
          }}>
          <TabsList className='grid w-full max-w-[400px] grid-cols-2'>
            <TabsTrigger value='active' className='cursor-pointer'>
              <AlertTriangle className='h-4 w-4 mr-2' />
              Active
              {activeMeters.length > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {activeMeters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='binned' className='cursor-pointer'>
              <Archive className='h-4 w-4 mr-2' />
              Binned
              {binnedMeters.length > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {binnedMeters.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-4 space-y-4'>
        {isLoading ? (
          <div className='flex justify-center items-center min-h-[200px]'>
            <div>
              <Loader2 className='h-3 w-3 animate-spin' />
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className='flex flex-wrap items-center gap-3 mb-4'>
              <Input
                type='text'
                placeholder='Search by serial, description, or staff...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-[300px]'
              />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className='w-[140px] cursor-pointer'>
                  <SelectValue>Status</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='repaired'>Repaired</SelectItem>
                  <SelectItem value='unrepairable'>Unrepairable</SelectItem>
                </SelectContent>
              </Select>

              <div className='w-[130px]'>
                <DatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>

              {hasActiveFilters() && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={clearFilters}
                  className='text-muted-foreground hover:text-foreground cursor-pointer'>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>

            {filteredMeters && filteredMeters.length > 0 ? (
              <div className='space-y-4'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-gray-50'>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>
                          {activeTab === "binned" ? "Binned By" : "Returned By"}
                        </TableHead>
                        <TableHead>
                          {activeTab === "binned"
                            ? "Binned Date"
                            : "Return Date"}
                        </TableHead>
                        <TableHead>Fault Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode='popLayout'>
                        {(currentMeters || []).map((meter) => (
                          <motion.tr
                            key={meter.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                              opacity: binningMeterId === meter.id ? 0 : 1,
                              x: binningMeterId === meter.id ? 100 : 0,
                              scale: binningMeterId === meter.id ? 0.8 : 1,
                              rotate: binningMeterId === meter.id ? 10 : 0,
                            }}
                            exit={{
                              opacity: 0,
                              x: 100,
                              scale: 0.5,
                              rotate: 15,
                              transition: { duration: 0.5 },
                            }}
                            transition={{
                              duration: 0.5,
                              type: "spring",
                              stiffness: 100,
                              damping: 15,
                            }}
                            className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                            <TableCell className='font-mono'>
                              {meter.serial_number}
                            </TableCell>
                            <TableCell className='capitalize'>
                              {meter.type}
                            </TableCell>
                            <TableCell>
                              {activeTab === "binned"
                                ? meter.binned_by_name || "-"
                                : meter.returner_name}
                            </TableCell>
                            <TableCell>{getDisplayDate(meter)}</TableCell>
                            <TableCell>
                              {meter.fault_description || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={cn(
                                  "capitalize",
                                  meter.status === "pending" &&
                                    "border-yellow-500 text-yellow-600",
                                  meter.status === "repaired" &&
                                    "border-green-500 text-green-600",
                                  meter.status === "unrepairable" &&
                                    "border-red-500 text-red-600"
                                )}>
                                {meter.status || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <MeterActionsCell
                                meter={meter}
                                activeTab={activeTab}
                                userRole={user?.role}
                                isUpdating={isUpdating}
                                binningMeterId={binningMeterId}
                                onStatusUpdate={handleStatusUpdate}
                                onBin={handleBinMeter}
                                onRestore={handleRestoreMeter}
                              />
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='mt-4'>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage((page) => Math.max(1, page - 1))
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
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                          )
                          .map((page, i, arr) => (
                            <React.Fragment key={page}>
                              {i > 0 && arr[i - 1] !== page - 1 && (
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className='cursor-pointer'>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </React.Fragment>
                          ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage((page) =>
                                Math.min(totalPages, page + 1)
                              )
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
            ) : (
              <EmptyState
                icon={AlertTriangle}
                message='No faulty meters found'
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
