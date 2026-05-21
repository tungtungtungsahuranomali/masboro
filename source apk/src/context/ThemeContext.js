import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/app-settings');
                if (res.data?.data?.theme) {
                    setTheme(res.data.data.theme);
                }
            } catch (e) {}
        })();
    }, []);

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
