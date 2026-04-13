import { useEffect, useState } from 'react';

export type Appearance = 'light';

// Always remove dark mode
const applyTheme = () => {
    document.documentElement.classList.remove('dark');
};

// Initialize theme (call this once in app start)
export function initializeTheme() {
    applyTheme();
}

// Hook
export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = () => {
        // force light only
        setAppearance('light');
        localStorage.setItem('appearance', 'light');
        applyTheme();
    };

    useEffect(() => {
        updateAppearance(); // always apply light on load
    }, []);

    return { appearance, updateAppearance };
}
