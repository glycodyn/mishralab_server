import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Save user/token to localStorage on change
    useEffect(() => {
        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, [user, token]);

 

    // Signup
    const signup = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/user/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Signup failed');
            setUser(data.user);
            setToken(data.token);
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`; 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Login
    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            setUser(data.user);
            setToken(data.token);
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`; 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    
    // Logout
    const logout = () => {
        setUser(null);
        setToken(null);
        setError(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        document.cookie = 'token=;Max-Age=0; path=/;';
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            error,
            signup,
            login,
            logout,
            setError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}