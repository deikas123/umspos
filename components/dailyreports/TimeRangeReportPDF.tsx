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
import type {
  AgentInventory,
  RemainingMetersByType,
  SaleWithMeters,
} from "./types";

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
    marginBottom: 20,
    color: "#000080",
  },
  dateRange: {
    fontSize: 12,
    color: "#666",
    marginBottom: 15,
  },
  summarySection: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000080",
  },
  comparisonText: {
    fontSize: 10,
    marginBottom: 5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  statBox: {
    width: "50%",
    padding: 10,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000080",
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000080",
    marginBottom: 20,
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
  },
  tableCell: {
    padding: 6,
    flex: 1,
    fontSize: 8,
  },
  totalRow: {
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#000080",
  },
  totalCell: {
    padding: 8,
    flex: 1,
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
  saleCard: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  saleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  saleTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000080",
  },
  saleMeta: {
    fontSize: 10,
    color: "#555",
  },
  saleTotal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000080",
  },
  saleMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  metaItem: {
    width: "50%",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  metaValue: {
    fontSize: 10,
    color: "#111827",
  },
  serialsSection: {
    marginTop: 4,
  },
  serialsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000080",
  },
  serialRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  serialCell: {
    width: "25%",
    fontSize: 9,
    color: "#1f2937",
    paddingVertical: 2,
  },
  noSerialsText: {
    fontSize: 9,
    color: "#6b7280",
  },
});

interface TimeRangeReportPDFProps {
  sales: SaleWithMeters[];
  dateRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  metrics: {
    totalSales: number;
    averageDailySales: number;
    totalMeters: number;
    metersByType: { [key: string]: number };
  };
  remainingMetersByType: RemainingMetersByType[];
  agentInventory: AgentInventory[];
}

const METER_TYPES = [
  "integrated",
  "split",
  "gas",
  "water",
  "smart",
  "3 phase",
] as const;

const SERIAL_COLUMNS = 4;

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

const TimeRangeReportPDF = ({
  sales,
  dateRange,
  metrics,
  remainingMetersByType,
  agentInventory,
}: TimeRangeReportPDFProps) => {
  const getAgentCount = (meterType: string) => {
    const inventory = agentInventory.find(
      (item) => item.type.toLowerCase() === meterType.toLowerCase()
    );
    return inventory?.with_agents || 0;
  };

  const allMeterTypes = METER_TYPES.map((type) => {
    const existingData = remainingMetersByType.find(
      (item) => item.type.toLowerCase() === type.toLowerCase()
    );
    return {
      type,
      remaining: existingData?.remaining_meters || 0,
      withAgents: getAgentCount(type),
      soldInPeriod: metrics.metersByType[type] || 0,
    };
  });

  const totals = {
    remaining: allMeterTypes.reduce((sum, item) => sum + item.remaining, 0),
    withAgents: allMeterTypes.reduce((sum, item) => sum + item.withAgents, 0),
    soldInPeriod: allMeterTypes.reduce(
      (sum, item) => sum + item.soldInPeriod,
      0
    ),
  };

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src='/logo.png' style={styles.logo} />
          <Text>{format(new Date(), "dd/MM/yyyy HH:mm:ss")}</Text>
        </View>

        <Text style={styles.title}>{dateRange.label}</Text>
        <Text style={styles.dateRange}>
          Period: {format(dateRange.startDate, "dd/MM/yyyy")} -{" "}
          {format(dateRange.endDate, "dd/MM/yyyy")}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>
              KES {metrics.totalSales.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Average Daily Sales</Text>
            <Text style={styles.statValue}>
              KES {metrics.averageDailySales.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Meters Sold</Text>
            <Text style={styles.statValue}>{metrics.totalMeters}</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.subtitle}>Detailed Transactions</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableHeaderCell}>Seller</Text>
              <Text style={styles.tableHeaderCell}>Type</Text>
              <Text style={styles.tableHeaderCell}>Qty</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Recipient</Text>
              <Text style={styles.tableHeaderCell}>Type</Text>
              <Text style={styles.tableHeaderCell}>County</Text>
            </View>
            {sales.map((sale, index) => (
              <View key={`${index}-${sale.id}`} style={styles.tableRow}>
                <Text style={styles.tableCell}>{sale.user_name}</Text>
                <Text style={styles.tableCell}>{sale.meter_type}</Text>
                <Text style={styles.tableCell}>{sale.batch_amount}</Text>
                <Text style={styles.tableCell}>
                  {sale.total_price.toLocaleString()}
                </Text>
                <Text style={styles.tableCell}>
                  {sale.sale_date
                    ? format(new Date(sale.sale_date), "dd/MM")
                    : "-"}
                </Text>
                <Text style={styles.tableCell}>{sale.recipient || "-"}</Text>
                <Text style={styles.tableCell}>
                  {sale.customer_type || "-"}
                </Text>
                <Text style={styles.tableCell}>
                  {sale.customer_county || "-"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          UMS Prepaid Kenya • {dateRange.label} Generated on{" "}
          {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </Text>
      </Page>
    </Document>
  );
};

export default TimeRangeReportPDF;
