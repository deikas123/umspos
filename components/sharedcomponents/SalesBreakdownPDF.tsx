import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";

Font.register({
  family: "GeistMono",
  src: "/fonts/GeistMonoVF.woff",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "GeistMono",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000080",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000080",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000080",
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000080",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000080",
  },
  tableHeader: {
    backgroundColor: "#000080",
  },
  tableHeaderCell: {
    padding: 6,
    flex: 1,
    fontSize: 9,
    color: "white",
    textAlign: "center",
  },
  tableHeaderCellWide: {
    padding: 6,
    flex: 1.5,
    fontSize: 9,
    color: "white",
    textAlign: "center",
  },
  tableCell: {
    padding: 6,
    flex: 1,
    fontSize: 8,
    color: "#000",
    textAlign: "center",
  },
  tableCellWide: {
    padding: 6,
    flex: 1.5,
    fontSize: 8,
    color: "#000",
    textAlign: "left",
  },
  totalRow: {
    backgroundColor: "#f0f4ff",
  },
  totalCell: {
    padding: 6,
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: "#000080",
    textAlign: "center",
  },
  totalCellWide: {
    padding: 6,
    flex: 1.5,
    fontSize: 9,
    fontWeight: "bold",
    color: "#000080",
    textAlign: "left",
  },
  meterTypeSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 10,
  },
  meterTypeBox: {
    padding: 10,
    backgroundColor: "#f0f4ff",
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  meterTypeLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  meterTypeValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000080",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#000080",
  },
});

interface SaleRecord {
  seller: string;
  meterType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  time: string;
  customerType: string;
  county: string;
  recipient: string;
}

interface SalesBreakdownPDFProps {
  sales: SaleRecord[];
  totalEarnings: number;
  totalMeters: number;
  meterTypeSummary: { type: string; count: number; earnings: number }[];
  reportTitle?: string;
  dateRange?: string;
}

const SalesBreakdownPDF = ({
  sales,
  totalEarnings,
  totalMeters,
  meterTypeSummary,
  reportTitle = "Sales Breakdown Report",
  dateRange,
}: SalesBreakdownPDFProps) => {
  const currentDateTime = format(new Date(), "dd/MM/yyyy HH:mm:ss");

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src='/logo.png' style={styles.logo} />
          <Text style={styles.timestamp}>{currentDateTime}</Text>
        </View>

        <Text style={styles.title}>{reportTitle}</Text>
        {dateRange && <Text style={styles.timestamp}>Period: {dateRange}</Text>}

        {/* Summary Boxes */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{sales.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Meters Sold</Text>
            <Text style={styles.summaryValue}>{totalMeters}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>
              KES {totalEarnings.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Meter Type Summary */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Sales by Meter Type</Text>
          <View style={styles.meterTypeSummary}>
            {meterTypeSummary.map((item) => (
              <View key={item.type} style={styles.meterTypeBox}>
                <Text style={styles.meterTypeLabel}>{item.type}</Text>
                <Text style={styles.meterTypeValue}>{item.count} units</Text>
                <Text style={styles.meterTypeLabel}>
                  KES {item.earnings.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sales Table */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Transaction Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableHeaderCellWide}>Seller</Text>
              <Text style={styles.tableHeaderCell}>Type</Text>
              <Text style={styles.tableHeaderCell}>Qty</Text>
              <Text style={styles.tableHeaderCell}>Unit Price</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
              <Text style={styles.tableHeaderCell}>Time</Text>
              <Text style={styles.tableHeaderCellWide}>Recipient</Text>
              <Text style={styles.tableHeaderCell}>County</Text>
            </View>
            {sales.map((sale) => (
              <View
                key={`${sale.seller}-${sale.time}-${sale.meterType}`}
                style={styles.tableRow}>
                <Text style={styles.tableCellWide}>{sale.seller}</Text>
                <Text style={styles.tableCell}>{sale.meterType}</Text>
                <Text style={styles.tableCell}>{sale.quantity}</Text>
                <Text style={styles.tableCell}>
                  {sale.unitPrice.toLocaleString()}
                </Text>
                <Text style={styles.tableCell}>
                  {sale.totalPrice.toLocaleString()}
                </Text>
                <Text style={styles.tableCell}>{sale.time}</Text>
                <Text style={styles.tableCellWide}>{sale.recipient}</Text>
                <Text style={styles.tableCell}>{sale.county || "-"}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={styles.totalCellWide}>TOTAL</Text>
              <Text style={styles.totalCell}>-</Text>
              <Text style={styles.totalCell}>{totalMeters}</Text>
              <Text style={styles.totalCell}>-</Text>
              <Text style={styles.totalCell}>
                {totalEarnings.toLocaleString()}
              </Text>
              <Text style={styles.totalCell}>-</Text>
              <Text style={styles.totalCellWide}>-</Text>
              <Text style={styles.totalCell}>-</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          UMS Prepaid Kenya • Sales Report Generated on {currentDateTime}
        </Text>
      </Page>
    </Document>
  );
};

export default SalesBreakdownPDF;
