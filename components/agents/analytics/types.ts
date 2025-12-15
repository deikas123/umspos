// Types for Agent Analytics components

export interface AgentData {
  id: string;
  name: string;
  totalSales: number;
}

export interface TopPerformerData {
  name: string;
  totalMeters: number;
  totalTransactions: number;
}

export interface SalesDataPoint {
  date: string;
  [agentName: string]: string | number;
}

export interface AgentBasicInfo {
  id: string;
  name: string;
  is_active: boolean | null;
}

export interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
  dataKey: string;
}
