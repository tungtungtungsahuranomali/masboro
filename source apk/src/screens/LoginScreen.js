import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LOCAL_VERSION } from '../hooks/useUpdateChecker';
import api from '../api';
import colors from '../theme';
import { useToast } from '../components/Toast';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [whatsapp, setWhatsapp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [appName, setAppName] = useState('Mentari Net');
    const [appTagline, setAppTagline] = useState('Sistem Tagihan Internet');
    const [appLogo, setAppLogo] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/app-settings');
                if (res.data?.data) {
                    setAppName(res.data.data.app_name || 'Mentari Net');
                    setAppTagline(res.data.data.app_tagline || 'Sistem Tagihan Internet');
                    setAppLogo(res.data.data.app_logo || null);
                }
            } catch (e) {
                // Use defaults
            }
        })();
    }, []);

    const handleLogin = async () => {
        if (!whatsapp || !password) {
            showToast('Nomor WhatsApp dan Password harus diisi.', 'warning');
            return;
        }
        setLoading(true);
        try {
            await login(whatsapp, password);
        } catch (e) {
            const msg = e.response?.data?.message || 'Login gagal. Periksa koneksi internet.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <StatusBar barStyle="light-content" backgroundColor={colors.gradientEnd} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <View style={styles.logoWrap}>
                        {appLogo ? (
                            <Image source={{ uri: appLogo }} style={styles.logoImage} />
                        ) : (
                            <Ionicons name="globe" size={48} color={colors.white} />
                        )}
                    </View>
                    <Text style={styles.title}>{appName}</Text>
                    <Text style={styles.subtitle}>{appTagline}</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.formTitle}>Masuk ke Akun Anda</Text>

                    <Text style={styles.label}>Nomor WhatsApp</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Contoh: 08123456789"
                            placeholderTextColor={colors.textSecondary}
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan password"
                            placeholderTextColor={colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={{ alignSelf: 'flex-end', marginTop: 12, marginBottom: 4 }}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    >
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Lupa Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.btnContent}>
                                <Ionicons name="log-in-outline" size={20} color={colors.white} />
                                <Text style={styles.btnText}>  Masuk</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.btnContent}>
                            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                            <Text style={styles.registerBtnText}>  Daftar Baru</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    © 2026 {appName}{'\n'}
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        Versi {LOCAL_VERSION}
                    </Text>
                </Text>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    logoImage: {
        width: 64,
        height: 64,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.white,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    form: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
        marginTop: 14,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputIcon: {
        paddingLeft: 14,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 15,
        color: colors.text,
    },
    eyeBtn: {
        paddingRight: 14,
        paddingVertical: 14,
    },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerBtn: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: 'rgba(229, 167, 27, 0.08)',
    },
    registerBtnText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 30,
        fontSize: 12,
    },
});
