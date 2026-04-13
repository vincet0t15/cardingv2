'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

interface DatePickerProps {
    value?: string; // ISO string "yyyy-MM-dd" or empty string
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className, id }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const parsedDate = React.useMemo(() => {
        if (!value) return undefined;
        const d = parse(value, 'yyyy-MM-dd', new Date());
        return isValid(d) ? d : undefined;
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
        if (date && onChange) {
            onChange(format(date, 'yyyy-MM-dd'));
        } else if (!date && onChange) {
            onChange('');
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !parsedDate && 'text-muted-foreground', className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {parsedDate ? format(parsedDate, 'MM/dd/yyyy') : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar mode="single" selected={parsedDate} defaultMonth={parsedDate} captionLayout="dropdown" onSelect={handleSelect} />
            </PopoverContent>
        </Popover>
    );
}
