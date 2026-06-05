import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import type { HazardPay } from '@/types/hazard-pay';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Hazard Pay',
        href: '/hazard-pays',
    },
    {
        title: 'History',
        href: '#',
    },
];

interface HazardPayHistoryProps {
    employee: Employee;
    hazardPays: HazardPay[];
}

export default function HazardPayHistory({ employee, hazardPays }: HazardPayHistoryProps) {
    const handleDelete = (record: HazardPay) => {
        if (confirm('Are you sure you want to delete this hazard pay record?')) {
            router.delete(route('hazard-pays.destroy', record.id));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Hazard Pay History - ${employee.last_name}, ${employee.first_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.get(route('hazard-pays.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {employee.last_name}, {employee.first_name} {employee.middle_name}
                        </h1>
                        <p className="text-muted-foreground">{employee.position}</p>
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Amount</TableHead>
                                <TableHead className="text-primary font-bold">Coverage Period</TableHead>
                                <TableHead className="text-primary font-bold">Created By</TableHead>
                                <TableHead className="text-primary font-bold">Date Created</TableHead>
                                <TableHead className="text-primary w-[100px] text-center font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {hazardPays.length > 0 ? (
                                hazardPays.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-muted/30">
                                        <TableCell className="text-lg font-bold text-amber-700 dark:text-amber-400">
                                            {formatCurrency(Number(record.amount))}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(record.start_date)}
                                            {record.end_date ? ` — ${formatDate(record.end_date)}` : ' — Present'}
                                        </TableCell>
                                        <TableCell>{record.created_by_user?.name || '-'}</TableCell>
                                        <TableCell>{formatDate(record.created_at)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(record)}>
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-lg font-semibold">No hazard pay records found.</p>
                                            <p className="text-sm">This employee has no hazard pay history.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
