// Utility functions for Agent Analytics

// Format date for x-axis: "dd/mm" format
export function formatAxisDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

// Get year from date string
export function getYearFromData(salesData: Array<{ date: string }>): string {
  if (!salesData || salesData.length === 0) return "";
  const firstDate = new Date(salesData[0].date);
  const lastEntry = salesData.at(-1);
  if (!lastEntry) return "";
  const lastDate = new Date(lastEntry.date);
  const firstYear = firstDate.getFullYear();
  const lastYear = lastDate.getFullYear();
  if (firstYear === lastYear) return String(firstYear);
  return `${firstYear}/${lastYear}`;
}

// Helper function to get ranking row background styles
export function getRankingRowStyle(index: number): string {
  if (index === 0) return "bg-purple-50 border border-purple-200";
  if (index === 1) return "bg-gray-100";
  if (index === 2) return "bg-orange-50";
  return "bg-gray-50";
}

// Helper function to get ranking badge styles
export function getRankingBadgeStyle(index: number): string {
  if (index === 0) return "bg-purple-600 text-white";
  if (index === 1) return "bg-gray-400 text-white";
  if (index === 2) return "bg-orange-400 text-white";
  return "bg-gray-300 text-gray-700";
}
