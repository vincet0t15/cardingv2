import { createContext, useContext, useState, useCallback } from 'react';

export interface AuthUser {
    id: number;
    name: string;
}

interface AuthContextType {
    user: AuthUser | null;
    setUser: (user: AuthUser) => void;
    url: string;
    setUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [url, setUrl] = useState('');

    const handleSetUser = useCallback((newUser: AuthUser) => {
        setUser(newUser);
    }, []);

    const handleSetUrl = useCallback((newUrl: string) => {
        setUrl(newUrl);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser, url, setUrl: handleSetUrl }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
    return ctx;
}
