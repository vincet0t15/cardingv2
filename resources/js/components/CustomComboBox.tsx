'use client';

import {
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput as ComboboxInputComponent,
    ComboboxItem,
    ComboboxList,
    Combobox as ComboboxRoot,
} from '@/components/ui/combobox';
import { useEffect, useMemo, useRef } from 'react';

type CustomComboBoxItem = { value: string; label: string };

interface CustomComboBoxProps {
    items: CustomComboBoxItem[];
    placeholder: string;
    value?: string | null;
    defaultValue?: string | null;
    onSelect?: (value: string | null) => void;
    showClear?: boolean;
}

export function CustomComboBox({ items, placeholder, value, defaultValue, onSelect, showClear = false }: CustomComboBoxProps) {
    const comboboxRef = useRef<HTMLDivElement | null>(null);

    const selectedItem = useMemo(() => {
        if (value == null) return null;
        return items.find((item) => item.value === value) || null;
    }, [value, items]);

    const defaultSelectedItem = useMemo(() => {
        if (defaultValue == null) return null;
        return items.find((item) => item.value === defaultValue) || null;
    }, [defaultValue, items]);

    // Directly update the input element's value in the DOM when selectedItem changes
    useEffect(() => {
        if (comboboxRef.current) {
            const input = comboboxRef.current.querySelector('input[role="combobox"]') as HTMLInputElement;
            if (input) {
                // Always set the value, even if empty
                if (selectedItem) {
                    input.value = selectedItem.label;
                } else {
                    input.value = '';
                }
            }
        }
    }, [selectedItem?.value]);

    return (
        <div ref={comboboxRef}>
            <ComboboxRoot
                items={items}
                itemToStringValue={(item: CustomComboBoxItem) => item.label}
                value={selectedItem}
                defaultValue={defaultSelectedItem}
                onValueChange={(item: CustomComboBoxItem | null) => {
                    // Also update the input value immediately on selection
                    if (comboboxRef.current) {
                        const input = comboboxRef.current.querySelector('input[role="combobox"]') as HTMLInputElement;
                        if (input) {
                            input.value = item?.label || '';
                        }
                    }
                    onSelect?.(item?.value ?? null);
                }}
            >
                <ComboboxInputComponent placeholder={placeholder} showClear={showClear} />
                <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item) => (
                            <ComboboxItem key={item.value} value={item}>
                                {item.label}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </ComboboxRoot>
        </div>
    );
}
