<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\GeneralFund;
use App\Models\Office;
use App\Models\SourceOfFundCode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeSourceOfFundController extends Controller
{
    /**
     * Display employees grouped by source of fund code
     */
    public function index(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $sourceOfFundCodeId = $request->input('source_of_fund_code_id');
        $search = $request->input('search');

        // Get all active source of fund codes with general fund
        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund:id,code,description,status')
            ->orderBy('code')
            ->get();

        // Build a lookup map for general funds
        $generalFundsLookup = GeneralFund::where('status', true)
            ->get()
            ->keyBy('id')
            ->map(fn ($gf) => [
                'name' => $gf->description, // Using description as the name
                'code' => $gf->code,
                'description' => $gf->description,
            ]);

        // Get offices for filter dropdown
        $offices = Office::orderBy('name')->get();

        // Get employees with their compensation and source of fund
        $employeesQuery = Employee::query()
            ->with([
                'employmentStatus',
                'office',
                'salaries.sourceOfFundCode.generalFund',
                'hazardPays.sourceOfFundCode.generalFund',
                'clothingAllowances.sourceOfFundCode.generalFund',
                'peras',
                'ratas',
            ])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($search, function ($query, $search) {
                $searchTerms = explode(' ', $search);
                $query->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        $term = trim($term);
                        if (strlen($term) >= 2) {
                            $q->where(function ($inner) use ($term) {
                                $inner->where('first_name', 'like', "%{$term}%")
                                    ->orWhere('middle_name', 'like', "%{$term}%")
                                    ->orWhere('last_name', 'like', "%{$term}%")
                                    ->orWhere('position', 'like', "%{$term}%");
                            });
                        }
                    }
                });
            })
            ->orderBy('last_name', 'asc');

        // If specific source of fund is selected, filter employees who have salary from that fund
        if ($sourceOfFundCodeId) {
            $employeeIds = Employee::query()
                ->join('salaries', 'employees.id', '=', 'salaries.employee_id')
                ->where('salaries.source_of_fund_code_id', $sourceOfFundCodeId)
                ->pluck('employees.id');

            $employeesQuery->whereIn('id', $employeeIds);
        }

        $employees = $employeesQuery->paginate(50)->withQueryString();

        $periodEnd = $month ? now()->setDate($year, (int) $month, 1)->endOfMonth() : now()->setDate($year, 12, 31);

        $employees->getCollection()->transform(function ($employee) use ($periodEnd, $generalFundsLookup) {
            $salary = $employee->salaries
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $hazardPay = $employee->hazardPays
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $clothingAllowance = $employee->clothingAllowances
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $pera = $employee->peras
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $rata = $employee->is_rata_eligible
                ? $employee->ratas
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first()
                : null;

            $fundingSources = [];
            $totalCompensation = 0;

            $processFund = function ($record, $type) use (&$fundingSources, &$totalCompensation, $generalFundsLookup) {
                if (!$record) return;

                $amount = (float) $record->amount;
                $totalCompensation += $amount;

                $fundCode = $record->sourceOfFundCode?->code;
                $generalFundId = $record->sourceOfFundCode?->general_fund_id;
                $generalFundData = $generalFundsLookup->get($generalFundId);
                $generalFundName = $generalFundData['name'] ?? null;

                if ($fundCode) {
                    $fundDisplayName = $generalFundName ? "{$generalFundName} - {$fundCode}" : $fundCode;
                } else {
                    $fundDisplayName = 'Unfunded';
                    $fundCode = 'Unfunded';
                    $generalFundName = null;
                }

                if (!isset($fundingSources[$fundDisplayName])) {
                    $fundingSources[$fundDisplayName] = [
                        'salary' => 0,
                        'hazard_pay' => 0,
                        'clothing_allowance' => 0,
                        'pera' => 0,
                        'rata' => 0,
                        'total' => 0,
                        'code' => $fundCode,
                        'general_fund_name' => $generalFundName,
                        'description' => $record->sourceOfFundCode?->description,
                    ];
                }

                $fundingSources[$fundDisplayName][$type] += $amount;
                $fundingSources[$fundDisplayName]['total'] += $amount;
            };

            $processFund($salary, 'salary');
            $processFund($hazardPay, 'hazard_pay');
            $processFund($clothingAllowance, 'clothing_allowance');

            if ($pera) {
                $peraAmount = (float) $pera->amount;
                $totalCompensation += $peraAmount;
            }

            if ($rata) {
                $rataAmount = (float) $rata->amount;
                $totalCompensation += $rataAmount;
            }

            $employee->funding_sources = $fundingSources;
            $employee->total_compensation = $totalCompensation;

            return $employee;
        });

        // Calculate summary statistics
        $employeesByFund = [];
        foreach ($employees as $employee) {
            foreach ($employee->funding_sources as $fundDisplayName => $amounts) {
                if (!isset($summary['by_fund'][$fundDisplayName])) {
                    $summary['by_fund'][$fundDisplayName] = [
                        'count' => 0,
                        'total' => 0,
                        'code' => $amounts['code'],
                        'general_fund_name' => $amounts['general_fund_name'],
                        'description' => $amounts['description'],
                    ];
                }
                $summary['by_fund'][$fundDisplayName]['count']++;
                $summary['by_fund'][$fundDisplayName]['total'] += $amounts['total'];

                if (!isset($employeesByFund[$fundDisplayName])) {
                    $employeesByFund[$fundDisplayName] = [];
                }
                $employeesByFund[$fundDisplayName][] = [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'suffix' => $employee->suffix,
                    'position' => $employee->position,
                    'office' => $employee->office ? ['name' => $employee->office->name] : null,
                    'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                    'total_compensation' => $employee->total_compensation,
                ];
            }
        }

        return Inertia::render('employees/SourceOfFund/Index', [
            'employees' => $employees,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'offices' => $offices,
            'filters' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'office_id' => $officeId,
                'source_of_fund_code_id' => $sourceOfFundCodeId,
                'search' => $search,
            ],
            'summary' => $summary,
            'employeesByFund' => $employeesByFund,
        ]);
    }

    public function print(Request $request)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $sourceOfFundCodeId = $request->input('source_of_fund_code_id');
        $search = $request->input('search');

        $sourceOfFundCodes = SourceOfFundCode::where('status', true)
            ->with('generalFund:id,code,description,status')
            ->orderBy('code')
            ->get();

        $generalFundsLookup = GeneralFund::where('status', true)
            ->get()
            ->keyBy('id')
            ->map(fn ($gf) => [
                'name' => $gf->description,
                'code' => $gf->code,
                'description' => $gf->description,
            ]);

        $employeesQuery = Employee::query()
            ->with([
                'employmentStatus',
                'office',
                'salaries.sourceOfFundCode.generalFund',
                'hazardPays.sourceOfFundCode.generalFund',
                'clothingAllowances.sourceOfFundCode.generalFund',
                'peras',
                'ratas',
            ])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($sourceOfFundCodeId, function ($query) use ($sourceOfFundCodeId) {
                $employeeIds = Employee::query()
                    ->join('salaries', 'employees.id', '=', 'salaries.employee_id')
                    ->where('salaries.source_of_fund_code_id', $sourceOfFundCodeId)
                    ->pluck('employees.id');
                $query->whereIn('id', $employeeIds);
            })
            ->when($search, function ($query, $search) {
                $searchTerms = explode(' ', $search);
                $query->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        $term = trim($term);
                        if (strlen($term) >= 2) {
                            $q->where(function ($inner) use ($term) {
                                $inner->where('first_name', 'like', "%{$term}%")
                                    ->orWhere('middle_name', 'like', "%{$term}%")
                                    ->orWhere('last_name', 'like', "%{$term}%")
                                    ->orWhere('position', 'like', "%{$term}%");
                            });
                        }
                    }
                });
            })
            ->orderBy('last_name', 'asc');

        $employees = $employeesQuery->get();

        $periodEnd = $month ? now()->setDate($year, (int) $month, 1)->endOfMonth() : now()->setDate($year, 12, 31);

        $employees->transform(function ($employee) use ($periodEnd, $generalFundsLookup) {
            $salary = $employee->salaries
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $hazardPay = $employee->hazardPays
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $clothingAllowance = $employee->clothingAllowances
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $pera = $employee->peras
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $rata = $employee->is_rata_eligible
                ? $employee->ratas
                    ->where('effective_date', '<=', $periodEnd)
                    ->sortByDesc('effective_date')
                    ->first()
                : null;

            $fundingSources = [];
            $totalCompensation = 0;

            $processFund = function ($record, $type) use (&$fundingSources, &$totalCompensation, $generalFundsLookup) {
                if (!$record) return;

                $amount = (float) $record->amount;
                $totalCompensation += $amount;

                $fundCode = $record->sourceOfFundCode?->code;
                $generalFundId = $record->sourceOfFundCode?->general_fund_id;
                $generalFundData = $generalFundsLookup->get($generalFundId);
                $generalFundName = $generalFundData['name'] ?? null;

                if ($fundCode) {
                    $fundDisplayName = $generalFundName ? "{$generalFundName} - {$fundCode}" : $fundCode;
                } else {
                    $fundDisplayName = 'Unfunded';
                    $fundCode = 'Unfunded';
                    $generalFundName = null;
                }

                if (!isset($fundingSources[$fundDisplayName])) {
                    $fundingSources[$fundDisplayName] = [
                        'salary' => 0,
                        'hazard_pay' => 0,
                        'clothing_allowance' => 0,
                        'pera' => 0,
                        'rata' => 0,
                        'total' => 0,
                        'code' => $fundCode,
                        'general_fund_name' => $generalFundName,
                        'description' => $record->sourceOfFundCode?->description,
                    ];
                }

                $fundingSources[$fundDisplayName][$type] += $amount;
                $fundingSources[$fundDisplayName]['total'] += $amount;
            };

            $processFund($salary, 'salary');
            $processFund($hazardPay, 'hazard_pay');
            $processFund($clothingAllowance, 'clothing_allowance');

            if ($pera) {
                $peraAmount = (float) $pera->amount;
                $totalCompensation += $peraAmount;
            }

            if ($rata) {
                $rataAmount = (float) $rata->amount;
                $totalCompensation += $rataAmount;
            }

            $employee->funding_sources = $fundingSources;
            $employee->total_compensation = $totalCompensation;

            return $employee;
        });

        $employeesByFund = [];
        $summary = ['by_fund' => []];
        foreach ($employees as $employee) {
            foreach ($employee->funding_sources as $fundDisplayName => $amounts) {
                if (!isset($summary['by_fund'][$fundDisplayName])) {
                    $summary['by_fund'][$fundDisplayName] = [
                        'count' => 0,
                        'total' => 0,
                        'code' => $amounts['code'],
                        'general_fund_name' => $amounts['general_fund_name'],
                        'description' => $amounts['description'],
                    ];
                }
                $summary['by_fund'][$fundDisplayName]['count']++;
                $summary['by_fund'][$fundDisplayName]['total'] += $amounts['total'];

                if (!isset($employeesByFund[$fundDisplayName])) {
                    $employeesByFund[$fundDisplayName] = [];
                }
                $employeesByFund[$fundDisplayName][] = [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'suffix' => $employee->suffix,
                    'position' => $employee->position,
                    'office' => $employee->office ? ['name' => $employee->office->name] : null,
                    'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                    'total_compensation' => $employee->total_compensation,
                ];
            }
        }

        return Inertia::render('employees/SourceOfFund/IndexPrint', [
            'employees' => $employees,
            'employeesByFund' => $employeesByFund,
            'sourceOfFundCodes' => $sourceOfFundCodes,
            'filters' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'office_id' => $officeId,
                'source_of_fund_code_id' => $sourceOfFundCodeId,
                'search' => $search,
            ],
            'summary' => $summary,
        ]);
    }

    public function fundEmployees(Request $request, string $fundCode)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $search = $request->input('search');

        $offices = Office::orderBy('name')->get();

        $employeesQuery = Employee::query()
            ->with([
                'employmentStatus',
                'office',
                'salaries.sourceOfFundCode.generalFund',
                'hazardPays.sourceOfFundCode.generalFund',
                'clothingAllowances.sourceOfFundCode.generalFund',
                'peras',
                'ratas',
            ])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($search, function ($query, $search) {
                $searchTerms = explode(' ', $search);
                $query->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        $term = trim($term);
                        if (strlen($term) >= 2) {
                            $q->where(function ($inner) use ($term) {
                                $inner->where('first_name', 'like', "%{$term}%")
                                    ->orWhere('middle_name', 'like', "%{$term}%")
                                    ->orWhere('last_name', 'like', "%{$term}%")
                                    ->orWhere('position', 'like', "%{$term}%");
                            });
                        }
                    }
                });
            })
            ->orderBy('last_name', 'asc');

        $employees = $employeesQuery->paginate(50)->withQueryString();

        $periodEnd = $month ? now()->setDate($year, (int) $month, 1)->endOfMonth() : now()->setDate($year, 12, 31);

        $fundEmployees = [];
        $fundTotal = 0;
        $fundInfo = null;

        foreach ($employees as $employee) {
            $salary = $employee->salaries
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $hazardPay = $employee->hazardPays
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $clothingAllowance = $employee->clothingAllowances
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $pera = $employee->peras
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $rata = $employee->is_rata_eligible
                ? $employee->ratas
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first()
                : null;

            $totalCompensation = 0;
            $hasFund = false;

            if ($salary) {
                $sfc = $salary->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $totalCompensation += (float) $salary->amount;
                    }
                }
            }

            if ($hazardPay) {
                $sfc = $hazardPay->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $totalCompensation += (float) $hazardPay->amount;
                    }
                }
            }

            if ($clothingAllowance) {
                $sfc = $clothingAllowance->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $totalCompensation += (float) $clothingAllowance->amount;
                    }
                }
            }

            if ($pera) {
                $totalCompensation += (float) $pera->amount;
            }

            if ($rata) {
                $totalCompensation += (float) $rata->amount;
            }

            if ($hasFund && $totalCompensation > 0) {
                $fundEmployees[] = [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'suffix' => $employee->suffix,
                    'position' => $employee->position,
                    'office' => $employee->office ? ['name' => $employee->office->name] : null,
                    'employment_status' => $employee->employmentStatus ? ['name' => $employee->employmentStatus->name] : null,
                    'total_compensation' => $totalCompensation,
                ];
                $fundTotal += $totalCompensation;
            }
        }

        $fundInfo = [
            'code' => $fundCode,
            'general_fund_name' => null,
            'description' => null,
            'count' => count($fundEmployees),
            'total' => $fundTotal,
        ];

        if ($fundCode !== 'Unfunded') {
            $parts = explode(' - ', $fundCode);
            if (count($parts) === 2) {
                $fundInfo['general_fund_name'] = $parts[0];
                $fundInfo['code'] = $parts[1];

                $sourceCode = SourceOfFundCode::where('code', $parts[1])->first();
                if ($sourceCode) {
                    $fundInfo['description'] = $sourceCode->description;
                }
            }
        }

        $employeesCollection = collect($fundEmployees);
        $perPage = 50;
        $currentPage = $employees->currentPage();
        $total = count($fundEmployees);
        $items = $employeesCollection
            ->slice(($currentPage - 1) * $perPage, $perPage)
            ->values()
            ->all();

        $lastPage = (int) ceil($total / $perPage);
        $from = $total > 0 ? (($currentPage - 1) * $perPage) + 1 : null;
        $to = $currentPage < $lastPage ? $from + $perPage - 1 : $total;

        $links = [];
        $baseUrl = url()->current() . '?' . http_build_query(array_filter([
            'year' => $year,
            'month' => $month,
            'office_id' => $officeId,
            'search' => $search,
        ]));

        if ($lastPage > 1) {
            $links[] = [
                'url' => $currentPage > 1 ? $baseUrl . '&page=' . ($currentPage - 1) : null,
                'label' => '&laquo; Previous',
                'active' => false,
            ];

            for ($i = 1; $i <= $lastPage; $i++) {
                $links[] = [
                    'url' => $baseUrl . '&page=' . $i,
                    'label' => (string) $i,
                    'active' => $i === $currentPage,
                ];
            }

            $links[] = [
                'url' => $currentPage < $lastPage ? $baseUrl . '&page=' . ($currentPage + 1) : null,
                'label' => 'Next &raquo;',
                'active' => false,
            ];
        }

        return Inertia::render('employees/SourceOfFund/FundEmployees', [
            'fundCode' => $fundCode,
            'fundInfo' => $fundInfo,
            'employees' => [
                'data' => $items,
                'current_page' => $currentPage,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
                'from' => $from,
                'to' => $to,
                'path' => url()->current(),
                'links' => $links,
            ],
            'offices' => $offices,
            'filters' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'office_id' => $officeId,
                'search' => $search,
            ],
        ]);
    }

    public function fundEmployeesPrint(Request $request, string $fundCode)
    {
        $year = $request->input('year', now()->year);
        $month = $request->input('month');
        $officeId = $request->input('office_id');
        $search = $request->input('search');

        $employeesQuery = Employee::query()
            ->with([
                'employmentStatus',
                'office',
                'salaries.sourceOfFundCode.generalFund',
                'hazardPays.sourceOfFundCode.generalFund',
                'clothingAllowances.sourceOfFundCode.generalFund',
                'peras',
                'ratas',
            ])
            ->when($officeId, function ($query, $officeId) {
                $query->where('office_id', $officeId);
            })
            ->when($search, function ($query, $search) {
                $searchTerms = explode(' ', $search);
                $query->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        $term = trim($term);
                        if (strlen($term) >= 2) {
                            $q->where(function ($inner) use ($term) {
                                $inner->where('first_name', 'like', "%{$term}%")
                                    ->orWhere('middle_name', 'like', "%{$term}%")
                                    ->orWhere('last_name', 'like', "%{$term}%")
                                    ->orWhere('position', 'like', "%{$term}%");
                            });
                        }
                    }
                });
            })
            ->orderBy('last_name', 'asc');

        $employees = $employeesQuery->get();

        $periodEnd = $month ? now()->setDate($year, (int) $month, 1)->endOfMonth() : now()->setDate($year, 12, 31);

        $fundEmployees = [];
        $fundTotal = 0;

        foreach ($employees as $employee) {
            $salary = $employee->salaries
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $hazardPay = $employee->hazardPays
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $clothingAllowance = $employee->clothingAllowances
                ->where('start_date', '<=', $periodEnd)
                ->where(function ($query) use ($periodEnd) {
                    $query->whereNull('end_date')->orWhere('end_date', '>=', $periodEnd);
                })
                ->sortByDesc('start_date')
                ->first();

            $pera = $employee->peras
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first();

            $rata = $employee->is_rata_eligible
                ? $employee->ratas
                ->where('effective_date', '<=', $periodEnd)
                ->sortByDesc('effective_date')
                ->first()
                : null;

            $totalCompensation = 0;
            $hasFund = false;
            $salaryAmount = 0;
            $hazardPayAmount = 0;
            $clothingAmount = 0;

            if ($salary) {
                $sfc = $salary->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $salaryAmount = (float) $salary->amount;
                        $totalCompensation += $salaryAmount;
                    }
                }
            }

            if ($hazardPay) {
                $sfc = $hazardPay->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $hazardPayAmount = (float) $hazardPay->amount;
                        $totalCompensation += $hazardPayAmount;
                    }
                }
            }

            if ($clothingAllowance) {
                $sfc = $clothingAllowance->sourceOfFundCode;
                if ($sfc) {
                    $displayName = $sfc->generalFund?->description
                        ? "{$sfc->generalFund->description} - {$sfc->code}"
                        : $sfc->code;

                    if ($displayName === $fundCode || ($fundCode === 'Unfunded' && !$sfc->generalFund)) {
                        $hasFund = true;
                        $clothingAmount = (float) $clothingAllowance->amount;
                        $totalCompensation += $clothingAmount;
                    }
                }
            }

            if ($pera) {
                $totalCompensation += (float) $pera->amount;
            }

            if ($rata) {
                $totalCompensation += (float) $rata->amount;
            }

            if ($hasFund && $totalCompensation > 0) {
                $fundEmployees[] = [
                    'id' => $employee->id,
                    'first_name' => $employee->first_name,
                    'middle_name' => $employee->middle_name,
                    'last_name' => $employee->last_name,
                    'suffix' => $employee->suffix,
                    'position' => $employee->position,
                    'office' => $employee->office ? ['name' => $employee->office->name] : null,
                    'salary' => $salaryAmount,
                    'hazard_pay' => $hazardPayAmount,
                    'clothing_allowance' => $clothingAmount,
                    'pera' => $pera ? (float) $pera->amount : 0,
                    'rata' => $rata ? (float) $rata->amount : 0,
                    'total_compensation' => $totalCompensation,
                ];
                $fundTotal += $totalCompensation;
            }
        }

        $fundInfo = [
            'code' => $fundCode,
            'general_fund_name' => null,
            'description' => null,
            'count' => count($fundEmployees),
            'total' => $fundTotal,
        ];

        if ($fundCode !== 'Unfunded') {
            $parts = explode(' - ', $fundCode);
            if (count($parts) === 2) {
                $fundInfo['general_fund_name'] = $parts[0];
                $fundInfo['code'] = $parts[1];

                $sourceCode = SourceOfFundCode::where('code', $parts[1])->first();
                if ($sourceCode) {
                    $fundInfo['description'] = $sourceCode->description;
                }
            }
        }

        return Inertia::render('employees/SourceOfFund/FundEmployeesPrint', [
            'fundInfo' => $fundInfo,
            'employees' => $fundEmployees,
            'filters' => [
                'year' => (int) $year,
                'month' => $month ? (int) $month : null,
                'office_id' => $officeId,
                'search' => $search,
            ],
        ]);
    }
}
