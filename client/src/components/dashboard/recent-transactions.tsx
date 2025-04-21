import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TransactionWithCategory } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type RecentTransactionsProps = {
  className?: string;
  limit?: number;
};

export function RecentTransactions({ className, limit = 5 }: RecentTransactionsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/transactions/recent", limit],
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
      currency: "KSH",
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
      housing: "bg-teal-100 text-teal-800"
    };
    
    const lowerCaseCategory = category.toLowerCase();
    return categoryColors[lowerCaseCategory] || "bg-gray-100 text-gray-800";
  };

  // Default data for skeleton loading
  const defaultTransactions: Partial<TransactionWithCategory>[] = Array(limit).fill(0).map((_, i) => ({
    id: i,
    description: "Loading...",
    amount: 0,
    date: new Date().toISOString(),
    isIncome: false,
    categoryName: "Loading"
  }));

  const transactions = isLoading || !data?.transactions 
    ? defaultTransactions 
    : data.transactions;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
        <Link href="/transactions">
          <a className="text-primary text-sm font-medium">View All</a>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Description</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Category</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Date</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={transaction.id || index} className="border-neutral-100">
                  <TableCell className="py-3 text-sm text-neutral-800">
                    {transaction.description || "No description"}
                  </TableCell>
                  <TableCell className="py-3">
                    {transaction.categoryName ? (
                      <Badge 
                        variant="outline" 
                        className={getCategoryBadgeColor(transaction.categoryName, transaction.categoryColor)}
                      >
                        {transaction.categoryName}
                      </Badge>
                    ) : isLoading ? (
                      <div className="w-16 h-5 bg-gray-200 rounded-full animate-pulse" />
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Uncategorized
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-neutral-500">
                    {transaction.date ? formatDate(transaction.date.toString()) : "N/A"}
                  </TableCell>
                  <TableCell 
                    className={`py-3 text-sm text-right ${
                      transaction.isIncome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount !== undefined 
                      ? formatCurrency(transaction.amount, Boolean(transaction.isIncome))
                      : "$0.00"}
                  </TableCell>
                </TableRow>
              ))}
              
              {transactions.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
