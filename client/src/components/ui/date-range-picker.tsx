import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Interface compatível com react-day-picker
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
  label?: string;
}

export interface DateRangePreset {
  label: string;
  dateRange: DateRange;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
  disabled?: boolean;
  presets?: DateRangePreset[];
}

export function DateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
  presets,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yyyy")} - {format(value.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(value.from, "dd/MM/yyyy")
              )
            ) : (
              <span>{t("dateRange.selectDates", "Selecionar datas")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {presets && presets.length > 0 && (
              <div className="border-r p-3 space-y-3">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onChange(preset.dateRange)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
            <div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={{
                  from: value?.from,
                  to: value?.to
                }}
                onSelect={(range) => {
                  if (range) {
                    // Garantir que o objeto DateRange tem o formato correto
                    const dateRange: DateRange = {
                      from: range.from,
                      to: range.to
                    };
                    onChange(dateRange);
                  }
                }}
                numberOfMonths={2}
                disabled={disabled}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}