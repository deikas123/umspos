"use client";

import { useState } from "react";
import { useUsersData, type UsersPageData } from "./hooks/useUsersData";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Download,
  File,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { EditNameDialog } from "./components/EditNameDialog";
import { UsersTable } from "./components/UsersTable";
import { UsersMobileList } from "./components/UsersMobileList";
import { UsersFilters } from "./components/UsersFilters";
import { UsersPagination } from "./components/UsersPagination";
import { generateCSV } from "@/lib/utils/csvGenerator";
import { generateXLSX } from "@/lib/utils/xlsxGenerator";
import { pdf } from "@react-pdf/renderer";
import TableReportPDF from "@/components/sharedcomponents/TableReportPDF";

interface UsersProps {
  readonly initialData?: UsersPageData;
}

export default function UsersPage({ initialData }: UsersProps) {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<
    string | null
  >(null);
  const [targetUserName, setTargetUserName] = useState<string>("");
  const itemsPerPage = 10;

  const {
    users,
    currentUser,
    isLoading,
    isFetching,
    error,
    updateUser,
    refetch,
  } = useUsersData(showDeactivated, initialData);

  const handleUpdateName = async (userId: string, newName: string) => {
    try {
      await updateUser({
        userId: userId,
        updates: { name: newName },
      });

      toast.success("User name updated successfully");
      setEditingUser(null);
      setShowEditNameDialog(false);
    } catch (error) {
      toast.error("Failed to update user name");
    }
  };

  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      await updateUser({
        userId: user.id,
        updates: { role: newRole },
      });

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = !user.isActive;
      await updateUser({
        userId: user.id,
        updates: { is_active: newStatus },
      });

      toast.success(
        `User ${newStatus ? "activated" : "deactivated"} successfully`
      );

      await refetch({ throwOnError: true });
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const openChangePasswordDialog = (userId: string, userName: string) => {
    setPasswordChangeUserId(userId);
    setTargetUserName(userName);
    setShowChangePasswordDialog(true);
  };

  const openEditNameDialog = (user: any) => {
    setEditingUser(user);
    setShowEditNameDialog(true);
  };

  // Filter and pagination logic
  const filteredAndPaginatedUsers = () => {
    let filtered = [...users];

    if (currentUser) {
      filtered.sort((a, b) => {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
        return 0;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedUsers: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalUsers: filtered.length,
    };
  };

  const handleRefresh = async () => {
    try {
      await refetch({ throwOnError: true });
      toast.success("Users list refreshed");
    } catch (error) {
      console.error("Failed to refresh users data:", error);
      toast.error("Failed to refresh data");
    }
  };

  const isRefreshing = isFetching && !isLoading;

  const handleExportCSV = () => {
    const data = users.map((user, index) => ({
      "#": index + 1,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? "Active" : "Inactive",
    }));
    generateCSV(data, "users");
  };

  const handleExportXLSX = () => {
    const data = users.map((user, index) => ({
      "#": index + 1,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? "Active" : "Inactive",
    }));
    generateXLSX(data, "users", "Users");
  };

  const handleExportPDF = async () => {
    const headers = ["#", "Name", "Email", "Role", "Status"];
    const data = users.map((user, index) => [
      String(index + 1),
      user.name,
      user.email,
      user.role,
      user.isActive ? "Active" : "Inactive",
    ]);

    const blob = await pdf(
      <TableReportPDF title='Users Report' headers={headers} data={data} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <div className='text-lg text-red-500'>Error: {error.message}</div>
        <Button
          onClick={() => refetch()}
          variant='outline'
          className='cursor-pointer'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry
        </Button>
      </div>
    );
  }

  const { paginatedUsers, totalPages, totalUsers } =
    filteredAndPaginatedUsers();

  return (
    <div className='container w-full'>
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        userId={passwordChangeUserId}
        userName={targetUserName}
        currentUser={currentUser}
      />

      <EditNameDialog
        isOpen={showEditNameDialog}
        onOpenChange={setShowEditNameDialog}
        user={editingUser}
        onSave={handleUpdateName}
      />

      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-center drop-shadow-lg'>Users</h1>
        {users.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
                <Download className='h-4 w-4 mr-2' />
                Export
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
      </div>

      <UsersFilters
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1);
        }}
        showDeactivated={showDeactivated}
        onShowDeactivatedChange={setShowDeactivated}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        totalUsers={totalUsers}
      />

      <div className='overflow-auto'>
        <div className='min-w-[300px]'>
          <UsersTable
            users={paginatedUsers}
            currentUser={currentUser}
            onEditName={openEditNameDialog}
            onChangePassword={openChangePasswordDialog}
            onChangeRole={handleChangeRole}
            onToggleStatus={handleToggleStatus}
          />
          <UsersMobileList
            users={paginatedUsers}
            currentUser={currentUser}
            onEditName={openEditNameDialog}
            onChangePassword={openChangePasswordDialog}
            onChangeRole={handleChangeRole}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      <UsersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
