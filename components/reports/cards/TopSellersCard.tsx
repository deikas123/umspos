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
import { Users, Download, File, FileSpreadsheet, FileText } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";
import type { TopSeller } from "../types";

interface TopSellersCardProps {
  topSellers: TopSeller[];
}

export function TopSellersCard({ topSellers }: Readonly<TopSellersCardProps>) {
  const handleExportCSV = () => {
    const data = topSellers.map((seller, index) => ({
      "#": index + 1,
      Name: seller.user_name,
      "Total Sales (KES)": seller.total_sales,
    }));
    generateCSV(data, "top_sellers");
  };

  const handleExportXLSX = () => {
    const data = topSellers.map((seller, index) => ({
      "#": index + 1,
      Name: seller.user_name,
      "Total Sales (KES)": seller.total_sales,
    }));
    generateXLSX(data, "top_sellers", "Top Sellers");
  };

  const handleExportPDF = async () => {
    const headers = ["#", "Name", "Total Sales (KES)"];
    const data = topSellers.map((seller, index) => [
      String(index + 1),
      seller.user_name,
      seller.total_sales.toLocaleString(),
    ]);

    const blob = await pdf(
      <TableReportPDF
        title='Top Sellers Report'
        headers={headers}
        data={data}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "top_sellers.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className='shadow-md hover:shadow-xl'>
      <CardHeader className='flex flex-row items-center justify-between p-4 md:p-6'>
        <CardTitle className='text-lg md:text-xl'>Top Sellers</CardTitle>
        <div className='flex items-center gap-2'>
          {topSellers.length > 0 && (
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
          <Users className='w-5 h-5 text-primary' />
        </div>
      </CardHeader>
      <CardContent className='p-4 md:p-6'>
        {topSellers.length > 0 ? (
          <div className='overflow-x-auto'>
            {/* Mobile View */}
            <div className='md:hidden space-y-4'>
              {topSellers.map((seller) => (
                <div
                  key={seller.user_name}
                  className='flex justify-between items-center'>
                  <span className='font-medium'>{seller.user_name}</span>
                  <span>KES {seller.total_sales.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className='text-right'>Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellers.map((seller) => (
                    <TableRow key={seller.user_name}>
                      <TableCell>{seller.user_name}</TableCell>
                      <TableCell className='text-right'>
                        KES {seller.total_sales.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <EmptyState icon={Users} message='No seller data available' />
        )}
      </CardContent>
    </Card>
  );
}
