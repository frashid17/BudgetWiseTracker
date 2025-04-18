import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  WalletCards 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
  const { data: balance = { currentBalance: 0, income: 0, expenses: 0 }, isLoading } = 
    useQuery({
      queryKey: ["/api/dashboard/balance"],
    });

  // Format money values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary bg-opacity-10">
              <WalletCards className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Current Balance</p>
              <h3 className="text-xl font-semibold text-neutral-800">
                {isLoading ? "Loading..." : formatCurrency(balance.currentBalance)}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Monthly Income</p>
              <h3 className="text-xl font-semibold text-neutral-800">
                {isLoading ? "Loading..." : formatCurrency(balance.income)}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500">Monthly Expenses</p>
              <h3 className="text-xl font-semibold text-neutral-800">
                {isLoading ? "Loading..." : formatCurrency(balance.expenses)}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
