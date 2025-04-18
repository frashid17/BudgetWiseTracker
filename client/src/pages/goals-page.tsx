import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function GoalsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/goals"],
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

  const goals = data?.goals || [];

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
        <Header title="Goals" onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-800">
              Savings Goals
            </h1>
            <Button size="sm" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="w-40 h-6 bg-gray-200 rounded mb-2" />
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-4 bg-gray-200 rounded mb-2" />
                      <div className="w-full h-8 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <>
              {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.map((goal) => (
                    <Card key={goal.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <div className="flex space-x-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
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
                        </div>
                        {goal.dueDate && (
                          <CardDescription>
                            Due by {formatDate(goal.dueDate)}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-lg font-medium">
                              {formatCurrency(goal.currentAmount)}
                            </span>{" "}
                            <span className="text-neutral-500">
                              of {formatCurrency(goal.targetAmount)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-neutral-600">
                            {goal.percentage}%
                          </div>
                        </div>
                        <Progress
                          value={goal.percentage}
                          max={100}
                          className="h-2.5"
                        />
                      </CardContent>
                      <CardFooter>
                        {goal.percentage < 100 ? (
                          <p className="text-sm text-neutral-500">
                            {formatCurrency(goal.targetAmount - goal.currentAmount)}{" "}
                            remaining to reach your goal
                          </p>
                        ) : (
                          <p className="text-sm text-green-600 font-medium">
                            Goal completed! 🎉
                          </p>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">
                      No savings goals created yet
                    </h3>
                    <p className="text-neutral-500 mb-6">
                      Start by creating your first savings goal
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Goal
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
