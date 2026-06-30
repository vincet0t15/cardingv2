import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

interface Props {
    conversations: Conversation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AI Assistant',
        href: '/ai',
    },
];

export default function SmartAssistant({ conversations }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { permissions?: string[] } } };
    const userPermissions = auth?.user?.permissions ?? [];
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setLoading(true);

        try {
            const res = await fetch(route('ai.chat'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId,
                }),
            });

            const data = await res.json();

            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
            if (data.conversation_id) {
                setConversationId(data.conversation_id);
            }
        } catch (err) {
            setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Connection error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const loadConversation = async (id: string) => {
        setConversationId(id);
        setMessages([]);
        setLoading(true);

        try {
            const res = await fetch(route('ai.history', id));
            const data = await res.json();
            setMessages(data.messages || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setConversationId(null);
        setMessages([]);
        setInput('');
    };

    const getInitialSuggestions = () => [
        'Magkano total salary ngayong buwan?',
        'Ilang empleyado ang nasa bawat office?',
        'Top 5 employees na may pinakamataas na claims',
        'Ilista ang claims ayon sa type',
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Assistant" />

            <div className="flex h-[calc(100vh-8rem)] gap-4 p-4">
                {/* Sidebar - Conversation List */}
                <Card className="hidden w-72 shrink-0 overflow-hidden md:block">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Conversations</CardTitle>
                            <Button variant="ghost" size="icon" onClick={startNewChat} title="New Chat">
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100% - 60px)' }}>
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                className={`w-full rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                    conversationId === conv.id ? 'bg-slate-100 dark:bg-slate-800 font-medium' : ''
                                }`}
                            >
                                <p className="truncate">{conv.title}</p>
                                <p className="text-muted-foreground mt-0.5 text-[10px]">
                                    {new Date(conv.updated_at).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                        {conversations.length === 0 && (
                            <p className="text-muted-foreground px-3 py-4 text-center text-xs">No conversations yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Main Chat Area */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    {/* Chat Header */}
                    <CardHeader className="border-b pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 p-2">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm">Payroll AI Assistant</CardTitle>
                                    <p className="text-muted-foreground text-xs">Ask anything about your payroll data</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {conversationId && (
                                    <Button variant="ghost" size="sm" onClick={startNewChat}>
                                        <Sparkles className="mr-1 h-4 w-4" />
                                        New Chat
                                    </Button>
                                )}
                                {userPermissions.includes('ai_settings.manage') && (
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('ai.settings'))}>
                                        Settings
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                                <div className="mb-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 p-4 dark:from-purple-900/30 dark:to-indigo-900/30">
                                    <Bot className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Payroll AI Assistant</h3>
                                <p className="text-muted-foreground mb-6 max-w-md text-sm">
                                    Ask me anything about your payroll data — employees, salaries, claims, deductions, and more!
                                </p>
                                <div className="grid w-full max-w-md gap-2">
                                    {getInitialSuggestions().map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => {
                                                setInput(suggestion);
                                                inputRef.current?.focus();
                                            }}
                                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                                                msg.role === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                                            }`}
                                        >
                                            <span className="whitespace-pre-wrap">{msg.content}</span>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="max-w-[80%] rounded-xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
                                            <span className="inline-flex gap-1">
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }}></span>
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }}></span>
                                                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </CardContent>

                    {/* Input */}
                    <div className="border-t p-4">
                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about payroll, employees, claims..."
                                className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                rows={1}
                                disabled={loading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="h-[42px] self-center"
                            >
                                Send
                            </Button>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-[10px]">
                            AI responses are generated based on your payroll data. Verify important information.
                        </p>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
