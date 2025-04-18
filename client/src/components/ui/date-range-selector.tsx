import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DayPicker } from "react-day-picker";

interface DateRangeSelectorProps {
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle range selection
  const handleRangeSelect = (
    range: { from: Date | undefined; to: Date | undefined } | undefined
  ) => {
    if (range) {
      onDateRangeChange(range);
    }
  };

  // Quick select handlers
  const selectLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const from = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    onDateRangeChange({ from, to });
  };

  const selectLast3Months = () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const from = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
    const to = today;
    onDateRangeChange({ from, to });
  };

  const selectThisYear = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), 0, 1);
    const to = today;
    onDateRangeChange({ from, to });
  };

  // Format the date range for display
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM d, yyyy")} - ${format(
        dateRange.to,
        "MMM d, yyyy"
      )}`;
    }
    if (dateRange.from) {
      return `${format(dateRange.from, "MMM d, yyyy")} - Select end date`;
    }
    return "Select date range";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateRange.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col p-2 gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs" 
              onClick={selectLastMonth}
            >
              Last Month
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs" 
              onClick={selectLast3Months}
            >
              Last 3 Months
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs" 
              onClick={selectThisYear}
            >
              This Year
            </Button>
          </div>
          <DayPicker
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
            showOutsideDays
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
