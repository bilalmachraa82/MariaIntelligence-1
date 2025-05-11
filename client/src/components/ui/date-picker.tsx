import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string;
  selected?: Date;
  onSelect?: (date: Date) => void;
  fromDate?: Date;
  toDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  id,
  selected,
  onSelect,
  fromDate,
  toDate,
  disabled = false,
  placeholder = "Selecionar data",
  className,
}: DatePickerProps) {
  const handleSelect = (date: Date | undefined) => {
    if (date && onSelect) {
      onSelect(date);
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "PPP", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          fromDate={fromDate}
          toDate={toDate}
          disabled={disabled}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}