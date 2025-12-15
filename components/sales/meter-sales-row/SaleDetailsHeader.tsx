import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateShort } from "@/lib/utils/dateUtils";
import { Check, Copy, StickyNote, Calendar } from "lucide-react";

interface SaleDetailsHeaderProps {
  transactionRef: string | null;
  isRefLoading: boolean;
  isCopying: boolean;
  onCopy: () => void;
  onOpenNoteDialog: () => void;
  hasNote: boolean;
  saleDate: Date | null;
}

export function SaleDetailsHeader({
  transactionRef,
  isRefLoading,
  isCopying,
  onCopy,
  onOpenNoteDialog,
  hasNote,
  saleDate,
}: SaleDetailsHeaderProps) {
  const formattedDate = formatDateShort(saleDate);

  return (
    <SheetHeader className='border-b border-gray-200 py-2 gap-2'>
      <div className='flex items-center justify-between'>
        <SheetTitle className='text-xl font-semibold text-gray-900'>
          Transaction Details
        </SheetTitle>
        <Button
          variant={hasNote ? "default" : "outline"}
          size='sm'
          onClick={(event) => {
            event.stopPropagation();
            onOpenNoteDialog();
          }}
          className={`cursor-pointer ${hasNote ? "bg-[#E46020] hover:bg-[#d45518]" : ""}`}
          title={hasNote ? "View/Edit note" : "Add note"}>
          <StickyNote className='h-4 w-4 mr-1.5' />
          {hasNote ? "View Note" : "Add Note"}
        </Button>
      </div>
      <SheetDescription className='flex items-center gap-3 text-sm text-gray-500'>
        <span className='flex items-center gap-1.5'>
          <Calendar className='h-3.5 w-3.5' />
          {formattedDate}
        </span>
        {isRefLoading && (
          <span className='animate-pulse text-gray-400'>Loading ref...</span>
        )}
        {!isRefLoading && transactionRef && (
          <button
            onClick={onCopy}
            className='flex items-center gap-1.5 font-mono text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors cursor-pointer'
            title='Click to copy'>
            {transactionRef}
            {isCopying ? (
              <Check className='h-3 w-3 text-green-600' />
            ) : (
              <Copy className='h-3 w-3 text-gray-400' />
            )}
          </button>
        )}
      </SheetDescription>
    </SheetHeader>
  );
}
