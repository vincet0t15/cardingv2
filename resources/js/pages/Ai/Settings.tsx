import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';

interface Settings {
    api_key: string;
    api_url: string;
    model: string;
    enabled: string;
}

interface Props {
    settings: Settings;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'AI Assistant', href: '/ai' },
    { title: 'Settings', href: '/ai/settings' },
];

const FREE_MODELS = [
    { value: 'deepseek-v4-flash-free', label: '🆓 DeepSeek V4 Flash Free (Recommended)' },
    { value: 'nemotron-3-ultra-free', label: '🆓 Nemotron 3 Ultra Free' },
    { value: 'north-mini-code-free', label: '🆓 North Mini Code Free' },
    { value: 'minimax-m3-free', label: '🆓 MiniMax M3 Free' },
    { value: 'mimo-v2.5-free', label: '🆓 MiMo V2.5 Free' },
];

const PAID_MODELS = [
    { value: 'gpt-5.5-pro', label: 'GPT 5.5 Pro (Paid)' },
    { value: 'gpt-5.5', label: 'GPT 5.5 (Paid)' },
    { value: 'gpt-5.4-pro', label: 'GPT 5.4 Pro (Paid)' },
    { value: 'gpt-5.4', label: 'GPT 5.4 (Paid)' },
    { value: 'gpt-5.4-mini', label: 'GPT 5.4 Mini (Paid)' },
    { value: 'gpt-5.4-nano', label: 'GPT 5.4 Nano (Paid)' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro (Paid)' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (Paid)' },
    { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6 (Paid)' },
    { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5 (Paid)' },
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Paid)' },
];

const AVAILABLE_MODELS = [...FREE_MODELS, ...PAID_MODELS];

export default function AiSettings({ settings }: Props) {
    const [form, setForm] = useState({
        api_key: settings.api_key ? '***' + settings.api_key.slice(-4) : '',
        api_url: settings.api_url,
        model: settings.model,
        enabled: settings.enabled === 'true',
    });
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);

        router.post(route('ai.settings.update'), {
            api_key: form.api_key,
            api_url: form.api_url,
            model: form.model,
            enabled: form.enabled,
        }, {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            },
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Settings" />

            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Assistant Settings</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Configure your AI provider and model for the Payroll AI Assistant.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                API Configuration
                            </CardTitle>
                            <CardDescription>
                                Enter your OpenAI-compatible API key and select a model.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* API Key */}
                            <div className="space-y-2">
                                <Label htmlFor="api_key">API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="api_key"
                                        type={showKey ? 'text' : 'password'}
                                        value={form.api_key}
                                        onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                                        placeholder="sk-... or leave as *** to keep existing"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Leave as ***xxx to keep your existing key. Enter a new key to change it.
                                </p>
                            </div>

                            {/* API URL */}
                            <div className="space-y-2">
                                <Label htmlFor="api_url">API URL</Label>
                                <Input
                                    id="api_url"
                                    value={form.api_url}
                                    onChange={(e) => setForm({ ...form, api_url: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                />
                                <p className="text-muted-foreground text-xs">
                                    Default: https://api.openai.com/v1. For NVIDIA NIM or custom endpoints, enter their URL here.
                                </p>
                            </div>

                            {/* Model */}
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <select
                                    id="model"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <optgroup label="🆓 Free Models">
                                        {FREE_MODELS.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="💰 Paid Models (requires billing)">
                                        {PAID_MODELS.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                <p className="text-muted-foreground text-xs">
                                    Choose the AI model to use. Make sure your API key has access to this model.
                                </p>
                            </div>

                            {/* Enable/Disable */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="enabled"
                                    checked={form.enabled}
                                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="enabled" className="cursor-pointer">
                                    Enable AI Assistant
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex items-center justify-between">
                        <div>
                            {saved && (
                                <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Settings saved!
                                </span>
                            )}
                        </div>
                        <Button type="submit" disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Need Help?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>
                            <strong>OpenCode (OpenAI-compatible):</strong> Use URL{' '}
                            <code className="rounded bg-slate-100 px-1 text-xs">https://api.opencode.ai/v1</code>
                            {' '}or get your key from{' '}
                            <a href="https://opencode.ai" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                opencode.ai
                            </a>
                        </p>
                        <p>
                            <strong>OpenAI:</strong> Use URL{' '}
                            <code className="rounded bg-slate-100 px-1 text-xs">https://api.openai.com/v1</code>
                        </p>
                        <p>
                            <strong>NVIDIA NIM:</strong> Use URL{' '}
                            <code className="rounded bg-slate-100 px-1 text-xs">https://integrate.api.nvidia.com/v1</code>
                        </p>
                        <p>
                            <strong>OpenRouter:</strong> Use URL{' '}
                            <code className="rounded bg-slate-100 px-1 text-xs">https://openrouter.ai/api/v1</code>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
