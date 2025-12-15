"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { ExternalLink, MapPin } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS } from "./types";
import type { ClientProspect } from "@/lib/db/schema";
import { CoordinatesDisplay } from "./CoordinatesDisplay";

interface ProspectExpandedDetailsProps {
  readonly prospect: ClientProspect;
  readonly colSpan: number;
  readonly showSalesPerson?: boolean;
}

export function ProspectExpandedDetails({
  prospect,
  colSpan,
  showSalesPerson = true,
}: ProspectExpandedDetailsProps) {
  const openInGoogleMaps = (lat: string, lng: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className='bg-gray-50'>
        <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <div>
              <span className='text-sm text-gray-500'>Location</span>
              <p className='font-medium'>{prospect.location}</p>
            </div>
            <div>
              <span className='text-sm text-gray-500'>Contact</span>
              <p className='font-medium'>{prospect.contact}</p>
            </div>
            <div>
              <span className='text-sm text-gray-500'>Status</span>
              <div className='mt-1'>
                <Badge className={STATUS_COLORS[prospect.status] || ""}>
                  {STATUS_LABELS[prospect.status] || prospect.status}
                </Badge>
              </div>
            </div>
            {showSalesPerson && (
              <div>
                <span className='text-sm text-gray-500'>Sales Person</span>
                <p className='font-medium'>{prospect.sales_person_name}</p>
              </div>
            )}
          </div>
          <div className='space-y-3'>
            <div>
              <span className='text-sm text-gray-500'>Meter Type</span>
              <p className='font-medium capitalize'>
                {prospect.meter_type.replace("_", " ")}
              </p>
            </div>
            <div>
              <span className='text-sm text-gray-500'>Number of Meters</span>
              <p className='font-medium'>{prospect.number_of_meters}</p>
            </div>
            <div>
              <span className='text-sm text-gray-500'>Other Remarks</span>
              <p className='font-medium'>{prospect.other_remarks || "None"}</p>
            </div>
            {prospect.latitude && prospect.longitude && (
              <div>
                <span className='text-sm text-gray-500'>GPS Location</span>
                <div className='flex items-start gap-2 mt-1'>
                  <MapPin className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    {(prospect as any).place_name ? (
                      <p className='font-medium text-sm'>
                        {(prospect as any).place_name}
                      </p>
                    ) : (
                      <CoordinatesDisplay
                        latitude={prospect.latitude}
                        longitude={prospect.longitude}
                      />
                    )}
                    <Button
                      variant='link'
                      size='sm'
                      className='h-auto p-0 justify-start text-xs'
                      onClick={() =>
                        openInGoogleMaps(
                          prospect.latitude!,
                          prospect.longitude!
                        )
                      }>
                      Open in Maps <ExternalLink className='h-3 w-3 ml-1' />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div>
              <span className='text-sm text-gray-500'>Created</span>
              <p className='font-medium'>
                {prospect.created_at
                  ? format(new Date(prospect.created_at), "MMM d, yyyy HH:mm")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
