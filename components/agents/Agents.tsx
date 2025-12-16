"use client";

import { useState } from "react";
import {
  updateAgentStatus,
  deleteAgent,
  getAgentInventory,
  getAgentsMeterCountsByType,
} from "@/lib/actions/agents";
import AgentAnalytics from "./AgentAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import EditAgentDialog from "./EditAgentDialog";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAgentsData,
  type AgentsPageData,
  type Agent,
} from "./hooks/useAgentsData";
import { Users2 } from "lucide-react";
import AgentHistory from "./AgentHistory";
import AgentsSearchBar from "./AgentsSearchBar";
import AgentTableRow from "./AgentTableRow";
import AgentMobileRow from "./AgentMobileRow";
import AgentDeleteDialog from "./AgentDeleteDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

// Meter types for export
const METER_TYPES = [
  "integrated",
  "split",
  "gas",
  "water",
  "smart",
  "3 phase",
] as const;

const EmptyState = () => (
  <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
    <div className='relative'>
      <Users2 className='w-12 h-12 mb-4 text-gray-400' />
      <span className='absolute -bottom-1 -right-1 flex h-3 w-3'>
        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
        <span className='relative inline-flex rounded-full h-3 w-3 bg-primary'></span>
      </span>
    </div>
    <p className='text-sm font-medium'>No agents registered yet</p>
    <p className='text-xs text-gray-400 mt-1'>
      Add agents to start managing your team
    </p>
  </div>
);

interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active?: boolean | null;
}

interface AgentsProps {
  readonly initialData?: AgentsPageData;
}

export default function Agents({ initialData }: AgentsProps) {
  const isMobile = useIsMobile();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletionSheetOpen, setIsDeletionSheetOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [agentInventory, setAgentInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 10;

  const {
    agentsData: { agents, currentUser, meterCounts, agentMeterCounts },
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAgentsData(initialData);

  const queryClient = useQueryClient();

  // Helper function for search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Helper function for edit
  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  // Helper function for record sale close
  const handleSaleClose = () => {
    setSelectedAgent(null);
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await updateAgentStatus(agent.id, !agent.is_active);

      queryClient.setQueryData(["agents"], (oldData: Agent[] = []) =>
        oldData.map((a) =>
          a.id === agent.id ? { ...a, is_active: !a.is_active } : a
        )
      );

      toast.success(
        `Agent ${agent.is_active ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      console.error("Error updating agent status:", error);
      queryClient.invalidateQueries({ queryKey: ["agents"] });

      toast.error("Failed to update agent status");
    }
  };

  const handleDeleteClick = async (agent: Agent) => {
    try {
      const inventory = await getAgentInventory(agent.id);
      setAgentInventory(inventory || []);
      setAgentToDelete(agent);
      setIsDeleteDialogOpen(true);
    } catch (error) {
      console.error("Error checking agent inventory:", error);
      toast.error("Failed to check agent inventory");
    }
  };

  const handleDeleteAgent = async (
    scannedMeters: string[] = [],
    unscannedMeters: string[] = []
  ) => {
    if (!currentUser) {
      toast.error("User information not available");
      return;
    }

    try {
      await deleteAgent(
        agentToDelete!.id,
        currentUser,
        scannedMeters,
        unscannedMeters
      );

      queryClient.setQueryData(["agents"], (oldData: Agent[] = []) =>
        oldData.filter((a) => a.id !== agentToDelete!.id)
      );

      toast.success("Agent deleted successfully");

      setIsDeleteDialogOpen(false);
      setIsDeletionSheetOpen(false);
      setAgentToDelete(null);
      setAgentInventory([]);
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["agents"] });

      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const filteredAndPaginatedAgents = () => {
    const filtered = agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone_number.includes(searchTerm) ||
        agent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.county.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedAgents: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalAgents: filtered.length,
    };
  };

  const { paginatedAgents, totalPages, totalAgents } =
    filteredAndPaginatedAgents();

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["agents"],
        refetchType: "active",
      });
      await refetch({ cancelRefetch: false, throwOnError: true });
      toast.success("Agents list refreshed");
    } catch (error) {
      console.error("Error refreshing agents data:", error);
      toast.error("Failed to refresh data");
    }
  };

  const isRefreshing = isFetching && !isLoading;

  // Export helpers
  const getExportData = () => {
    // Export filtered agents (all, not just current page)
    const filtered = agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone_number.includes(searchTerm) ||
        agent.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.county.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  };

  const formatAgentForExport = (
    agent: Agent,
    meterCountsByType: Record<string, Record<string, number>>
  ) => {
    const agentMeterCounts = meterCountsByType[agent.id] || {};
    return {
      Name: agent.name,
      "Phone Number": agent.phone_number,
      Location: agent.location,
      County: agent.county,
      Type: agent.agent_type === "credit" ? "Credit" : "Cash",
      "Total Meters": agent.total_meters ?? 0,
      Integrated: agentMeterCounts["integrated"] || 0,
      Split: agentMeterCounts["split"] || 0,
      Gas: agentMeterCounts["gas"] || 0,
      Water: agentMeterCounts["water"] || 0,
      Smart: agentMeterCounts["smart"] || 0,
      "3 Phase": agentMeterCounts["3 phase"] || 0,
      Status: agent.is_active ? "Active" : "Inactive",
    };
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const meterCountsByType = await getAgentsMeterCountsByType();
      const exportData = getExportData().map((agent) =>
        formatAgentForExport(agent, meterCountsByType)
      );
      if (exportData.length === 0) {
        toast.error("No agents to export");
        return;
      }
      generateCSV(
        exportData,
        `agents-list-${new Date().toISOString().split("T")[0]}`
      );
      toast.success(`Exported ${exportData.length} agents to CSV`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    setIsExporting(true);
    try {
      const meterCountsByType = await getAgentsMeterCountsByType();
      const exportData = getExportData().map((agent) =>
        formatAgentForExport(agent, meterCountsByType)
      );
      if (exportData.length === 0) {
        toast.error("No agents to export");
        return;
      }
      generateXLSX(
        exportData,
        `agents-list-${new Date().toISOString().split("T")[0]}`,
        "Agents"
      );
      toast.success(`Exported ${exportData.length} agents to Excel`);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const meterCountsByType = await getAgentsMeterCountsByType();
      const exportData = getExportData();
      if (exportData.length === 0) {
        toast.error("No agents to export");
        return;
      }

      const headers = [
        "Name",
        "Phone",
        "Location",
        "County",
        "Type",
        "Total",
        "Int",
        "Split",
        "Gas",
        "Water",
        "Smart",
        "3Ph",
        "Status",
      ];
      const data = exportData.map((agent) => {
        const agentMeterCounts = meterCountsByType[agent.id] || {};
        return [
          agent.name,
          agent.phone_number,
          agent.location,
          agent.county,
          agent.agent_type === "credit" ? "Credit" : "Cash",
          String(agent.total_meters ?? 0),
          String(agentMeterCounts["integrated"] || 0),
          String(agentMeterCounts["split"] || 0),
          String(agentMeterCounts["gas"] || 0),
          String(agentMeterCounts["water"] || 0),
          String(agentMeterCounts["smart"] || 0),
          String(agentMeterCounts["3 phase"] || 0),
          agent.is_active ? "Active" : "Inactive",
        ];
      });

      const blob = await pdf(
        <TableReportPDF title='Agents List' headers={headers} data={data} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agents-list-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} agents to PDF`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div className='w-full h-full'>
      <div className='rounded-md border p-4 bg-white'>
        <Tabs defaultValue='agents' className='w-full'>
          <TabsList className='mb-4'>
            <TabsTrigger className='cursor-pointer' value='agents'>
              Agents
            </TabsTrigger>
            <TabsTrigger className='cursor-pointer' value='history'>
              History
            </TabsTrigger>
            <TabsTrigger className='cursor-pointer gap-1' value='analytics'>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value='agents' className='space-y-4'>
            <AgentsSearchBar
              searchTerm={searchTerm}
              totalAgents={totalAgents}
              agents={agents}
              meterCounts={meterCounts}
              onSearchChange={handleSearchChange}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onExportCSV={handleExportCSV}
              onExportXLSX={handleExportXLSX}
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
            />

            {/* Desktop View */}
            <div className='hidden md:block'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='font-semibold'>Name</TableHead>
                    <TableHead className='font-semibold'>Contact</TableHead>
                    <TableHead className='font-semibold'>Location</TableHead>
                    <TableHead className='font-semibold'>County</TableHead>
                    <TableHead className='font-semibold'>Type</TableHead>
                    <TableHead className='font-semibold text-center'>
                      Meters
                    </TableHead>
                    <TableHead className='font-semibold'>Status</TableHead>
                    <TableHead className='font-semibold'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgents.length > 0 ? (
                    paginatedAgents.map((agent) => (
                      <AgentTableRow
                        key={agent.id}
                        agent={agent}
                        currentUser={currentUser}
                        meterCountsByType={agentMeterCounts[agent.id]}
                        onEdit={handleEdit}
                        onSaleClose={handleSaleClose}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteClick}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className='block md:hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='font-semibold'>Name</TableHead>
                    <TableHead className='font-semibold text-center'>
                      Details
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAgents.length > 0 ? (
                    paginatedAgents.map((agent) => (
                      <AgentMobileRow
                        key={agent.id}
                        agent={agent}
                        currentUser={currentUser}
                        meterCountsByType={agentMeterCounts[agent.id]}
                        onEdit={handleEdit}
                        onSaleClose={handleSaleClose}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteClick}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <EmptyState />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Edit Agent Dialog */}
            {selectedAgent && (
              <EditAgentDialog
                isOpen={isEditDialogOpen}
                onClose={() => {
                  setIsEditDialogOpen(false);
                  setSelectedAgent(null);
                }}
                onAgentUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ["agents"] });
                }}
                agent={selectedAgent}
              />
            )}

            <AgentDeleteDialog
              isOpen={isDeleteDialogOpen}
              isDeletionSheetOpen={isDeletionSheetOpen}
              agent={agentToDelete}
              inventory={agentInventory}
              currentUser={currentUser}
              onOpenChange={setIsDeleteDialogOpen}
              onDeletionSheetOpenChange={setIsDeletionSheetOpen}
              onDelete={handleDeleteAgent}
              isMobile={isMobile}
            />

            {/* Pagination */}
            <div className='mt-4 flex justify-center'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={cn(
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={cn(
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </TabsContent>

          <TabsContent value='history'>
            <AgentHistory />
          </TabsContent>

          <TabsContent value='analytics'>
            <AgentAnalytics agents={agents} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
