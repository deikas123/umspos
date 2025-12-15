"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, UserPlus, X, Users, PenLine } from "lucide-react";
import type { ReferralInfo, ReferralMode } from "./types";

interface SalesPersonUser {
  id: string;
  name: string;
}

interface ReferralSelectorProps {
  value?: ReferralInfo;
  onChange: (referral: ReferralInfo | undefined) => void;
  salesPersonUsers: readonly SalesPersonUser[];
}

// Sub-component for displaying selected referral
function SelectedReferral({
  referral,
  onClear,
}: Readonly<{
  referral: ReferralInfo;
  onClear: () => void;
}>) {
  return (
    <div className='flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200'>
      <UserPlus className='h-4 w-4 text-gray-500' />
      <span className='flex-1 text-sm font-medium'>{referral.name}</span>
      {referral.isRegistered && (
        <span className='text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded'>
          Registered
        </span>
      )}
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='h-6 w-6 p-0'
        onClick={onClear}>
        <X className='h-3.5 w-3.5' />
      </Button>
    </div>
  );
}

// Sub-component for method selection dropdown
function MethodSelector({
  onSelectExisting,
  onSelectManual,
}: Readonly<{
  onSelectExisting: () => void;
  onSelectManual: () => void;
}>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between bg-white border-2 border-gray-200 hover:border-primary transition-colors font-normal text-muted-foreground cursor-pointer'>
          Add referral salesperson...
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-[280px]'>
        <DropdownMenuItem onClick={onSelectExisting} className='cursor-pointer'>
          <Users className='mr-2 h-4 w-4' />
          <span>Select existing salesperson</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSelectManual} className='cursor-pointer'>
          <PenLine className='mr-2 h-4 w-4' />
          <span>Type name manually</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Sub-component for existing salesperson selector
function ExistingSalespersonSelector({
  salesPersonUsers,
  onSelect,
  onBack,
}: Readonly<{
  salesPersonUsers: readonly SalesPersonUser[];
  onSelect: (user: SalesPersonUser) => void;
  onBack: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className='space-y-2'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className='w-full justify-between bg-white border-2 border-gray-200 hover:border-primary transition-colors font-normal text-muted-foreground cursor-pointer'>
            Search salespersons...
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command className='w-full'>
            <CommandInput
              placeholder='Search salesperson...'
              className='h-9 border-none focus:ring-0'
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className='max-h-[200px] overflow-y-auto'>
              <CommandEmpty>No salesperson found.</CommandEmpty>
              <CommandGroup heading='Salespersons'>
                {salesPersonUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => {
                      onSelect(user);
                      setSearchTerm("");
                      setOpen(false);
                    }}
                    className='hover:bg-primary/10 cursor-pointer'>
                    {user.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='text-xs cursor-pointer text-muted-foreground'
        onClick={onBack}>
        ← Back
      </Button>
    </div>
  );
}

// Sub-component for manual entry
function ManualReferralEntry({
  onAdd,
  onBack,
}: Readonly<{
  onAdd: (name: string) => void;
  onBack: () => void;
}>) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  };

  return (
    <div className='space-y-2'>
      <div className='flex gap-2'>
        <Input
          type='text'
          placeholder='Enter salesperson name...'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className='flex-1'
        />
        <Button
          type='button'
          variant='default'
          size='sm'
          disabled={!name.trim()}
          onClick={handleAdd}
          className='bg-[#E46020] hover:bg-[#d45518]'>
          Add
        </Button>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='text-xs text-muted-foreground'
        onClick={onBack}>
        ← Back
      </Button>
    </div>
  );
}

// Main component
export function ReferralSelector({
  value,
  onChange,
  salesPersonUsers,
}: Readonly<ReferralSelectorProps>) {
  const [mode, setMode] = useState<ReferralMode>("none");

  const handleClear = () => {
    onChange(undefined);
    setMode("none");
  };

  const handleSelectExisting = (user: SalesPersonUser) => {
    onChange({
      userId: user.id,
      name: user.name,
      isRegistered: true,
    });
    setMode("none");
  };

  const handleAddManual = (name: string) => {
    onChange({
      name,
      isRegistered: false,
    });
    setMode("none");
  };

  const renderContent = () => {
    // Selected referral is shown
    if (value) {
      return <SelectedReferral referral={value} onClear={handleClear} />;
    }

    // Mode-based rendering (no nested ternaries)
    switch (mode) {
      case "existing":
        return (
          <ExistingSalespersonSelector
            salesPersonUsers={salesPersonUsers}
            onSelect={handleSelectExisting}
            onBack={() => setMode("none")}
          />
        );
      case "manual":
        return (
          <ManualReferralEntry
            onAdd={handleAddManual}
            onBack={() => setMode("none")}
          />
        );
      default:
        return (
          <MethodSelector
            onSelectExisting={() => setMode("existing")}
            onSelectManual={() => setMode("manual")}
          />
        );
    }
  };

  return (
    <div className='space-y-2 w-full'>
      <label className='text-sm font-medium'>
        Referral Salesperson{" "}
        <span className='text-muted-foreground font-normal'>(Optional)</span>
      </label>

      {renderContent()}

      <p className='text-xs text-muted-foreground'>
        Track which salesperson referred this customer.
      </p>
    </div>
  );
}
