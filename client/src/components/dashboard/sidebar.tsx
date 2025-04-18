import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  BarChart,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  className?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/budgets", label: "Budgets", icon: Wallet },
    { href: "/goals", label: "Goals", icon: PiggyBank },
    { href: "/reports", label: "Reports", icon: BarChart },
    { href: "/reminders", label: "Reminders", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={cn(
        "hidden md:flex md:w-64 md:flex-col h-screen bg-primary text-white",
        className
      )}
    >
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="px-4 pb-6">
          <h1 className="text-2xl font-bold">BudgetWise</h1>
        </div>
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-white bg-opacity-10"
                      : "hover:bg-white hover:bg-opacity-10"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="px-4 pb-6 mt-auto">
            <Separator className="bg-white/20 my-4" />
            <div className="flex items-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary-200 text-primary-800">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs font-medium text-white text-opacity-60">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-4 flex text-sm justify-start px-0 hover:bg-transparent hover:text-white/80"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
