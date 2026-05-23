import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme';

const ToastContext = createContext();

const TOAST_DURATION = 3000;
const ANIM_DURATION = 300;

const ICON_MAP = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
};

const BG_MAP = {
    success: '#2ecc71',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#3498db',
};

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;
    const timerRef = useRef(null);

    const showToast = useCallback((message, type = 'error', duration = TOAST_DURATION) => {
        // Clear any existing timer
        if (timerRef.current) clearTimeout(timerRef.current);

        setToast({ message, type });

        // Reset & animate in
        opacity.setValue(0);
        translateY.setValue(-100);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: ANIM_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: ANIM_DURATION,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        timerRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: ANIM_DURATION,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: ANIM_DURATION,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setToast(null);
            });
        }, duration);
    }, [opacity, translateY]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toast,
                        { backgroundColor: BG_MAP[toast.type] || BG_MAP.error },
                        { opacity, transform: [{ translateY }] },
                    ]}
                >
                    <Ionicons name={ICON_MAP[toast.type] || ICON_MAP.error} size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : (Platform.OS === 'android' ? (StatusBar.currentHeight || 30) + 10 : 60),
        left: 16,
        right: 16,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999999,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
