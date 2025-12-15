"use client";

import { useState, Fragment } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Search,
  History,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Target,
} from "lucide-react";
import type { ClientProspect } from "@/lib/db/schema";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

interface ChangeHistoryEntry {
  timestamp: string;
  user_id: string;
  user_name: string;
  changes: {
    field: string;
    old_value: string | number | null;
    new_value: string | number | null;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  interested: "bg-green-100 text-green-800",
  not_interested: "bg-red-100 text-red-800",
  prospect: "bg-blue-100 text-blue-800",
  lead: "bg-purple-100 text-purple-800",
  presentation: "bg-yellow-100 text-yellow-800",
  quotation_sent: "bg-orange-100 text-orange-800",
  closed: "bg-emerald-100 text-emerald-800",
  lost: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  not_interested: "Not Interested",
  prospect: "Prospect",
  lead: "Lead",
  presentation: "Presentation",
  quotation_sent: "Quotation Sent",
  closed: "Closed",
  lost: "Lost",
};

interface ProspectsListProps {
  readonly initialProspects: readonly ClientProspect[];
}

export default function ProspectsList({
  initialProspects,
}: ProspectsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProspectHistory, setSelectedProspectHistory] = useState<
    ChangeHistoryEntry[]
  >([]);
  const [selectedProspectName, setSelectedProspectName] = useState("");

  // Get unique sales persons for filter
  const salesPersons = Array.from(
    new Set(initialProspects.map((p) => p.sales_person_name))
  ).sort((a, b) => a.localeCompare(b));

  // Filter prospects
  const filteredProspects = initialProspects.filter((prospect) => {
    const matchesSearch =
      prospect.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  });

  const openHistoryDialog = (prospect: ClientProspect) => {
    const history = (prospect.change_history as ChangeHistoryEntry[]) || [];
    setSelectedProspectHistory(history);
    setSelectedProspectName(prospect.client_name);
    setHistoryDialogOpen(true);
  };

  const openInGoogleMaps = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
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
          <h1 className='text-2xl font-bold text-gray-900'>Prospects List</h1>
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
              {/* Inline Stats Row */}
              <div className='flex flex-wrap items-center gap-4 md:gap-6'>
                <div className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-gray-100'>
                    <Filter className='h-4 w-4 text-gray-600' />
                  </div>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-xl font-bold text-gray-900'>{filteredProspects.length}</span>
                    <span className='text-sm text-gray-500'>Total</span>
                  </div>
                </div>

                <div className='h-6 w-px bg-gray-200 hidden sm:block' />

                <div className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-purple-50'>
                    <Target className='h-4 w-4 text-purple-600' />
                  </div>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-xl font-bold text-purple-600'>
                      {filteredProspects.filter((p) =>
                        ["interested", "prospect"].includes(p.status)
                      ).length}
                    </span>
                    <span className='text-sm text-gray-500'>Active</span>
                  </div>
                </div>

                <div className='h-6 w-px bg-gray-200 hidden sm:block' />

                <div className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-green-50'>
                    <ChevronUp className='h-4 w-4 text-green-600' />
                  </div>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-xl font-bold text-green-600'>
                      {filteredProspects.filter((p) => p.status === "closed").length}
                    </span>
                    <span className='text-sm text-gray-500'>Closed</span>
                  </div>
                </div>

                <div className='h-6 w-px bg-gray-200 hidden sm:block' />

                <div className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-blue-50'>
                    <ChevronDown className='h-4 w-4 text-blue-600' />
                  </div>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-xl font-bold text-blue-600'>
                      {filteredProspects.filter((p) =>
                        ["lead", "presentation", "quotation_sent"].includes(p.status)
                      ).length}
                    </span>
                    <span className='text-sm text-gray-500'>Pipeline</span>
                  </div>
                </div>

                <div className='h-6 w-px bg-gray-200 hidden sm:block' />

                <div className='flex items-center gap-2'>
                  <div className='p-1.5 rounded-md bg-red-50'>
                    <History className='h-4 w-4 text-red-600' />
                  </div>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-xl font-bold text-red-600'>
                      {filteredProspects.filter(
                        (p) => p.status === "lost" || p.status === "not_interested"
                      ).length}
                    </span>
                    <span className='text-sm text-gray-500'>Lost</span>
                  </div>
                </div>
              </div>

              {/* Inline Filters Row */}
              <div className='flex flex-col md:flex-row gap-3'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search by client, location, contact, or sales person...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <div className='flex gap-2'>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[160px]'>
                      <Filter className='h-4 w-4 mr-2' />
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={salesPersonFilter}
                    onValueChange={setSalesPersonFilter}>
                    <SelectTrigger className='w-[180px]'>
                      <SelectValue placeholder='Sales Person' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Sales Persons</SelectItem>
                      {salesPersons.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[30px]'></TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Meter Type</TableHead>
                    <TableHead className='text-center'># Meters</TableHead>
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProspects.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
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
                          <TableCell>{prospect.location}</TableCell>
                          <TableCell>{prospect.contact}</TableCell>
                          <TableCell>
                            <Badge
                              className={STATUS_COLORS[prospect.status] || ""}>
                              {STATUS_LABELS[prospect.status] ||
                                prospect.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='capitalize'>
                            {prospect.meter_type.replace("_", " ")}
                          </TableCell>
                          <TableCell className='text-center'>
                            {prospect.number_of_meters}
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
                            <div className='flex gap-2'>
                              {prospect.latitude && prospect.longitude && (
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInGoogleMaps(
                                      prospect.latitude!,
                                      prospect.longitude!
                                    );
                                  }}
                                  title='View on map'>
                                  <MapPin className='h-4 w-4 text-blue-600' />
                                </Button>
                              )}
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
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRow === prospect.id && (
                          <TableRow>
                            <TableCell colSpan={10} className='bg-gray-50'>
                              <div className='p-4 space-y-2'>
                                <div>
                                  <span className='font-medium'>
                                    Other Remarks:
                                  </span>{" "}
                                  {prospect.other_remarks || "None"}
                                </div>
                                {(prospect as any).place_name && (
                                  <div>
                                    <span className='font-medium'>
                                      GPS Location:
                                    </span>{" "}
                                    {(prospect as any).place_name}
                                    {prospect.latitude &&
                                      prospect.longitude && (
                                        <Button
                                          variant='link'
                                          size='sm'
                                          className='ml-2 h-auto p-0'
                                          onClick={() =>
                                            openInGoogleMaps(
                                              prospect.latitude!,
                                              prospect.longitude!
                                            )
                                          }>
                                          Open in Maps{" "}
                                          <ExternalLink className='h-3 w-3 ml-1' />
                                        </Button>
                                      )}
                                  </div>
                                )}
                                {!(prospect as any).place_name &&
                                  prospect.latitude &&
                                  prospect.longitude && (
                                    <div>
                                      <span className='font-medium'>
                                        Coordinates:
                                      </span>{" "}
                                      {prospect.latitude}, {prospect.longitude}
                                      <Button
                                        variant='link'
                                        size='sm'
                                        className='ml-2 h-auto p-0'
                                        onClick={() =>
                                          openInGoogleMaps(
                                            prospect.latitude!,
                                            prospect.longitude!
                                          )
                                        }>
                                        Open in Maps{" "}
                                        <ExternalLink className='h-3 w-3 ml-1' />
                                      </Button>
                                    </div>
                                  )}
                                <div>
                                  <span className='font-medium'>Created:</span>{" "}
                                  {prospect.created_at
                                    ? format(
                                        new Date(prospect.created_at),
                                        "MMM d, yyyy HH:mm"
                                      )
                                    : "-"}
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

        {/* History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Change History - {selectedProspectName}</DialogTitle>
              <DialogDescription>
                Track all changes made to this prospect
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className='max-h-[400px]'>
              {selectedProspectHistory.length === 0 ? (
                <p className='text-gray-500 text-center py-4'>
                  No changes recorded
                </p>
              ) : (
                <div className='space-y-4'>
                  {selectedProspectHistory
                    .toSorted(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((entry) => (
                      <div
                        key={entry.timestamp}
                        className='border rounded-lg p-4'>
                        <div className='flex justify-between items-start mb-2'>
                          <span className='font-medium'>{entry.user_name}</span>
                          <span className='text-sm text-gray-500'>
                            {format(
                              new Date(entry.timestamp),
                              "MMM d, yyyy HH:mm"
                            )}
                          </span>
                        </div>
                        <div className='space-y-1'>
                          {entry.changes.map((change) => (
                            <div
                              key={`${entry.timestamp}-${change.field}`}
                              className='text-sm'>
                              <span className='text-gray-500 capitalize'>
                                {change.field.replace("_", " ")}:
                              </span>{" "}
                              <span className='text-red-500 line-through'>
                                {String(change.old_value || "empty")}
                              </span>{" "}
                              →{" "}
                              <span className='text-green-600'>
                                {String(change.new_value || "empty")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
