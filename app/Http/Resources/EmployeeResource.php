<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'full_name' => trim("{$this->last_name}, {$this->first_name} {$this->middle_name}"),
            'position' => $this->position,
            'is_rata_eligible' => $this->is_rata_eligible,
            'image_path' => $this->image_path,
            'employment_status' => EmploymentStatusResource::make($this->whenLoaded('employmentStatus')),
            'office' => OfficeResource::make($this->whenLoaded('office')),
            'latest_salary' => SalaryResource::make($this->whenLoaded('latestSalary')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
