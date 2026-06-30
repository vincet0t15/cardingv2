import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo } from 'react';
import { route as routeFn } from 'ziggy-js';
import { AuthProvider, useAuthContext } from './contexts/auth-context';
import { ChatProvider } from './contexts/chat-context';
import { ChatManager } from './components/messenger/chat-manager';
import { Toaster } from './components/ui/sonner';
import { usePage } from '@inertiajs/react';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';

    configureEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 6001),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 6001),
        forceTLS: isHttps,
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel: { name: string }) => ({
            authorize: (socketId: string, callback: (error: Error | null, data: { auth: string } | null) => void) => {
                const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
                fetch('/broadcasting/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: new URLSearchParams({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }).toString(),
                })
                    .then((r) => {
                        if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
                        return r.json();
                    })
                    .then((data) => callback(null, data))
                    .catch((err: Error) => callback(err, null));
            },
        }),
    });
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Bridge component rendered INSIDE the Inertia App tree.
 * Syncs auth user + current URL into the persistent AuthContext
 * so the chat layer (outside the page tree) can access them.
 */
function AuthBridge() {
    const page = usePage();
    const auth = (page.props as { auth?: { user: { id: number; name: string } } }).auth;
    const url = page.url;
    const { setUser, setUrl } = useAuthContext();

    const user = auth?.user;

    // Use effects so we don't call setState during render
    useEffect(() => {
        if (user) setUser(user);
    }, [user?.id]);

    useEffect(() => {
        setUrl(url);
    }, [url]);

    return null;
}

/**
 * Persistent chat overlay rendered OUTSIDE the Inertia page tree.
 * Because it lives in a parent component that never unmounts,
 * the floating chat windows survive page-to-page navigation.
 */
function PersistentChatLayer() {
    const url = useAuthContext().url;
    const hideFloatingChat = useMemo(() => url.startsWith('/messenger/'), [url]);

    return (
        <>
            <Toaster position="top-right" />
            <div className={hideFloatingChat ? 'hidden' : ''}>
                <ChatManager />
            </div>
        </>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AuthProvider>
                <ChatProvider>
                    {/**
                     * Custom children render function for the Inertia <App> component.
                     * This lets us inject <AuthBridge> inside the Inertia page context
                     * while keeping <PersistentChatLayer> outside the page tree so it
                     * survives navigations.
                     */}
                    <App {...props}>
                        {({ Component: PageComponent, key, props: pageProps }: { Component: any; key: any; props: any }) => (
                            <>
                                <AuthBridge />
                                <PageComponent key={key} {...pageProps} />
                            </>
                        )}
                    </App>
                    <PersistentChatLayer />
                </ChatProvider>
            </AuthProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
