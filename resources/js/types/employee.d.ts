import type { ClothingAllowance } from './clothing-allowance';
import type { EmployeeDeduction } from './employeeDeduction';
import type { EmploymentStatus } from './employmentStatuses';
import type { HazardPay } from './hazard-pay';
import type { Office } from './office';
import type { Pera } from './pera';
import type { Rata } from './rata';
import type { Salary } from './salary';

export interface Employee {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    image_path?: string;
    photo?: File | null;
    position: string;
    is_rata_eligible: boolean;
    office_id: number;
    employment_status_id: number;
    employment_status: EmploymentStatus;
    office: Office;
    salaries?: Salary[];
    peras?: Pera[];
    ratas?: Rata[];
    hazard_pays?: HazardPay[];
    clothing_allowances?: ClothingAllowance[];
    deductions?: EmployeeDeduction[];
    latest_salary?: Salary;
    latest_pera?: Pera;
    latest_rata?: Rata;
    latest_hazard_pay?: HazardPay;
    latest_clothing_allowance?: ClothingAllowance;
    current_pera?: number | null;
    card_color?: string | null;
    earliest_salary?: Salary | null;
    created_at?: string | null;
}

export type EmployeeCreateRequest = {
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    position: string;
    is_rata_eligible: boolean;
    office_id: string | number;
    employment_status_id: string | number;
    photo: File | null;
    _method?: string;
    force_create?: boolean;
};
