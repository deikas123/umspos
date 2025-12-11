import { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";

interface SaleToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onDownload: () => void;
}

export function SaleToolbar({
  searchTerm,
  onSearchChange,
  onDownload,
}: SaleToolbarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className='bg-white rounded-xl border border-gray-200 p-3 shadow-sm'>
      <div className='flex items-center gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            className='pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#E46020] focus:ring-[#E46020]/20 transition-all rounded-lg'
            placeholder='Search serial numbers...'
            value={searchTerm}
            onChange={handleChange}
          />
        </div>
        <Button
          variant='outline'
          onClick={onDownload}
          className='whitespace-nowrap border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'>
          <Download className='h-4 w-4 mr-2' />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
