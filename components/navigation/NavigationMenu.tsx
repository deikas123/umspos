"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  requiresReportAccess?: boolean;
  adminOnly?: boolean;
}

interface NavigationMenuProps {
  items: NavigationItem[];
  currentPath: string;
}

export function NavigationMenu({
  items,
  currentPath,
}: Readonly<NavigationMenuProps>) {
  const [clickedUrl, setClickedUrl] = useState<string | null>(null);

  // Clear clicked URL when route changes (navigation complete)
  useEffect(() => {
    setClickedUrl(null);
  }, [currentPath]);

  const handleClick = (url: string) => {
    if (currentPath === url) return;
    setClickedUrl(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className='text-sm font-medium text-gray-500 uppercase tracking-wider'>
        Menu
      </SidebarGroupLabel>
      <SidebarGroupContent className='mt-2 space-y-1'>
        <SidebarMenu>
          {items.map((item) => {
            const isNavigating = clickedUrl === item.url;
            const isActive = currentPath === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{
                    children: item.title,
                    hidden: false,
                    side: "right",
                    sideOffset: 8,
                  }}
                  className={cn(
                    "w-full px-2 py-2.5 cursor-pointer text-sm font-medium transition-all duration-150",
                    "hover:bg-gray-50 hover:text-primary",
                    "focus:bg-gray-50 focus:text-primary focus:outline-none",
                    isActive &&
                      "bg-primary text-white font-semibold shadow-sm border-l-4 border-primary",
                    isNavigating && "bg-primary/10 text-primary opacity-70"
                  )}>
                  <Link
                    href={item.url}
                    prefetch={true}
                    onClick={() => handleClick(item.url)}>
                    <item.icon className='h-4 w-4' />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
