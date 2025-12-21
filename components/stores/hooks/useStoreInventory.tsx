"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAgentInventory } from "@/lib/actions/agents";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/dateUtils";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

export interface MeterInventory {
  id: string;
  serial_number: string;
  type: string;
  assigned_at: Date | null;
}

interface UseStoreInventoryOptions {
  storeId: string | undefined;
  storeName: string | undefined;
  itemsPerPage?: number;
}

export function useStoreInventory({
  storeId,
  storeName,
  itemsPerPage = 10,
}: UseStoreInventoryOptions) {
  const [inventory, setInventory] = useState<MeterInventory[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch inventory when store changes
  useEffect(() => {
    const fetchInventory = async () => {
      if (!storeId) return;
      setIsLoadingInventory(true);
      try {
        const data = await getAgentInventory(storeId);
        setInventory(data || []);
      } catch (error) {
        console.error("Error fetching store inventory:", error);
        toast.error("Failed to load inventory");
      } finally {
        setIsLoadingInventory(false);
      }
    };
    fetchInventory();
  }, [storeId]);

  // Filter inventory by type and search term
  const filteredInventory = useMemo(() => {
    return inventory.filter((meter) => {
      const matchesType =
        activeTab === "all" ||
        meter.type.toLowerCase() === activeTab.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        meter.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [inventory, activeTab, searchTerm]);

  // Paginate filtered inventory
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInventory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Type counts for tabs
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: inventory.length };
    inventory.forEach((meter) => {
      const type = meter.type.toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  // Refresh inventory
  const refreshInventory = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await getAgentInventory(storeId);
      setInventory(data || []);
    } catch (error) {
      console.error("Error refreshing store inventory:", error);
    }
  }, [storeId]);

  // Export functions
  const getExportData = useCallback(() => {
    return filteredInventory.map((meter) => ({
      "Serial Number": meter.serial_number,
      Type: meter.type,
      "Assigned Date": meter.assigned_at
        ? formatDate(meter.assigned_at)
        : "N/A",
    }));
  }, [filteredInventory]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportData = getExportData();
      if (exportData.length === 0) {
        toast.error("No meters to export");
        return;
      }
      generateCSV(
        exportData,
        `${storeName || "store"}-inventory-${new Date().toISOString().split("T")[0]}`
      );
      toast.success(`Exported ${exportData.length} meters to CSV`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, storeName]);

  const handleExportXLSX = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportData = getExportData();
      if (exportData.length === 0) {
        toast.error("No meters to export");
        return;
      }
      generateXLSX(
        exportData,
        `${storeName || "store"}-inventory-${new Date().toISOString().split("T")[0]}`,
        "Inventory"
      );
      toast.success(`Exported ${exportData.length} meters to Excel`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, storeName]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const exportData = filteredInventory;
      if (exportData.length === 0) {
        toast.error("No meters to export");
        return;
      }

      const headers = ["Serial Number", "Type", "Assigned Date"];
      const data = exportData.map((meter) => [
        meter.serial_number,
        meter.type,
        meter.assigned_at ? formatDate(meter.assigned_at) : "N/A",
      ]);

      const blob = await pdf(
        <TableReportPDF
          title={`${storeName || "Store"} Inventory`}
          headers={headers}
          data={data}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${storeName || "store"}-inventory-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} meters to PDF`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  }, [filteredInventory, storeName]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  }, []);

  return {
    inventory,
    filteredInventory,
    paginatedInventory,
    isLoadingInventory,
    searchTerm,
    currentPage,
    activeTab,
    totalPages,
    typeCounts,
    isExporting,
    setCurrentPage,
    handleSearchChange,
    handleTabChange,
    handleExportCSV,
    handleExportXLSX,
    handleExportPDF,
    refreshInventory,
  };
}
