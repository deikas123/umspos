import { createElement, useCallback, useState } from "react";

import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import { getAllSaleBatchesForExport } from "@/lib/actions/sales";
import { generateCSV } from "@/lib/utils/csvGenerator";

import type { SaleBatch } from "../hooks/useMeterSalesData";

interface UseMeterSalesExportOptions {
  formatDate: (date: Date | null) => string;
  filters?: {
    searchUser?: string;
    meterType?: string;
    customerType?: string;
    dateRange?: { start: Date; end: Date };
    specificDate?: Date;
  };
}

export function useMeterSalesExport(
  batches: SaleBatch[],
  { formatDate, filters }: UseMeterSalesExportOptions
) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Fetch all filtered data for export
      const allBatches = await getAllSaleBatchesForExport(filters);

      if (!allBatches.length) {
        toast.error("No data to export");
        return;
      }

      const headers = [
        "Seller",
        "Meter Type",
        "Amount",
        "Sale Amount",
        "Sale Date",
        "Customer Type",
        "County",
        "Contact",
      ];

      const data = allBatches.map((batch) => [
        batch.user_name,
        batch.meter_type,
        batch.batch_amount.toString(),
        `KES ${Math.round(batch.total_price).toLocaleString()}`,
        formatDate(batch.sale_date),
        batch.customer_type || "N/A",
        batch.customer_county || "N/A",
        batch.customer_contact || "N/A",
      ]);

      const blob = await pdf(
        createElement(TableReportPDF, {
          title: "Meter Sales Report",
          headers,
          data,
        })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meter-sales-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allBatches.length} records to PDF`);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  const handleExportCSV = useCallback(async () => {
    if (isExporting) return;

    console.log("[EXPORT] Starting CSV export with filters:", filters);

    setIsExporting(true);
    try {
      // Fetch all filtered data for export
      const allBatches = await getAllSaleBatchesForExport(filters);
      console.log("[EXPORT] Received batches count:", allBatches.length);

      if (!allBatches.length) {
        toast.error("No data to export");
        return;
      }

      const csvData = allBatches.map((batch) => ({
        Seller: batch.user_name,
        "Meter Type": batch.meter_type,
        Amount: batch.batch_amount.toString(),
        "Sale Amount": batch.total_price.toString(),
        "Sale Date": formatDate(batch.sale_date),
        Destination: batch.destination,
        Recipient: batch.recipient,
        "Customer Type": batch.customer_type || "N/A",
        County: batch.customer_county || "N/A",
        Contact: batch.customer_contact || "N/A",
      }));

      generateCSV(csvData, "meter_sales_report");

      toast.success(`Exported ${allBatches.length} records to CSV`);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  return {
    handleExportPDF,
    handleExportCSV,
    isExporting,
  };
}
