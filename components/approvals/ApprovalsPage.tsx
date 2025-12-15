"use client";

import type { PendingRequest } from "./types";
import { useApprovalsData } from "./useApprovalsData";
import { ApprovalsFilters } from "./ApprovalsFilters";
import { ApprovalsEmptyState } from "./ApprovalsEmptyState";
import { ApprovalsList } from "./ApprovalsList";
import { RejectDialog } from "./RejectDialog";

interface ApprovalsPageProps {
  initialPendingRequests: PendingRequest[];
}

export function ApprovalsPage({
  initialPendingRequests,
}: Readonly<ApprovalsPageProps>) {
  const {
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
    isApproving,
    isRejecting,

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
  } = useApprovalsData({ initialPendingRequests });

  // Render content based on state
  const renderContent = () => {
    if (pendingRequests.length === 0) {
      return <ApprovalsEmptyState type='no-requests' />;
    }

    if (filteredRequests.length === 0) {
      return (
        <ApprovalsEmptyState type='no-matches' onClearFilters={clearFilters} />
      );
    }

    return (
      <ApprovalsList
        requests={filteredRequests}
        totalCount={pendingRequests.length}
        hasActiveFilters={hasActiveFilters}
        expandedRowId={expandedRow}
        isApproving={isApproving}
        isRejecting={isRejecting}
        onToggleExpand={toggleRow}
        onApprove={handleApprove}
        onReject={handleOpenRejectDialog}
      />
    );
  };

  return (
    <div className='w-full h-full px-4'>
      <div className='flex flex-col gap-4 mb-6'>
        <div className='text-center'>
          <h1 className='text-2xl md:text-3xl font-bold drop-shadow-lg'>
            Update Approvals
          </h1>
        </div>

        {pendingRequests.length > 0 && (
          <ApprovalsFilters
            filterSearch={filterSearch}
            filterRequestedBy={filterRequestedBy}
            filterMeterType={filterMeterType}
            filterRecipient={filterRecipient}
            filterStatus={filterStatus}
            hasActiveFilters={hasActiveFilters}
            onFilterSearchChange={setFilterSearch}
            onFilterRequestedByChange={setFilterRequestedBy}
            onFilterMeterTypeChange={setFilterMeterType}
            onFilterRecipientChange={setFilterRecipient}
            onFilterStatusChange={setFilterStatus}
            onClearFilters={clearFilters}
            onExportCSV={handleExportCSV}
            onExportXLSX={handleExportXLSX}
            onExportPDF={handleExportPDF}
          />
        )}
      </div>

      {renderContent()}

      <RejectDialog
        open={rejectDialogOpen}
        rejectionReason={rejectionReason}
        isRejecting={isRejecting}
        onOpenChange={setRejectDialogOpen}
        onReasonChange={setRejectionReason}
        onConfirm={handleReject}
        onCancel={handleCancelReject}
      />
    </div>
  );
}
