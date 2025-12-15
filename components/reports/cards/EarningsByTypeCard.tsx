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
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  File,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import type { MeterTypeEarnings } from "../types";

interface EarningsByTypeCardProps {
  earnings: MeterTypeEarnings[];
}

export function EarningsByTypeCard({ earnings }: EarningsByTypeCardProps) {
  const handleExportCSV = () => {
    const data = earnings.map((item, index) => ({
      "#": index + 1,
      "Meter Type": item.meter_type,
      "Total Earnings (KES)": item.total_earnings,
    }));
    generateCSV(data, "earnings_by_type");
  };

  const handleExportXLSX = () => {
    const data = earnings.map((item, index) => ({
      "#": index + 1,
      "Meter Type": item.meter_type,
      "Total Earnings (KES)": item.total_earnings,
    }));
    generateXLSX(data, "earnings_by_type", "Earnings by Type");
  };

  const handleExportPDF = async () => {
    const headers = ["#", "Meter Type", "Total Earnings (KES)"];
    const data = earnings.map((item, index) => [
      String(index + 1),
      item.meter_type,
      item.total_earnings.toLocaleString(),
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Earnings by Meter Type Report'
        headers={headers}
        data={data}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "earnings_by_type.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className='shadow-md hover:shadow-xl'>
      <CardHeader className='flex flex-row items-center justify-between p-4 md:p-6'>
        <CardTitle className='text-lg md:text-xl'>Earnings by Type</CardTitle>
        <div className='flex items-center gap-2'>
          {earnings.length > 0 && (
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
          <BarChart3 className='w-5 h-5 text-primary' />
        </div>
      </CardHeader>
      <CardContent className='p-4 md:p-6'>
        {earnings.length > 0 ? (
          <div className='overflow-x-auto'>
            {/* Mobile View */}
            <div className='md:hidden space-y-4'>
              {earnings.map((item, index) => (
                <div key={index} className='flex justify-between items-center'>
                  <span className='font-medium capitalize'>
                    {item.meter_type}
                  </span>
                  <span>KES {item.total_earnings.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className='text-right'>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className='capitalize'>
                        {item.meter_type}
                      </TableCell>
                      <TableCell className='text-right'>
                        KES {item.total_earnings.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <EmptyState icon={BarChart3} message='No earnings data available' />
        )}
      </CardContent>
    </Card>
  );
}
