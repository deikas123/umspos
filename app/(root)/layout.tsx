import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/components/navigation/Navbar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { Suspense } from "react";
import { AuthGate } from "@/components/navigation/AuthGate";

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
    <SidebarProvider>
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>


      <div className='flex pt-16 w-full h-full px-2'>
        <AppSidebar />
        <SidebarInset>
          <AuthGate>{children}</AuthGate>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
