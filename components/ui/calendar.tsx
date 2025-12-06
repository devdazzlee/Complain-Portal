'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      fromYear={1900}
      toYear={new Date().getFullYear()}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-2',
        caption: 'flex justify-center pt-1 relative items-center mb-2',
        caption_label: 'text-sm font-medium text-[#E6E6E6] hidden',
        caption_dropdowns: 'flex justify-center gap-2',
        dropdown: 'bg-[#1F2022] border border-[#E6E6E6] text-[#E6E6E6] rounded px-2 py-1 text-sm focus:border-[#2AB3EE] focus:outline-none',
        dropdown_month: 'bg-[#1F2022] border border-[#E6E6E6] text-[#E6E6E6] rounded px-2 py-1 text-sm focus:border-[#2AB3EE] focus:outline-none',
        dropdown_year: 'bg-[#1F2022] border border-[#E6E6E6] text-[#E6E6E6] rounded px-2 py-1 text-sm focus:border-[#2AB3EE] focus:outline-none',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-[#E6E6E6] hover:bg-[#2A2B30] rounded-lg'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-[#E6E6E6] rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-[#1F2022]/50 [&:has([aria-selected])]:bg-[#2AB3EE] [&:has([aria-selected])]:text-white first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg text-[#E6E6E6] hover:bg-[#2A2B30] hover:text-white'
        ),
        day_range_end: 'day-range-end',
        day_selected: 'bg-[#2AB3EE] text-white hover:bg-[#1F8FD0] hover:text-white focus:bg-[#2AB3EE] focus:text-white',
        day_today: 'bg-[#1F2022] text-[#E6E6E6] font-semibold',
        day_outside: 'day-outside text-[#E6E6E6]/50 opacity-50 aria-selected:bg-[#1F2022]/50 aria-selected:text-[#E6E6E6]/50 aria-selected:opacity-30',
        day_disabled: 'text-[#E6E6E6]/50 opacity-50',
        day_range_middle: 'aria-selected:bg-[#2AB3EE] aria-selected:text-white',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

