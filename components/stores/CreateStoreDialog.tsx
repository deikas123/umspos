"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createAgent } from "@/lib/actions/agents";
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
import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { KENYA_COUNTIES, type KenyaCounty } from "@/lib/constants/locationData";
import { useQueryClient } from "@tanstack/react-query";

interface CreateStoreDialogProps {
  readonly trigger?: React.ReactNode;
}

export default function CreateStoreDialog({ trigger }: CreateStoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    location: "",
    county: "Nairobi" as KenyaCounty,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate phone number format
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(formData.phone_number)) {
        throw new Error("Invalid phone number format");
      }

      // Create as a store (is_store = true)
      await createAgent({
        ...formData,
        is_store: true,
        agent_type: "cash", // Stores default to cash
      });

      toast.success("Store created successfully");

      // Refresh stores list
      queryClient.invalidateQueries({ queryKey: ["stores"] });

      setOpen(false);
      setFormData({
        name: "",
        phone_number: "",
        location: "",
        county: "Nairobi",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create store");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant='outline'
            size='sm'
            className='gap-2 cursor-pointer bg-primary text-white hover:bg-primary/90 hover:text-white'>
            <Plus className='h-4 w-4' />
            Add Store
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-[500px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Store className='h-5 w-5' />
            Create New Store
          </DialogTitle>
          <DialogDescription>
            Add a new branch location to manage inventory separately.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4 px-2'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Store Name</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='e.g., Main Office, Mombasa Branch'
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
                placeholder='Store Address or Area'
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
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className='cursor-pointer'>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isLoading}
                className='bg-primary hover:bg-[#000066] cursor-pointer'>
                {isLoading ? "Creating..." : "Create Store"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
