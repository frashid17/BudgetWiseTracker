import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type SpendingTrendsProps = {
  className?: string;
};

type TimeRange = "3M" | "6M" | "1Y";

export function SpendingTrends({ className }: SpendingTrendsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard/spending-trends", timeRange],
  });

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Default data in case of loading or empty data
  const defaultData = [
    { month: "May", income: 3400, expenses: 2100 },
    { month: "June", income: 3350, expenses: 1980 },
    { month: "July", income: 3521, expenses: 2180 },
  ];

  const chartData = isLoading || !data?.trends ? defaultData : data.trends;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Spending Trends</CardTitle>
        <div className="flex space-x-2">
          <Button
            variant={timeRange === "3M" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setTimeRange("3M")}
          >
            3M
          </Button>
          <Button
            variant={timeRange === "6M" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setTimeRange("6M")}
          >
            6M
          </Button>
          <Button
            variant={timeRange === "1Y" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setTimeRange("1Y")}
          >
            1Y
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e5eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9CA3AF"
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value)]}
                labelStyle={{ fontWeight: "bold" }}
                contentStyle={{
                  borderRadius: "6px",
                  border: "1px solid #e1e5eb",
                }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#66BB6A"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#EF5350"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
