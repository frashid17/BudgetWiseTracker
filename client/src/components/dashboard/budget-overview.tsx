import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, Utensils, Car, Film } from "lucide-react";

type BudgetOverviewProps = {
  className?: string;
};

type Budget = {
  id: number;
  category: string;
  icon: string;
  current: number;
  max: number;
  percentage: number;
};

export function BudgetOverview({ className }: BudgetOverviewProps) {
  const { data, isLoading } = useQuery<{ budgets: Budget[] }>({
    queryKey: ["/api/budgets/overview"],
  });

  // Convert icon string to component
  const getIconComponent = (icon: string) => {
    switch (icon) {
      case "shopping_bag":
        return <ShoppingCart className="h-5 w-5 text-neutral-500" />;
      case "restaurant":
        return <Utensils className="h-5 w-5 text-neutral-500" />;
      case "directions_car":
        return <Car className="h-5 w-5 text-neutral-500" />;
      case "local_movies":
        return <Film className="h-5 w-5 text-neutral-500" />;
      default:
        return <ShoppingCart className="h-5 w-5 text-neutral-500" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Default data for skeleton loading
  const defaultBudgets: Budget[] = [
    {
      id: 1,
      category: "Dining",
      icon: "restaurant",
      current: 150,
      max: 200,
      percentage: 75,
    },
    {
      id: 2,
      category: "Groceries",
      icon: "shopping_bag",
      current: 320,
      max: 300,
      percentage: 106,
    },
    {
      id: 3,
      category: "Transportation",
      icon: "directions_car",
      current: 95,
      max: 150,
      percentage: 63,
    },
    {
      id: 4,
      category: "Entertainment",
      icon: "local_movies",
      current: 75,
      max: 100,
      percentage: 75,
    },
  ];

  const budgets = isLoading || !data?.budgets ? defaultBudgets : data.budgets;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Budget Overview</CardTitle>
        <Link href="/budgets">
          <a className="text-primary text-sm font-medium">Adjust Budgets</a>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {getIconComponent(budget.icon)}
                  <span className="text-sm font-medium text-neutral-700 ml-2">
                    {budget.category}
                  </span>
                </div>
                <div className="text-sm font-medium text-neutral-500">
                  {formatCurrency(budget.current)} / {formatCurrency(budget.max)}
                </div>
              </div>
              <Progress
                value={budget.percentage}
                max={100}
                className="h-2.5"
                style={{
                  backgroundColor: budget.percentage > 100 ? "red" : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
