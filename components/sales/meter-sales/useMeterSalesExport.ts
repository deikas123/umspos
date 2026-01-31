import { createElement, useCallback, useState } from "react";

import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import {
  getAllSaleBatchesForExport,
  getSaleBatchesWithDetailsForExport,
} from "@/lib/actions/sales";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";

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
  { formatDate, filters }: UseMeterSalesExportOptions,
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
        batch.customer_type
          ?.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") || "N/A",
        batch.customer_county || "N/A",
        batch.customer_contact || "N/A",
      ]);

      const blob = await pdf(
        createElement(TableReportPDF, {
          title: "Meter Sales Report",
          headers,
          data,
        }),
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

    setIsExporting(true);
    try {
      // Fetch all filtered data for export
      const allBatches = await getAllSaleBatchesForExport(filters);

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
        "Customer Type":
          batch.customer_type
            ?.split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A",
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

  const handleExportXLSX = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const allBatches = await getAllSaleBatchesForExport(filters);

      if (!allBatches.length) {
        toast.error("No data to export");
        return;
      }

      const xlsxData = allBatches.map((batch) => ({
        Seller: batch.user_name,
        "Meter Type": batch.meter_type,
        Amount: batch.batch_amount,
        "Sale Amount": batch.total_price,
        "Sale Date": formatDate(batch.sale_date),
        Destination: batch.destination,
        Recipient: batch.recipient,
        "Customer Type":
          batch.customer_type
            ?.split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A",
        County: batch.customer_county || "N/A",
        Contact: batch.customer_contact || "N/A",
      }));

      generateXLSX(xlsxData, "meter_sales_report", "Sales");

      toast.success(`Exported ${allBatches.length} records to Excel`);
    } catch (error) {
      console.error("Failed to export XLSX:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  // --- With Details Export Handlers ---

  const handleExportPDFWithDetails = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const detailedSales = await getSaleBatchesWithDetailsForExport(filters);

      if (!detailedSales.length) {
        toast.error("No data to export");
        return;
      }

      const headers = [
        "Date",
        "Customer Name",
        "Type",
        "Serial Number",
        "Amount",
        "County",
      ];

      const data = detailedSales.map((sale) => [
        formatDate(sale.sale_date),
        sale.customer_name,
        sale.meter_type
          ?.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") || "N/A",
        sale.serial_number,
        `KES ${Math.round(sale.unit_price).toLocaleString()}`,
        sale.customer_county || "N/A",
      ]);

      const blob = await pdf(
        createElement(TableReportPDF, {
          title: "Meter Sales Detailed Report",
          headers,
          data,
        }),
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meter-sales-detailed-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${detailedSales.length} records to PDF`);
    } catch (error) {
      console.error("Failed to export PDF with details:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  const handleExportCSVWithDetails = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const detailedSales = await getSaleBatchesWithDetailsForExport(filters);

      if (!detailedSales.length) {
        toast.error("No data to export");
        return;
      }

      const csvData = detailedSales.map((sale) => ({
        Date: formatDate(sale.sale_date),
        "Customer Name": sale.customer_name,
        Type:
          sale.meter_type
            ?.split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A",
        "Serial Number": sale.serial_number,
        Amount: sale.unit_price.toString(),
        County: sale.customer_county || "N/A",
      }));

      generateCSV(csvData, "meter_sales_detailed");

      toast.success(`Exported ${detailedSales.length} records to CSV`);
    } catch (error) {
      console.error("Failed to export CSV with details:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  const handleExportXLSXWithDetails = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const detailedSales = await getSaleBatchesWithDetailsForExport(filters);

      if (!detailedSales.length) {
        toast.error("No data to export");
        return;
      }

      const xlsxData = detailedSales.map((sale) => ({
        Date: formatDate(sale.sale_date),
        "Customer Name": sale.customer_name,
        Type:
          sale.meter_type
            ?.split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A",
        "Serial Number": sale.serial_number,
        Amount: sale.unit_price,
        County: sale.customer_county || "N/A",
      }));

      generateXLSX(xlsxData, "meter_sales_detailed", "Sales Details");

      toast.success(`Exported ${detailedSales.length} records to Excel`);
    } catch (error) {
      console.error("Failed to export XLSX with details:", error);
      toast.error("Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  }, [filters, formatDate, isExporting]);

  return {
    handleExportPDF,
    handleExportCSV,
    handleExportXLSX,
    handleExportPDFWithDetails,
    handleExportCSVWithDetails,
    handleExportXLSXWithDetails,
    isExporting,
  };
}
