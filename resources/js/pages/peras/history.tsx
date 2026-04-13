import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { Employee } from '@/types/employee';
import type { Pera } from '@/types/pera';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'PERA',
        href: '/peras',
    },
    {
        title: 'History',
        href: '#',
    },
];

interface PeraHistoryProps {
    employee: Employee;
    peras: Pera[];
}

export default function PeraHistory({ employee, peras }: PeraHistoryProps) {
    const handleDelete = (pera: Pera) => {
        if (confirm('Are you sure you want to delete this PERA record?')) {
            router.delete(route('peras.destroy', pera.id));
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
            <Head title={`PERA History - ${employee.last_name}, ${employee.first_name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.get(route('peras.index'))}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {employee.last_name}, {employee.first_name} {employee.middle_name}
                        </h1>
                        <p className="text-muted-foreground">{employee.position}</p>
                    </div>
                </div>

                <div className="w-full overflow-hidden rounded-sm border shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-primary font-bold">Amount</TableHead>
                                <TableHead className="text-primary font-bold">Effective Date</TableHead>
                                <TableHead className="text-primary font-bold">Created By</TableHead>
                                <TableHead className="text-primary font-bold">Created At</TableHead>
                                <TableHead className="text-primary w-[100px] text-center font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {peras.length > 0 ? (
                                peras.map((pera) => (
                                    <TableRow key={pera.id} className="hover:bg-muted/30">
                                        <TableCell className="text-lg font-bold">{formatCurrency(pera.amount)}</TableCell>
                                        <TableCell>{formatDate(pera.effective_date)}</TableCell>
                                        <TableCell>{pera.created_by_user?.name || '-'}</TableCell>
                                        <TableCell>{formatDate(pera.created_at)}</TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(pera)}>
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-3 text-center text-gray-500">
                                        No PERA records found.
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
