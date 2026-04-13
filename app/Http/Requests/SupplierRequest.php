<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'contact_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'remarks' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
