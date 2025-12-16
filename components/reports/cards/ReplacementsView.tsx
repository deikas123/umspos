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
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  Download,
  File,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { getMeterReplacements } from "@/lib/actions/reports";
import { EmptyState } from "./EmptyState";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDate } from "@internationalized/date";
import { cn } from "@/lib/utils";
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

interface Replacement {
  id: string;
  serial_number: string;
  recipient: string | null;
  customer_contact: string | null;
  replacement_serial: string | null;
  replacement_date: Date | null;
  replacement_by: string | null;
}

export default function ReplacementsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const {
    data: replacements,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Replacement[]>({
    queryKey: ["replacements"],
    queryFn: getMeterReplacements,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const handleRefresh = async () => {
    try {
      await refetch({ throwOnError: true });
      toast.success("Replacement data refreshed");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      toast.error("Failed to refresh data");
    }
  };

  const isRefreshing = isFetching && !isLoading;

  const filteredReplacements = replacements?.filter((replacement) => {
    const matchesSearch =
      searchTerm === "" ||
      replacement.serial_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      replacement.replacement_serial
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false ||
      replacement.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      replacement.replacement_by
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      false;

    const matchesDate =
      !selectedDate ||
      !replacement.replacement_date ||
      formatISODate(replacement.replacement_date) ===
        `${selectedDate.year}-${String(selectedDate.month).padStart(2, "0")}-${String(selectedDate.day).padStart(2, "0")}`;

    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(
    (filteredReplacements?.length || 0) / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReplacements = filteredReplacements?.slice(startIndex, endIndex);

  const handleExportCSV = () => {
    if (!filteredReplacements || filteredReplacements.length === 0) return;
    const data = filteredReplacements.map((r, index) => ({
      "#": index + 1,
      "Original Serial": r.serial_number,
      "Replacement Serial": r.replacement_serial || "-",
      Customer: r.recipient || "-",
      Contact: r.customer_contact || "-",
      "Replaced By": r.replacement_by || "-",
      Date: r.replacement_date ? formatDate(r.replacement_date) : "-",
    }));
    generateCSV(data, "meter_replacements");
  };

  const handleExportXLSX = () => {
    if (!filteredReplacements || filteredReplacements.length === 0) return;
    const data = filteredReplacements.map((r, index) => ({
      "#": index + 1,
      "Original Serial": r.serial_number,
      "Replacement Serial": r.replacement_serial || "-",
      Customer: r.recipient || "-",
      Contact: r.customer_contact || "-",
      "Replaced By": r.replacement_by || "-",
      Date: r.replacement_date ? formatDate(r.replacement_date) : "-",
    }));
    generateXLSX(data, "meter_replacements", "Replacements");
  };

  const handleExportPDF = async () => {
    if (!filteredReplacements || filteredReplacements.length === 0) return;
    const headers = [
      "#",
      "Original Serial",
      "Replacement Serial",
      "Customer",
      "Replaced By",
      "Date",
    ];
    const data = filteredReplacements.map((r, index) => [
      String(index + 1),
      r.serial_number,
      r.replacement_serial || "-",
      r.recipient || "-",
      r.replacement_by || "-",
      r.replacement_date ? formatDate(r.replacement_date) : "-",
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Meter Replacements Report'
        headers={headers}
        data={data}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meter_replacements.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className='p-4 text-center text-red-500 flex items-center justify-center gap-2'>
        <AlertCircle className='h-4 w-4' />
        Failed to load replacement data
      </div>
    );
  }

  const hasActiveFilters = () => {
    return searchTerm || selectedDate;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDate(null);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      <div className='flex-none bg-gray-50 pb-4 pt-2 px-6 border-b border-gray-200'>
        <div className='flex justify-between items-center mb-4 pr-12'>
          <h2 className='flex items-center gap-2 text-2xl font-bold'>
            <RefreshCw className='h-5 w-5 text-blue-500' />
            Meter Replacements
          </h2>
          <div className='flex items-center gap-2'>
            {filteredReplacements && filteredReplacements.length > 0 && (
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
              disabled={isLoading || isRefreshing}
              aria-label='Refresh replacement data'
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
                placeholder='Search by serial, customer, or staff...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-[300px]'
              />

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

            {filteredReplacements && filteredReplacements.length > 0 ? (
              <div className='space-y-4'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-gray-50'>
                        <TableHead>Original Serial</TableHead>
                        <TableHead>Replacement Serial</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Replaced By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(currentReplacements || []).map((replacement) => (
                        <TableRow key={replacement.id}>
                          <TableCell className='font-mono'>
                            {replacement.serial_number}
                          </TableCell>
                          <TableCell className='font-mono'>
                            {replacement.replacement_serial || "-"}
                          </TableCell>
                          <TableCell>{replacement.recipient || "-"}</TableCell>
                          <TableCell>
                            {replacement.customer_contact || "-"}
                          </TableCell>
                          <TableCell>
                            {replacement.replacement_by || "-"}
                          </TableCell>
                          <TableCell>
                            {replacement.replacement_date
                              ? formatDate(replacement.replacement_date)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
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
                                ? "pointer-events-none opacity-50 cursor-pointer"
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
                                ? "pointer-events-none opacity-50 cursor-pointer"
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
                icon={RefreshCw}
                message='No meter replacements found'
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
