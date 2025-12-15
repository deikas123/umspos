import { Badge } from "@/components/ui/badge";

interface UserStatusBadgeProps {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: Readonly<UserStatusBadgeProps>) {
  return (
    <Badge
      variant='outline'
      className={isActive ? "bg-green-100" : "bg-red-100"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
