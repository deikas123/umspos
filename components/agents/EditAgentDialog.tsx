"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateAgentDetails } from "@/lib/actions/agents";
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
import { KENYA_COUNTIES, type KenyaCounty } from "@/lib/constants/locationData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AgentType = "cash" | "credit";

interface EditAgentDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAgentUpdated: () => void;
  readonly agent: {
    readonly id: string;
    readonly name: string;
    readonly phone_number: string;
    readonly location: string;
    readonly county: string;
    readonly agent_type?: string;
  };
  readonly isStore?: boolean;
}

export default function EditAgentDialog({
  isOpen,
  onClose,
  onAgentUpdated,
  agent,
  isStore = false,
}: Readonly<EditAgentDialogProps>) {
  const [formData, setFormData] = useState<{
    name: string;
    phone_number: string;
    location: string;
    county: KenyaCounty;
    agent_type: AgentType;
  }>({
    name: agent.name,
    phone_number: agent.phone_number,
    location: agent.location,
    county: (agent.county as KenyaCounty) || "Nairobi",
    agent_type: (agent.agent_type as AgentType) || "cash",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  const entityName = isStore ? "Store" : "Agent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate phone number format
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        throw new Error("Invalid phone number format");
      }

      await updateAgentDetails(agent.id, {
        name: formData.name,
        phone_number: formData.phone_number,
        location: formData.location,
        county: formData.county,
        agent_type: formData.agent_type,
      });

      toast.success(`${entityName} updated successfully`);

      onAgentUpdated();
      onClose();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to update ${entityName.toLowerCase()}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px] bg-gray-50 border-gray-200 px-2'>
        <DialogHeader>
          <DialogTitle>Edit {entityName} Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={`${entityName} Name`}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <Input
              id='phone'
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              placeholder='+254700000000'
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Input
              id='location'
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder={`${entityName} Location`}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label>County</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  aria-expanded={openCombobox}
                  className='w-full justify-between bg-white border-2 border-gray-200 hover:border-primary transition-colors font-medium cursor-pointer'>
                  {formData.county || "Select county..."}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-full p-0'>
                <Command className='w-full'>
                  <CommandInput
                    placeholder='Search county...'
                    className='h-9 border-none focus:ring-0'
                  />
                  <CommandList className='max-h-[300px] overflow-y-auto'>
                    <CommandEmpty>No county found.</CommandEmpty>
                    <CommandGroup>
                      {KENYA_COUNTIES.map((county) => (
                        <CommandItem
                          key={county}
                          value={county}
                          onSelect={(currentValue) => {
                            setFormData((prev) => ({
                              ...prev,
                              county: currentValue as KenyaCounty,
                            }));
                            setOpenCombobox(false);
                          }}
                          className='hover:bg-primary/10 cursor-pointer font-medium'>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.county === county
                                ? "opacity-100"
                                : "opacity-0"
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
          {!isStore && (
            <div className='space-y-2'>
              <Label>{entityName} Type</Label>
              <Select
                value={formData.agent_type}
                onValueChange={(value: AgentType) =>
                  setFormData({ ...formData, agent_type: value })
                }>
                <SelectTrigger className='w-full bg-white cursor-pointer'>
                  <SelectValue
                    placeholder={`Select ${entityName.toLowerCase()} type`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='cash' className='cursor-pointer'>
                    <span className='font-medium'>Cash</span>
                  </SelectItem>
                  <SelectItem value='credit' className='cursor-pointer'>
                    <span className='font-medium'>Credit</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='cursor-pointer'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
              className='bg-primary hover:bg-[#000066] cursor-pointer'>
              {isLoading ? "Updating..." : `Update ${entityName}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
