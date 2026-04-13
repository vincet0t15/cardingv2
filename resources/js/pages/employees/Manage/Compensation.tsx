import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Employee } from '@/types/employee';
import CompensationPera from './compensation/pera';
import CompensationRata from './compensation/rata';
import { CompensationSalary } from './compensation/salary';

interface EmployeeCompensationProps {
    employee: Employee;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}

function EmployeeCompensation({ employee, sourceOfFundCodes }: EmployeeCompensationProps) {
    return (
        <div>
            <Tabs defaultValue="salary" orientation="vertical">
                <TabsList className="flex w-[150px] flex-col gap-3 bg-transparent">
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                    <TabsTrigger value="pera">PERA</TabsTrigger>
                    <TabsTrigger value="rata">RATA</TabsTrigger>
                </TabsList>

                <TabsContent value="salary">
                    <CompensationSalary employee={employee} sourceOfFundCodes={sourceOfFundCodes} />
                </TabsContent>

                <TabsContent value="pera">
                    <CompensationPera employee={employee} />
                </TabsContent>

                <TabsContent value="rata">
                    <CompensationRata employee={employee} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default EmployeeCompensation;
