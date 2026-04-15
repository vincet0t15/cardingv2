<?php

namespace App\Http\Requests;

use App\Models\Adjustment;
use Illuminate\Foundation\Http\FormRequest;

class AdjustmentUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('adjustment'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,id',
            'adjustment_type' => 'required|string|in:' . implode(',', Adjustment::getAdjustmentTypes()),
            'amount' => 'required|numeric|min:-999999999.99|max:999999999.99',
            'pay_period_month' => 'required|integer|min:1|max:12',
            'pay_period_year' => 'required|integer|min:2020|max:2035',
            'effectivity_date' => 'required|date',
            'reference_id' => 'nullable|string|max:255',
            'reference_type' => 'nullable|string|in:dtr,biometric,payroll,deduction',
            'reason' => 'required|string|max:1000',
            'remarks' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'employee_id.required' => 'Please select an employee.',
            'adjustment_type.required' => 'Please select an adjustment type.',
            'amount.required' => 'Please enter the adjustment amount.',
            'pay_period_month.required' => 'Please select the pay period month.',
            'pay_period_year.required' => 'Please select the pay period year.',
            'effectivity_date.required' => 'Please enter the effectivity date.',
            'reason.required' => 'Please provide a reason for this adjustment.',
        ];
    }
}
