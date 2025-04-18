import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingTrends } from "@/components/dashboard/spending-trends";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { SavingsGoals } from "@/components/dashboard/savings-goals";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return null; // Protected route will handle redirect
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar className="h-full border-r-0" />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Dashboard" 
          onMenuClick={() => setMobileSidebarOpen(true)} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              <SpendingTrends />
              <RecentTransactions />
              <UpcomingBills />
            </div>

            {/* Right column (1/3 width on large screens) */}
            <div className="space-y-6">
              <BudgetOverview />
              <CategoryChart />
              <SavingsGoals />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
