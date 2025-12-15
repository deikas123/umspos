"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPendingUpdateRequests,
  approveUpdateRequest,
  rejectUpdateRequest,
} from "@/lib/actions/sale-updates";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import type { PendingRequest } from "./types";
import { formatDateShort } from "./utils";

interface UseApprovalsDataProps {
  initialPendingRequests: PendingRequest[];
}

export function useApprovalsData({
  initialPendingRequests,
}: UseApprovalsDataProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // UI State
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter State - now using empty strings for text inputs
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [filterRequestedBy, setFilterRequestedBy] = useState<string>("");
  const [filterMeterType, setFilterMeterType] = useState<string>("all");
  const [filterRecipient, setFilterRecipient] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Query
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pendingUpdateRequests"],
    queryFn: getPendingUpdateRequests,
    initialData: initialPendingRequests,
    staleTime: 1000 * 60 * 2,
  });

  // Filtered requests with text-based filtering
  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((request) => {
      // Search filter - matches update_reason
      if (filterSearch.trim()) {
        const searchLower = filterSearch.toLowerCase().trim();
        if (!request.update_reason?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Requested by filter - partial match
      if (filterRequestedBy.trim()) {
        const requesterLower = filterRequestedBy.toLowerCase().trim();
        if (
          !request.requested_by_name?.toLowerCase().includes(requesterLower)
        ) {
          return false;
        }
      }

      // Meter type filter - exact match (from dropdown)
      if (filterMeterType !== "all") {
        if (
          request.batch_meter_type?.toLowerCase() !==
          filterMeterType.toLowerCase()
        ) {
          return false;
        }
      }

      // Recipient filter - partial match
      if (filterRecipient.trim()) {
        const recipientLower = filterRecipient.toLowerCase().trim();
        if (!request.batch_recipient?.toLowerCase().includes(recipientLower)) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all") {
        if (request.status !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [
    pendingRequests,
    filterSearch,
    filterRequestedBy,
    filterMeterType,
    filterRecipient,
    filterStatus,
  ]);

  const hasActiveFilters =
    filterSearch.trim() !== "" ||
    filterRequestedBy.trim() !== "" ||
    filterMeterType !== "all" ||
    filterRecipient.trim() !== "" ||
    filterStatus !== "all";

  // Mutations
  const approveMutation = useMutation({
    mutationFn: approveUpdateRequest,
    onSuccess: () => {
      toast.success("Update request approved successfully");
      queryClient.invalidateQueries({ queryKey: ["pendingUpdateRequests"] });
      queryClient.invalidateQueries({ queryKey: ["saleBatches"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectUpdateRequest,
    onSuccess: () => {
      toast.success("Update request rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequestId(null);
      queryClient.invalidateQueries({ queryKey: ["pendingUpdateRequests"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject request"
      );
    },
  });

  // Handlers
  const handleApprove = useCallback(
    async (requestId: string) => {
      if (!user) return;
      await approveMutation.mutateAsync({
        requestId,
        approvedBy: user.id,
        approvedByName: user.name || "Unknown",
      });
    },
    [user, approveMutation]
  );

  const handleOpenRejectDialog = useCallback((requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectDialogOpen(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!user || !selectedRequestId || !rejectionReason.trim()) return;
    await rejectMutation.mutateAsync({
      requestId: selectedRequestId,
      rejectedBy: user.id,
      rejectedByName: user.name || "Unknown",
      rejectionReason: rejectionReason.trim(),
    });
  }, [user, selectedRequestId, rejectionReason, rejectMutation]);

  const handleCancelReject = useCallback(() => {
    setRejectDialogOpen(false);
    setRejectionReason("");
    setSelectedRequestId(null);
  }, []);

  const toggleRow = useCallback((requestId: string) => {
    setExpandedRow((prev) => (prev === requestId ? null : requestId));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterSearch("");
    setFilterRequestedBy("");
    setFilterMeterType("all");
    setFilterRecipient("");
    setFilterStatus("all");
  }, []);

  // Export Handlers
  const handleExportCSV = useCallback(() => {
    const data = filteredRequests.map((request, index) => ({
      "#": index + 1,
      "Requested By": request.requested_by_name,
      "Meter Type": request.batch_meter_type,
      Recipient: request.batch_recipient,
      Reason: request.update_reason,
      "Requested At": formatDateShort(request.requested_at),
    }));
    generateCSV(data, "pending_approvals");
  }, [filteredRequests]);

  const handleExportXLSX = useCallback(() => {
    const data = filteredRequests.map((request, index) => ({
      "#": index + 1,
      "Requested By": request.requested_by_name,
      "Meter Type": request.batch_meter_type,
      Recipient: request.batch_recipient,
      Reason: request.update_reason,
      "Requested At": formatDateShort(request.requested_at),
    }));
    generateXLSX(data, "pending_approvals", "Pending Approvals");
  }, [filteredRequests]);

  const handleExportPDF = useCallback(async () => {
    const headers = ["#", "Requested By", "Meter Type", "Recipient", "Reason"];
    const data = filteredRequests.map((request, index) => [
      String(index + 1),
      request.requested_by_name,
      request.batch_meter_type,
      request.batch_recipient,
      request.update_reason,
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Pending Approvals Report'
        headers={headers}
        data={data}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pending_approvals.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filteredRequests]);

  return {
    // Data
    pendingRequests,
    filteredRequests,
    hasActiveFilters,

    // UI State
    expandedRow,
    rejectDialogOpen,
    rejectionReason,

    // Filter State
    filterSearch,
    filterRequestedBy,
    filterMeterType,
    filterRecipient,
    filterStatus,

    // Mutation State
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,

    // Actions
    setRejectDialogOpen,
    setRejectionReason,
    setFilterSearch,
    setFilterRequestedBy,
    setFilterMeterType,
    setFilterRecipient,
    setFilterStatus,
    handleApprove,
    handleOpenRejectDialog,
    handleReject,
    handleCancelReject,
    toggleRow,
    clearFilters,
    handleExportCSV,
    handleExportXLSX,
    handleExportPDF,
  };
}
