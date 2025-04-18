import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Home, Zap, Wifi } from "lucide-react";
import { format, differenceInDays } from "date-fns";

type UpcomingBillsProps = {
  className?: string;
};

type Bill = {
  id: number;
  title: string;
  icon: string;
  amount: number;
  dueDate: string;
};

export function UpcomingBills({ className }: UpcomingBillsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/reminders/upcoming"],
  });

  // Convert icon string to component
  const getIconComponent = (icon: string) => {
    switch (icon) {
      case "home":
        return <Home className="h-4 w-4 text-neutral-500" />;
      case "power":
        return <Zap className="h-4 w-4 text-neutral-500" />;
      case "wifi":
        return <Wifi className="h-4 w-4 text-neutral-500" />;
      default:
        return <Home className="h-4 w-4 text-neutral-500" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date and calculate due days
  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    
    return {
      formattedDate: format(dueDate, "MMM d, yyyy"),
      dueIn: daysUntilDue,
    };
  };

  // Default data for skeleton loading
  const defaultBills: Bill[] = [
    {
      id: 1,
      title: "Rent",
      icon: "home",
      amount: 1200,
      dueDate: "2023-08-01",
    },
    {
      id: 2,
      title: "Electricity",
      icon: "power",
      amount: 85.4,
      dueDate: "2023-08-04",
    },
    {
      id: 3,
      title: "Internet",
      icon: "wifi",
      amount: 59.99,
      dueDate: "2023-08-06",
    },
  ];

  const bills = isLoading || !data?.reminders ? defaultBills : data.reminders;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Upcoming Bills</CardTitle>
        <Link href="/reminders">
          <a className="text-primary text-sm font-medium">Manage Reminders</a>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bills.map((bill) => {
            const { formattedDate, dueIn } = formatDueDate(bill.dueDate);
            
            return (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 border border-neutral-100 rounded-md"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-neutral-100">
                    {getIconComponent(bill.icon)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-neutral-800">
                      {bill.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Due in {dueIn} days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-800">
                    {formatCurrency(bill.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">{formattedDate}</p>
                </div>
              </div>
            );
          })}

          {bills.length === 0 && !isLoading && (
            <div className="py-4 text-center text-neutral-500">
              No upcoming bills
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
