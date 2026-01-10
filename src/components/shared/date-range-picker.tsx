"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onSelect: (from: Date | undefined, to: Date | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempFrom, setTempFrom] = React.useState<Date | undefined>(from);
  const [tempTo, setTempTo] = React.useState<Date | undefined>(to);

  const handleSelect = (date: Date | undefined) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(date);
      setTempTo(undefined);
    } else {
      if (date && date < tempFrom) {
        setTempTo(tempFrom);
        setTempFrom(date);
      } else {
        setTempTo(date);
      }
    }
  };

  const handleApply = () => {
    onSelect(tempFrom, tempTo);
    setOpen(false);
  };

  const handleClear = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    onSelect(undefined, undefined);
    setOpen(false);
  };

  const formatDateRange = () => {
    if (!from && !to) return "Select date range";
    if (from && !to) return format(from, "MMM dd, yyyy");
    if (from && to) {
      return `${format(from, "MMM dd")} - ${format(to, "MMM dd, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !from && !to && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
          {(from || to) && (
            <X
              className="ml-auto h-4 w-4 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2">
          <Calendar
            mode="single"
            selected={tempFrom}
            onSelect={handleSelect}
            initialFocus
          />
          <Calendar
            mode="single"
            selected={tempTo}
            onSelect={handleSelect}
            disabled={(date) => (tempFrom ? date < tempFrom : false)}
          />
        </div>
        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
