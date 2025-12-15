"use client";

import { useCallback, useState } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import { toast } from "sonner";

import { SaleBatch } from "./hooks/useMeterSalesData";
import { SaleDetailsHeader } from "./meter-sales-row/SaleDetailsHeader";
import { SaleSummaryCards } from "./meter-sales-row/SaleSummaryCards";
import { SaleToolbar } from "./meter-sales-row/SaleToolbar";
import { SerialNumbersSection } from "./meter-sales-row/SerialNumbersSection";
import { ScrollTopButton } from "./meter-sales-row/ScrollTopButton";
import { useMeterSaleDetails } from "./meter-sales-row/useMeterSaleDetails";
import { useScrollContainer } from "./meter-sales-row/useScrollContainer";
import { useSerialNumberSearch } from "./meter-sales-row/useSerialNumberSearch";

interface MeterSalesRowProps {
  batch: SaleBatch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNoteDialog: (batch: SaleBatch) => void;
}

const ITEMS_PER_PAGE = 20;

export function MeterSalesRow({
  batch,
  isOpen,
  onOpenChange,
  onOpenNoteDialog,
}: Readonly<MeterSalesRowProps>) {
  const { meters, transactionRef, loading, isRefLoading } = useMeterSaleDetails(
    batch.id,
    isOpen
  );
  const {
    searchTerm,
    setSearchTerm,
    filteredMeters,
    currentMeters,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  } = useSerialNumberSearch(meters, ITEMS_PER_PAGE);
  const { scrollRef, showScrollTop, scrollToTop, preserveScrollPosition } =
    useScrollContainer();
  const [isCopying, setIsCopying] = useState(false);

  const handleExportCSV = useCallback(() => {
    const csvData = meters.map((meter) => ({
      "SN#": meter.serial_number,
    }));

    const filename = transactionRef
      ? `meter_serials_${transactionRef.replaceAll("/", "-")}`
      : `meter_serials_batch_${batch.id}`;

    generateCSV(csvData, filename);
  }, [meters, transactionRef, batch.id]);

  const handleExportXLSX = useCallback(() => {
    const xlsxData = meters.map((meter) => ({
      "SN#": meter.serial_number,
    }));

    const filename = transactionRef
      ? `meter_serials_${transactionRef.replaceAll("/", "-")}`
      : `meter_serials_batch_${batch.id}`;

    generateXLSX(xlsxData, filename, "Meter Serials");
  }, [meters, transactionRef, batch.id]);

  const handleExportPDF = useCallback(async () => {
    const filename = transactionRef
      ? `meter_serials_${transactionRef.replaceAll("/", "-")}`
      : `meter_serials_batch_${batch.id}`;

    const title = transactionRef
      ? `Meter Serials - ${transactionRef}`
      : `Meter Serials - Batch ${batch.id}`;

    const headers = ["#", "Serial Number"];
    const pdfData = meters.map((meter, index) => [
      String(index + 1),
      meter.serial_number,
    ]);

    const blob = await pdf(
      <TableReportPDF title={title} headers={headers} data={pdfData} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [meters, transactionRef, batch.id]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!transactionRef) {
      return;
    }

    try {
      await navigator.clipboard.writeText(transactionRef);
      setIsCopying(true);
      toast.success("Reference number copied to clipboard");

      setTimeout(() => {
        setIsCopying(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy reference number:", error);
      toast.error("Failed to copy reference number");
    }
  }, [transactionRef]);

  const handlePageChange = useCallback(
    (page: number) => {
      preserveScrollPosition(() => goToPage(page));
    },
    [goToPage, preserveScrollPosition]
  );

  const handleNextPage = useCallback(() => {
    preserveScrollPosition(goToNextPage);
  }, [goToNextPage, preserveScrollPosition]);

  const handlePreviousPage = useCallback(() => {
    preserveScrollPosition(goToPreviousPage);
  }, [goToPreviousPage, preserveScrollPosition]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='min-w-[60vw] w-full bg-gray-100 border-l border-gray-200 p-0 gap-0'>
        <div className='h-full flex flex-col'>
          {/* Fixed Header */}
          <div className='flex-shrink-0 bg-white pl-2 pr-6 border-b border-gray-200'>
            <SaleDetailsHeader
              transactionRef={transactionRef}
              isRefLoading={isRefLoading}
              isCopying={isCopying}
              onCopy={handleCopyToClipboard}
              onOpenNoteDialog={() => onOpenNoteDialog(batch)}
              hasNote={Boolean(batch.notes)}
              saleDate={batch.sale_date}
            />
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            className='flex-1 overflow-y-auto px-6 py-6 space-y-4'>
            <SaleSummaryCards batch={batch} />

            <SaleToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onExportCSV={handleExportCSV}
              onExportXLSX={handleExportXLSX}
              onExportPDF={handleExportPDF}
            />

            <SerialNumbersSection
              loading={loading}
              filteredMeters={filteredMeters}
              totalMeters={meters.length}
              currentMeters={currentMeters}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              hasSearchTerm={Boolean(searchTerm)}
            />
          </div>
        </div>

        <ScrollTopButton visible={showScrollTop} onClick={scrollToTop} />
      </SheetContent>
    </Sheet>
  );
}
