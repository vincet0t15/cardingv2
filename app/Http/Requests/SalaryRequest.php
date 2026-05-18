<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SalaryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'source_of_fund_code_id' => 'nullable|exists:source_of_fund_codes,id',
        ];
    }
}
