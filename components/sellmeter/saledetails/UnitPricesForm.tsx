"use client";

import { Input } from "@/components/ui/input";
import type { UnitPrices } from "./types";

interface UnitPricesFormProps {
  meterTypes: string[];
  unitPrices: UnitPrices;
  onChange: (unitPrices: UnitPrices) => void;
}

export function UnitPricesForm({
  meterTypes,
  unitPrices,
  onChange,
}: Readonly<UnitPricesFormProps>) {
  const handlePriceChange = (type: string, value: string) => {
    onChange({
      ...unitPrices,
      [type]: value,
    });
  };

  return (
    <div className='space-y-4'>
      <h4 className='text-sm font-semibold border-b pb-2'>Unit Prices</h4>
      <div className='grid gap-3 w-full'>
        {meterTypes.map((type) => (
          <div
            key={type}
            className='grid grid-cols-[80px,1fr] items-center gap-1'>
            <label className='text-sm font-medium'>{type}:</label>
            <Input
              type='number'
              placeholder={`Enter ${type} price`}
              value={unitPrices[type] || ""}
              onChange={(e) => handlePriceChange(type, e.target.value)}
              className='w-full'
              required
            />
          </div>
        ))}
      </div>
    </div>
  );
}
