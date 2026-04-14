import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Employee } from '@/types/employee';
import { useState } from 'react';
import { CompensationClothingAllowance } from './compensation/clothing-allowance';
import { CompensationHazardPay } from './compensation/hazard-pay';
import CompensationPera from './compensation/pera';
import CompensationRata from './compensation/rata';
import { CompensationSalary } from './compensation/salary';

interface EmployeeCompensationProps {
    employee: Employee;
    sourceOfFundCodes?: { id: number; code: string; description: string | null; status: boolean }[];
}

function EmployeeCompensation({ employee, sourceOfFundCodes }: EmployeeCompensationProps) {
    // Get initial tab from URL or default to 'salary'
    const getInitialTab = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const compTab = urlParams.get('comp_tab');
        const validTabs = ['salary', 'pera', 'rata', 'hazard-pay', 'clothing-allowance'];
        return compTab && validTabs.includes(compTab) ? compTab : 'salary';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Update URL when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const url = new URL(window.location.href);
        url.searchParams.set('comp_tab', value);
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <div>
            <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical">
                <TabsList className="flex w-[180px] flex-col gap-3 bg-transparent">
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                    <TabsTrigger value="pera">PERA</TabsTrigger>
                    <TabsTrigger value="rata">RATA</TabsTrigger>
                    <TabsTrigger value="hazard-pay">Hazard Pay</TabsTrigger>
                    <TabsTrigger value="clothing-allowance">Clothing Allowance</TabsTrigger>
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

                <TabsContent value="hazard-pay">
                    <CompensationHazardPay employee={employee} sourceOfFundCodes={sourceOfFundCodes} />
                </TabsContent>

                <TabsContent value="clothing-allowance">
                    <CompensationClothingAllowance employee={employee} sourceOfFundCodes={sourceOfFundCodes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default EmployeeCompensation;
