import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import {
  CUSTOMER_TYPES,
  getCountiesForRegion,
  type CustomerType,
} from "@/lib/constants/locationData";
import { getUsersList } from "@/lib/actions/users";
import {
  RegionSelector,
  CountySelector,
  ReferralSelector,
  UnitPricesForm,
  PickupSection,
  type SaleDetails,
  type SaleDetailsDialogProps,
  type PickupInfo,
} from "./saledetails";

// Re-export types for external use
export type { SaleDetails } from "./saledetails";

const SaleDetailsDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  meterTypes,
  trigger,
}: SaleDetailsDialogProps) => {
  // Convert CalendarDate to CalendarDate for the date picker or use today
  const initialCalendarDate = useMemo(() => {
    if (!initialData?.saleDate) return today(getLocalTimeZone());
    return initialData.saleDate;
  }, [initialData]);

  const [selectedDate, setSelectedDate] =
    useState<CalendarDate>(initialCalendarDate);

  const [formData, setFormData] = useState<Omit<SaleDetails, "saleDate">>({
    destination: initialData?.destination || "",
    recipient: initialData?.recipient || "",
    unitPrices: initialData?.unitPrices || {},
    customerType: initialData?.customerType || "walk in",
    customerRegion: initialData?.customerRegion || "Nairobi",
    customerCounty: initialData?.customerCounty || "Nairobi",
    customerContact: initialData?.customerContact || "",
    referral: initialData?.referral,
    pickup: initialData?.pickup,
  });

  const [openRegionCombobox, setOpenRegionCombobox] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Fetch registered users for referral selection
  const { data: registeredUsers = [] } = useQuery({
    queryKey: ["usersList"],
    queryFn: getUsersList,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter to only show sales_person role
  const salesPersonUsers = useMemo(() => {
    return registeredUsers.filter(
      (user) => (user.role as string) === "sales_person"
    );
  }, [registeredUsers]);

  // Get counties based on selected region
  const availableCounties = useMemo(() => {
    return getCountiesForRegion(formData.customerRegion);
  }, [formData.customerRegion]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        destination: initialData.destination,
        recipient: initialData.recipient,
        unitPrices: initialData.unitPrices,
        customerType: initialData.customerType,
        customerRegion: initialData.customerRegion,
        customerCounty: initialData.customerCounty,
        customerContact: initialData.customerContact,
        referral: initialData.referral,
        pickup: initialData.pickup,
      });
      setSelectedDate(initialData.saleDate || today(getLocalTimeZone()));
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // selectedDate is already a CalendarDate
    const calendarDate = selectedDate || today(getLocalTimeZone());

    onSubmit({
      ...formData,
      saleDate: calendarDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className='h-[90vh] bg-gray-50 border-gray-200 gap-0 p-0 flex flex-col'>
        <DialogHeader className='px-6 pt-6 pb-4 border-b flex-none'>
          <DialogTitle className='text-xl font-bold text-center'>
            Sale Details
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto m-0 px-6 py-4 space-y-6'>
          <div className='grid w-full gap-4'>
            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium'>Destination</label>
              <Input
                type='text'
                placeholder='Enter destination'
                value={formData.destination}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    destination: e.target.value,
                  }))
                }
                className='w-full'
                required
              />
            </div>

            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium'>Recipient</label>
              <Input
                type='text'
                placeholder='Enter recipient name'
                value={formData.recipient}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    recipient: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium'>Contact</label>
              <Input
                type='tel'
                placeholder='Enter contact number'
                value={formData.customerContact}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerContact: e.target.value,
                  }))
                }
                className='w-full'
                required
              />
            </div>

            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium'>Sale Date</label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label='Select sale date (default: today)'
              />
              <p className='text-xs text-muted-foreground mt-1'>
                Default is today. Select a past date to backdate the sale.
              </p>
            </div>

            <div className='space-y-2 w-full'>
              <label className='text-sm font-medium'>Customer Type</label>
              <select
                value={formData.customerType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerType: e.target.value as CustomerType,
                  }))
                }
                className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'>
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Selector */}
            <RegionSelector
              value={formData.customerRegion}
              onChange={(region, firstCounty) =>
                setFormData((prev) => ({
                  ...prev,
                  customerRegion: region,
                  customerCounty: firstCounty,
                }))
              }
              open={openRegionCombobox}
              onOpenChange={setOpenRegionCombobox}
            />

            {/* County Selector */}
            <CountySelector
              value={formData.customerCounty}
              onChange={(county) =>
                setFormData((prev) => ({ ...prev, customerCounty: county }))
              }
              counties={availableCounties}
              open={openCombobox}
              onOpenChange={setOpenCombobox}
            />

            {/* Referral Salesperson */}
            <ReferralSelector
              value={formData.referral}
              onChange={(referral) =>
                setFormData((prev) => ({ ...prev, referral }))
              }
              salesPersonUsers={salesPersonUsers}
            />

            {/* Pickup Information */}
            <PickupSection
              value={formData.pickup}
              onChange={(pickup: PickupInfo | undefined) =>
                setFormData((prev) => ({ ...prev, pickup }))
              }
            />
          </div>

          {/* Unit Prices */}
          <UnitPricesForm
            meterTypes={meterTypes}
            unitPrices={formData.unitPrices}
            onChange={(unitPrices) =>
              setFormData((prev) => ({ ...prev, unitPrices }))
            }
          />

          <Button
            type='submit'
            className='w-full cursor-pointer bg-[#E46020] hover:bg-[#e46120] text-white'>
            Save Details
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailsDialog;
