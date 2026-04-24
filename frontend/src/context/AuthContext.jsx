import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                }
            } catch (e) {
                console.error("Invalid token", e);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.login(email, password);
        const { token, user: userData } = res.data;
        
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser({ ...decoded, ...userData });
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.register(name, email, password);
        const { token, user: userData } = res.data;
        
        if (token) {
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({ ...decoded, ...userData });
        }
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
