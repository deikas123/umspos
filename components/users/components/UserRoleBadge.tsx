import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role: string;
}

export function UserRoleBadge({ role }: Readonly<UserRoleBadgeProps>) {
  const getRoleStyle = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100";
      case "admin":
        return "bg-green-100";
      case "accountant":
        return "bg-purple-100";
      case "sales_person":
        return "bg-blue-100";
      default:
        return "bg-yellow-100";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "sales_person":
        return "Sales Person";
      default:
        return role;
    }
  };

  return (
    <Badge variant='outline' className={getRoleStyle(role)}>
      {getRoleLabel(role)}
    </Badge>
  );
}
