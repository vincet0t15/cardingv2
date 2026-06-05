import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Textarea } from '@/components/ui/textarea';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Camera, MapPin, Save, User, Calendar, Phone, Mail, Home } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface EmployeeProfile {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    position: string;
    image_path: string | null;
    is_rata_eligible: boolean;
    office: { id: number; name: string; code?: string };
    employment_status: { id: number; name: string };
    contact_number?: string;
    email?: string;
    address?: string;
    birthdate?: string;
    created_at?: string;
}

interface ProfilePageProps {
    employee: EmployeeProfile;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const getInitials = (emp: EmployeeProfile): string => {
    const f = (emp.first_name?.[0] || '').toUpperCase();
    const l = (emp.last_name?.[0] || '').toUpperCase();
    return f + l;
};

const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

// ─── Main Component ──────────────────────────────────────────────────

export default function EmployeeProfile({ employee }: ProfilePageProps) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: employee.first_name || '',
        middle_name: employee.middle_name || '',
        last_name: employee.last_name || '',
        suffix: employee.suffix || '',
        contact_number: (employee as any).contact_number || '',
        email: (employee as any).email || '',
        address: (employee as any).address || '',
        birthdate: (employee as any).birthdate || '',
        _method: 'PUT' as const,
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('photo', file as any);
            const reader = new FileReader();
            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employee.profile.update'), {
            preserveScroll: true,
            onSuccess: () => setPhotoPreview(null),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Head title="My Profile" />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Link href={route('employee.dashboard')} className="text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
                </div>

                {/* Profile Info Card */}
                <Card className="overflow-hidden border shadow-sm">
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-center">
                        <div className="relative mx-auto inline-block">
                            <Avatar className="h-28 w-28 border-4 border-white/30 shadow-xl">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                ) : employee.image_path ? (
                                    <AvatarImage src={employee.image_path} alt={`${employee.first_name} ${employee.last_name}`} className="object-cover" />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-emerald-500 text-3xl font-bold text-white">
                                        {getInitials(employee)}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-slate-100"
                            >
                                <Camera className="h-4 w-4 text-slate-600" />
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-white">
                            {employee.first_name} {employee.last_name}
                        </h2>
                        <p className="text-slate-300">{employee.position}</p>
                        <div className="mt-3 flex justify-center gap-2">
                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                {employee.office?.name}
                            </Badge>
                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                {employee.employment_status?.name}
                            </Badge>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
                                        <User className="h-5 w-5 text-slate-500" /> Personal Information
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name *</Label>
                                            <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} />
                                            {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="middle_name">Middle Name</Label>
                                            <Input id="middle_name" value={data.middle_name} onChange={(e) => setData('middle_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name *</Label>
                                            <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} />
                                            {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="suffix">Suffix</Label>
                                            <Input id="suffix" value={data.suffix} onChange={(e) => setData('suffix', e.target.value)} placeholder="Jr., III" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Contact Information */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
                                        <Phone className="h-5 w-5 text-slate-500" /> Contact Information
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_number" className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-400" /> Contact Number
                                            </Label>
                                            <Input id="contact_number" value={data.contact_number} onChange={(e) => setData('contact_number', e.target.value)} placeholder="09XX-XXX-XXXX" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                                            </Label>
                                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="email@example.com" />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <Label htmlFor="address" className="flex items-center gap-2">
                                            <Home className="h-3.5 w-3.5 text-slate-400" /> Address
                                        </Label>
                                        <Textarea id="address" rows={2} value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Your complete address" />
                                    </div>
                                </div>

                                <Separator />

                                {/* Other Info */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
                                        <Calendar className="h-5 w-5 text-slate-500" /> Other Information
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="birthdate">Birthdate</Label>
                                            <Input id="birthdate" type="date" value={data.birthdate} onChange={(e) => setData('birthdate', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Employee Since</Label>
                                            <Input value={formatDate(employee.created_at)} disabled className="bg-slate-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t bg-slate-50/50 px-6 py-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('employee.dashboard')}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" /> {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
