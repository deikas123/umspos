"use client";

import { useState, useMemo, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  Download,
  File,
  FileSpreadsheet,
  FileText,
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

interface SalesPersonProspectsListProps {
  readonly initialProspects: readonly ClientProspect[];
}

export default function SalesPersonProspectsList({
  initialProspects,
}: SalesPersonProspectsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] =
    useState<ClientProspect | null>(null);

  // Use initialProspects directly since we refresh on updates
  const prospects = initialProspects;

  // Filter prospects
  const filteredProspects = useMemo(
    () =>
      prospects.filter((prospect) => {
        const matchesSearch =
          prospect.client_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          prospect.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prospect.contact.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || prospect.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [prospects, searchTerm, statusFilter]
  );

  const handleEditClick = (e: React.MouseEvent, prospect: ClientProspect) => {
    e.stopPropagation();
    setSelectedProspect(prospect);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the page to get updated data
    router.refresh();
  };

  const handleExportCSV = () => {
    const data = filteredProspects.map((p, index) => ({
      "#": index + 1,
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
    const data = filteredProspects.map((p, index) => ({
      "#": index + 1,
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
    const data = filteredProspects.map((p, index) => [
      String(index + 1),
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
      />
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

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='mb-6 flex justify-between items-start'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>My Prospects</h1>
            <p className='text-gray-600'>
              View and manage your client prospects
            </p>
          </div>
          <div className='flex gap-2'>
            {filteredProspects.length > 0 && (
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

        <ProspectStats prospects={filteredProspects} />

        <Card>
          <CardHeader>
            <CardTitle>My Prospects</CardTitle>
            <CardDescription>
              Click on a row to view details or edit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
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
                  {filteredProspects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-center py-8 text-gray-500'>
                        No prospects found. Start by creating a new one!
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
                                  "MMM d, yyyy HH:mm"
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
                                            "MMM d, yyyy HH:mm"
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
