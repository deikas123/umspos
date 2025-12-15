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

interface CountySelectorProps {
  value: string;
  onChange: (county: string) => void;
  counties: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CountySelector({
  value,
  onChange,
  counties,
  open,
  onOpenChange,
}: Readonly<CountySelectorProps>) {
  return (
    <div className='space-y-2 w-full'>
      <label htmlFor='county-selector' className='text-sm font-medium'>County</label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id='county-selector'
            variant='outline'
            aria-expanded={open}
            className='w-full justify-between bg-white border-2 border-gray-200 hover:border-primary transition-colors font-medium cursor-pointer'>
            {value || "Select county..."}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command className='w-full'>
            <CommandInput
              placeholder='Search county...'
              className='h-9 border-none focus:ring-0'
            />
            <CommandList className='max-h-[300px] overflow-y-auto scroll-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent'>
              <CommandEmpty>No county found.</CommandEmpty>
              <CommandGroup>
                {counties.map((county) => (
                  <CommandItem
                    key={county}
                    value={county}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      onOpenChange(false);
                    }}
                    className='hover:bg-primary/10 cursor-pointer font-medium'>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === county ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {county}
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
