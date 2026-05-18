import { Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-3 font-medium">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shadow-md dark:bg-white">
                                <Building2 className="h-6 w-6 text-white dark:text-slate-900" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm leading-none font-bold text-slate-900 dark:text-white">ECMS</p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Employee Compensation Management System</p>
                            </div>
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
