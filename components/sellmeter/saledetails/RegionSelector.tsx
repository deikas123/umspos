"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KENYA_REGION_NAMES,
  getCountiesForRegion,
  type KenyaRegion,
} from "@/lib/constants/locationData";

interface RegionSelectorProps {
  value: KenyaRegion;
  onChange: (region: KenyaRegion, firstCounty: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegionSelector({
  value,
  onChange,
  open,
  onOpenChange,
}: Readonly<RegionSelectorProps>) {
  return (
    <div className='space-y-2 w-full'>
      <label htmlFor='region-selector' className='text-sm font-medium'>Region</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id='region-selector'
            variant='outline'
            aria-expanded={open}
            className='w-full justify-between bg-white border-2 border-gray-200 hover:border-primary transition-colors font-medium cursor-pointer'>
            {value || "Select region..."}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[calc(100%-2rem)] p-0' align='start'>
          <Command className='w-full'>
            <CommandInput
              placeholder='Search region...'
              className='h-9 border-none focus:ring-0'
            />
            <CommandList className='max-h-[300px] overflow-y-auto scroll-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent'>
              <CommandEmpty>No region found.</CommandEmpty>
              <CommandGroup>
                {KENYA_REGION_NAMES.map((region) => (
                  <CommandItem
                    key={region}
                    value={region}
                    onSelect={(currentValue) => {
                      const selectedRegion = currentValue as KenyaRegion;
                      const regionCounties =
                        getCountiesForRegion(selectedRegion);
                      onChange(selectedRegion, regionCounties[0] || "");
                      onOpenChange(false);
                    }}
                    className='hover:bg-primary/10 cursor-pointer font-medium'>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === region ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {region}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
