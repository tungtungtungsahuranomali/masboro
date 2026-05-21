import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import {
    registerForPushNotifications,
    sendTokenToServer,
    removeTokenFromServer,
} from '../services/NotificationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cek token saat app dibuka
    useEffect(() => {
        const loadToken = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('token');
                const savedUser = await AsyncStorage.getItem('user');
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (e) {
                console.log('Error loading token:', e);
            } finally {
                setLoading(false);
            }
        };
        loadToken();
    }, []);

    // Register push notification setelah login (token berubah)
    useEffect(() => {
        if (token) {
            (async () => {
                try {
                    const pushToken = await registerForPushNotifications();
                    if (pushToken) {
                        await sendTokenToServer(pushToken);
                    }
                } catch (e) {
                    console.log('Error registering push:', e);
                }
            })();
        }
    }, [token]);

    const login = async (whatsapp, password) => {
        const res = await api.post('/login', { whatsapp, password });
        const { token: newToken, pelanggan } = res.data.data;
        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('user', JSON.stringify(pelanggan));
        setToken(newToken);
        setUser(pelanggan);
        return res.data;
    };

    const logout = async () => {
        try {
            await removeTokenFromServer();
        } catch (e) {
            // Tetap lanjut logout walau gagal hapus token
        }
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
