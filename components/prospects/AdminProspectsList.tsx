"use client";

import { useState, useMemo, Fragment } from "react";
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
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  History,
  Download,
  File,
  FileSpreadsheet,
  FileText,
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

interface AdminProspectsListProps {
  readonly initialProspects: readonly ClientProspect[];
}

export default function AdminProspectsList({
  initialProspects,
}: AdminProspectsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [salesPersonFilter, setSalesPersonFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProspectHistory, setSelectedProspectHistory] = useState<
    ChangeHistoryEntry[]
  >([]);
  const [selectedProspectName, setSelectedProspectName] = useState("");

  // Get unique sales persons for filter
  const salesPersons = useMemo(
    () =>
      Array.from(
        new Set(initialProspects.map((p) => p.sales_person_name))
      ).sort((a, b) => a.localeCompare(b)),
    [initialProspects]
  );

  // Filter prospects
  const filteredProspects = useMemo(
    () =>
      initialProspects.filter((prospect) => {
        const matchesSearch =
          prospect.client_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          prospect.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prospect.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prospect.sales_person_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || prospect.status === statusFilter;
        const matchesSalesPerson =
          salesPersonFilter === "all" ||
          prospect.sales_person_name === salesPersonFilter;

        return matchesSearch && matchesStatus && matchesSalesPerson;
      }),
    [initialProspects, searchTerm, statusFilter, salesPersonFilter]
  );

  const openHistoryDialog = (prospect: ClientProspect) => {
    const history = (prospect.change_history as ChangeHistoryEntry[]) || [];
    setSelectedProspectHistory(history);
    setSelectedProspectName(prospect.client_name);
    setHistoryDialogOpen(true);
  };

  const handleExportCSV = () => {
    const data = filteredProspects.map((p, index) => ({
      "#": index + 1,
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
    const data = filteredProspects.map((p, index) => ({
      "#": index + 1,
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
    const data = filteredProspects.map((p, index) => [
      String(index + 1),
      p.client_name,
      p.contact,
      p.location,
      STATUS_LABELS[p.status] || p.status,
      p.sales_person_name,
    ]);

    const blob = await pdf(
      <TableReportPDF title='Prospects Report' headers={headers} data={data} />
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

  return (
    <div className='min-h-screen bg-gray-50 px-4'>
      <div className='mx-auto space-y-4'>
        {/* Header with title and export */}
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-gray-900'>All Prospects</h1>
          {filteredProspects.length > 0 && (
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
              <ProspectStats prospects={filteredProspects} />

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
            <div className='overflow-x-auto'>
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
                  {filteredProspects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center py-8 text-gray-500'>
                        No prospects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProspects.map((prospect) => (
                      <Fragment key={prospect.id}>
                        <TableRow
                          className='cursor-pointer hover:bg-gray-50'
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === prospect.id ? null : prospect.id
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
                                  "MMM d, yyyy HH:mm"
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
