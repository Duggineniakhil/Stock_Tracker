import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'stock-tracker-theme';

export const ThemeProvider = ({ children }) => {
    // Quotra design is strictly dark theme. Support for legacy light theme removed.
    const theme = 'dark';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    const toggleTheme = () => {
        // No-op: Quotra branding is locked to dark mode
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
};

export default ThemeContext;
