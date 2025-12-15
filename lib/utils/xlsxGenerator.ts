import * as XLSX from "xlsx";

export interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Generate and download an XLSX file from data
 */
export function generateXLSX(
  data: ExportData[],
  filename: string,
  sheetName: string = "Sheet1"
) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on content
  const headers = Object.keys(data[0]);
  const columnWidths = headers.map((header) => {
    const maxLength = Math.max(
      header.length,
      ...data.map((row) => String(row[header] ?? "").length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 chars
  });
  worksheet["!cols"] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download the file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Generate XLSX with multiple sheets
 */
export function generateMultiSheetXLSX(
  sheets: { name: string; data: ExportData[] }[],
  filename: string
) {
  if (!sheets || sheets.length === 0) {
    console.warn("No sheets to export");
    return;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const headers = Object.keys(data[0]);
    const columnWidths = headers.map((header) => {
      const maxLength = Math.max(
        header.length,
        ...data.map((row) => String(row[header] ?? "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31)); // Sheet names max 31 chars
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
