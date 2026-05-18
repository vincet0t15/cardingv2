import { Head, useForm } from '@inertiajs/react';
import { Check, Copy, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { KeyRound } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    username: string;
}

interface ResetPasswordForm {
    token: string;
    username: string;
    password: string;
    password_confirmation: string;
    [key: string]: any;
}

export default function ResetPassword({ token, username }: ResetPasswordProps) {
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        username: username,
        password: '',
        password_confirmation: '',
    });

    const copyToken = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Reset password" description="Please enter your new password below">
            <Head title="Reset password" />

            <form onSubmit={submit}>
                <div className="grid gap-6">
                    {/* Token Display */}
                    <Alert className="border-amber-200 bg-amber-50">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            <div className="mt-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium">Your reset token:</p>
                                    <Button type="button" variant="outline" size="sm" onClick={copyToken} className="h-7 gap-1 text-xs">
                                        {copied ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3 w-3" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <code className="mt-2 block rounded bg-amber-100 p-3 font-mono text-xs break-all select-all">{token}</code>
                            </div>
                            <p className="mt-2 text-xs">Copy this token and keep it secure. It will expire in 60 minutes.</p>
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={data.username}
                            className="mt-1 block w-full"
                            readOnly
                        />
                        <InputError message={errors.username} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <Button type="submit" className="mt-4 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Reset password
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
