import { useState, useEffect } from 'react';

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const admin = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(admin);
    }, []);

    const login = (pin: string) => {
        // Simple PIN for demo/MVP as requested
        if (pin === '1914' || pin === '0000') {
            localStorage.setItem('isAdmin', 'true');
            setIsAdmin(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('isAdmin');
        setIsAdmin(false);
    };

    return { isAdmin, login, logout };
}
