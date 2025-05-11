import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { ptBR, Locale } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
  locale?: Locale;
  monthsShown?: number;
}

export function DatePicker({
  date,
  setDate,
  placeholder,
  className,
  disabled = false,
  fromDate,
  toDate,
  locale = ptBR,
  monthsShown = 1,
}: DatePickerProps) {
  const { t } = useTranslation();
  
  const defaultPlaceholder = t("Selecione uma data");
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale }) : placeholder || defaultPlaceholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={(date) => {
            let disabled = false;
            if (fromDate) {
              disabled = disabled || date < fromDate;
            }
            if (toDate) {
              disabled = disabled || date > toDate;
            }
            return disabled;
          }}
          numberOfMonths={monthsShown}
        />
      </PopoverContent>
    </Popover>
  );
}