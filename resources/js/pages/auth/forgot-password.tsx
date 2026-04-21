// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { KeyRound } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot password" description="Enter your username to receive a password reset token">
            <Head title="Forgot password" />

            {status && (
                <Alert className="mb-4 border-blue-200 bg-blue-50">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">{status}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                <form onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={data.username}
                            autoFocus
                            onChange={(e) => setData('username', e.target.value)}
                            placeholder="Enter your username"
                        />

                        <InputError message={errors.username} />
                    </div>

                    <div className="my-6 flex items-center justify-start">
                        <Button className="w-full" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Generate Reset Token
                        </Button>
                    </div>
                </form>

                <div className="text-muted-foreground space-x-1 text-center text-sm">
                    <span>Or, return to</span>
                    <TextLink href={route('login')}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
