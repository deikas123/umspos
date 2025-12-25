"use client";

import { useState } from "react";
import { updateAgentStatus } from "@/lib/actions/agents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useStoresData, type StoresPageData } from "./hooks/useStoresData";
import { useStoreInventory } from "./hooks/useStoreInventory";
import {
  Package,
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import EditAgentDialog from "@/components/agents/EditAgentDialog";
import AssignMetersToAgent from "@/components/agents/AssignMetersToAgent";
import ReturnMetersFromAgent from "@/components/agents/ReturnMetersFromAgent";

import StoreEmptyState from "./StoreEmptyState";
import StoreHeader from "./StoreHeader";
import StoreInventoryTab from "./StoreInventoryTab";
import StoreHistory from "./StoreHistory";
import ScanStoreSale from "./ScanStoreSale";

interface StoresProps {
  readonly initialData?: StoresPageData;
}

export default function Stores({ initialData }: StoresProps) {
  const isMobile = useIsMobile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [returnSheetOpen, setReturnSheetOpen] = useState(false);
  const [saleSheetOpen, setSaleSheetOpen] = useState(false);

  const {
    storesData: { stores, currentUser },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStoresData(initialData);

  const queryClient = useQueryClient();

  // Get the single store (first one)
  const store = stores[0] || null;

  // Inventory hook
  const {
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
  } = useStoreInventory({
    storeId: store?.id,
    storeName: store?.name,
  });

  const handleToggleStatus = async () => {
    if (!store) return;
    try {
      await updateAgentStatus(store.id, !store.is_active);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success(
        `Store ${store.is_active ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      console.error("Error updating store status:", error);
      toast.error("Failed to update store status");
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      await refreshInventory();
      toast.success("Store data refreshed");
    } catch (error) {
      console.error("Error refreshing store data:", error);
      toast.error("Failed to refresh data");
    }
  };

  const handleSaleComplete = () => {
    refreshInventory();
    queryClient.invalidateQueries({ queryKey: ["agentTransactions"] });
  };

  const isRefreshing = isFetching && !isLoading;

  if (isError) {
    return (
      <div className='p-8 text-center text-red-500'>
        Error: {error?.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='p-8 text-center text-gray-500'>Loading store data...</div>
    );
  }

  // No store registered yet
  if (!store) {
    return (
      <div className='w-full h-full'>
        <div className='rounded-md border p-4 bg-white'>
          <StoreEmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className='w-full h-full space-y-6'>
      {/* Store Header with Actions */}
      <StoreHeader
        store={store}
        inventoryCount={inventory.length}
        isRefreshing={isRefreshing}
        isMobile={isMobile}
        onRefresh={handleRefresh}
        onEdit={() => setIsEditDialogOpen(true)}
        onToggleStatus={handleToggleStatus}
        onAssignMeters={() => setAssignSheetOpen(true)}
        onReturnMeters={() => setReturnSheetOpen(true)}
        onRecordSale={() => setSaleSheetOpen(true)}
      />

      {/* Inventory & History Tabs */}
      <Card>
        <Tabs defaultValue='inventory' className='w-full'>
          <CardHeader>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <TabsList>
                <TabsTrigger value='inventory' className='gap-2 cursor-pointer'>
                  <Package className='h-4 w-4' />
                  Inventory
                  <Badge variant='secondary' className='ml-1'>
                    {inventory.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='history' className='gap-2 cursor-pointer'>
                  <Calendar className='h-4 w-4' />
                  Transaction History
                </TabsTrigger>
              </TabsList>
              <div className='flex items-center gap-2'>
                {/* Export Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='cursor-pointer'
                      disabled={isExporting || filteredInventory.length === 0}>
                      <Download className='h-4 w-4 mr-2' />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={handleExportCSV}
                      className='cursor-pointer'>
                      <FileText className='mr-2 h-4 w-4' />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportXLSX}
                      className='cursor-pointer'>
                      <FileSpreadsheet className='mr-2 h-4 w-4' />
                      Export Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportPDF}
                      className='cursor-pointer'>
                      <FileText className='mr-2 h-4 w-4 text-red-500' />
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value='inventory' className='mt-0'>
              <StoreInventoryTab
                filteredInventory={filteredInventory}
                paginatedInventory={paginatedInventory}
                isLoadingInventory={isLoadingInventory}
                searchTerm={searchTerm}
                activeTab={activeTab}
                currentPage={currentPage}
                totalPages={totalPages}
                typeCounts={typeCounts}
                onSearchChange={handleSearchChange}
                onTabChange={handleTabChange}
                onPageChange={setCurrentPage}
              />
            </TabsContent>

            <TabsContent value='history' className='mt-0'>
              <StoreHistory storeId={store.id} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Sheets for Actions */}
      {/* Assign Meters Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent
          side='right'
          className='w-full bg-white min-w-[40vw] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Assign Meters to {store.name}</SheetTitle>
          </SheetHeader>
          <AssignMetersToAgent
            currentUser={{
              id: currentUser?.id ?? "",
              name: currentUser?.name ?? undefined,
            }}
            preSelectedAgent={{
              id: store.id,
              name: store.name,
              location: store.location,
            }}
            isSheetOpen={assignSheetOpen}
            isStore={true}
          />
        </SheetContent>
      </Sheet>

      {/* Return Meters Sheet */}
      <Sheet open={returnSheetOpen} onOpenChange={setReturnSheetOpen}>
        <SheetContent
          side='right'
          className='w-full bg-white min-w-[40vw] overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Return Meters from {store.name}</SheetTitle>
          </SheetHeader>
          <ReturnMetersFromAgent
            agent={{
              id: store.id,
              name: store.name,
              location: store.location,
            }}
            currentUser={{
              id: currentUser?.id ?? "",
              name: currentUser?.name ?? undefined,
            }}
            isStore={true}
          />
        </SheetContent>
      </Sheet>

      {/* Record Sale Sheet */}
      <Sheet open={saleSheetOpen} onOpenChange={setSaleSheetOpen}>
        <SheetContent
          side='right'
          className='w-full bg-white min-w-[40vw] p-0 overflow-hidden'>
          <SheetHeader className='px-4 pt-4 pb-2 border-b'>
            <SheetTitle>Record Sale - {store.name}</SheetTitle>
          </SheetHeader>
          <ScanStoreSale
            store={{
              id: store.id,
              name: store.name,
              location: store.location,
              county: store.county,
              phone_number: store.phone_number,
            }}
            currentUser={{
              id: currentUser?.id ?? "",
              name: currentUser?.name ?? undefined,
              email: currentUser?.email,
            }}
            onClose={() => setSaleSheetOpen(false)}
            onSaleComplete={handleSaleComplete}
          />
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <EditAgentDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onAgentUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["stores"] });
        }}
        agent={store}
        isStore={true}
      />
    </div>
  );
}
