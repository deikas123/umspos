import { SaleBatch } from "../hooks/useMeterSalesData";
import {
  User,
  Package,
  Phone,
  MapPin,
  Tag,
  Building2,
  Map,
} from "lucide-react";

interface SaleSummaryCardsProps {
  batch: SaleBatch;
}

interface InfoRowProps {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly value: string | number;
  readonly highlight?: boolean;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: InfoRowProps) {
  return (
    <div className='flex items-center gap-3 py-2'>
      <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center'>
        <Icon className='h-4 w-4 text-gray-500' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs text-gray-500 uppercase tracking-wide'>{label}</p>
        <p
          className={`font-medium truncate ${highlight ? "text-[#E46020]" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function SaleSummaryCards({ batch }: SaleSummaryCardsProps) {
  return (
    <div className='space-y-4'>
      {/* Hero Stats Row */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm'>
          <p className='text-3xl font-bold text-gray-900'>
            {batch.batch_amount}
          </p>
          <p className='text-xs text-gray-500 uppercase tracking-wide mt-1'>
            Units Sold
          </p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm'>
          <p className='text-3xl font-bold text-[#E46020]'>
            {Math.round(batch.unit_price).toLocaleString()}
          </p>
          <p className='text-xs text-gray-500 uppercase tracking-wide mt-1'>
            Unit Price (KES)
          </p>
        </div>
        <div className='bg-gradient-to-br from-[#E46020] to-[#d45518] rounded-xl p-4 text-center shadow-sm'>
          <p className='text-3xl font-bold text-white'>
            {Math.round(batch.total_price).toLocaleString()}
          </p>
          <p className='text-xs text-white/80 uppercase tracking-wide mt-1'>
            Total (KES)
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Sale Info Card */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100'>
            Sale Information
          </h3>
          <div className='space-y-1'>
            <InfoRow icon={User} label='Sold By' value={batch.user_name} />
            <InfoRow
              icon={Package}
              label='Meter Type'
              value={batch.meter_type}
            />
            <InfoRow
              icon={Tag}
              label='Customer Type'
              value={batch.customer_type || "N/A"}
            />
          </div>
        </div>

        {/* Customer Info Card */}
        <div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100'>
            Customer Details
          </h3>
          <div className='space-y-1'>
            <InfoRow icon={User} label='Recipient' value={batch.recipient} />
            <InfoRow
              icon={Phone}
              label='Contact'
              value={batch.customer_contact || "N/A"}
            />
          </div>
        </div>

        {/* Location Card - Full Width */}
        <div className='md:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100'>
            Location
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            <InfoRow
              icon={Map}
              label='Region'
              value={batch.customer_region || "N/A"}
            />
            <InfoRow
              icon={Building2}
              label='County'
              value={batch.customer_county || "N/A"}
            />
            <InfoRow
              icon={MapPin}
              label='Destination'
              value={batch.destination}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
