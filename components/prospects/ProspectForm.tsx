"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Trash2, Send, Save, Loader2 } from "lucide-react";
import {
  createMultipleProspects,
  ProspectFormData,
} from "@/lib/actions/prospects";
import { PROSPECT_STATUS_OPTIONS, METER_TYPE_OPTIONS } from "./types";

interface ProspectDraft {
  id: string;
  client_name: string;
  location: string;
  contact: string;
  status: string;
  other_remarks: string;
  meter_type: string;
  number_of_meters: number | string;
  latitude: string;
  longitude: string;
  isNew?: boolean;
}

const DRAFTS_STORAGE_KEY = "prospect_form_drafts";

const generateId = () =>
  `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const createEmptyDraft = (): ProspectDraft => ({
  id: generateId(),
  client_name: "",
  location: "",
  contact: "",
  status: "prospect",
  other_remarks: "",
  meter_type: "split",
  number_of_meters: "",
  latitude: "",
  longitude: "",
  isNew: true,
});

export default function ProspectForm() {
  const [drafts, setDrafts] = useState<ProspectDraft[]>([]);
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Load drafts from localStorage on mount
  useEffect(() => {
    const savedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrafts(parsed);
          return;
        }
      } catch (error) {
        console.error("Error parsing saved drafts:", error);
      }
    }
    // Initialize with one empty form
    setDrafts([createEmptyDraft()]);
  }, []);

  // Save drafts to localStorage whenever they change
  useEffect(() => {
    if (drafts.length > 0) {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    }
  }, [drafts]);

  const updateDraft = useCallback(
    (index: number, field: keyof ProspectDraft, value: string | number) => {
      setDrafts((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value, isNew: false };
        return updated;
      });
    },
    []
  );

  const addNewForm = useCallback(() => {
    setDrafts((prev) => [...prev, createEmptyDraft()]);
    setActiveFormIndex(drafts.length);
    toast.success("New form added");
  }, [drafts.length]);

  const removeForm = useCallback(
    (index: number) => {
      if (drafts.length <= 1) {
        // Reset to empty form instead of removing
        setDrafts([createEmptyDraft()]);
        setActiveFormIndex(0);
        toast.info("Form cleared");
        return;
      }

      setDrafts((prev) => prev.filter((_, i) => i !== index));
      if (activeFormIndex >= drafts.length - 1) {
        setActiveFormIndex(Math.max(0, drafts.length - 2));
      }
      toast.success("Form removed");
    },
    [drafts.length, activeFormIndex]
  );

  // Removed getGeolocation function as it is now handled automatically in handleSubmitAll

  const validateDraft = (draft: ProspectDraft): string[] => {
    const errors: string[] = [];
    if (!draft.client_name.trim()) errors.push("Client name is required");
    if (!draft.location.trim()) errors.push("Location is required");
    if (!draft.contact.trim()) errors.push("Contact is required");
    if (!draft.meter_type) errors.push("Meter type is required");
    return errors;
  };

  const handleSubmitAll = async () => {
    // Validate all forms
    const allErrors: { index: number; errors: string[] }[] = [];
    drafts.forEach((draft, index) => {
      const errors = validateDraft(draft);
      if (errors.length > 0) {
        allErrors.push({ index, errors });
      }
    });

    if (allErrors.length > 0) {
      const firstError = allErrors[0];
      setActiveFormIndex(firstError.index);
      toast.error(`Form ${firstError.index + 1}: ${firstError.errors[0]}`);
      return;
    }

    setIsSubmitting(true);

    // Capture location automatically and reverse geocode to get place name
    let currentLatitude = "";
    let currentLongitude = "";
    let placeName = "";

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          }
        );
        currentLatitude = position.coords.latitude.toFixed(7);
        currentLongitude = position.coords.longitude.toFixed(7);

        // Reverse geocode to get place name
        try {
          const geocodeResponse = await fetch(
            `/api/places/geocode?lat=${currentLatitude}&lng=${currentLongitude}`
          );
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.formatted_address) {
              placeName = geocodeData.formatted_address;
            }
          }
        } catch (geocodeError) {
          console.error("Error reverse geocoding:", geocodeError);
          // Continue without place name if geocoding fails
        }
      } catch (error) {
        console.error("Error capturing location:", error);
        toast.warning("Could not capture location automatically");
      }
    }

    try {
      const prospectsData: ProspectFormData[] = drafts.map((draft) => ({
        client_name: draft.client_name.trim(),
        location: draft.location.trim(),
        contact: draft.contact.trim(),
        status: draft.status as ProspectFormData["status"],
        other_remarks: draft.other_remarks.trim() || undefined,
        meter_type: draft.meter_type,
        number_of_meters: Number(draft.number_of_meters) || 0,
        latitude: currentLatitude || undefined,
        longitude: currentLongitude || undefined,
        place_name: placeName || undefined,
      }));

      const result = await createMultipleProspects(prospectsData);

      if (result.success) {
        toast.success(`Successfully submitted ${result.count} prospect(s)`);
        // Clear all drafts and start fresh
        localStorage.removeItem(DRAFTS_STORAGE_KEY);
        setDrafts([createEmptyDraft()]);
        setActiveFormIndex(0);
      }
    } catch (error: any) {
      console.error("Error submitting prospects:", error);
      toast.error(error.message || "Failed to submit prospects");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDraft = drafts[activeFormIndex] || createEmptyDraft();

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Client Visit Form
          </h1>
          <p className='text-gray-600'>
            Record your field visits and client prospects
          </p>
        </div>

        {/* Form tabs */}
        <div className='mb-4'>
          <ScrollArea className='w-full'>
            <div className='flex gap-2 pb-2'>
              {drafts.map((draft, index) => (
                <Button
                  key={draft.id}
                  variant={activeFormIndex === index ? "default" : "outline"}
                  size='sm'
                  onClick={() => setActiveFormIndex(index)}
                  className='relative whitespace-nowrap'>
                  Form {index + 1}
                  {draft.client_name && (
                    <span className='ml-1 text-xs opacity-70'>
                      ({draft.client_name.substring(0, 10)}...)
                    </span>
                  )}
                  {!draft.isNew && (
                    <Badge variant='secondary' className='ml-1 text-xs'>
                      Draft
                    </Badge>
                  )}
                </Button>
              ))}
              <Button
                variant='ghost'
                size='sm'
                onClick={addNewForm}
                className='flex items-center gap-1'>
                <Plus className='h-4 w-4' />
                Add Form
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Active form */}
        <Card className='shadow-lg'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>Form {activeFormIndex + 1}</CardTitle>
              <CardDescription>Fill in the client details</CardDescription>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => removeForm(activeFormIndex)}
              className='text-red-500 hover:text-red-700 hover:bg-red-50'>
              <Trash2 className='h-5 w-5' />
            </Button>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Client Name */}
            <div className='space-y-2'>
              <Label htmlFor='client_name'>Client Name *</Label>
              <Input
                id='client_name'
                placeholder='Enter client or company name'
                value={activeDraft.client_name}
                onChange={(e) =>
                  updateDraft(activeFormIndex, "client_name", e.target.value)
                }
                required
              />
            </div>

            {/* Location */}
            <div className='space-y-2'>
              <Label htmlFor='location'>Location *</Label>
              <Input
                id='location'
                placeholder='Enter location/address'
                value={activeDraft.location}
                onChange={(e) =>
                  updateDraft(activeFormIndex, "location", e.target.value)
                }
                required
              />
            </div>

            {/* Contact */}
            <div className='space-y-2'>
              <Label htmlFor='contact'>Contact *</Label>
              <Input
                id='contact'
                placeholder='Phone number or email'
                value={activeDraft.contact}
                onChange={(e) =>
                  updateDraft(activeFormIndex, "contact", e.target.value)
                }
                required
              />
            </div>

            {/* Status Dropdown */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status *</Label>
              <Select
                value={activeDraft.status}
                onValueChange={(value) =>
                  updateDraft(activeFormIndex, "status", value)
                }>
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Other Remarks */}
            <div className='space-y-2'>
              <Label htmlFor='other_remarks'>Other Remarks</Label>
              <Textarea
                id='other_remarks'
                placeholder='Any additional notes or remarks...'
                value={activeDraft.other_remarks}
                onChange={(e) =>
                  updateDraft(activeFormIndex, "other_remarks", e.target.value)
                }
                rows={3}
              />
            </div>

            {/* Meter Type */}
            <div className='space-y-2'>
              <Label htmlFor='meter_type'>Meter Type *</Label>
              <Select
                value={activeDraft.meter_type}
                onValueChange={(value) =>
                  updateDraft(activeFormIndex, "meter_type", value)
                }>
                <SelectTrigger id='meter_type'>
                  <SelectValue placeholder='Select meter type' />
                </SelectTrigger>
                <SelectContent>
                  {METER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Meters */}
            <div className='space-y-2'>
              <Label htmlFor='number_of_meters'>Number of Meters</Label>
              <Input
                id='number_of_meters'
                type='number'
                min={0}
                placeholder='0'
                value={activeDraft.number_of_meters}
                onChange={(e) =>
                  updateDraft(
                    activeFormIndex,
                    "number_of_meters",
                    e.target.value
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit section */}
        <div className='mt-6 flex flex-col sm:flex-row gap-3 justify-end'>
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <Save className='h-4 w-4' />
            <span>Drafts auto-save locally</span>
          </div>
          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={() => {
                localStorage.removeItem(DRAFTS_STORAGE_KEY);
                setDrafts([createEmptyDraft()]);
                setActiveFormIndex(0);
                toast.info("All drafts cleared");
              }}>
              Clear All
            </Button>
            <Button
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className='flex items-center gap-2'>
              {isSubmitting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4' />
              )}
              Submit {drafts.length > 1 ? `All (${drafts.length})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
