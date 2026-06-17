import React from "react";
import SideNavBar from "@/components/navigation/SideNavBar";
import TopAppBar from "@/components/navigation/TopAppBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background min-h-screen text-foreground">
      {/* Sidebar Navigation */}
      <SideNavBar />
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top AppBar */}
        <TopAppBar />
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
