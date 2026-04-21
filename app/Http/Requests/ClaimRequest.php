<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClaimRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'claim_type_id' => 'required|exists:claim_types,id',
            'claim_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'purpose' => 'required|string',
            'remarks' => 'nullable|string',
        ];
    }
}
