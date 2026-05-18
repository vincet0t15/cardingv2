import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner immediately if prompt is available
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Also check if immediately available (some browsers fire the event before we listen)
        setTimeout(() => {
            if (!deferredPrompt) {
                // Try to register service worker to enable PWA
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistration().then((registration) => {
                        if (registration) {
                            // PWA is available
                            setShowBanner(true);
                        }
                    }).catch(() => {});
                }
            }
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            // Try to trigger install via service worker or show message
            alert('To install: Go to browser menu → Add to Home Screen');
            return;
        }

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        // Don't show again for this session
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pwa-banner-dismissed', 'true');
        }
    };

    // Don't show if already installed or no prompt available
    if (isInstalled) return null;

    // Check if dismissed for this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-banner-dismissed')) {
        return null;
    }

    // Don't show if browser doesn't support PWA
    if (typeof window !== 'undefined' && !('serviceWorker' in navigator) && !deferredPrompt) {
        return null;
    }

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-4 max-w-xs">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            Install App
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Add to home screen for quick access
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleInstall}
                    >
                        Install
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                    >
                        Later
                    </Button>
                </div>
            </div>
        </div>
    );
}