import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { DateRangeSelector } from "@/components/ui/date-range-selector";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function TransactionsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date(),
  });

  // Format dates for API request
  const fromDate = dateRange.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : undefined;
  const toDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/transactions",
      { fromDate, toDate, search, category: categoryFilter },
    ],
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Format currency
  const formatCurrency = (amount: number, isIncome: boolean) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    return isIncome ? formatted : `-${formatted}`;
  };

  // Get badge color based on category
  const getCategoryBadgeColor = (category: string, color?: string) => {
    if (color) return color;

    // Default colors if no color provided
    const categoryColors: Record<string, string> = {
      groceries: "bg-blue-100 text-blue-800",
      income: "bg-green-100 text-green-800",
      utilities: "bg-orange-100 text-orange-800",
      dining: "bg-purple-100 text-purple-800",
      shopping: "bg-pink-100 text-pink-800",
      transportation: "bg-yellow-100 text-yellow-800",
      entertainment: "bg-indigo-100 text-indigo-800",
      health: "bg-red-100 text-red-800",
      housing: "bg-teal-100 text-teal-800",
    };

    const lowerCaseCategory = category.toLowerCase();
    return categoryColors[lowerCaseCategory] || "bg-gray-100 text-gray-800";
  };

  const transactions = data?.transactions || [];
  const categories = data?.categories || [];

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
          title="Transactions"
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-1/4">
                  <DateRangeSelector
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                </div>

                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="w-full md:w-1/4">
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium text-neutral-500 uppercase">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-medium text-neutral-500 uppercase">
                        Description
                      </TableHead>
                      <TableHead className="text-xs font-medium text-neutral-500 uppercase">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-medium text-neutral-500 uppercase text-right">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <TableRow key={index} className="border-neutral-100">
                            <TableCell className="py-3">
                              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse" />
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="w-20 h-5 bg-gray-200 rounded ml-auto animate-pulse" />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow
                          key={transaction.id}
                          className="border-neutral-100"
                        >
                          <TableCell className="py-3 text-sm text-neutral-500">
                            {formatDate(transaction.date.toString())}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-neutral-800">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="py-3">
                            {transaction.categoryName ? (
                              <Badge
                                variant="outline"
                                className={getCategoryBadgeColor(
                                  transaction.categoryName,
                                  transaction.categoryColor
                                )}
                              >
                                {transaction.categoryName}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-800"
                              >
                                Uncategorized
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell
                            className={`py-3 text-sm text-right ${
                              transaction.isIncome
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(
                              transaction.amount,
                              transaction.isIncome
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-neutral-500"
                        >
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
