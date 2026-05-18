<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'amount' => (float) $this->amount,
            'effective_date' => $this->effective_date->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'source_of_fund_code' => SourceOfFundCodeResource::make($this->whenLoaded('sourceOfFundCode')),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
