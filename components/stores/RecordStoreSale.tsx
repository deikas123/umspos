"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Loader2, X, ShoppingCart } from "lucide-react";
import { getAgentInventory } from "@/lib/actions/agents";
import { processAgentMeterSale } from "@/lib/actions/sales";
import { getUserProfile } from "@/lib/actions/users";
import { pdf } from "@react-pdf/renderer";
import MeterSalesReceipt from "@/components/sharedcomponents/MeterSalesReceipt";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecordStoreSaleProps {
  store: {
    id: string;
    name: string;
    location: string;
    county: string;
    phone_number: string;
  };
  currentUser: {
    id: string;
    email?: string;
    role?: string;
    name?: string;
  };
  onClose: () => void;
  onSaleComplete?: () => void;
}

interface MeterInventory {
  id: string;
  meter_id: string | null;
  serial_number: string;
  type: string;
  assigned_at: Date | null;
}

const ITEMS_PER_PAGE = 8;

export default function RecordStoreSale({
  store,
  currentUser,
  onClose,
  onSaleComplete,
}: Readonly<RecordStoreSaleProps>) {
  const [inventory, setInventory] = useState<MeterInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMeters, setSelectedMeters] = useState<MeterInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitPrices, setUnitPrices] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(today(getLocalTimeZone()));

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getAgentInventory(store.id);
        setInventory(data || []);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast.error("Failed to load inventory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [store.id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.id) {
        const profile = await getUserProfile(currentUser.id);
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  const handleCheckMeter = (meter: MeterInventory) => {
    if (selectedMeters.some((m) => m.id === meter.id)) {
      setSelectedMeters(selectedMeters.filter((m) => m.id !== meter.id));
    } else {
      setSelectedMeters([...selectedMeters, meter]);
    }
  };

  const handleRemoveFromCart = (meterId: string) => {
    setSelectedMeters(selectedMeters.filter((m) => m.id !== meterId));
  };

  const isMeterSelected = (meterId: string) =>
    selectedMeters.some((m) => m.id === meterId);

  const handleUnitPriceChange = (type: string, price: string) => {
    setUnitPrices({ ...unitPrices, [type]: price });
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      toast.error("Please log in to continue");
      return;
    }

    const uniqueTypes = Array.from(new Set(selectedMeters.map((m) => m.type)));
    const missingPrices = uniqueTypes.filter((type) => !unitPrices[type]);
    if (missingPrices.length > 0) {
      toast.error(`Please set unit prices for: ${missingPrices.join(", ")}`);
      return;
    }

    if (selectedMeters.length === 0) {
      toast.error("No meters selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const saleDate = new Date(
        selectedDate.year,
        selectedDate.month - 1,
        selectedDate.day
      );

      const result = await processAgentMeterSale({
        agentId: store.id,
        meters: selectedMeters.map((meter) => ({
          id: meter.id,
          serial_number: meter.serial_number,
          type: meter.type,
        })),
        currentUser: { id: currentUser.id },
        userName,
        saleDetails: {
          destination: store.location,
          recipient: store.name,
          unitPrices,
          customerType: "agent",
          customerCounty: store.county,
          customerContact: store.phone_number,
          saleDate,
        },
      });

      const soldMeterIds = new Set(selectedMeters.map((m) => m.id));
      setInventory((prevInventory) =>
        prevInventory.filter((invMeter) => !soldMeterIds.has(invMeter.id))
      );

      const receiptData = {
        meters: selectedMeters.map((meter) => ({
          serialNumber: meter.serial_number,
          type: meter.type,
        })),
        destination: store.location,
        recipient: store.name,
        unitPrices,
        userName: currentUser.name || currentUser.email,
        customerType: "store" as const,
        customerCounty: store.county,
        customerContact: store.phone_number,
        saleDate: saleDate.toISOString(),
        referenceNumber: result.referenceNumber,
      };

      localStorage.setItem(
        "lastSubmittedSaleMeters",
        JSON.stringify(receiptData)
      );

      setSelectedMeters([]);
      setIsSubmitted(true);

      toast.success("Sale recorded successfully!");
      onSaleComplete?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to record sale";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const lastSubmittedData = JSON.parse(
        localStorage.getItem("lastSubmittedSaleMeters") || "{}"
      );

      const blob = await pdf(
        <MeterSalesReceipt
          meters={lastSubmittedData.meters}
          destination={lastSubmittedData.destination}
          recipient={lastSubmittedData.recipient}
          unitPrices={lastSubmittedData.unitPrices}
          userName={lastSubmittedData.userName}
          customerType={lastSubmittedData.customerType}
          customerCounty={lastSubmittedData.customerCounty}
          customerContact={lastSubmittedData.customerContact}
          saleDate={lastSubmittedData.saleDate}
          referenceNumber={lastSubmittedData.referenceNumber}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `store-sale-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      localStorage.removeItem("lastSubmittedSaleMeters");
      setIsSubmitted(false);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  const filteredInventory = inventory.filter((meter) =>
    meter.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  const allCurrentPageSelected =
    currentItems.length > 0 && currentItems.every((m) => isMeterSelected(m.id));
  const someCurrentPageSelected =
    currentItems.some((m) => isMeterSelected(m.id)) && !allCurrentPageSelected;

  let selectAllCheckboxState: boolean | "indeterminate" = false;
  if (allCurrentPageSelected) {
    selectAllCheckboxState = true;
  } else if (someCurrentPageSelected) {
    selectAllCheckboxState = "indeterminate";
  }

  const handleToggleSelectAllCurrentPage = (checked: boolean) => {
    if (checked) {
      const selectedIds = new Set(selectedMeters.map((m) => m.id));
      const newSelections = currentItems.filter((m) => !selectedIds.has(m.id));
      if (newSelections.length) {
        setSelectedMeters([...selectedMeters, ...newSelections]);
      }
      return;
    }

    const currentIds = new Set(currentItems.map((m) => m.id));
    setSelectedMeters(selectedMeters.filter((m) => !currentIds.has(m.id)));
  };

  const handleSelectAll = () => {
    setSelectedMeters([...filteredInventory]);
  };

  const handleClearSelection = () => {
    setSelectedMeters([]);
  };

  const allSelected =
    filteredInventory.length > 0 &&
    filteredInventory.every((m) => isMeterSelected(m.id));

  const uniqueTypes = Array.from(new Set(selectedMeters.map((m) => m.type)));

  const calculateTotal = () => {
    return selectedMeters.reduce((total, meter) => {
      const price = Number.parseFloat(unitPrices[meter.type] || "0");
      return total + price;
    }, 0);
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Inventory Section */}
      <div className='flex-1 overflow-hidden flex flex-col'>
        <div className='px-4 pt-2 space-y-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search meters by serial number...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9'
            />
          </div>
          {filteredInventory.length > 0 && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>
                {filteredInventory.length} meters available
              </span>
              <Button
                variant='ghost'
                size='sm'
                onClick={allSelected ? handleClearSelection : handleSelectAll}
                className='text-xs cursor-pointer'>
                {allSelected ? "Clear All" : "Select All"}
              </Button>
            </div>
          )}
        </div>

        <div className='flex-1 overflow-auto px-4'>
          {isLoading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          )}
          {!isLoading && filteredInventory.length === 0 && (
            <div className='text-center py-12 text-muted-foreground'>
              {searchTerm
                ? "No meters found matching your search"
                : "No meters available in inventory"}
            </div>
          )}
          {!isLoading && filteredInventory.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[40px]'>
                    <Checkbox
                      checked={selectAllCheckboxState}
                      onCheckedChange={(value) =>
                        handleToggleSelectAllCurrentPage(Boolean(value))
                      }
                      className='border-primary cursor-pointer'
                    />
                  </TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((meter) => (
                  <TableRow
                    key={meter.id}
                    className={isMeterSelected(meter.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isMeterSelected(meter.id)}
                        onCheckedChange={() => handleCheckMeter(meter)}
                        className='border-primary cursor-pointer'
                      />
                    </TableCell>
                    <TableCell className='font-mono'>
                      {meter.serial_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{meter.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className='px-4 py-2 border-t'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className='cursor-pointer'>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className='border-t bg-muted/30'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <ShoppingCart className='h-5 w-5 text-primary' />
              <span className='font-semibold'>Cart</span>
              <Badge variant='secondary'>{selectedMeters.length}</Badge>
            </div>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          {selectedMeters.length > 0 ? (
            <>
              {/* Selected meters preview */}
              <ScrollArea className='h-24 mb-3'>
                <div className='flex flex-wrap gap-2'>
                  {selectedMeters.map((meter) => (
                    <Badge
                      key={meter.id}
                      variant='secondary'
                      className='pl-2 pr-1 py-1 gap-1'>
                      <span className='font-mono text-xs'>
                        {meter.serial_number}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-4 w-4 hover:bg-destructive/20 cursor-pointer'
                        onClick={() => handleRemoveFromCart(meter.id)}>
                        <X className='h-3 w-3' />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>

              {/* Unit prices */}
              <div className='space-y-2 mb-3'>
                {uniqueTypes.map((type) => (
                  <div key={type} className='flex items-center gap-2'>
                    <span className='text-sm min-w-24'>{type}:</span>
                    <Input
                      type='number'
                      placeholder='Unit price'
                      value={unitPrices[type] || ""}
                      onChange={(e) =>
                        handleUnitPriceChange(type, e.target.value)
                      }
                      className='flex-1 h-8'
                    />
                    <span className='text-sm text-muted-foreground'>
                      × {selectedMeters.filter((m) => m.type === type).length}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className='flex items-center justify-between text-sm font-medium border-t pt-2 mb-3'>
                <span>Total ({selectedMeters.length} meters)</span>
                <span className='text-lg'>
                  KES {calculateTotal().toLocaleString()}
                </span>
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                className='w-full cursor-pointer'
                disabled={isSubmitting || selectedMeters.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Recording Sale...
                  </>
                ) : (
                  `Complete Sale (${selectedMeters.length} meters)`
                )}
              </Button>
            </>
          ) : (
            <div className='text-center py-4 text-muted-foreground text-sm'>
              Select meters from inventory to add to cart
            </div>
          )}

          {isSubmitted && selectedMeters.length === 0 && (
            <div className='mt-3 relative'>
              <Button
                onClick={handleDownloadReceipt}
                className='w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer'>
                Download Sales Receipt
              </Button>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant='ghost'
                size='icon'
                className='absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 cursor-pointer'
                aria-label='Dismiss'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
