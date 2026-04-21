<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeRequest extends FormRequest
{
    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id;

        $rules = [
            'first_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('employees', 'first_name')->where(function ($query) {
                    $query->where('last_name', $this->input('last_name'));
                    if ($this->input('middle_name')) {
                        $query->where('middle_name', $this->input('middle_name'));
                    }
                })->ignore($employeeId),
            ],
            'middle_name' => 'nullable|string|max:255',
            'last_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('employees', 'last_name')->where(function ($query) {
                    $query->where('first_name', $this->input('first_name'));
                    if ($this->input('middle_name')) {
                        $query->where('middle_name', $this->input('middle_name'));
                    }
                })->ignore($employeeId),
            ],
            'suffix' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'is_rata_eligible' => 'boolean',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'office_id' => 'required|exists:offices,id',
            'photo' => ['nullable', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ];

        return $rules;
    }

    public function messages(): array
    {
        return [
            'first_name.unique' => 'An employee with this full name already exists.',
            'last_name.unique' => 'An employee with this full name already exists.',
        ];
    }
}
