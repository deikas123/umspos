"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChangeHistoryEntry } from "./types";

interface ProspectHistoryDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly prospectName: string;
  readonly history: readonly ChangeHistoryEntry[];
}

export function ProspectHistoryDialog({
  open,
  onOpenChange,
  prospectName,
  history,
}: ProspectHistoryDialogProps) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Change History - {prospectName}</DialogTitle>
          <DialogDescription>
            Track all changes made to this prospect
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='max-h-[400px]'>
          {sortedHistory.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>
              No changes recorded
            </p>
          ) : (
            <div className='space-y-4'>
              {sortedHistory.map((entry) => (
                <div key={entry.timestamp} className='border rounded-lg p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <span className='font-medium'>{entry.user_name}</span>
                    <span className='text-sm text-gray-500'>
                      {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    {entry.changes.map((change) => (
                      <div
                        key={`${entry.timestamp}-${change.field}`}
                        className='text-sm'>
                        <span className='text-gray-500 capitalize'>
                          {change.field.replace("_", " ")}:
                        </span>{" "}
                        <span className='text-red-500 line-through'>
                          {String(change.old_value || "empty")}
                        </span>{" "}
                        →{" "}
                        <span className='text-green-600'>
                          {String(change.new_value || "empty")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
