import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle,
    ChevronRight,
    Clock,
    CoinsIcon,
    FileText,
    Receipt,
    Settings,
    Shield,
    Sparkles,
    TrendingDown,
    Users,
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Employee Compensation Management System" />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                {/* Nav */}
                <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img src="/LGU_logo.png" alt="LGU Logo" className="h-10 w-10 object-contain" />
                            <div>
                                <p className="text-sm leading-none font-bold text-slate-700 dark:text-slate-300">ECMS</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Employee Compensation Management</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg dark:from-orange-500 dark:to-orange-600"
                                >
                                    Go to Dashboard
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        Log in
                                    </Link>
                                    <Link href={route('login')}>
                                        <Button className="gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-5 hover:from-orange-500 hover:to-orange-600 dark:from-orange-500 dark:to-orange-600">
                                            Get Started
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-400/5 via-transparent to-transparent" />
                    <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
                        <div className="text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-orange-50/80 px-4 py-1.5 text-xs font-medium text-orange-600 shadow-sm dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300">
                                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                                Local Government Unit — Employee Compensation Management System
                            </div>
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 lg:text-7xl dark:text-white">
                                Streamline Your
                                <br />
                                <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                                    Payroll Operations
                                </span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                                A comprehensive platform for managing employee compensation, deductions, PERA, RATA, and claims — designed for LGU
                                payroll accuracy, transparency, and efficiency.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    href={auth.user ? route('dashboard') : route('login')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-400/20 transition-all hover:scale-105 hover:from-orange-500 hover:to-orange-600 hover:shadow-orange-500/30 dark:from-orange-500 dark:to-orange-600"
                                >
                                    {auth.user ? 'Go to Dashboard' : 'Sign In to Continue'}
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="mt-16 grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 sm:grid-cols-4 dark:border-slate-700">
                                {[
                                    { value: '100+', label: 'Employees Managed' },
                                    { value: '50+', label: 'Offices Supported' },
                                    { value: '99.9%', label: 'Accuracy Rate' },
                                    { value: '24/7', label: 'System Availability' },
                                ].map((stat) => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">{stat.value}</div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="mb-12 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-4 py-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            <Shield className="h-3.5 w-3.5" />
                            Comprehensive Features
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Everything You Need</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                            All modules integrated seamlessly for complete employee lifecycle and compensation management
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: <Users className="h-6 w-6" />,
                                title: 'Employee Directory',
                                desc: 'Comprehensive employee profiles with positions, offices, employment status, and compensation history.',
                                color: 'from-blue-500 to-blue-600',
                                bgColor: 'bg-blue-50 dark:bg-blue-950/50',
                            },
                            {
                                icon: <CoinsIcon className="h-6 w-6" />,
                                title: 'Compensation Management',
                                desc: 'Track salary grades, PERA allowances, and RATA benefits with automated calculations and audit trails.',
                                color: 'from-emerald-500 to-emerald-600',
                                bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
                            },
                            {
                                icon: <TrendingDown className="h-6 w-6" />,
                                title: 'Deductions Tracking',
                                desc: 'Record and manage monthly deductions by pay period with type classification and amount verification.',
                                color: 'from-red-500 to-red-600',
                                bgColor: 'bg-red-50 dark:bg-red-950/50',
                            },
                            {
                                icon: <Receipt className="h-6 w-6" />,
                                title: 'Claims & Reimbursements',
                                desc: 'Process employee claims with purpose documentation, date tracking, type categorization, and approval workflows.',
                                color: 'from-orange-400 to-orange-500',
                                bgColor: 'bg-orange-50 dark:bg-orange-950/50',
                            },
                            {
                                icon: <BarChart3 className="h-6 w-6" />,
                                title: 'Reports & Analytics',
                                desc: 'Generate detailed financial summaries, deduction reports, claims analysis, and payroll breakdowns by period.',
                                color: 'from-amber-500 to-amber-600',
                                bgColor: 'bg-amber-50 dark:bg-amber-950/50',
                            },
                            {
                                icon: <Settings className="h-6 w-6" />,
                                title: 'System Configuration',
                                desc: 'Configure offices, deduction types, claim categories, employment statuses, and user roles with permissions.',
                                color: 'from-slate-500 to-slate-600',
                                bgColor: 'bg-slate-100 dark:bg-slate-800/50',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="group relative overflow-hidden rounded-md border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-800/50"
                            >
                                <div
                                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}
                                >
                                    {feature.icon}
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.desc}</p>
                                <div
                                    className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-10 transition-opacity group-hover:opacity-20 ${feature.bgColor}`}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-4 py-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Why Choose ECMS
                            </div>
                            <h2 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Built for LGU Payroll Excellence</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        icon: <Clock className="h-5 w-5" />,
                                        title: 'Time-Saving Automation',
                                        desc: 'Automated calculations for PERA, RATA, and deductions reduce manual work and errors.',
                                    },
                                    {
                                        icon: <Shield className="h-5 w-5" />,
                                        title: 'Secure & Compliant',
                                        desc: 'Role-based access control ensures data security and compliance with government standards.',
                                    },
                                    {
                                        icon: <FileText className="h-5 w-5" />,
                                        title: 'Comprehensive Reporting',
                                        desc: 'Generate detailed payroll reports, employee summaries, and financial breakdowns instantly.',
                                    },
                                    {
                                        icon: <Users className="h-5 w-5" />,
                                        title: 'Multi-Office Support',
                                        desc: 'Manage employees across multiple departments and offices from a single platform.',
                                    },
                                ].map((benefit, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 dark:bg-orange-900/30">
                                            <div className="text-orange-600 dark:text-orange-400">{benefit.icon}</div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">{benefit.title}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-blue-500/20 blur-3xl" />
                            <div className="relative rounded-md border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400" />
                                        <div className="h-3 w-3 rounded-full bg-amber-400" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-400" />
                                    </div>
                                    <span className="text-xs text-slate-400">Dashboard Preview</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/30">
                                            <div className="mb-1 text-xs text-orange-500">Total Employees</div>
                                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">156</div>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                            <div className="mb-1 text-xs text-slate-400">Monthly Deductions</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">₱245K</div>
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">Top Deduction Types</span>
                                        </div>
                                        <div className="space-y-2">
                                            {['GSIS', 'Pag-IBIG', 'PhilHealth'].map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-300">{item}</span>
                                                    <span className="font-medium text-slate-900 dark:text-white">₱{(85 - i * 15).toFixed(0)}K</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="mx-auto max-w-7xl px-6 py-20">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 px-10 py-16 text-center shadow-lg shadow-orange-400/20">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
                        <div className="relative">
                            <h2 className="mb-4 text-3xl font-bold text-white">Ready to Transform Your Payroll?</h2>
                            <p className="mx-auto mb-8 max-w-lg text-orange-50">
                                Join hundreds of LGUs using ECMS to streamline their employee compensation management.
                            </p>
                            <Link
                                href={auth.user ? route('dashboard') : route('login')}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-orange-600 shadow-xl transition-all hover:scale-105 hover:bg-orange-50"
                            >
                                {auth.user ? 'Open Dashboard' : 'Get Started Today'}
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200/80 dark:border-slate-700/50">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <img src="/LGU_logo.png" alt="LGU Logo" className="h-8 w-8 object-contain" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">ECMS</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                © {new Date().getFullYear()} Employee Compensation Management System. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
