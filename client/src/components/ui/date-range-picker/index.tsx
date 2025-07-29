import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: value.startDate ? new Date(value.startDate) : undefined,
    to: value.endDate ? new Date(value.endDate) : undefined,
  });

  // Predefined date ranges
  const predefinedRanges = [
    {
      label: t("dateRange.last7Days", "Últimos 7 dias"),
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          label: t("dateRange.last7Days", "Últimos 7 dias"),
        };
      },
    },
    {
      label: t("dateRange.last30Days", "Últimos 30 dias"),
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          label: t("dateRange.last30Days", "Últimos 30 dias"),
        };
      },
    },
    {
      label: t("dateRange.thisMonth", "Este mês"),
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
          label: t("dateRange.thisMonth", "Este mês"),
        };
      },
    },
    {
      label: t("dateRange.lastMonth", "Mês passado"),
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          label: t("dateRange.lastMonth", "Mês passado"),
        };
      },
    },
    {
      label: t("dateRange.thisYear", "Este ano"),
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd"),
          label: t("dateRange.thisYear", "Este ano"),
        };
      },
    },
  ];

  // Handle date selection
  function handleSelect(range: { from: Date; to?: Date }) {
    setTempRange(range);
    if (range.from && range.to) {
      const newRange = {
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
        label: t("dateRange.custom", "Personalizado"),
      };
      onChange(newRange);
      setIsOpen(false);
    }
  }

  // Handle predefined range selection
  function handlePredefinedRange(range: DateRange) {
    onChange(range);
    setTempRange({
      from: new Date(range.startDate),
      to: new Date(range.endDate),
    });
    setIsOpen(false);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.label !== t("dateRange.custom", "Personalizado")
              ? value.label
              : value.startDate &&
                value.endDate && (
                  <>
                    {format(new Date(value.startDate), "dd/MM/yyyy")} - {format(new Date(value.endDate), "dd/MM/yyyy")}
                  </>
                )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {t("dateRange.ranges", "Intervalos")}
              </h4>
              <div className="flex flex-col space-y-1">
                {predefinedRanges.map((range) => (
                  <Button
                    key={range.label}
                    variant={value.label === range.label ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => handlePredefinedRange(range.getValue())}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Calendar
                mode="range"
                defaultMonth={tempRange.from}
                selected={tempRange}
                onSelect={handleSelect}
                numberOfMonths={1}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}