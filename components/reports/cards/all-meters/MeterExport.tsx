import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { getAllMetersForExport, MeterWithStatus } from "@/lib/actions/exports";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { formatISODate } from "@/lib/utils/dateUtils";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import { CalendarDate } from "@internationalized/date";
import { DateRangeValue } from "../../hooks/useMetersData";

type MeterExportProps = Readonly<{
  filters: {
    statusFilter: string;
    typeFilter: string | null;
    searchTerm: string | undefined;
    dateRange: DateRangeValue;
    selectedDate: CalendarDate | null;
  };
  isLoading: boolean;
}>;

function getDateRangeParams(filters: MeterExportProps["filters"]) {
  const effectiveRange: DateRangeValue = filters.selectedDate
    ? { start: filters.selectedDate, end: filters.selectedDate }
    : filters.dateRange;

  const formatCalendarDate = (date: CalendarDate) => {
    const year = String(date.year);
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDateStr = effectiveRange?.start
    ? formatCalendarDate(effectiveRange.start)
    : undefined;

  const endDateStr = effectiveRange?.end
    ? formatCalendarDate(effectiveRange.end)
    : undefined;

  return { startDateStr, endDateStr };
}

function getAgentDetails(meter: MeterWithStatus) {
  if (meter.status !== "with_agent") return {};
  return {
    "Agent Name": meter.agent_details.agent_name,
    "Agent Phone": meter.agent_details.agent_phone,
    "Agent Location": meter.agent_details.agent_location,
    "Assigned Date": meter.agent_details.assigned_at
      ? formatISODate(meter.agent_details.assigned_at)
      : "",
  };
}

function getSaleDetails(meter: MeterWithStatus) {
  if (meter.status !== "sold" && meter.status !== "replaced") {
    // faulty might have sale_details too, but let's check explicit statuses first or use type guards if needed.
    // However, simpler is:
    if ("sale_details" in meter && meter.sale_details) {
      return {
        "Sold Date": meter.sale_details.sold_at
          ? formatISODate(meter.sale_details.sold_at)
          : "",
        "Sold By": meter.sale_details.sold_by,
        Recipient: meter.sale_details.recipient,
        Destination: meter.sale_details.destination,
        "Customer Contact": meter.sale_details.customer_contact,
        "Unit Price": meter.sale_details.unit_price,
      };
    }
    return {};
  }

  if (!meter.sale_details) return {};
  return {
    "Sold Date": meter.sale_details.sold_at
      ? formatISODate(meter.sale_details.sold_at)
      : "",
    "Sold By": meter.sale_details.sold_by,
    Recipient: meter.sale_details.recipient,
    Destination: meter.sale_details.destination,
    "Customer Contact": meter.sale_details.customer_contact,
    "Unit Price": meter.sale_details.unit_price,
  };
}

function getReplacementDetails(meter: MeterWithStatus) {
  if (meter.status !== "replaced") return {};
  return {
    "Replacement Serial": meter.replacement_details.replacement_serial,
    "Replacement Date": meter.replacement_details.replacement_date
      ? formatISODate(meter.replacement_details.replacement_date)
      : "",
    "Replaced By": meter.replacement_details.replacement_by,
  };
}

function getFaultDetails(meter: MeterWithStatus) {
  if (meter.status !== "faulty") return {};

  const details = {} as any;
  if (meter.fault_details) {
    Object.assign(details, {
      "Reported Date": meter.fault_details.reported_at
        ? formatISODate(meter.fault_details.reported_at)
        : "",
      "Reported By": meter.fault_details.reported_by,
      "Returner Name": meter.fault_details.returner_name,
      "Fault Description": meter.fault_details.fault_description,
      "Fault Status": meter.fault_details.fault_status,
    });
  }

  // Faulty meters might also have sale details if they were sold before faulty return
  if (meter.sale_details) {
    // Manual extraction since getSaleDetails might not match faulty status if I made it strict
    Object.assign(details, {
      "Sold Date": meter.sale_details.sold_at
        ? formatISODate(meter.sale_details.sold_at)
        : "",
      "Sold By": meter.sale_details.sold_by,
      Recipient: meter.sale_details.recipient,
      Destination: meter.sale_details.destination,
    });
  }
  return details;
}

function formatMeterForCsv(meter: MeterWithStatus) {
  const baseData = {
    "Serial Number": meter.serial_number,
    Type: meter.type,
    Status: meter.status,
  };

  let additionalData = {};

  switch (meter.status) {
    case "with_agent":
      additionalData = getAgentDetails(meter);
      break;

    case "sold":
      // For sold, we just get sale details
      if (meter.status === "sold") {
        additionalData = getSaleDetails(meter);
      }
      break;

    case "replaced":
      // For replaced, we get sale + replacement
      if (meter.status === "replaced") {
        additionalData = {
          ...getSaleDetails(meter),
          ...getReplacementDetails(meter),
        };
      }
      break;

    case "faulty":
      additionalData = getFaultDetails(meter);
      break;

    case "in_stock":
      break;
  }

  return { ...baseData, ...additionalData };
}

export function MeterExport({ filters, isLoading }: MeterExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      const { startDateStr, endDateStr } = getDateRangeParams(filters);

      // Get all meters based on current filters
      const allMeters = await getAllMetersForExport(
        filters.statusFilter,
        filters.typeFilter,
        filters.searchTerm,
        startDateStr,
        endDateStr,
      );

      if (!allMeters.length) {
        toast.error("No meters found to export with the current filters");
        setIsExporting(false);
        return;
      }

      // Format the data for CSV
      const csvData = allMeters.map(formatMeterForCsv);

      // Generate and download the CSV
      generateCSV(
        csvData,
        `meters-report-${filters.statusFilter || "all"}-${
          new Date().toISOString().split("T")[0]
        }`,
      );

      toast.success(`Exported ${allMeters.length} meters`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error(
        "An error occurred while exporting the data. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    try {
      setIsExporting(true);

      const { startDateStr, endDateStr } = getDateRangeParams(filters);

      const allMeters = await getAllMetersForExport(
        filters.statusFilter,
        filters.typeFilter,
        filters.searchTerm,
        startDateStr,
        endDateStr,
      );

      if (!allMeters.length) {
        toast.error("No meters found to export with the current filters");
        setIsExporting(false);
        return;
      }

      const xlsxData = allMeters.map(formatMeterForCsv);

      generateXLSX(
        xlsxData,
        `meters-report-${filters.statusFilter || "all"}-${
          new Date().toISOString().split("T")[0]
        }`,
        "Meters",
      );

      toast.success(`Exported ${allMeters.length} meters to XLSX`);
    } catch (error) {
      console.error("Error exporting XLSX:", error);
      toast.error("An error occurred while exporting. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      const { startDateStr, endDateStr } = getDateRangeParams(filters);

      const allMeters = await getAllMetersForExport(
        filters.statusFilter,
        filters.typeFilter,
        filters.searchTerm,
        startDateStr,
        endDateStr,
      );

      if (!allMeters.length) {
        toast.error("No meters found to export with the current filters");
        setIsExporting(false);
        return;
      }

      const headers = ["Serial Number", "Type", "Status", "Details", "Date"];

      const pdfData = allMeters.map((meter: MeterWithStatus) => {
        let details = "";
        let dateStr = "";

        if (meter.status === "with_agent") {
          details = meter.agent_details.agent_name;
          dateStr = meter.agent_details.assigned_at
            ? formatISODate(meter.agent_details.assigned_at)
            : "";
        } else if (meter.status === "sold") {
          details = `Sold to: ${meter.sale_details.recipient}`;
          dateStr = meter.sale_details.sold_at
            ? formatISODate(meter.sale_details.sold_at)
            : "";
        } else if (meter.status === "replaced") {
          details = `Repl: ${meter.replacement_details.replacement_serial}`;
          dateStr = meter.replacement_details.replacement_date
            ? formatISODate(meter.replacement_details.replacement_date)
            : "";
        } else if (meter.status === "faulty") {
          details = `Fault: ${meter.fault_details?.fault_description || "N/A"}`;
          dateStr = meter.fault_details?.reported_at
            ? formatISODate(meter.fault_details.reported_at)
            : "";
        }

        return [
          meter.serial_number,
          meter.type,
          meter.status,
          details,
          dateStr,
        ];
      });

      const blob = await pdf(
        <TableReportPDF
          title={`Meters Report - ${filters.statusFilter || "All"}`}
          headers={headers}
          data={pdfData}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meters-report-${filters.statusFilter || "all"}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allMeters.length} meters to PDF`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("An error occurred while exporting. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={isExporting || isLoading}
          className='ml-2 cursor-pointer'>
          {isExporting ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Exporting...
            </>
          ) : (
            <>
              <Download className='w-4 h-4 mr-2' />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleExportCSV} className='cursor-pointer'>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportXLSX} className='cursor-pointer'>
          Export as XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className='cursor-pointer'>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
