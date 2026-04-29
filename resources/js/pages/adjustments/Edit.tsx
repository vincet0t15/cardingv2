// Re-export the Create component for edit functionality
import { Adjustment, AdjustmentType, ReferenceType } from '@/types';
import { Employee } from '@/types/employee';
import Create from './Create';

interface EditProps {
    adjustment: Adjustment;
    employees: Employee[];
    adjustmentTypes: AdjustmentType[];
    referenceTypes: ReferenceType[];
}

export default function Edit({ adjustment, employees, adjustmentTypes, referenceTypes }: EditProps) {
    // Reuse Create component for editing; explanatory text already included in Create.tsx
    return <Create adjustment={adjustment} employees={employees} adjustmentTypes={adjustmentTypes} referenceTypes={referenceTypes} />;
}
