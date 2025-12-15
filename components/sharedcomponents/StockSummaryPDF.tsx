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
    padding: 8,
    flex: 1,
    fontSize: 10,
    color: "white",
    textAlign: "center",
  },
  tableCell: {
    padding: 8,
    flex: 1,
    fontSize: 10,
    color: "#000",
    textAlign: "center",
  },
  tableCellLeft: {
    padding: 8,
    flex: 1,
    fontSize: 10,
    color: "#000",
    textAlign: "left",
  },
  totalRow: {
    backgroundColor: "#f0f4ff",
  },
  totalCell: {
    padding: 8,
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#000080",
    textAlign: "center",
  },
  totalCellLeft: {
    padding: 8,
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#000080",
    textAlign: "left",
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

interface StockData {
  type: string;
  inStock: number;
  withAgents: number;
  faulty: number;
  total: number;
}

interface StockSummaryPDFProps {
  data: StockData[];
  totals: {
    inStock: number;
    withAgents: number;
    faulty: number;
    total: number;
  };
}

const StockSummaryPDF = ({ data, totals }: StockSummaryPDFProps) => {
  const currentDateTime = format(new Date(), "dd/MM/yyyy HH:mm:ss");

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src='/logo.png' style={styles.logo} />
          <Text style={styles.timestamp}>{currentDateTime}</Text>
        </View>

        <Text style={styles.title}>Stock Summary Report</Text>

        {/* Summary Boxes */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>In Stock</Text>
            <Text style={styles.summaryValue}>{totals.inStock}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>With Agents</Text>
            <Text style={styles.summaryValue}>{totals.withAgents}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Faulty</Text>
            <Text style={styles.summaryValue}>{totals.faulty}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Available</Text>
            <Text style={styles.summaryValue}>{totals.total}</Text>
          </View>
        </View>

        {/* Inventory Table */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Inventory Breakdown by Meter Type</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableHeaderCell}>Meter Type</Text>
              <Text style={styles.tableHeaderCell}>In Stock</Text>
              <Text style={styles.tableHeaderCell}>With Agents</Text>
              <Text style={styles.tableHeaderCell}>Faulty</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>
            {data.map((item) => (
              <View key={item.type} style={styles.tableRow}>
                <Text style={styles.tableCellLeft}>{item.type}</Text>
                <Text style={styles.tableCell}>{item.inStock}</Text>
                <Text style={styles.tableCell}>{item.withAgents}</Text>
                <Text style={styles.tableCell}>{item.faulty}</Text>
                <Text style={styles.tableCell}>{item.total}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={styles.totalCellLeft}>TOTAL</Text>
              <Text style={styles.totalCell}>{totals.inStock}</Text>
              <Text style={styles.totalCell}>{totals.withAgents}</Text>
              <Text style={styles.totalCell}>{totals.faulty}</Text>
              <Text style={styles.totalCell}>{totals.total}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          UMS Prepaid Kenya • Stock Summary Generated on {currentDateTime}
        </Text>
      </Page>
    </Document>
  );
};

export default StockSummaryPDF;
