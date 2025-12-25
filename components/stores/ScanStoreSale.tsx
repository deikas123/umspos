"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { toast } from "sonner";
import { Loader2, X, Edit2 } from "lucide-react";
import { getAgentInventoryBySerial } from "@/lib/actions/agents";
import { processAgentMeterSale } from "@/lib/actions/sales";
import { getUserProfile } from "@/lib/actions/users";
import { pdf } from "@react-pdf/renderer";
import MeterSalesReceipt from "@/components/sharedcomponents/MeterSalesReceipt";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import SaleDetailsDialog, {
  type SaleDetails,
} from "@/components/sellmeter/SaleDetailsDialog";

interface ScanStoreSaleProps {
  readonly store: {
    id: string;
    name: string;
    location: string;
    county: string;
    phone_number: string;
  };
  readonly currentUser: {
    id: string;
    email?: string;
    role?: string;
    name?: string;
  };
  readonly onClose: () => void;
  readonly onSaleComplete?: () => void;
}

interface ScannedMeter {
  id: string;
  meter_id: string | null;
  serial_number: string;
  type: string;
}

const MAX_SERIAL_LENGTH = 12;

export default function ScanStoreSale({
  store,
  currentUser,
  onClose,
  onSaleComplete,
}: ScanStoreSaleProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [scannedMeters, setScannedMeters] = useState<ScannedMeter[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | React.ReactNode>(
    null
  );
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);
  const [saleDetails, setSaleDetails] = useState<SaleDetails | null>(null);

  const serialInputRef = useRef<HTMLInputElement>(null);

  // Focus on input on mount
  useEffect(() => {
    if (serialInputRef.current) {
      serialInputRef.current.focus();
    }
  }, []);

  // Fetch user profile
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
  }, [currentUser?.id]);

  // Find existing meter in scanned list
  const findExistingMeter = useCallback(
    (serialNum: string) => {
      return scannedMeters.findIndex(
        (m) => m.serial_number.toLowerCase() === serialNum.toLowerCase()
      );
    },
    [scannedMeters]
  );

  // Scroll to and highlight a meter row
  const scrollToMeterRow = useCallback((rowIndex: number) => {
    const element = document.querySelector(`[data-row-index="${rowIndex}"]`);
    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    element?.classList.add("bg-yellow-100");
    setTimeout(() => {
      element?.classList.remove("bg-yellow-100");
    }, 2000);
  }, []);

  // Get unique meter types for sale details dialog
  const meterTypes = useMemo(() => {
    return Array.from(new Set(scannedMeters.map((m) => m.type)));
  }, [scannedMeters]);

  // Auto-check serial number when typing
  useEffect(() => {
    const checkSerialNumber = async () => {
      if (!serialNumber.trim()) {
        setErrorMessage(null);
        return;
      }

      const normalizedSerial = serialNumber.trim().toUpperCase();

      // Check for duplicate in scanned list
      const existingIndex = findExistingMeter(normalizedSerial);
      if (existingIndex !== -1) {
        setErrorMessage(
          <div className='flex items-center gap-2'>
            <span>Meter already scanned</span>
            <button
              type='button'
              className='text-blue-500 hover:underline cursor-pointer'
              onClick={() => scrollToMeterRow(existingIndex)}>
              View Entry
            </button>
          </div>
        );
        return;
      }

      setIsChecking(true);
      try {
        // Check if meter exists in store's inventory
        const meter = await getAgentInventoryBySerial(
          normalizedSerial,
          store.id
        );

        if (!meter) {
          setErrorMessage("Meter not found in store inventory");
          return;
        }

        // Add meter to scanned list
        setScannedMeters((prev) => [
          {
            id: meter.id,
            meter_id: meter.meter_id,
            serial_number: meter.serial_number,
            type: meter.type,
          },
          ...prev,
        ]);
        setSerialNumber("");
        setErrorMessage("");
        toast.success("Meter added to sale list");
      } catch (error) {
        console.error("Error checking meter:", error);
        setErrorMessage("Failed to check meter. Please try again.");
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkSerialNumber, 300);
    return () => clearTimeout(timeoutId);
  }, [serialNumber, findExistingMeter, store.id]);

  const handleRemoveMeter = (meterId: string) => {
    setScannedMeters((prev) => prev.filter((m) => m.id !== meterId));
  };

  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > MAX_SERIAL_LENGTH) {
      toast.error("Serial number cannot be more than 12 digits");
      return;
    }
    setSerialNumber(value);
  };

  const handleSaleDetailsSubmit = (details: SaleDetails) => {
    setSaleDetails(details);
  };

  const calculateTotal = () => {
    if (!saleDetails?.unitPrices) return 0;
    return scannedMeters.reduce((total, meter) => {
      const price = Number.parseFloat(
        saleDetails.unitPrices[meter.type] || "0"
      );
      return total + price;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      toast.error("Please log in to continue");
      return;
    }

    if (scannedMeters.length === 0) {
      toast.error("No meters scanned");
      return;
    }

    if (!saleDetails) {
      toast.error("Please fill in sale details first");
      setSaleDetailsOpen(true);
      return;
    }

    // Validate unit prices for all meter types
    const uniqueTypes = Array.from(new Set(scannedMeters.map((m) => m.type)));
    const missingPrices = uniqueTypes.filter(
      (type) => !saleDetails.unitPrices[type]
    );
    if (missingPrices.length > 0) {
      toast.error(`Please set unit prices for: ${missingPrices.join(", ")}`);
      setSaleDetailsOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const saleDate = new Date(
        saleDetails.saleDate.year,
        saleDetails.saleDate.month - 1,
        saleDetails.saleDate.day
      );

      const result = await processAgentMeterSale({
        agentId: store.id,
        meters: scannedMeters.map((meter) => ({
          id: meter.id,
          serial_number: meter.serial_number,
          type: meter.type,
        })),
        currentUser: { id: currentUser.id },
        userName,
        saleDetails: {
          destination: saleDetails.destination,
          recipient: saleDetails.recipient,
          unitPrices: saleDetails.unitPrices,
          customerType: saleDetails.customerType,
          customerRegion: saleDetails.customerRegion,
          customerCounty: saleDetails.customerCounty,
          customerContact: saleDetails.customerContact,
          saleDate,
        },
      });

      const receiptData = {
        meters: scannedMeters.map((meter) => ({
          serialNumber: meter.serial_number,
          type: meter.type,
        })),
        destination: saleDetails.destination,
        recipient: saleDetails.recipient,
        unitPrices: saleDetails.unitPrices,
        userName: currentUser.name || currentUser.email,
        customerType: saleDetails.customerType,
        customerRegion: saleDetails.customerRegion,
        customerCounty: saleDetails.customerCounty,
        customerContact: saleDetails.customerContact,
        saleDate: saleDate.toISOString(),
        referenceNumber: result.referenceNumber,
        referral: saleDetails.referral,
        pickup: saleDetails.pickup,
      };

      localStorage.setItem(
        "lastSubmittedSaleMeters",
        JSON.stringify(receiptData)
      );

      setScannedMeters([]);
      setSaleDetails(null);
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
          customerRegion={lastSubmittedData.customerRegion}
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

  const handleClearForm = () => {
    setScannedMeters([]);
    setSerialNumber("");
    setSaleDetails(null);
    setErrorMessage(null);
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Scanning Section */}
      <div className='px-4 pt-4 space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='font-semibold text-lg'>Scan Meters for Sale</h3>
          {scannedMeters.length > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleClearForm}
              className='cursor-pointer'>
              Clear All
            </Button>
          )}
        </div>

        <div className='relative'>
          <Input
            ref={serialInputRef}
            type='text'
            placeholder='Scan or enter serial number...'
            value={serialNumber.toUpperCase()}
            onChange={handleSerialNumberChange}
            maxLength={MAX_SERIAL_LENGTH}
            className='pr-10'
          />
          {isChecking && (
            <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground' />
          )}
        </div>

        {errorMessage && (
          <p
            className={`text-sm ${scannedMeters.length === 0 ? "text-muted-foreground" : "text-red-500"}`}>
            {errorMessage}
          </p>
        )}
      </div>

      {/* Download Receipt Button */}
      {isSubmitted && scannedMeters.length === 0 && (
        <div className='mx-4 mt-4 relative'>
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

      {/* Scanned Meters List */}
      {scannedMeters.length > 0 && (
        <div className='flex-1 flex flex-col px-4 pt-4 min-h-0'>
          {/* Sale Details Section */}
          {saleDetails ? (
            <div className='flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4'>
              <Badge
                variant='secondary'
                className='bg-gradient-to-r from-green-500/50 to-blue-500/50 text-black'>
                Destination: {saleDetails.destination}
              </Badge>
              <Badge
                variant='secondary'
                className='bg-gradient-to-r from-orange-500/50 to-yellow-500/50 text-black'>
                Recipient: {saleDetails.recipient}
              </Badge>
              <Badge
                variant='secondary'
                className='bg-gradient-to-r from-purple-500/50 to-pink-500/50 text-black'>
                Contact: {saleDetails.customerContact}
              </Badge>
              <Badge
                variant='secondary'
                className='bg-gradient-to-r from-blue-500/50 to-indigo-500/50 text-black'>
                Type: {saleDetails.customerType}
              </Badge>
              <Badge
                variant='secondary'
                className='bg-gradient-to-r from-red-500/50 to-orange-500/50 text-black'>
                County: {saleDetails.customerCounty}
              </Badge>
              {Object.entries(saleDetails.unitPrices).map(([type, price]) => (
                <Badge
                  key={type}
                  variant='secondary'
                  className='bg-gradient-to-r from-indigo-500/50 to-purple-500/50 text-black'>
                  {type}: KES {price}
                </Badge>
              ))}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSaleDetailsOpen(true)}
                className='ml-auto bg-yellow-500/50 text-black cursor-pointer'>
                <Edit2 className='h-4 w-4 mr-1' />
                Edit Details
              </Button>
            </div>
          ) : (
            <Button
              type='button'
              variant='secondary'
              className='w-full mb-4 cursor-pointer bg-primary hover:bg-primary/90 text-white'
              onClick={() => setSaleDetailsOpen(true)}>
              Add Sale Details
            </Button>
          )}

          {/* Meters Table */}
          <div className='flex-1 min-h-0'>
            <div className='flex justify-between items-center mb-2'>
              <h4 className='font-medium text-gray-700'>Scanned Meters</h4>
              <span className='text-sm text-muted-foreground'>
                {scannedMeters.length} meter
                {scannedMeters.length === 1 ? "" : "s"}
              </span>
            </div>
            <ScrollArea className='h-[250px] border rounded-lg'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='bg-gray-50'>Serial Number</TableHead>
                    <TableHead className='bg-gray-50'>Type</TableHead>
                    <TableHead className='bg-gray-50 w-[60px]'>
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedMeters.map((meter, index) => (
                    <TableRow
                      key={meter.id}
                      data-row-index={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className='font-mono'>
                        {meter.serial_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{meter.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 cursor-pointer hover:bg-destructive/10'
                          onClick={() => handleRemoveMeter(meter.id)}>
                          <X className='h-4 w-4 text-destructive' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Total and Submit */}
          {saleDetails && (
            <div className='pt-4 border-t mt-4'>
              <div className='flex items-center justify-between text-sm font-medium mb-3'>
                <span>Total ({scannedMeters.length} meters)</span>
                <span className='text-lg'>
                  KES {calculateTotal().toLocaleString()}
                </span>
              </div>
              <Button
                onClick={handleSubmit}
                className='w-full cursor-pointer'
                disabled={isSubmitting || scannedMeters.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Recording Sale...
                  </>
                ) : (
                  `Complete Sale (${scannedMeters.length} meters)`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {scannedMeters.length === 0 && !isSubmitted && (
        <div className='flex-1 flex items-center justify-center px-4'>
          <div className='text-center text-muted-foreground'>
            <p className='text-sm'>
              Start scanning meters to add them to the sale
            </p>
            <p className='text-xs mt-1'>
              Meters will be verified against store inventory
            </p>
          </div>
        </div>
      )}

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        isOpen={saleDetailsOpen}
        onOpenChange={setSaleDetailsOpen}
        onSubmit={handleSaleDetailsSubmit}
        initialData={saleDetails}
        meterTypes={meterTypes}
      />
    </div>
  );
}
