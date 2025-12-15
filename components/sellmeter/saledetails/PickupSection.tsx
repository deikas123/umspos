"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, User, Phone, X, ChevronDown, ChevronUp } from "lucide-react";
import type { PickupInfo, PickupType } from "./types";

interface PickupSectionProps {
  value?: PickupInfo;
  onChange: (pickup: PickupInfo | undefined) => void;
}

export function PickupSection({
  value,
  onChange,
}: Readonly<PickupSectionProps>) {
  const [isExpanded, setIsExpanded] = useState(Boolean(value));
  const [pickupType, setPickupType] = useState<PickupType>(
    value?.type || "customer"
  );
  const [pickupName, setPickupName] = useState(value?.name || "");
  const [pickupContact, setPickupContact] = useState(value?.contact || "");

  const handleTypeChange = (type: PickupType) => {
    setPickupType(type);
    if (pickupName || pickupContact) {
      onChange({
        type,
        name: pickupName,
        contact: pickupContact,
      });
    }
  };

  const handleNameChange = (name: string) => {
    setPickupName(name);
    if (name || pickupContact) {
      onChange({
        type: pickupType,
        name,
        contact: pickupContact,
      });
    } else if (!name && !pickupContact) {
      onChange(undefined);
    }
  };

  const handleContactChange = (contact: string) => {
    setPickupContact(contact);
    if (pickupName || contact) {
      onChange({
        type: pickupType,
        name: pickupName,
        contact,
      });
    } else if (!pickupName && !contact) {
      onChange(undefined);
    }
  };

  const handleClear = () => {
    setPickupName("");
    setPickupContact("");
    setPickupType("customer");
    setIsExpanded(false);
    onChange(undefined);
  };

  const handleToggleExpand = () => {
    if (isExpanded && !value) {
      handleClear();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className='space-y-2 w-full'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium flex items-center gap-2'>
          <Package className='h-4 w-4 text-gray-500' />
          Pickup Information
          <span className='text-xs text-muted-foreground'>(Optional)</span>
        </Label>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs'
          onClick={handleToggleExpand}>
          {isExpanded ? (
            <>
              <ChevronUp className='h-3 w-3 mr-1' />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className='h-3 w-3 mr-1' />
              Add pickup info
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className='p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4'>
          {/* Picked by info display when filled */}
          {value && (
            <div className='flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200 mb-3'>
              <User className='h-4 w-4 text-gray-500' />
              <span className='flex-1 text-sm'>
                <span className='font-medium'>{value.name}</span>
                {value.contact && (
                  <span className='text-muted-foreground ml-2'>
                    ({value.contact})
                  </span>
                )}
              </span>
              <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded capitalize'>
                {value.type}
              </span>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0'
                onClick={handleClear}>
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}

          {/* Picked by type selector */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>Picked by</Label>
            <Select value={pickupType} onValueChange={handleTypeChange}>
              <SelectTrigger className='w-full bg-white'>
                <SelectValue placeholder='Select who picked up' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='customer'>
                  <div className='flex items-center gap-2'>
                    <User className='h-4 w-4' />
                    Customer
                  </div>
                </SelectItem>
                <SelectItem value='rider'>
                  <div className='flex items-center gap-2'>
                    <Package className='h-4 w-4' />
                    Rider
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name input */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground flex items-center gap-1'>
              <User className='h-3 w-3' />
              {pickupType === "customer" ? "Customer" : "Rider"} Name
            </Label>
            <Input
              type='text'
              placeholder={`Enter ${pickupType} name`}
              value={pickupName}
              onChange={(e) => handleNameChange(e.target.value)}
              className='w-full bg-white'
            />
          </div>

          {/* Contact input */}
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground flex items-center gap-1'>
              <Phone className='h-3 w-3' />
              {pickupType === "customer" ? "Customer" : "Rider"} Contact
            </Label>
            <Input
              type='tel'
              placeholder={`Enter ${pickupType} contact number`}
              value={pickupContact}
              onChange={(e) => handleContactChange(e.target.value)}
              className='w-full bg-white'
            />
          </div>
        </div>
      )}
    </div>
  );
}
