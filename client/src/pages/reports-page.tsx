import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function ReportsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Get spending trends for the last 6 months
  const { data: trendData, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/dashboard/spending-trends", { months: 6 }],
  });

  // Get category spending
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/dashboard/category-spending"],
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const trends = trendData?.trends || [];
  const categories = categoryData?.categories || [];

  // Generate monthly savings data
  const savingsData = trends.map((month: any) => ({
    month: month.month,
    savings: month.income - month.expenses,
  }));

  // Calculate total income and expenses for the period
  const totalIncome = trends.reduce((sum: number, month: any) => sum + month.income, 0);
  const totalExpenses = trends.reduce((sum: number, month: any) => sum + month.expenses, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

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
          title="Financial Reports"
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-sm text-gray-500">Last 6 months</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-sm text-gray-500">Last 6 months</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Savings Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {savingsRate}%
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(totalSavings)} saved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Income vs Expenses Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>
                Monthly comparison of your income and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trends}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short'
                        }).format(value)
                      } 
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']} 
                      labelFormatter={(value) => `Month: ${value}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Savings Trend Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Monthly Savings</CardTitle>
              <CardDescription>
                How much you're saving each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={savingsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short'
                        }).format(value)
                      } 
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Savings']} 
                      labelFormatter={(value) => `Month: ${value}`}
                    />
                    <Bar
                      dataKey="savings"
                      fill="#8884d8"
                      minPointSize={5}
                    >
                      {savingsData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.savings >= 0 ? "#10b981" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                Where your money is going
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No category spending data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}