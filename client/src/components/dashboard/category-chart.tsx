import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type CategoryChartProps = {
  className?: string;
};

export function CategoryChart({ className }: CategoryChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/dashboard/category-spending"],
  });

  // Default data in case of loading or empty data
  const defaultData = [
    { name: "Housing", value: 35, color: "#1976D2" },
    { name: "Food", value: 20, color: "#66BB6A" },
    { name: "Transportation", value: 10, color: "#FFA726" },
    { name: "Entertainment", value: 15, color: "#42A5F5" },
    { name: "Shopping", value: 8, color: "#EC407A" },
    { name: "Utilities", value: 7, color: "#AB47BC" },
    { name: "Other", value: 5, color: "#78909C" },
  ];

  const chartData = isLoading || !data?.categories ? defaultData : data.categories;

  // Custom tooltip that shows percentage and amount
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-100">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{`${data.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend rendering
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-3 text-xs mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Spending by Category
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={renderLegend}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
