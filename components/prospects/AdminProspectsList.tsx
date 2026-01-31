"use client";

import { useState, useEffect, Fragment, useCallback } from "react";
import { format } from "date-fns";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  ChevronDown,
  ChevronUp,
  History,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import type { ClientProspect } from "@/lib/db/schema";
import type { ChangeHistoryEntry } from "./types";
import { STATUS_LABELS } from "./types";
import { ProspectStats } from "./ProspectStats";
import { ProspectFilters } from "./ProspectFilters";
import { ProspectExpandedDetails } from "./ProspectExpandedDetails";
import { ProspectHistoryDialog } from "./ProspectHistoryDialog";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import {
  getAllProspectsPaginated,
  type PaginatedProspectsResult,
  type ProspectStatus,
} from "@/lib/actions/prospects";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminProspectsListProps {
  readonly initialData: PaginatedProspectsResult;
  readonly salesPersons: string[];
}

const PAGE_SIZE = 10;

export default function AdminProspectsList({
  initialData,
  salesPersons,
}: AdminProspectsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "all">(
    "all",
  );
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProspectHistory, setSelectedProspectHistory] = useState<
    ChangeHistoryEntry[]
  >([]);
  const [selectedProspectName, setSelectedProspectName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] =
    useState<PaginatedProspectsResult>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch data when filters or page changes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAllProspectsPaginated({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        salesPerson:
          salesPersonFilter === "all" ? undefined : salesPersonFilter,
      });
      setPaginatedData(result);
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, salesPersonFilter]);

  useEffect(() => {
    // Skip initial fetch since we have initialData
    if (
      currentPage === 1 &&
      !debouncedSearch &&
      statusFilter === "all" &&
      salesPersonFilter === "all"
    ) {
      setPaginatedData(initialData);
      return;
    }
    fetchData();
  }, [
    currentPage,
    debouncedSearch,
    statusFilter,
    salesPersonFilter,
    fetchData,
    initialData,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, salesPersonFilter]);

  const { prospects, totalCount, totalPages } = paginatedData;

  const openHistoryDialog = (prospect: ClientProspect) => {
    const history = (prospect.change_history as ChangeHistoryEntry[]) || [];
    setSelectedProspectHistory(history);
    setSelectedProspectName(prospect.client_name);
    setHistoryDialogOpen(true);
  };

  const handleExportCSV = () => {
    const data = prospects.map((p, index) => ({
      "#": (currentPage - 1) * PAGE_SIZE + index + 1,
      "Client Name": p.client_name,
      Contact: p.contact,
      Location: p.location,
      Status: STATUS_LABELS[p.status] || p.status,
      "Sales Person": p.sales_person_name,
      "Last Updated": p.updated_at
        ? format(new Date(p.updated_at), "dd/MM/yyyy")
        : "-",
    }));
    generateCSV(data, "prospects");
  };

  const handleExportXLSX = () => {
    const data = prospects.map((p, index) => ({
      "#": (currentPage - 1) * PAGE_SIZE + index + 1,
      "Client Name": p.client_name,
      Contact: p.contact,
      Location: p.location,
      Status: STATUS_LABELS[p.status] || p.status,
      "Sales Person": p.sales_person_name,
      "Last Updated": p.updated_at
        ? format(new Date(p.updated_at), "dd/MM/yyyy")
        : "-",
    }));
    generateXLSX(data, "prospects", "Prospects");
  };

  const handleExportPDF = async () => {
    const headers = [
      "#",
      "Client",
      "Contact",
      "Location",
      "Status",
      "Sales Person",
    ];
    const data = prospects.map((p, index) => [
      String((currentPage - 1) * PAGE_SIZE + index + 1),
      p.client_name,
      p.contact,
      p.location,
      STATUS_LABELS[p.status] || p.status,
      p.sales_person_name,
    ]);

    const blob = await pdf(
      <TableReportPDF title='Prospects Report' headers={headers} data={data} />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prospects.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "ellipsis",
        ...Array.from({ length: 4 }, (_, i) => totalPages - 3 + i),
      ];
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ];
  };

  return (
    <div className='min-h-screen bg-gray-50 px-4'>
      <div className='mx-auto space-y-4'>
        {/* Header with title and export */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>All Prospects</h1>
            <p className='text-sm text-muted-foreground'>
              {totalCount} total prospects
            </p>
          </div>
          {prospects.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Download className='h-4 w-4 mr-2' />
                  Export
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
        </div>

        {/* Single unified card containing filters, stats, and table */}
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex flex-col gap-4'>
              {/* Stats Row */}
              <ProspectStats prospects={prospects} />

              {/* Filters Row */}
              <ProspectFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                salesPersonFilter={salesPersonFilter}
                onSalesPersonChange={setSalesPersonFilter}
                salesPersons={salesPersons}
                showSalesPersonFilter
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto relative'>
              {isLoading && (
                <div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary' />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[30px]'></TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className='w-[80px]'>History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center py-8 text-gray-500'>
                        No prospects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    prospects.map((prospect) => (
                      <Fragment key={prospect.id}>
                        <TableRow
                          className='cursor-pointer hover:bg-gray-50'
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === prospect.id ? null : prospect.id,
                            )
                          }>
                          <TableCell>
                            {expandedRow === prospect.id ? (
                              <ChevronUp className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4' />
                            )}
                          </TableCell>
                          <TableCell className='font-medium'>
                            {prospect.client_name}
                          </TableCell>
                          <TableCell>{prospect.sales_person_name}</TableCell>
                          <TableCell>
                            {prospect.updated_at
                              ? format(
                                  new Date(prospect.updated_at),
                                  "MMM d, yyyy HH:mm",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {(
                              (prospect.change_history as ChangeHistoryEntry[]) ||
                              []
                            ).length > 0 && (
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openHistoryDialog(prospect);
                                }}
                                title='View history'>
                                <History className='h-4 w-4 text-gray-600' />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRow === prospect.id && (
                          <ProspectExpandedDetails
                            prospect={prospect}
                            colSpan={5}
                            showSalesPerson
                          />
                        )}
                      </Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-4 flex items-center justify-center'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, idx) =>
                      page === "ellipsis" ? (
                        <PaginationItem
                          key={`ellipsis-${page}-${idx}-${currentPage}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        <ProspectHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          prospectName={selectedProspectName}
          history={selectedProspectHistory}
        />
      </div>
    </div>
  );
}
