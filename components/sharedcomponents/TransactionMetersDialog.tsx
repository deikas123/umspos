"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Package,
  Download,
  File,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import { getTransactionMeters } from "@/lib/actions/agents";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import { format } from "date-fns";
import { toast } from "sonner";

interface TransactionMetersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionInfo: {
    agentId: string;
    agentName?: string;
    transactionDate: Date | string;
    transactionType: string;
    meterType: string;
    quantity: number;
  } | null;
}

interface MeterDetail {
  id: string;
  serial_number: string;
  meter_id: string;
}

export default function TransactionMetersDialog({
  open,
  onOpenChange,
  transactionInfo,
}: Readonly<TransactionMetersDialogProps>) {
  const [meters, setMeters] = useState<MeterDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [performedBy, setPerformedBy] = useState<string | null>(null);

  useEffect(() => {
    if (open && transactionInfo) {
      fetchMeters();
    } else {
      // Reset state when dialog closes
      setMeters([]);
      setSearchTerm("");
      setPerformedBy(null);
    }
  }, [open, transactionInfo]);

  const fetchMeters = async () => {
    if (!transactionInfo) return;

    setIsLoading(true);
    try {
      const result = await getTransactionMeters({
        agentId: transactionInfo.agentId,
        transactionDate: transactionInfo.transactionDate,
        transactionType: transactionInfo.transactionType,
        meterType: transactionInfo.meterType,
      });
      setMeters(result.meters);
      setPerformedBy(result.performedBy);
    } catch (error) {
      console.error("Failed to fetch transaction meters:", error);
      setMeters([]);
      setPerformedBy(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeters = meters.filter((meter) =>
    meter.serial_number.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getExportFilename = useCallback(() => {
    const agentPart = transactionInfo?.agentName
      ? transactionInfo.agentName.replaceAll(/\s+/g, "_")
      : "store";
    const datePart = transactionInfo?.transactionDate
      ? format(new Date(transactionInfo.transactionDate), "yyyy-MM-dd")
      : "unknown";
    const typePart = transactionInfo?.transactionType ?? "transaction";
    return `${typePart}_meters_${agentPart}_${datePart}`;
  }, [transactionInfo]);

  const getExportTitle = useCallback(() => {
    const agentPart = transactionInfo?.agentName ?? "Store Transaction";
    const datePart = transactionInfo?.transactionDate
      ? format(new Date(transactionInfo.transactionDate), "dd/MM/yyyy")
      : "";
    const typePart =
      transactionInfo?.transactionType === "assignment"
        ? "Assigned"
        : "Returned";
    const byPart = performedBy ? ` by ${performedBy}` : "";
    return `${typePart} Meters - ${agentPart} (${datePart})${byPart}`;
  }, [transactionInfo, performedBy]);

  const handleExportCSV = useCallback(() => {
    if (meters.length === 0) return;
    const csvData = meters.map((meter, index) => ({
      "#": index + 1,
      "Serial Number": meter.serial_number,
    }));
    generateCSV(csvData, getExportFilename());
    toast.success(`Exported ${meters.length} meters to CSV`);
  }, [meters, getExportFilename]);

  const handleExportXLSX = useCallback(() => {
    if (meters.length === 0) return;
    const xlsxData = meters.map((meter, index) => ({
      "#": index + 1,
      "Serial Number": meter.serial_number,
    }));
    generateXLSX(xlsxData, getExportFilename(), "Meter Serials");
    toast.success(`Exported ${meters.length} meters to XLSX`);
  }, [meters, getExportFilename]);

  const handleExportPDF = useCallback(async () => {
    if (meters.length === 0) return;

    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;

    try {
      const headers = ["#", "Serial Number"];
      const pdfData = meters.map((meter, index) => [
        String(index + 1),
        meter.serial_number,
      ]);

      const blob = await pdf(
        <TableReportPDF
          title={getExportTitle()}
          headers={headers}
          data={pdfData}
        />,
      ).toBlob();

      url = URL.createObjectURL(blob);
      link = document.createElement("a");
      link.href = url;
      link.download = `${getExportFilename()}.pdf`;
      document.body.appendChild(link);
      link.click();
      toast.success(`Exported ${meters.length} meters to PDF`);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      if (link) link.remove();
      if (url) URL.revokeObjectURL(url);
    }
  }, [meters, getExportFilename, getExportTitle]);

  const getTransactionTypeLabel = (type: string) => {
    return type === "assignment" ? "Assigned" : "Returned";
  };

  const capitalizeMeterType = (type: string) => {
    if (type === "3 phase") return "3 Phase";
    return type
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex flex-col max-w-2xl bg-gradient-to-br from-gray-50 to-white border-2'
        style={{ height: "85vh", maxHeight: "85vh" }}>
        <DialogHeader className='flex-shrink-0 pb-4 border-b'>
          <DialogTitle className='flex items-center gap-3 text-xl'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Package className='h-6 w-6 text-primary' />
            </div>
            <div>
              <div>Meter Serial Numbers</div>
              {transactionInfo && (
                <div className='text-sm font-normal text-muted-foreground mt-1'>
                  {transactionInfo.agentName || "Store Transaction"}
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {transactionInfo && (
              <div className='flex flex-wrap items-center gap-2 mt-3'>
                <Badge
                  variant='outline'
                  className={
                    transactionInfo.transactionType === "assignment"
                      ? "bg-blue-100 text-blue-800 border-blue-300 font-medium"
                      : "bg-orange-100 text-orange-800 border-orange-300 font-medium"
                  }>
                  {getTransactionTypeLabel(transactionInfo.transactionType)}
                </Badge>
                <Badge variant='secondary' className='font-medium'>
                  {capitalizeMeterType(transactionInfo.meterType)}
                </Badge>
                <span className='text-sm font-medium text-gray-700'>
                  • {transactionInfo.quantity} meter
                  {transactionInfo.quantity === 1 ? "" : "s"}
                </span>
                {performedBy && (
                  <span className='text-sm font-medium text-gray-700'>
                    • By {performedBy}
                  </span>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='flex-shrink-0 pt-4'>
          <div className='flex items-center gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search serial numbers...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 bg-white border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
              />
            </div>
            {meters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='whitespace-nowrap border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'>
                    <Download className='h-4 w-4 mr-2' />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    className='cursor-pointer'>
                    <File className='w-4 h-4 mr-2' />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportXLSX}
                    className='cursor-pointer'>
                    <FileSpreadsheet className='w-4 h-4 mr-2' />
                    Export as XLSX
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportPDF}
                    className='cursor-pointer'>
                    <FileText className='w-4 h-4 mr-2' />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className='flex-1 overflow-y-auto min-h-0 mt-4'>
          {isLoading && (
            <div className='flex items-center justify-center h-full'>
              <Loader />
            </div>
          )}
          {!isLoading && filteredMeters.length === 0 && (
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
              <Package className='h-12 w-12 mb-2 opacity-50' />
              {meters.length === 0 ? (
                <p className='text-sm'>
                  No meter details recorded for this transaction
                </p>
              ) : (
                <p className='text-sm'>No meters match your search</p>
              )}
            </div>
          )}
          {!isLoading && filteredMeters.length > 0 && (
            <div className='space-y-2.5'>
              {filteredMeters.map((meter, index) => (
                <div
                  key={meter.id}
                  className='flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200'>
                  <div className='flex items-center gap-4'>
                    <div className='flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg'>
                      <span className='text-xs text-primary font-bold'>
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <span className='font-mono text-base font-semibold text-gray-900'>
                        {meter.serial_number}
                      </span>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        Serial Number
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex-shrink-0 pt-4 border-t border-gray-200 text-center'>
          {!isLoading && meters.length > 0 && (
            <p className='text-sm font-medium text-gray-600'>
              Showing{" "}
              <span className='text-primary font-semibold'>
                {filteredMeters.length}
              </span>{" "}
              of{" "}
              <span className='text-primary font-semibold'>
                {meters.length}
              </span>{" "}
              meter
              {meters.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
