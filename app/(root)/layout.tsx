import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { PrefetchProvider } from "@/components/providers/PrefetchProvider";
import { Suspense } from "react";

function NavbarFallback() {
  return (
    <div className='fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-16 flex items-center px-4 w-full' />
  );
}

export default function AppLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <PrefetchProvider>
      <SidebarProvider>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>

        <div className='flex pt-16 w-full h-full px-2'>
          <AppSidebar />
          <SidebarInset>
            <div>{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PrefetchProvider>
  );
}
