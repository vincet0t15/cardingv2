<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payroll Report - {{ date('F Y', mktime(0, 0, 0, $month, 1, $year)) }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .totals-row { font-weight: bold; background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 9px; }
    </style>
</head>
<body>
    <h1>Payroll Summary</h1>
    <p class="subtitle">Period: {{ date('F Y', mktime(0, 0, 0, $month, 1, $year)) }}<br>Generated: {{ now()->format('Y-m-d H:i:s') }}</p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Office</th>
                <th>Status</th>
                <th class="text-right">Salary</th>
                <th class="text-right">PERA</th>
                <th class="text-right">RATA</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Deductions</th>
                <th class="text-right">Net Pay</th>
            </tr>
        </thead>
        <tbody>
            @foreach($employees as $index => $emp)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $emp['name'] }}</td>
                <td>{{ $emp['position'] }}</td>
                <td>{{ $emp['office'] }}</td>
                <td>{{ $emp['employment_status'] }}</td>
                <td class="text-right">{{ number_format($emp['salary'], 2) }}</td>
                <td class="text-right">{{ number_format($emp['pera'], 2) }}</td>
                <td class="text-right">{{ number_format($emp['rata'], 2) }}</td>
                <td class="text-right">{{ number_format($emp['gross_pay'], 2) }}</td>
                <td class="text-right">{{ number_format($emp['total_deductions'], 2) }}</td>
                <td class="text-right">{{ number_format($emp['net_pay'], 2) }}</td>
            </tr>
            @endforeach
            <tr class="totals-row">
                <td colspan="5">TOTALS</td>
                <td class="text-right">{{ number_format($totals['salary'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['pera'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['rata'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['gross_pay'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['total_deductions'], 2) }}</td>
                <td class="text-right">{{ number_format($totals['net_pay'], 2) }}</td>
            </tr>
        </tbody>
    </table>

    <p class="footer">ECMS - Employee Compensation Management System</p>
</body>
</html>
