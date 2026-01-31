import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils/dateUtils";
import { MeterWithStatus } from "@/lib/actions/exports";

type MeterDetailsProps = Readonly<{
  meter: MeterWithStatus;
}>;

export function MeterDetails({ meter }: MeterDetailsProps) {
  return (
    <div className='space-y-1 text-sm'>
      {meter.status === "with_agent" && meter.agent_details && (
        <div>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Agent:</span>{" "}
            {meter.agent_details.agent_name}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Phone:</span>{" "}
            {meter.agent_details.agent_phone}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Location:</span>{" "}
            {meter.agent_details.agent_location}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Assigned on:</span>{" "}
            {meter.agent_details.assigned_at
              ? formatDateShort(meter.agent_details.assigned_at)
              : "Unknown"}
          </p>
        </div>
      )}

      {(meter.status === "sold" || meter.status === "replaced") &&
        meter.sale_details && (
          <div>
            <p className='text-muted-foreground'>
              <span className='font-medium'>Sold on:</span>{" "}
              {formatDateShort(meter.sale_details.sold_at)}
            </p>
            <p className='text-muted-foreground'>
              <span className='font-medium'>Sold by:</span>{" "}
              {meter.sale_details.sold_by}
            </p>
            <p className='text-muted-foreground'>
              <span className='font-medium'>Destination:</span>{" "}
              {meter.sale_details.destination}
            </p>
            <p className='text-muted-foreground'>
              <span className='font-medium'>Recipient:</span>{" "}
              {meter.sale_details.recipient}
            </p>
            {meter.sale_details.customer_contact && (
              <p className='text-muted-foreground'>
                <span className='font-medium'>Contact:</span>{" "}
                {meter.sale_details.customer_contact}
              </p>
            )}
          </div>
        )}

      {meter.status === "replaced" && meter.replacement_details && (
        <div className='mt-2 pt-2 border-t'>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Replaced with:</span>{" "}
            {meter.replacement_details.replacement_serial}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Replaced on:</span>{" "}
            {formatDateShort(meter.replacement_details.replacement_date)}
          </p>
        </div>
      )}

      {meter.status === "faulty" && meter.fault_details && (
        <div>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Returned on:</span>{" "}
            {formatDateShort(meter.fault_details.returned_at)}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Returned by:</span>{" "}
            {meter.fault_details.returner_name || ""}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Fault:</span>{" "}
            {meter.fault_details.fault_description}
          </p>
          <p className='text-muted-foreground'>
            <span className='font-medium'>Status:</span>{" "}
            <Badge
              variant='outline'
              className={
                meter.fault_details.fault_status === "repaired"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }>
              {meter.fault_details.fault_status || ""}
            </Badge>
          </p>
        </div>
      )}
    </div>
  );
}
