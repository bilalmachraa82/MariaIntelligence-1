import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";

// Interface estendida do DateRange com uma propriedade label
export interface UIDateRange extends DateRange {
  label?: string;
}

export interface DateRangePreset {
  id: string;
  label: string;
  getRange: () => UIDateRange;
}

export interface DateRangePresetPickerProps {
  value: UIDateRange;
  onChange: (value: UIDateRange) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DateRangePresetPicker({
  value,
  onChange,
  className,
  align = "start"
}: DateRangePresetPickerProps) {
  const { t } = useTranslation();
  
  // Função para formatar data para string no formato ISO
  const formatISODate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const presets: DateRangePreset[] = [
    {
      id: "current-month",
      label: t("dateRanges.currentMonth", "Mês Atual"),
      getRange: () => {
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        return {
          from: currentMonthStart,
          to: currentMonthEnd,
          label: t("dateRanges.currentMonth", "Mês Atual")
        };
      }
    },
    {
      id: "last-month",
      label: t("dateRanges.lastMonth", "Mês Passado"),
      getRange: () => {
        const lastMonth = subMonths(new Date(), 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);
        return {
          from: lastMonthStart,
          to: lastMonthEnd,
          label: t("dateRanges.lastMonth", "Mês Passado")
        };
      }
    },
    {
      id: "current-quarter",
      label: t("dateRanges.currentQuarter", "Trimestre Atual"),
      getRange: () => {
        const quarterStart = startOfQuarter(new Date());
        const quarterEnd = endOfQuarter(new Date());
        return {
          from: quarterStart,
          to: quarterEnd,
          label: t("dateRanges.currentQuarter", "Trimestre Atual")
        };
      }
    },
    {
      id: "current-year",
      label: t("dateRanges.currentYear", "Ano Atual"),
      getRange: () => {
        const yearStart = startOfYear(new Date());
        const yearEnd = endOfYear(new Date());
        return {
          from: yearStart,
          to: yearEnd,
          label: t("dateRanges.currentYear", "Ano Atual")
        };
      }
    },
    {
      id: "last-30-days",
      label: t("dateRanges.last30Days", "Últimos 30 Dias"),
      getRange: () => {
        const thirtyDaysAgo = startOfDay(subMonths(new Date(), 1));
        const today = endOfDay(new Date());
        return {
          from: thirtyDaysAgo,
          to: today,
          label: t("dateRanges.last30Days", "Últimos 30 Dias")
        };
      }
    }
  ];

  const formatSelectedRange = () => {
    if (!value.from || !value.to) {
      return t("dateRanges.selectRange", "Selecionar período");
    }
    
    return `${format(value.from, "dd/MM/yyyy")} - ${format(value.to, "dd/MM/yyyy")}`;
  };

  const applyPreset = (preset: DateRangePreset) => {
    const range = preset.getRange();
    onChange(range);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{formatSelectedRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="space-y-2 p-3">
          <div className="grid gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                className="justify-start text-left"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <hr className="my-2" />
          <div className="rounded-md border">
            <DateRangePicker
              value={value}
              onChange={onChange}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}