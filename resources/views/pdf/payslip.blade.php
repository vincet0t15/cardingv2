<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payslip - {{ $employee->last_name }}, {{ $monthName }}</title>
    <style>
        @page {
            margin: 20px 30px;
            size: letter portrait;
        }
        body {
            font-family: 'DejaVu Sans', 'Segoe UI', sans-serif;
            font-size: 10pt;
            color: #1e293b;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 18pt;
            margin: 0;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header .sub {
            font-size: 9pt;
            color: #64748b;
            margin-top: 4px;
        }
        .header .period {
            font-size: 11pt;
            font-weight: bold;
            color: #2563eb;
            margin-top: 6px;
        }
        .grid-2 {
            display: table;
            width: 100%;
            margin-bottom: 16px;
        }
        .grid-2 .col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .info-box {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 14px;
        }
        .info-box h3 {
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin: 0 0 8px 0;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 4px;
        }
        .info-row {
            display: table;
            width: 100%;
            margin: 2px 0;
        }
        .info-row .label {
            display: table-cell;
            width: 45%;
            color: #64748b;
            font-size: 9pt;
        }
        .info-row .value {
            display: table-cell;
            width: 55%;
            font-weight: 600;
            text-align: right;
        }
        table.payroll {
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
        }
        table.payroll th {
            background: #1e293b;
            color: #fff;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            text-align: left;
        }
        table.payroll td {
            padding: 6px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9pt;
        }
        table.payroll .amount {
            text-align: right;
            font-weight: 600;
            width: 120px;
        }
        table.payroll .total-row td {
            border-top: 2px solid #1e293b;
            font-weight: bold;
            font-size: 10pt;
            padding-top: 8px;
        }
        table.payroll .total-row .amount {
            font-size: 11pt;
            color: #2563eb;
        }
        table.payroll .negative {
            color: #dc2626;
        }
        table.payroll .positive {
            color: #16a34a;
        }
        .net-pay-box {
            margin-top: 20px;
            padding: 16px;
            background: #f0fdf4;
            border: 2px solid #16a34a;
            border-radius: 8px;
            text-align: center;
        }
        .net-pay-box .label {
            font-size: 10pt;
            text-transform: uppercase;
            color: #166534;
            letter-spacing: 1px;
        }
        .net-pay-box .amount {
            font-size: 20pt;
            font-weight: bold;
            color: #166534;
        }
        .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 7.5pt;
            color: #94a3b8;
            text-align: center;
        }
        .remarks {
            margin-top: 10px;
            padding: 8px 12px;
            background: #f8fafc;
            border-left: 3px solid #3b82f6;
            font-size: 8pt;
            color: #475569;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 7pt;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-blue {
            background: #dbeafe;
            color: #1d4ed8;
        }
        .badge-green {
            background: #dcfce7;
            color: #15803d;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">
        <h1>Republic of the Philippines</h1>
        <div class="sub">PAYSLIP &mdash; {{ $monthName }}</div>
        <div class="period">
            Period: {{ $monthName }}
        </div>
    </div>

    <!-- EMPLOYEE INFO -->
    <div class="grid-2">
        <div class="col" style="padding-right: 8px;">
            <div class="info-box">
                <h3>Employee Details</h3>
                <div class="info-row">
                    <span class="label">Name</span>
                    <span class="value">{{ $employee->last_name }}, {{ $employee->first_name }} {{ $employee->middle_name ? $employee->middle_name.' ' : '' }}{{ $employee->suffix }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Position</span>
                    <span class="value">{{ $employee->position }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Office</span>
                    <span class="value">{{ $employee->office->name ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Status</span>
                    <span class="value">{{ $employee->employment_status->name ?? 'N/A' }}</span>
                </div>
            </div>
        </div>
        <div class="col" style="padding-left: 8px;">
            <div class="info-box">
                <h3>Period Summary</h3>
                <div class="info-row">
                    <span class="label">Month</span>
                    <span class="value">{{ $monthName }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Working Days</span>
                    <span class="value">{{ $payroll['summary']['working_days'] ?? '-' }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Total Deductions</span>
                    <span class="value">{{ number_format($payroll['summary']['total_deductions'] ?? 0, 2) }}</span>
                </div>
                <div class="info-row">
                    <span class="label">Net Pay</span>
                    <span class="value" style="color: #16a34a; font-size: 11pt;">{{ number_format($payroll['summary']['net_pay'] ?? 0, 2) }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- EARNINGS -->
    <table class="payroll">
        <thead>
            <tr>
                <th>Earnings</th>
                <th class="amount">Amount (₱)</th>
            </tr>
        </thead>
        <tbody>
            @php $earnings = $payroll['earnings'] ?? []; @endphp
            <tr>
                <td>Basic Salary</td>
                <td class="amount">{{ number_format($earnings['basic_salary'] ?? 0, 2) }}</td>
            </tr>
            @if(($earnings['pera'] ?? 0) > 0)
            <tr>
                <td>PERA (Personal Economic Relief Allowance)</td>
                <td class="amount">{{ number_format($earnings['pera'], 2) }}</td>
            </tr>
            @endif
            @if(($earnings['rata'] ?? 0) > 0)
            <tr>
                <td>RATA (Representation & Transportation Allowance)</td>
                <td class="amount">{{ number_format($earnings['rata'], 2) }}</td>
            </tr>
            @endif
            @if(($earnings['hazard_pay'] ?? 0) > 0)
            <tr>
                <td>Hazard Pay</td>
                <td class="amount">{{ number_format($earnings['hazard_pay'], 2) }}</td>
            </tr>
            @endif
            @if(($earnings['clothing_allowance'] ?? 0) > 0)
            <tr>
                <td>Clothing Allowance</td>
                <td class="amount">{{ number_format($earnings['clothing_allowance'], 2) }}</td>
            </tr>
            @endif
            @if(($earnings['total_claims'] ?? 0) > 0)
            <tr>
                <td>Claims</td>
                <td class="amount positive">{{ number_format($earnings['total_claims'], 2) }}</td>
            </tr>
            @endif
            @if(($earnings['adjustments'] ?? 0) != 0)
            <tr>
                <td>Adjustments</td>
                <td class="amount {{ ($earnings['adjustments'] ?? 0) >= 0 ? 'positive' : 'negative' }}">
                    {{ number_format($earnings['adjustments'], 2) }}
                </td>
            </tr>
            @endif
            <tr class="total-row">
                <td>Gross Pay</td>
                <td class="amount">{{ number_format($payroll['summary']['gross_pay'] ?? 0, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- DEDUCTIONS -->
    <table class="payroll">
        <thead>
            <tr>
                <th>Deductions</th>
                <th class="amount">Amount (₱)</th>
            </tr>
        </thead>
        <tbody>
            @php $deductions = $payroll['deductions'] ?? []; @endphp
            @if(count($deductions['items'] ?? []) > 0)
                @foreach($deductions['items'] as $item)
                <tr>
                    <td>{{ $item['name'] }}</td>
                    <td class="amount negative">{{ number_format($item['amount'], 2) }}</td>
                </tr>
                @endforeach
            @endif
            <tr>
                <td>SSS Contribution</td>
                <td class="amount negative">{{ number_format($deductions['sss'] ?? 0, 2) }}</td>
            </tr>
            <tr>
                <td>PhilHealth Contribution</td>
                <td class="amount negative">{{ number_format($deductions['philhealth'] ?? 0, 2) }}</td>
            </tr>
            <tr>
                <td>Pag-IBIG Contribution</td>
                <td class="amount negative">{{ number_format($deductions['pagibig'] ?? 0, 2) }}</td>
            </tr>
            <tr>
                <td>Withholding Tax</td>
                <td class="amount negative">{{ number_format($deductions['withholding_tax'] ?? 0, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Total Deductions</td>
                <td class="amount negative">{{ number_format($payroll['summary']['total_deductions'] ?? 0, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- NET PAY -->
    <div class="net-pay-box">
        <div class="label">Net Pay for {{ $monthName }}</div>
        <div class="amount">₱ {{ number_format($payroll['summary']['net_pay'] ?? 0, 2) }}</div>
    </div>

    @if(($payroll['summary']['remarks'] ?? '') !== '')
    <div class="remarks">
        <strong>Remarks:</strong> {{ $payroll['summary']['remarks'] }}
    </div>
    @endif

    <div class="footer">
        This payslip is system-generated from the Carding Payroll System. For inquiries, please contact HR.<br>
        Generated on: {{ now()->format('F d, Y h:i A') }}
    </div>

</body>
</html>
