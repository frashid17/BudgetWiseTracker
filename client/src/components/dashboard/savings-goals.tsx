import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type SavingsGoalsProps = {
  className?: string;
};

type Goal = {
  id: number;
  name: string;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
};

export function SavingsGoals({ className }: SavingsGoalsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/goals"],
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
    }).format(amount);
  };

  // Default data for skeleton loading
  const defaultGoals: Goal[] = [
    {
      id: 1,
      name: "Vacation Fund",
      currentAmount: 1500,
      targetAmount: 3000,
      percentage: 50,
    },
    {
      id: 2,
      name: "Emergency Fund",
      currentAmount: 4500,
      targetAmount: 6000,
      percentage: 75,
    },
    {
      id: 3,
      name: "New Laptop",
      currentAmount: 800,
      targetAmount: 1200,
      percentage: 67,
    },
  ];

  const goals = isLoading || !data?.goals ? defaultGoals : data.goals;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Savings Goals</CardTitle>
        <Link href="/goals">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">
                    {goal.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {formatCurrency(goal.currentAmount)} /{" "}
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
                <div className="text-xs font-medium text-neutral-700">
                  {goal.percentage}%
                </div>
              </div>
              <Progress value={goal.percentage} className="h-2.5" />
            </div>
          ))}

          {goals.length === 0 && !isLoading && (
            <div className="py-4 text-center text-neutral-500">
              No savings goals yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
