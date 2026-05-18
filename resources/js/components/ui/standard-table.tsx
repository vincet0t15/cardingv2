"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Table as BaseTable,
  TableHeader as BaseTableHeader,
  TableBody as BaseTableBody,
  TableFooter as BaseTableFooter,
  TableHead as BaseTableHead,
  TableRow as BaseTableRow,
  TableCell as BaseTableCell,
  TableCaption as BaseTableCaption,
} from '@/components/ui/table'

// Standardized table components to enforce a uniform design across Manage pages.
// These wrap the base table primitives and apply consistent default classNames.

function StandardTable({ className, ...props }: React.ComponentProps<typeof BaseTable>) {
  return (
    <div className={cn('w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <BaseTable className={cn('w-full text-sm bg-transparent', className)} {...props} />
    </div>
  )
}

function StandardTableHeader({ className, ...props }: React.ComponentProps<typeof BaseTableHeader>) {
  return (
    <BaseTableHeader className={cn('[&_tr]:border-b bg-muted/50', className)} {...props} />
  )
}

function StandardTableBody({ className, ...props }: React.ComponentProps<typeof BaseTableBody>) {
  return (
    <BaseTableBody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}

function StandardTableFooter({ className, ...props }: React.ComponentProps<typeof BaseTableFooter>) {
  return <BaseTableFooter className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...props} />
}

function StandardTableRow({ className, ...props }: React.ComponentProps<typeof BaseTableRow>) {
  return (
    <BaseTableRow
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function StandardTableHead({ className, ...props }: React.ComponentProps<typeof BaseTableHead>) {
  return (
    <BaseTableHead className={cn('h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground', className)} {...props} />
  )
}

function StandardTableCell({ className, ...props }: React.ComponentProps<typeof BaseTableCell>) {
  return (
    <BaseTableCell className={cn('p-3 align-middle whitespace-nowrap', className)} {...props} />
  )
}

function StandardTableCaption({ className, ...props }: React.ComponentProps<typeof BaseTableCaption>) {
  return <BaseTableCaption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
}

export {
  StandardTable as Table,
  StandardTableHeader as TableHeader,
  StandardTableBody as TableBody,
  StandardTableFooter as TableFooter,
  StandardTableHead as TableHead,
  StandardTableRow as TableRow,
  StandardTableCell as TableCell,
  StandardTableCaption as TableCaption,
}
