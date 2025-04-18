import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Bell, Calendar, DollarSign, Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RemindersPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Calculate days until due
  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Overdue";
    } else if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else {
      return `${diffDays} days`;
    }
  };

  // Get status badge based on days until due
  const getStatusBadge = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Overdue</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800">Soon</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Upcoming</Badge>;
    }
  };

  const reminders = data?.reminders || [];

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
          title="Reminders"
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">
              Bill Reminders
            </h1>
            <Button size="sm" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bills</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-4 border-b border-neutral-100"
                      >
                        <div className="w-40 h-6 bg-gray-200 rounded" />
                        <div className="w-20 h-6 bg-gray-200 rounded" />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase">Title</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase">Due Date</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase">Time Left</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase">Recurring</TableHead>
                        <TableHead className="text-xs font-medium text-neutral-500 uppercase text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reminders.length > 0 ? (
                        reminders.map((reminder) => (
                          <TableRow key={reminder.id} className="border-neutral-100">
                            <TableCell className="py-3 text-sm font-medium text-neutral-800 flex items-center">
                              <Bell className="mr-2 h-4 w-4 text-neutral-500" />
                              {reminder.title}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-neutral-800">
                              {reminder.amount ? formatCurrency(reminder.amount) : "—"}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-neutral-500">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-neutral-400" />
                                {formatDate(reminder.dueDate)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              {getStatusBadge(reminder.dueDate)}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-neutral-500">
                              {reminder.isRecurring ? (
                                <div className="flex items-center">
                                  <Repeat className="mr-2 h-4 w-4 text-neutral-400" />
                                  {reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}
                                </div>
                              ) : (
                                "One-time"
                              )}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex justify-end space-x-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-4 text-neutral-500"
                          >
                            No reminders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
