"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  History,
  AlertTriangle,
  RefreshCw,
  List,
  Download,
  File,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import { getMeterTypeBadgeClass } from "../utils/meterTypeConfig";
import type {
  RemainingMetersByType,
  AgentInventory,
  FaultyMetersByType,
} from "../types";
import {
  SheetTitle,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import PurchaseBatchesView from "./PurchaseBatchesView";
import FaultyMetersView from "./FaultyMetersView";
import ReplacementsView from "./ReplacementsView";
import AllMetersView from "./AllMetersView";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

const METER_TYPES = [
  "integrated",
  "split",
  "gas",
  "water",
  "smart",
  "3 phase",
] as const;

interface MeterInventoryCardProps {
  remainingMetersByType: RemainingMetersByType[];
  agentInventory: AgentInventory[];
  faultyMetersByType: FaultyMetersByType[];
  sidebarState: string;
}

export function MeterInventoryCard({
  remainingMetersByType,
  agentInventory,
  faultyMetersByType,
  sidebarState,
}: Readonly<MeterInventoryCardProps>) {
  // Helper functions
  const getAgentCount = (meterType: string) => {
    const inventory = agentInventory.find(
      (item) => item.type.toLowerCase() === meterType.toLowerCase()
    );
    return inventory?.with_agents || 0;
  };

  const getFaultyCount = (meterType: string) => {
    const faulty = faultyMetersByType.find(
      (item) => item.type.toLowerCase() === meterType.toLowerCase()
    );
    return faulty?.faulty_count || 0;
  };

  const getTotal = (meterType: string, remaining: number) => {
    const withAgents = getAgentCount(meterType);
    const faulty = getFaultyCount(meterType);
    return Number(remaining) + Number(withAgents) + Number(faulty);
  };

  // all meter types are represented (like in DailyReportsSummary)
  const allMeterTypes = METER_TYPES.map((type) => {
    const existingData = remainingMetersByType.find(
      (item) => item.type.toLowerCase() === type.toLowerCase()
    );
    return existingData || { type, remaining_meters: 0 };
  });

  // Calculate grand totals (including faulty)
  const grandTotals = {
    remaining: allMeterTypes.reduce(
      (sum, item) => sum + Number(item.remaining_meters),
      0
    ),
    withAgents: agentInventory.reduce(
      (sum, item) => sum + Number(item.with_agents),
      0
    ),
    faulty: faultyMetersByType.reduce(
      (sum, item) => sum + Number(item.faulty_count),
      0
    ),
    total: allMeterTypes.reduce(
      (sum, item) =>
        sum +
        Number(item.remaining_meters) +
        getAgentCount(item.type) +
        getFaultyCount(item.type),
      0
    ),
  };

  const handleExportCSV = () => {
    const data = allMeterTypes.map((item, index) => ({
      "#": index + 1,
      "Meter Type": item.type,
      "In Stock": item.remaining_meters,
      "With Agents": getAgentCount(item.type),
      Faulty: getFaultyCount(item.type),
      Total: getTotal(item.type, item.remaining_meters),
    }));
    data.push({
      "#": data.length + 1,
      "Meter Type": "TOTAL",
      "In Stock": grandTotals.remaining,
      "With Agents": grandTotals.withAgents,
      Faulty: grandTotals.faulty,
      Total: grandTotals.total,
    });
    generateCSV(data, "meter_inventory");
  };

  const handleExportXLSX = () => {
    const data = allMeterTypes.map((item, index) => ({
      "#": index + 1,
      "Meter Type": item.type,
      "In Stock": item.remaining_meters,
      "With Agents": getAgentCount(item.type),
      Faulty: getFaultyCount(item.type),
      Total: getTotal(item.type, item.remaining_meters),
    }));
    data.push({
      "#": data.length + 1,
      "Meter Type": "TOTAL",
      "In Stock": grandTotals.remaining,
      "With Agents": grandTotals.withAgents,
      Faulty: grandTotals.faulty,
      Total: grandTotals.total,
    });
    generateXLSX(data, "meter_inventory", "Meter Inventory");
  };

  const handleExportPDF = async () => {
    const headers = [
      "#",
      "Meter Type",
      "In Stock",
      "With Agents",
      "Faulty",
      "Total",
    ];
    const data = allMeterTypes.map((item, index) => [
      String(index + 1),
      item.type,
      String(item.remaining_meters),
      String(getAgentCount(item.type)),
      String(getFaultyCount(item.type)),
      String(getTotal(item.type, item.remaining_meters)),
    ]);
    data.push([
      String(data.length + 1),
      "TOTAL",
      String(grandTotals.remaining),
      String(grandTotals.withAgents),
      String(grandTotals.faulty),
      String(grandTotals.total),
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Meter Inventory Report'
        headers={headers}
        data={data}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meter_inventory.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      className={cn(
        "shadow-md hover:shadow-xl",
        "col-span-full lg:col-span-2"
      )}>
      <CardHeader className='flex flex-row items-center justify-between p-4 md:p-6'>
        <CardTitle className='text-lg md:text-xl'>Meters Remaining</CardTitle>
        <div className='flex items-center gap-2'>
          <Sheet>
            <SheetTrigger asChild>
              <Badge
                variant='outline'
                role='button'
                tabIndex={0}
                aria-label='Open all meters overview'
                className='hover:bg-gray-100 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary'>
                <List className='h-3 w-3' />
                All Meters
              </Badge>
            </SheetTrigger>
            <SheetContent
              className='min-w-[90vw] md:min-w-[82vw] bg-gray-50 border-l border-gray-200'
              side='right'>
              <VisuallyHidden.Root>
                <SheetTitle>All Meters</SheetTitle>
              </VisuallyHidden.Root>
              <AllMetersView />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Badge
                variant='outline'
                role='button'
                tabIndex={0}
                aria-label='Open faulty meters view'
                className='hover:bg-gray-100 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary'>
                <AlertTriangle className='h-3 w-3' />
                Faulty Meters
              </Badge>
            </SheetTrigger>
            <SheetContent
              side='right'
              className='min-w-[90vw] md:min-w-[70vw] bg-gray-50 border-l border-gray-200'>
              <VisuallyHidden.Root>
                <SheetTitle>Faulty Meters</SheetTitle>
              </VisuallyHidden.Root>
              <FaultyMetersView />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Badge
                variant='outline'
                role='button'
                tabIndex={0}
                aria-label='Open meter replacements view'
                className='hover:bg-gray-100 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary'>
                <RefreshCw className='h-3 w-3' />
                Replacements
              </Badge>
            </SheetTrigger>
            <SheetContent
              side='right'
              className='min-w-[90vw] md:min-w-[70vw] bg-gray-50 border-l border-gray-200'>
              <VisuallyHidden.Root>
                <SheetTitle>Replacements</SheetTitle>
              </VisuallyHidden.Root>
              <ReplacementsView />
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Badge
                variant='outline'
                role='button'
                tabIndex={0}
                aria-label='Open purchase batches history'
                className='hover:bg-gray-100 cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary'>
                <History className='h-3 w-3' />
                Purchase History
              </Badge>
            </SheetTrigger>
            <SheetContent
              side='right'
              className='min-w-[90vw] md:min-w-[70vw] bg-gray-50 border-l border-gray-200'>
              <VisuallyHidden.Root>
                <SheetTitle>Purchase History</SheetTitle>
              </VisuallyHidden.Root>
              <PurchaseBatchesView />
            </SheetContent>
          </Sheet>

          {grandTotals.total > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon' className='h-8 w-8'>
                  <Download className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <File className='h-4 w-4 mr-2' />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportXLSX}>
                  <FileSpreadsheet className='h-4 w-4 mr-2' />
                  Export as XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className='h-4 w-4 mr-2' />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Package className='w-5 h-5 text-[#E46020]' />
        </div>
      </CardHeader>
      <CardContent className='p-4 md:p-6'>
        {grandTotals.total > 0 ? (
          <div className='overflow-x-auto'>
            {/* Mobile View */}
            <div className='md:hidden space-y-4'>
              {METER_TYPES.map((type, index) => {
                const item = allMeterTypes.find((m) => m.type === type)!;
                return (
                  <div key={type} className='space-y-2'>
                    <div className='flex justify-between items-center font-medium'>
                      <Badge
                        variant='outline'
                        className={cn(
                          "capitalize",
                          getMeterTypeBadgeClass(item.type)
                        )}>
                        {item.type}
                      </Badge>
                    </div>
                    <div className='grid grid-cols-4 gap-2 text-sm pl-2'>
                      <div>
                        <p className='text-muted-foreground'>In Stock</p>
                        <p className='font-medium'>{item.remaining_meters}</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>With Agents</p>
                        <p className='font-medium'>
                          {getAgentCount(item.type)}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Faulty</p>
                        <p className='font-medium'>
                          {getFaultyCount(item.type)}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Total</p>
                        <p className='font-medium'>
                          {getTotal(item.type, item.remaining_meters)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className='flex justify-between items-center pt-4 border-t'>
                <Badge variant='outline' className='bg-gray-100'>
                  Total
                </Badge>
                <div className='grid grid-cols-4 gap-4 text-sm font-bold'>
                  <span>{grandTotals.remaining}</span>
                  <span>{grandTotals.withAgents}</span>
                  <span>{grandTotals.faulty}</span>
                  <span>{grandTotals.total}</span>
                </div>
              </div>
            </div>

            {/* Desktop View */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='font-semibold'>Meter Type</TableHead>
                    <TableHead className='font-semibold text-right'>
                      In Stock
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      With Agents
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      Faulty
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMeterTypes.map((item) => (
                    <TableRow key={item.type} className='hover:bg-gray-50'>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={cn(
                            "capitalize",
                            getMeterTypeBadgeClass(item.type)
                          )}>
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.remaining_meters}
                      </TableCell>
                      <TableCell className='text-right'>
                        {getAgentCount(item.type)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {getFaultyCount(item.type)}
                      </TableCell>
                      <TableCell className='text-right'>
                        {getTotal(item.type, item.remaining_meters)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='bg-gray-50 font-bold'>
                    <TableCell>
                      <Badge variant='outline' className='bg-gray-100'>
                        Total
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {grandTotals.remaining}
                    </TableCell>
                    <TableCell className='text-right'>
                      {grandTotals.withAgents}
                    </TableCell>
                    <TableCell className='text-right'>
                      {grandTotals.faulty}
                    </TableCell>
                    <TableCell className='text-right'>
                      {grandTotals.total}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <EmptyState icon={Package} message='No meters in inventory' />
        )}
      </CardContent>
    </Card>
  );
}
