"use client";

import { useState, useEffect, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Plus,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import type { ClientProspect } from "@/lib/db/schema";
import { STATUS_COLORS, STATUS_LABELS } from "./types";
import { ProspectStats } from "./ProspectStats";
import { ProspectFilters } from "./ProspectFilters";
import { EditProspectDialog } from "./EditProspectDialog";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import {
  getMyProspectsPaginated,
  type PaginatedProspectsResult,
} from "@/lib/actions/prospects";
import { useDebounce } from "@/hooks/use-debounce";

interface SalesPersonProspectsListProps {
  readonly initialData: PaginatedProspectsResult;
}

const PAGE_SIZE = 10;

export default function SalesPersonProspectsList({
  initialData,
}: SalesPersonProspectsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] =
    useState<ClientProspect | null>(null);

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
      const result = await getMyProspectsPaginated({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setPaginatedData(result);
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    // Skip initial fetch since we have initialData
    if (currentPage === 1 && !debouncedSearch && statusFilter === "all") {
      setPaginatedData(initialData);
      return;
    }
    fetchData();
  }, [currentPage, debouncedSearch, statusFilter, fetchData, initialData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const { prospects, totalCount, totalPages } = paginatedData;

  const handleEditClick = (e: React.MouseEvent, prospect: ClientProspect) => {
    e.stopPropagation();
    setSelectedProspect(prospect);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the data
    fetchData();
  };

  const handleExportCSV = () => {
    const data = prospects.map((p, index) => ({
      "#": (currentPage - 1) * PAGE_SIZE + index + 1,
      "Client Name": p.client_name,
      Contact: p.contact,
      Location: p.location,
      Status: STATUS_LABELS[p.status] || p.status,
      "Last Updated": p.updated_at
        ? format(new Date(p.updated_at), "dd/MM/yyyy")
        : "-",
    }));
    generateCSV(data, "my_prospects");
  };

  const handleExportXLSX = () => {
    const data = prospects.map((p, index) => ({
      "#": (currentPage - 1) * PAGE_SIZE + index + 1,
      "Client Name": p.client_name,
      Contact: p.contact,
      Location: p.location,
      Status: STATUS_LABELS[p.status] || p.status,
      "Last Updated": p.updated_at
        ? format(new Date(p.updated_at), "dd/MM/yyyy")
        : "-",
    }));
    generateXLSX(data, "my_prospects", "My Prospects");
  };

  const handleExportPDF = async () => {
    const headers = ["#", "Client", "Contact", "Location", "Status"];
    const data = prospects.map((p, index) => [
      String((currentPage - 1) * PAGE_SIZE + index + 1),
      p.client_name,
      p.contact,
      p.location,
      STATUS_LABELS[p.status] || p.status,
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='My Prospects Report'
        headers={headers}
        data={data}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my_prospects.pdf";
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
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-6 flex justify-between items-start'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>My Prospects</h1>
            <p className='text-gray-600'>{totalCount} total prospects</p>
          </div>
          <div className='flex gap-2'>
            {prospects.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
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
            <Button onClick={() => router.push("/prospects/new")}>
              <Plus className='h-4 w-4 mr-2' />
              New Prospect
            </Button>
          </div>
        </div>

        <ProspectFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <ProspectStats prospects={prospects} />

        <Card>
          <CardHeader>
            <CardTitle>My Prospects</CardTitle>
            <CardDescription>
              Click on a row to view details or edit
            </CardDescription>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className='w-[100px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center py-8 text-gray-500'>
                        No prospects found. Start by creating a new one!
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
                          <TableCell>
                            <Badge
                              className={STATUS_COLORS[prospect.status] || ""}>
                              {STATUS_LABELS[prospect.status] ||
                                prospect.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {prospect.updated_at
                              ? format(
                                  new Date(prospect.updated_at),
                                  "MMM d, yyyy HH:mm",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={(e) => handleEditClick(e, prospect)}
                                title='Edit prospect'>
                                <Edit className='h-4 w-4 text-blue-600' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRow === prospect.id && (
                          <TableRow>
                            <TableCell colSpan={5} className='bg-gray-50'>
                              <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='space-y-3'>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Location
                                    </span>
                                    <p className='font-medium'>
                                      {prospect.location}
                                    </p>
                                  </div>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Contact
                                    </span>
                                    <p className='font-medium'>
                                      {prospect.contact}
                                    </p>
                                  </div>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Meter Type
                                    </span>
                                    <p className='font-medium capitalize'>
                                      {prospect.meter_type.replace("_", " ")}
                                    </p>
                                  </div>
                                </div>
                                <div className='space-y-3'>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Number of Meters
                                    </span>
                                    <p className='font-medium'>
                                      {prospect.number_of_meters}
                                    </p>
                                  </div>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Other Remarks
                                    </span>
                                    <p className='font-medium'>
                                      {prospect.other_remarks || "None"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className='text-sm text-gray-500'>
                                      Created
                                    </span>
                                    <p className='font-medium'>
                                      {prospect.created_at
                                        ? format(
                                            new Date(prospect.created_at),
                                            "MMM d, yyyy HH:mm",
                                          )
                                        : "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
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

        {selectedProspect && (
          <EditProspectDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            prospect={selectedProspect}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </div>
  );
}
