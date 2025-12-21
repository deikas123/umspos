import {
  Home,
  ShoppingCart,
  BarChart2,
  Users,
  PlusCircle,
  DollarSign,
  Calendar,
  HandPlatter,
  ArrowLeftCircle,
  SmilePlus,
  ClipboardCheck,
  FileText,
  ClipboardList,
  Store,
} from "lucide-react";
import {
  type UserRole,
  isSalesPerson,
  isAdmin,
  isSuperAdmin,
  hasReportsAccess,
} from "@/lib/utils/rolePermissions";

export interface NavItem {
  title: string;
  url: string;
  icon: any;
  adminOnly?: boolean;
  requiresReportAccess?: boolean;
  requiresApprovalAccess?: boolean;
  salesPersonOnly?: boolean;
  requiresProspectViewAccess?: boolean;
}

export interface ActionItem {
  title: string;
  icon: any;
  component?: React.ComponentType<any>;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

export const navigationItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Reports", url: "/reports", icon: BarChart2 },
  {
    title: "Daily Reports",
    url: "/daily-reports",
    icon: Calendar,
    adminOnly: false,
    requiresReportAccess: true,
  },
  { title: "Users", url: "/users", icon: Users },
  { title: "Agents", url: "/agents", icon: HandPlatter },
  { title: "Stores", url: "/stores", icon: Store, adminOnly: true },
  {
    title: "Approvals",
    url: "/approvals",
    icon: ClipboardCheck,
    requiresApprovalAccess: true,
  },
  {
    title: "Client Form",
    url: "/prospects/new",
    icon: FileText,
    salesPersonOnly: true,
  },
  {
    title: "Prospects List",
    url: "/prospects",
    icon: ClipboardList,
    requiresProspectViewAccess: true,
  },
];

export const actionItems: ActionItem[] = [
  {
    title: "Sell Meters",
    icon: DollarSign,
    component: undefined,
  },
  {
    title: "Return Sold Meters",
    icon: ArrowLeftCircle,
    component: undefined,
    adminOnly: false,
    requiresAuth: true,
  },
  {
    title: "Assign Meters to Agent",
    icon: Users,
    component: undefined,
    adminOnly: false,
    requiresAuth: true,
  },
  {
    title: "Create User",
    icon: SmilePlus,
    component: undefined,
    adminOnly: true,
  },
  {
    title: "Create Agent",
    icon: HandPlatter,
    component: undefined,
    adminOnly: true,
  },
  {
    title: "Add Meters",
    icon: PlusCircle,
    component: undefined,
    adminOnly: true,
  },
];

export function hasNavigationAccess(
  item: NavItem,
  userRole: UserRole
): boolean {
  // Sales person can ONLY see their Client Form page
  if (isSalesPerson(userRole)) {
    return item.salesPersonOnly === true;
  }

  // Sales person only pages are not visible to other roles
  if (item.salesPersonOnly) {
    return false;
  }

  if (item.requiresProspectViewAccess) {
    return isAdmin(userRole);
  }
  if (item.requiresApprovalAccess) {
    return isSuperAdmin(userRole);
  }
  if (item.requiresReportAccess) {
    return hasReportsAccess(userRole);
  }
  if (item.adminOnly) {
    return isAdmin(userRole);
  }
  return true;
}

export function hasActionAccess(item: ActionItem, userRole: UserRole): boolean {
  if (item.adminOnly) {
    return isAdmin(userRole);
  }
  if (item.requiresAuth) {
    return hasReportsAccess(userRole);
  }
  return true;
}
