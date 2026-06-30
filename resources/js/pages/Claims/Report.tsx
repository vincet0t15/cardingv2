import ClaimsReportTable from '@/components/ClaimsReportTable';
import { CustomComboBox } from '@/components/CustomComboBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { PaginatedDataResponse } from '@/types/pagination';
import { Head, router, useForm } from '@inertiajs/react';
import { Printer, Search } from 'lucide-react';
import { useEffect } from 'react';

const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface EmployeeClaims {
    id: number;
    name: string;
    office: string;
    total_amount: number;
    claim_count: number;
    claim_type_counts: Record<string, number>;
}

interface Summary {
    total_employees: number;
    total_claims: number;
    total_amount: number;
}

interface ReportProps {
    employees: PaginatedDataResponse<EmployeeClaims>;
    summary: Summary;
    offices: {
        id: number;
        name: string;
    }[];
    filters: {
        month: string | null;
        year: number | null;
        type: string | null;
        sort_by?: string | null;
        office: string | null;
        employee: string | null;
        claim_types: string | null;
        per_page: number | null;
    };
    availableClaimTypes: {
        id: number;
        code: string;
        name: string;
    }[];
    pagination: {
        current_page: number;
        total_pages: number;
        total_records: number;
        per_page: number;
    };
}

export default function ClaimsReport({ employees, summary, offices, filters, availableClaimTypes }: ReportProps) {
    const { data: searchData, setData } = useForm({
        search: filters.employee || '',
    });

    useEffect(() => {
        setData('search', filters.employee || '');
    }, [filters.employee]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Claims Report', href: '/claims-report' },
    ];

    const handleFilterChange = (key: string, value: string | null) => {
        router.get(
            route('claims.report'),
            {
                ...filters,
                [key]: value,
                page: 1,
            },
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    const handleSearch = () => {
        router.get(
            route('claims.report'),
            {
                ...filters,
                employee: searchData.search || null,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // Selected claim types from filters (only for type=travel mode)
    const selectedClaimTypes = filters.claim_types
        ? filters.claim_types.split(',')
        : filters.type === 'travel'
          ? ['TRAVEL', 'MEAL', 'CASH_ADVANCE_TRAVEL']
          : [];

    const handleClaimTypeToggle = (code: string) => {
        let newSelection: string[];
        if (selectedClaimTypes.includes(code)) {
            // Don't allow deselecting all - keep at least one
            if (selectedClaimTypes.length <= 1) return;
            newSelection = selectedClaimTypes.filter((c) => c !== code);
        } else {
            newSelection = [...selectedClaimTypes, code];
        }

        router.get(
            route('claims.report'),
            {
                ...filters,
                claim_types: newSelection.join(','),
                page: 1,
            },
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    // Dynamic year range: fixed start year (2020) to current year + 5
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map((year) => ({
        value: year.toString(),
        label: year.toString(),
    }));

    const officeItems = [{ value: '', label: 'All Offices' }, ...offices.map((office) => ({ value: office.id.toString(), label: office.name }))];

    const selectedType = filters.type || 'all';

    // Get label for selected claim types
    const getSelectedTypesLabel = () => {
        const names = selectedClaimTypes.map(code => {
            const ct = availableClaimTypes.find(t => t.code === code);
            return ct ? ct.name : code;
        });
        if (names.length <= 2) return names.join(' and ');
        return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
    };

    // Determine page title based on type and sort_by
    const getPageTitle = () => {
        if (selectedType === 'travel') {
            return filters.sort_by === 'count' ? 'Employees Ranked by Trip Count' : 'Top Travel Claims by Employee';
        }
        if (selectedType === 'overtime') {
            return filters.sort_by === 'count' ? 'Employees with Most Overtime' : 'Top Overtime Claims by Employee';
        }
        return 'Claims Report';
    };

    const getPageDescription = () => {
        const monthLabel = filters.month ? months.find((m) => m.value === filters.month)?.label : 'All Months';
        const yearLabel = filters.year || currentYear;
        const typesLabel = getSelectedTypesLabel();
        if (selectedType === 'travel') {
            return filters.sort_by === 'count'
                ? `Employees ranked by number of trips (${typesLabel}) for ${monthLabel} ${yearLabel}`
                : `Employees ranked by total claim amount (${typesLabel}) for ${monthLabel} ${yearLabel}`;
        }
        if (selectedType === 'overtime') {
            return `Employees ranked by overtime compensation for ${monthLabel} ${yearLabel}`;
        }
        return `Comprehensive view of all employee claims for ${monthLabel} ${yearLabel}`;
    };

    const handleEmployeeClick = (employeeId: number) => {
        const params = new URLSearchParams();
        if (filters.month) params.set('month', filters.month);
        if (filters.year) params.set('year', filters.year.toString());
        if (filters.type) params.set('type', filters.type);
        if (filters.office) params.set('office', filters.office);
        window.location.href = route('claims.employee.detail', employeeId) + (params.toString() ? `?${params.toString()}` : '');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={getPageTitle()} />
            <div className="p-6">
                {/* Header with Print */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
                        <p className="text-muted-foreground mt-1">{getPageDescription()}</p>
                    </div>
                    <Button
                        onClick={() => {
                            window.open(
                                route('claims.report.print', {
                                    ...filters,
                                    type: selectedType === 'all' ? null : selectedType,
                                }),
                                '_blank',
                            );
                        }}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Report
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid gap-4 md:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Search Employee</label>
                                <div className="relative">
                                    <Input
                                        id="search"
                                        placeholder="Search employee..."
                                        className="w-full pl-8"
                                        value={searchData.search}
                                        onChange={(e) => setData('search', e.target.value)}
                                        onKeyDown={handleSearchKeyDown}
                                    />
                                    <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Month</label>
                                <CustomComboBox
                                    items={months}
                                    placeholder="Select month"
                                    value={filters.month || null}
                                    onSelect={(value) => handleFilterChange('month', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Year</label>
                                <CustomComboBox
                                    items={years}
                                    placeholder="Select year"
                                    value={(filters.year || currentYear).toString()}
                                    onSelect={(value) => handleFilterChange('year', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Office</label>
                                <CustomComboBox
                                    items={officeItems}
                                    placeholder="Select office"
                                    value={filters.office || null}
                                    onSelect={(value) => handleFilterChange('office', value ?? '')}
                                    showClear={true}
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Show</label>
                                <CustomComboBox
                                    items={[
                                        { value: '25', label: '25 rows' },
                                        { value: '50', label: '50 rows' },
                                        { value: '100', label: '100 rows' },
                                        { value: 'all', label: 'All' },
                                    ]}
                                    placeholder="Select"
                                    value={filters.per_page ? filters.per_page.toString() : '25'}
                                    onSelect={(value) => handleFilterChange('per_page', value === 'all' ? 'all' : (value ?? '25'))}
                                    showClear={false}
                                />
                            </div>
                        </div>

                        {filters.type === 'travel' && (
                            /* Claim Type Filter */
                            <div className="mt-4 border-t pt-4">
                                <label className="mb-3 block text-sm font-medium">Claim Types</label>
                                <div className="flex flex-wrap gap-4">
                                    {availableClaimTypes.map((ct) => {
                                        const isSelected = selectedClaimTypes.includes(ct.code);
                                        return (
                                            <label
                                                key={ct.code}
                                                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={isSelected}
                                                    onChange={() => handleClaimTypeToggle(ct.code)}
                                                />
                                                {ct.name}
                                                <span className="text-muted-foreground text-xs">({ct.code})</span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    Select which claim types to include in the computation.
                                    {selectedClaimTypes.length}/{availableClaimTypes.length} selected
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Claims Report Table */}
                <ClaimsReportTable employees={employees} summary={summary} filters={filters} onEmployeeClick={handleEmployeeClick} />
            </div>
        </AppLayout>
    );
}
